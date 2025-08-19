import { useQuery } from '@tanstack/react-query';
import { useTrainerSessions } from './use-member-sessions';
import { TrainingSession } from '@/types';
import { queryKeys } from '@/lib/query-client';

interface TrainerStats {
  activeClients: number;
  sessionsThisMonth: number;
  hoursThisWeek: number;
  earningsThisMonth: number;
  // Additional stats for dashboard
  todaysSessions: {
    total: number;
    completed: number;
    upcoming: number;
  };
  earningsThisWeek: number;
}

/**
 * Hook for calculating trainer statistics based on their sessions
 * Uses modern TanStack Query patterns with smart caching
 */
export function useTrainerStats(trainerId: string | null) {
  // Get all sessions for this trainer
  const { data: allSessions = [], isLoading: sessionsLoading } = useTrainerSessions(trainerId);

  return useQuery({
    queryKey: [...queryKeys.trainers.stats(), 'trainer', trainerId || 'unknown'],
    queryFn: () => calculateTrainerStats(allSessions),
    enabled: !!trainerId && !sessionsLoading && allSessions.length >= 0,
    meta: {
      errorMessage: 'Failed to calculate trainer statistics',
    },
  });
}

function calculateTrainerStats(sessions: TrainingSession[]): TrainerStats {
  const now = new Date();
  
  // Current month boundaries
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Current week boundaries (Monday to Sunday)
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
  startOfWeek.setDate(now.getDate() - daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Filter sessions by time periods
  const sessionsThisMonth = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledDate);
    return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
  });

  const sessionsThisWeek = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledDate);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  // Calculate active clients (unique clients with sessions in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledDate);
    return sessionDate >= thirtyDaysAgo;
  });

  const activeClients = new Set(
    recentSessions
      .filter(session => session.member)
      .map(session => session.member!.id)
  ).size;

  // Calculate hours this week (sum of completed or in-progress session durations)
  const hoursThisWeek = sessionsThisWeek
    .filter(session => session.status === 'completed' || session.status === 'in_progress')
    .reduce((total, session) => total + (session.duration || 0), 0) / 60; // Convert minutes to hours

  // Calculate earnings this month (sum of costs from completed sessions)
  const earningsThisMonth = sessionsThisMonth
    .filter(session => session.status === 'completed' && session.cost)
    .reduce((total, session) => total + (session.cost || 0), 0);

  // Calculate today's sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todaysSessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledDate);
    return sessionDate >= today && sessionDate < tomorrow;
  });

  const todaysCompleted = todaysSessions.filter(session => 
    session.status === 'completed'
  ).length;

  const todaysUpcoming = todaysSessions.filter(session => 
    session.status === 'scheduled' || session.status === 'confirmed'
  ).length;

  // Calculate earnings this week (sum of costs from completed sessions this week)
  const earningsThisWeek = sessionsThisWeek
    .filter(session => session.status === 'completed' && session.cost)
    .reduce((total, session) => total + (session.cost || 0), 0);

  return {
    activeClients,
    sessionsThisMonth: sessionsThisMonth.length,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10, // Round to 1 decimal place
    earningsThisMonth,
    todaysSessions: {
      total: todaysSessions.length,
      completed: todaysCompleted,
      upcoming: todaysUpcoming,
    },
    earningsThisWeek,
  };
}