'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainerService } from '@/lib/services/trainer-service';
import { queryKeys } from '@/lib/query-client';
import { Trainer } from '@/types';
import {
  type CreateTrainerData,
  type UpdateTrainerData,
  type TrainerFilters
} from '@/lib/schemas';

// ============================
// TRAINER QUERY HOOKS
// ============================

/**
 * Modern hook to fetch trainers with filtering and caching
 * Replaces old useState/useEffect patterns
 */
export function useTrainers(filters?: TrainerFilters) {
  return useQuery({
    queryKey: queryKeys.trainers.lists(filters),
    queryFn: () => trainerService.getTrainers(filters),
    select: (data) => data.data || [],
    meta: { errorMessage: 'Failed to load trainers' },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}

/**
 * Hook to fetch a single trainer by ID with caching
 */
export function useTrainer(id: string) {
  return useQuery({
    queryKey: queryKeys.trainers.detail(id),
    queryFn: () => trainerService.getTrainerById(id),
    select: (data) => data.data,
    enabled: !!id,
    meta: { errorMessage: 'Failed to load trainer' },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch trainer statistics with caching
 */
export function useTrainerStats() {
  return useQuery({
    queryKey: queryKeys.trainers.stats(),
    queryFn: () => trainerService.getTrainerStats(),
    select: (data) => data.data,
    meta: { errorMessage: 'Failed to load trainer statistics' },
    staleTime: 10 * 60 * 1000, // 10 minutes for stats
    gcTime: 15 * 60 * 1000,    // 15 minutes
  });
}

// ============================
// TRAINER MUTATION HOOKS
// ============================

/**
 * Modern hook for trainer CRUD operations with optimistic updates
 */
export function useTrainerActions() {
  const queryClient = useQueryClient();

  const createTrainer = useMutation({
    mutationFn: (data: CreateTrainerData) => trainerService.createTrainer(data),
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate and refetch trainer lists
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.stats() });
        
        // Add the new trainer to the cache
        queryClient.setQueryData(
          queryKeys.trainers.detail(result.data.id),
          { data: result.data, error: null }
        );
      }
    },
    meta: { 
      successMessage: 'Trainer created successfully',
      errorMessage: 'Failed to create trainer'
    }
  });

  const updateTrainer = useMutation({
    mutationFn: (data: UpdateTrainerData) => trainerService.updateTrainer(data),
    onMutate: async (data) => {
      // Cancel outgoing refetches for this trainer
      await queryClient.cancelQueries({ queryKey: queryKeys.trainers.detail(data.id) });

      // Snapshot the previous value
      const previousTrainer = queryClient.getQueryData(queryKeys.trainers.detail(data.id));

      // Optimistically update the trainer
      if (previousTrainer) {
        queryClient.setQueryData(
          queryKeys.trainers.detail(data.id),
          (old: any) => ({
            ...old,
            data: { ...old.data, ...data }
          })
        );
      }

      return { previousTrainer };
    },
    onError: (_, data, context) => {
      // Rollback on error
      if (context?.previousTrainer) {
        queryClient.setQueryData(
          queryKeys.trainers.detail(data.id),
          context.previousTrainer
        );
      }
    },
    onSuccess: (result, data) => {
      if (result.data) {
        // Update the trainer in cache
        queryClient.setQueryData(
          queryKeys.trainers.detail(data.id),
          { data: result.data, error: null }
        );
        
        // Invalidate lists to show updated data
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.stats() });
      }
    },
    meta: { 
      successMessage: 'Trainer updated successfully',
      errorMessage: 'Failed to update trainer'
    }
  });

  const deleteTrainer = useMutation({
    mutationFn: (id: string) => trainerService.deleteTrainer(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.trainers.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.trainers.lists() });

      // Snapshot previous values
      const previousTrainer = queryClient.getQueryData(queryKeys.trainers.detail(id));
      const previousTrainers = queryClient.getQueryData(queryKeys.trainers.lists());

      // Optimistically remove trainer from lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.trainers.lists() },
        (old: any) => {
          if (!old) return old;
          return old.filter((trainer: Trainer) => trainer.id !== id);
        }
      );

      return { previousTrainer, previousTrainers };
    },
    onError: (_, id, context) => {
      // Rollback on error
      if (context?.previousTrainer) {
        queryClient.setQueryData(
          queryKeys.trainers.detail(id),
          context.previousTrainer
        );
      }
      if (context?.previousTrainers) {
        queryClient.setQueryData(
          queryKeys.trainers.lists(),
          context.previousTrainers
        );
      }
    },
    onSuccess: (result, id) => {
      if (result.data?.success) {
        // Remove trainer from cache
        queryClient.removeQueries({ queryKey: queryKeys.trainers.detail(id) });
        
        // Invalidate lists and stats
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.trainers.stats() });
      }
    },
    meta: { 
      successMessage: 'Trainer deleted successfully',
      errorMessage: 'Failed to delete trainer'
    }
  });

  return {
    createTrainer,
    updateTrainer,
    deleteTrainer,
    // Convenience methods
    isCreating: createTrainer.isPending,
    isUpdating: updateTrainer.isPending,
    isDeleting: deleteTrainer.isPending,
    isLoading: createTrainer.isPending || updateTrainer.isPending || deleteTrainer.isPending,
  };
}

// ============================
// UTILITY HOOKS
// ============================

/**
 * Hook to get trainer specializations for filtering
 */
export function useTrainerSpecializations() {
  const { data: trainers = [] } = useTrainers();
  
  // Extract unique specializations from all trainers
  const specializations = trainers.reduce<string[]>((acc, trainer) => {
    trainer.specializations.forEach(spec => {
      if (!acc.includes(spec)) {
        acc.push(spec);
      }
    });
    return acc;
  }, []);

  return specializations.sort();
}

/**
 * Hook to search trainers by name or email
 */
export function useTrainerSearch(searchTerm: string) {
  return useTrainers({ searchTerm, sortBy: 'name', sortOrder: 'asc' });
}

/**
 * Hook to get trainers by specialization
 */
export function useTrainersBySpecialization(specialization: string) {
  return useTrainers({ specialization, sortBy: 'name', sortOrder: 'asc' });
}

// ============================
// PREFETCH UTILITIES
// ============================

/**
 * Utility to prefetch trainer data
 */
export function usePrefetchTrainer() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainers.detail(id),
      queryFn: () => trainerService.getTrainerById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Utility to prefetch trainer lists
 */
export function usePrefetchTrainers() {
  const queryClient = useQueryClient();

  return (filters?: TrainerFilters) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainers.lists(filters),
      queryFn: () => trainerService.getTrainers(filters),
      staleTime: 5 * 60 * 1000,
    });
  };
}