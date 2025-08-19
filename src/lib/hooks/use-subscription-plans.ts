import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionPlanService } from '@/lib/services/subscription-plan-service';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import { 
  type CreateSubscriptionPlanData, 
  type UpdateSubscriptionPlanData, 
  type SubscriptionPlanFilters 
} from '@/lib/schemas';

// =============================================
// QUERY HOOKS
// =============================================

/**
 * Hook for fetching all subscription plans with filters
 * Uses smart caching and background refetching
 */
export function useSubscriptionPlans(filters?: SubscriptionPlanFilters) {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.list(filters),
    queryFn: () => subscriptionPlanService.getPlans(filters),
    select: (data) => data.data || [], // Extract data from ServiceResponse
    meta: {
      errorMessage: 'Failed to load subscription plans',
    },
  });
}

/**
 * Hook for fetching active subscription plans only
 * Perfect for dropdowns and selectors
 */
export function useActiveSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.list({ isActive: true, sortBy: 'name', sortOrder: 'asc' }),
    queryFn: () => subscriptionPlanService.getPlans({ isActive: true, sortBy: 'name', sortOrder: 'asc' }),
    select: (data) => data.data || [],
    staleTime: 10 * 60 * 1000, // 10 minutes for active plans
    meta: {
      errorMessage: 'Failed to load active subscription plans',
    },
  });
}

/**
 * Hook for fetching a single subscription plan by ID
 * Includes optimistic updates and detailed error handling
 */
export function useSubscriptionPlan(id: string | null) {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.detail(id!),
    queryFn: () => subscriptionPlanService.getPlanById(id!),
    select: (data) => data.data,
    enabled: !!id, // Only run query if ID exists
    meta: {
      errorMessage: 'Failed to load subscription plan details',
    },
  });
}

/**
 * Hook for subscription plan statistics with 5-minute cache
 * Perfect for dashboard widgets and analytics
 */
export function useSubscriptionPlanStats() {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.stats(),
    queryFn: () => subscriptionPlanService.getPlanStats(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load subscription plan statistics',
    },
  });
}

// =============================================
// MUTATION HOOKS
// =============================================

/**
 * Hook for creating new subscription plans
 * Includes optimistic updates and smart cache invalidation
 */
export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionPlanData) => {
      const result = await subscriptionPlanService.createPlan(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.data) {
        // Add to cache optimistically
        queryClient.setQueryData(
          queryKeys.subscriptionPlans.detail(result.data.id),
          { data: result.data, error: null }
        );

        // Invalidate lists and stats
        invalidateQueries.subscriptionPlans.lists();
        invalidateQueries.subscriptionPlans.stats();
      }
    },
    meta: {
      successMessage: 'Subscription plan created successfully',
      errorMessage: 'Failed to create subscription plan',
    },
  });
}

/**
 * Hook for updating subscription plans
 * Features optimistic updates for instant UI feedback
 */
export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionPlanData) => {
      const result = await subscriptionPlanService.updatePlan(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptionPlans.detail(variables.id) });

      // Snapshot the previous value
      const previousPlan = queryClient.getQueryData(queryKeys.subscriptionPlans.detail(variables.id));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.subscriptionPlans.detail(variables.id), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, ...variables }
        };
      });

      return { previousPlan };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousPlan) {
        queryClient.setQueryData(queryKeys.subscriptionPlans.detail(variables.id), context.previousPlan);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.detail(variables.id) });
      invalidateQueries.subscriptionPlans.lists();
    },
    meta: {
      successMessage: 'Subscription plan updated successfully',
      errorMessage: 'Failed to update subscription plan',
    },
  });
}

/**
 * Hook for deleting a subscription plan
 * Includes confirmation and optimistic removal
 */
export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await subscriptionPlanService.deletePlan(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (result, id) => {
      if (result.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: queryKeys.subscriptionPlans.detail(id) });

        // Invalidate lists and stats
        invalidateQueries.subscriptionPlans.lists();
        invalidateQueries.subscriptionPlans.stats();
      }
    },
    meta: {
      successMessage: 'Subscription plan deleted successfully',
      errorMessage: 'Failed to delete subscription plan',
    },
  });
}

/**
 * Hook for toggling subscription plan active status
 * Quick status update with instant feedback
 */
export function useToggleSubscriptionPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await subscriptionPlanService.togglePlanStatus(id, isActive);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.subscriptionPlans.detail(id) });
      
      // Snapshot the previous value
      const previousPlan = queryClient.getQueryData(queryKeys.subscriptionPlans.detail(id));
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.subscriptionPlans.detail(id), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, isActive }
        };
      });

      return { previousPlan };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousPlan) {
        queryClient.setQueryData(queryKeys.subscriptionPlans.detail(id), context.previousPlan);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.detail(id) });
      invalidateQueries.subscriptionPlans.lists();
      invalidateQueries.subscriptionPlans.stats();
    },
    meta: {
      successMessage: ({ isActive }: { isActive: boolean }) => 
        `Subscription plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      errorMessage: 'Failed to update subscription plan status',
    },
  });
}

// =============================================
// PREFETCH HELPERS
// =============================================

/**
 * Prefetch subscription plan details
 * Great for hover cards or anticipated navigation
 */
export function usePrefetchSubscriptionPlan() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.subscriptionPlans.detail(id),
      queryFn: () => subscriptionPlanService.getPlanById(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

/**
 * Prefetch subscription plans list with filters
 * Perfect for anticipated filter changes
 */
export function usePrefetchSubscriptionPlans() {
  const queryClient = useQueryClient();

  return (filters?: SubscriptionPlanFilters) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.subscriptionPlans.list(filters),
      queryFn: () => subscriptionPlanService.getPlans(filters),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook to get plans grouped by duration
 * Useful for organized displays
 */
export function useSubscriptionPlansByDuration() {
  const { data: plans = [], ...rest } = useSubscriptionPlans();

  const plansByDuration = plans.reduce((acc, plan) => {
    if (!acc[plan.duration]) {
      acc[plan.duration] = [];
    }
    acc[plan.duration].push(plan);
    return acc;
  }, {} as Record<string, typeof plans>);

  return {
    data: plansByDuration,
    plans,
    ...rest
  };
}

/**
 * Hook to get the most popular subscription plans
 * Based on current subscribers count
 */
export function usePopularSubscriptionPlans(limit = 3) {
  return useQuery({
    queryKey: [...queryKeys.subscriptionPlans.all, 'popular', limit],
    queryFn: async () => {
      const plansResult = await subscriptionPlanService.getPlans({ isActive: true, sortBy: 'name', sortOrder: 'asc' });
      // TODO: Add subscriber count logic when subscription data is available
      return plansResult;
    },
    select: (data) => (data.data || []).slice(0, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load popular subscription plans',
    },
  });
}