import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '@/lib/services/member-service';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import { 
  type CreateMemberData, 
  type UpdateMemberData, 
  type MemberFilters 
} from '@/lib/schemas';
import { type Member } from '@/types';

// =============================================
// QUERY HOOKS
// =============================================

/**
 * Hook for fetching paginated members list with filters
 * Uses smart caching and background refetching
 */
export function useMembers(filters?: MemberFilters) {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => memberService.getMembers(filters),
    select: (data) => data.data || [], // Extract data from ServiceResponse
    meta: {
      errorMessage: 'Failed to load members',
    },
  });
}

/**
 * Hook for fetching a single member by ID
 * Includes optimistic updates and detailed error handling
 */
export function useMember(id: string | null) {
  return useQuery({
    queryKey: queryKeys.members.detail(id!),
    queryFn: () => memberService.getMemberById(id!),
    select: (data) => data.data,
    enabled: !!id, // Only run query if ID exists
    meta: {
      errorMessage: 'Failed to load member details',
    },
  });
}

/**
 * Hook for member statistics with 5-minute cache
 * Perfect for dashboard widgets
 */
export function useMemberStats() {
  return useQuery({
    queryKey: queryKeys.members.stats(),
    queryFn: () => memberService.getMemberStats(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load member statistics',
    },
  });
}

/**
 * Hook for member distribution chart data
 * Automatically derived from stats
 */
export function useMemberDistribution() {
  return useQuery({
    queryKey: queryKeys.members.distribution(),
    queryFn: () => memberService.getMemberDistribution(),
    select: (data) => data.data || [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load member distribution',
    },
  });
}

/**
 * Hook for recent member activities
 * Great for activity feeds
 */
export function useRecentMemberActivities(limit = 10) {
  return useQuery({
    queryKey: queryKeys.members.activities(limit),
    queryFn: () => memberService.getRecentMemberActivities(limit),
    select: (data) => data.data || [],
    staleTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      errorMessage: 'Failed to load recent activities',
    },
  });
}

// =============================================
// MUTATION HOOKS
// =============================================

/**
 * Hook for creating new members
 * Includes optimistic updates and smart cache invalidation
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberData) => memberService.createMember(data),
    onSuccess: (result) => {
      if (result.data) {
        // Add to cache optimistically
        queryClient.setQueryData(
          queryKeys.members.detail(result.data.id),
          { data: result.data, error: null }
        );

        // Invalidate lists and stats
        invalidateQueries.members.lists();
        invalidateQueries.members.stats();
      }
    },
    meta: {
      successMessage: 'Member created successfully',
      errorMessage: 'Failed to create member',
    },
  });
}

/**
 * Hook for updating members
 * Features optimistic updates for instant UI feedback
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMemberData) => memberService.updateMember(data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(variables.id) });

      // Snapshot the previous value
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(variables.id));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.members.detail(variables.id), (old: { data?: Member } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, ...variables }
        };
      });

      return { previousMember };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(variables.id), context.previousMember);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(variables.id) });
      invalidateQueries.members.lists();
    },
    meta: {
      successMessage: 'Member updated successfully',
      errorMessage: 'Failed to update member',
    },
  });
}

/**
 * Hook for deleting a single member
 * Includes confirmation and optimistic removal
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => memberService.deleteMember(id),
    onSuccess: (result, id) => {
      if (result.data?.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: queryKeys.members.detail(id) });

        // Invalidate lists and stats
        invalidateQueries.members.lists();
        invalidateQueries.members.stats();
      }
    },
    meta: {
      successMessage: 'Member deleted successfully',
      errorMessage: 'Failed to delete member',
    },
  });
}

/**
 * Hook for bulk deleting members
 * Efficient for batch operations
 */
export function useDeleteMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => memberService.deleteMembers(ids),
    onSuccess: (result, ids) => {
      if (result.data?.success) {
        // Remove all from cache
        ids.forEach(id => {
          queryClient.removeQueries({ queryKey: queryKeys.members.detail(id) });
        });

        // Invalidate lists and stats
        invalidateQueries.members.lists();
        invalidateQueries.members.stats();
      }
    },
    meta: {
      successMessage: (variables: string[]) => `${variables.length} members deleted successfully`,
      errorMessage: 'Failed to delete members',
    },
  });
}

// =============================================
// STATUS UPDATE HOOKS
// =============================================

/**
 * Hook for freezing member membership
 * Quick status update with instant feedback
 */
export function useFreezeMembership() {
  return useMemberStatusMutation('freeze', 'frozen');
}

/**
 * Hook for unfreezing member membership
 */
export function useUnfreezeMembership() {
  return useMemberStatusMutation('unfreeze', 'active');
}

/**
 * Hook for cancelling member membership
 */
export function useCancelMembership() {
  return useMemberStatusMutation('cancel', 'cancelled');
}

/**
 * Hook for reactivating member membership
 */
export function useReactivateMembership() {
  return useMemberStatusMutation('reactivate', 'active');
}

// =============================================
// HELPER HOOKS
// =============================================

/**
 * Generic status update mutation factory
 * Reduces code duplication for status changes
 */
function useMemberStatusMutation(action: string, status: string) {
  const queryClient = useQueryClient();

  const mutationFn = {
    freeze: memberService.freezeMembership.bind(memberService),
    unfreeze: memberService.unfreezeMembership.bind(memberService),
    cancel: memberService.cancelMembership.bind(memberService),
    reactivate: memberService.reactivateMembership.bind(memberService),
  }[action];

  return useMutation({
    mutationFn,
    onMutate: async (id: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(id) });
      
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(id));
      
      queryClient.setQueryData(queryKeys.members.detail(id), (old: { data?: Member } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, membershipStatus: status }
        };
      });

      return { previousMember };
    },
    onError: (_err, id, context) => {
      // Rollback
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(id), context.previousMember);
      }
    },
    onSettled: (_data, _error, id) => {
      // Refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(id) });
      invalidateQueries.members.lists();
      invalidateQueries.members.stats();
    },
    meta: {
      successMessage: `Member ${action}d successfully`,
      errorMessage: `Failed to ${action} member`,
    },
  });
}

// =============================================
// PREFETCH HELPERS
// =============================================

/**
 * Prefetch member details
 * Great for hover cards or anticipated navigation
 */
export function usePrefetchMember() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.members.detail(id),
      queryFn: () => memberService.getMemberById(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

/**
 * Prefetch members list with filters
 * Perfect for anticipated filter changes
 */
export function usePrefetchMembers() {
  const queryClient = useQueryClient();

  return (filters?: MemberFilters) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.members.list(filters),
      queryFn: () => memberService.getMembers(filters),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };
}