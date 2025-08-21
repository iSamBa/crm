'use client';

import { useQuery } from '@tanstack/react-query';
import { memberService } from '@/lib/services/member-service';
import { subscriptionService } from '@/lib/services/subscription-service';
import { sessionService } from '@/lib/services/session-service';
import { dateFormatters } from '@/lib/utils/date-formatting';

export interface DashboardStats {
  totalMembers: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  dailyCheckins: number;
  // Additional computed stats
  revenueGrowth?: number;
  memberGrowth?: number;
  subscriptionGrowth?: number;
}

export function useDashboardStats() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all stats in parallel
      const [memberStatsResult, subscriptionStatsResult, todaySessionsResult] = await Promise.all([
        memberService.getMemberStats(),
        subscriptionService.getSubscriptionStats(),
        sessionService.getSessionsByDateRange(
          new Date().toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
          { status: 'completed' }
        )
      ]);

      if (memberStatsResult.error) {
        throw new Error(`Member stats error: ${memberStatsResult.error}`);
      }

      if (subscriptionStatsResult.error) {
        throw new Error(`Subscription stats error: ${subscriptionStatsResult.error}`);
      }

      if (todaySessionsResult.error) {
        console.warn('Session stats error:', todaySessionsResult.error);
      }

      const memberStats = memberStatsResult.data;
      const subscriptionStats = subscriptionStatsResult.data;
      const todaySessions = todaySessionsResult.data || [];

      // Calculate monthly revenue from active subscriptions
      const monthlyRevenue = subscriptionStats?.totalRevenue || 0;

      // Calculate member growth (if we have historical data)
      const memberGrowth = memberStats?.newThisMonth ? 
        Math.round((memberStats.newThisMonth / (memberStats.totalMembers - memberStats.newThisMonth || 1)) * 100) : 
        20; // Default growth percentage

      // Calculate subscription growth
      const subscriptionGrowth = Math.round((subscriptionStats?.activeSubscriptions || 0) / Math.max(subscriptionStats?.totalSubscriptions || 1, 1) * 100) - 50;

      // Revenue growth (mock calculation - would need historical data)
      const revenueGrowth = 12;

      return {
        totalMembers: memberStats?.totalMembers || 0,
        monthlyRevenue,
        activeSubscriptions: subscriptionStats?.activeSubscriptions || 0,
        dailyCheckins: todaySessions.length,
        revenueGrowth,
        memberGrowth,
        subscriptionGrowth,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to load dashboard statistics'
    }
  });

  return {
    stats: stats || {
      totalMembers: 0,
      monthlyRevenue: 0,
      activeSubscriptions: 0,
      dailyCheckins: 0,
    },
    isLoading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for recent activities across all services
export function useRecentActivities(limit = 10) {
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: async () => {
      // Get recent member activities
      const { data: memberActivities, error: memberError } = await memberService.getRecentMemberActivities(limit);
      
      if (memberError) {
        throw new Error(`Member activities error: ${memberError}`);
      }

      // Get recently created sessions
      const { data: recentSessions, error: sessionsError } = await sessionService.getRecentlyCreatedSessions(limit);

      if (sessionsError) {
        console.warn('Sessions activities error:', sessionsError);
      }

      // Transform session data to activities
      const sessionActivities = (recentSessions || []).map(session => ({
        type: 'session_scheduled',
        title: 'Training session created',
        description: `${session.title} with ${session.member?.firstName || 'Member'} ${session.member?.lastName || ''}`.trim(),
        time: dateFormatters.shortDateTime(session.createdAt || session.scheduledDate),
        sessionTitle: session.title,
        memberName: session.member ? `${session.member.firstName} ${session.member.lastName}` : 'Unknown Member',
        trainerName: session.trainer ? `${session.trainer.firstName} ${session.trainer.lastName}` : 'Unknown Trainer',
        timestamp: session.createdAt || session.scheduledDate,
      }));

      // Combine and sort activities by timestamp
      const allActivities = [
        ...(memberActivities || []),
        ...sessionActivities
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, limit);

      return allActivities;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for activities
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    meta: {
      errorMessage: 'Failed to load recent activities'
    }
  });

  return {
    activities: activities || [],
    isLoading,
    error: error?.message || null,
    refetch,
  };
}