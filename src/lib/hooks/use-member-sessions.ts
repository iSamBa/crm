import { useQuery } from '@tanstack/react-query';
import { sessionService, type SessionFilters } from '@/lib/services/session-service';
import { queryKeys } from '@/lib/query-client';

// =============================================
// SESSIONS QUERY HOOKS
// =============================================

/**
 * Hook for fetching sessions for a specific member
 * Uses modern TanStack Query patterns with smart caching
 */
export function useMemberSessions(
  memberId: string | null, 
  filters?: Omit<SessionFilters, 'memberId'>
) {
  return useQuery({
    queryKey: queryKeys.sessions.member(memberId!, filters),
    queryFn: () => sessionService.getMemberSessions(memberId!, filters),
    select: (data) => data.data || [], // Extract data from ServiceResponse
    enabled: !!memberId, // Only run query if memberId exists
    meta: {
      errorMessage: 'Failed to load member sessions',
    },
  });
}

/**
 * Hook for fetching sessions for a specific trainer
 * Uses modern TanStack Query patterns with smart caching
 */
export function useTrainerSessions(
  trainerId: string | null, 
  filters?: Omit<SessionFilters, 'trainerId'>
) {
  return useQuery({
    queryKey: queryKeys.sessions.trainer(trainerId!, filters),
    queryFn: () => sessionService.getTrainerSessions(trainerId!, filters),
    select: (data) => data.data || [], // Extract data from ServiceResponse
    enabled: !!trainerId, // Only run query if trainerId exists
    meta: {
      errorMessage: 'Failed to load trainer sessions',
    },
  });
}

/**
 * Hook for fetching session comments for a specific session
 */
export function useSessionComments(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.sessions.comments(sessionId!),
    queryFn: () => sessionService.getSessionComments(sessionId!),
    select: (data) => data.data || [],
    enabled: !!sessionId,
    meta: {
      errorMessage: 'Failed to load session comments',
    },
  });
}