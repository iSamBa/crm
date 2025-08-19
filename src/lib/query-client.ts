import { QueryClient } from '@tanstack/react-query';

// Global query client configuration with modern defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Modern caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000,   // 10 minutes - garbage collection time
      retry: (failureCount, error: any) => {
        // Smart retry logic
        if (error?.status === 404 || error?.status === 401) {
          return false; // Don't retry for these errors
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Prevent excessive refetching
      refetchOnReconnect: true,    // Refetch when coming back online
    },
    mutations: {
      retry: 1, // Single retry for mutations
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // TODO: Add global toast notification here
      },
    },
  },
});

// Query key factory for consistent cache management
export const queryKeys = {
  // Members
  members: {
    all: ['members'] as const,
    lists: () => [...queryKeys.members.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.members.lists(), filters] as const,
    details: () => [...queryKeys.members.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.members.details(), id] as const,
    stats: () => [...queryKeys.members.all, 'stats'] as const,
    distribution: () => [...queryKeys.members.all, 'distribution'] as const,
    activities: (limit?: number) => [...queryKeys.members.all, 'activities', limit] as const,
  },
  
  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    calendar: (startDate: string, endDate: string, filters?: any) => 
      [...queryKeys.sessions.lists(), 'calendar', startDate, endDate, filters] as const,
    member: (memberId: string, filters?: any) => 
      [...queryKeys.sessions.lists(), 'member', memberId, filters] as const,
    trainer: (trainerId: string, filters?: any) => 
      [...queryKeys.sessions.lists(), 'trainer', trainerId, filters] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    comments: (sessionId: string) => [...queryKeys.sessions.all, 'comments', sessionId] as const,
    stats: (filters?: any) => [...queryKeys.sessions.all, 'stats', filters] as const,
  },
  
  // Subscriptions
  subscriptions: {
    all: ['subscriptions'] as const,
    plans: () => [...queryKeys.subscriptions.all, 'plans'] as const,
    member: (memberId: string) => [...queryKeys.subscriptions.all, 'member', memberId] as const,
    stats: () => [...queryKeys.subscriptions.all, 'stats'] as const,
  },
  
  // Trainers
  trainers: {
    all: ['trainers'] as const,
    lists: (filters?: any) => [...queryKeys.trainers.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.trainers.all, 'detail', id] as const,
    availability: (id: string, date?: string) => 
      [...queryKeys.trainers.all, 'availability', id, date] as const,
    stats: () => [...queryKeys.trainers.all, 'stats'] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  members: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(id) }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() }),
  },
  sessions: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() }),
    member: (memberId: string) => queryClient.invalidateQueries({ 
      queryKey: queryKeys.sessions.member(memberId, undefined) 
    }),
  },
  sessionComments: {
    all: () => queryClient.invalidateQueries({ queryKey: ['sessions', 'comments'] }),
    session: (sessionId: string) => queryClient.invalidateQueries({ 
      queryKey: queryKeys.sessions.comments(sessionId) 
    }),
  },
  subscriptions: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all }),
    member: (memberId: string) => queryClient.invalidateQueries({ 
      queryKey: queryKeys.subscriptions.member(memberId) 
    }),
  },
};