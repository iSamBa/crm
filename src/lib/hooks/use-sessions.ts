import { useCallback, useState, useEffect } from 'react';
import { TrainingSession, SessionComment } from '@/types';
import { 
  sessionService, 
  CreateSessionData, 
  UpdateSessionData, 
  SessionFilters 
} from '@/lib/services/session-service';

// Hook for calendar view - sessions within date range
export function useCalendarSessions(startDate: string, endDate: string, filters?: SessionFilters) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!startDate || !endDate) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await sessionService.getSessionsByDateRange(startDate, endDate, filters);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setSessions(data || []);
    }
    
    setIsLoading(false);
  }, [startDate, endDate, filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions
  };
}

// Hook for member-specific sessions
export function useMemberSessions(memberId: string, filters?: Omit<SessionFilters, 'memberId'>) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await sessionService.getMemberSessions(memberId, filters);
    
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setSessions(data || []);
    }
    
    setIsLoading(false);
  }, [memberId, filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions
  };
}

// Hook for trainer-specific sessions
export function useTrainerSessions(trainerId: string, filters?: Omit<SessionFilters, 'trainerId'>) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!trainerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await sessionService.getTrainerSessions(trainerId, filters);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setSessions(data || []);
    }
    
    setIsLoading(false);
  }, [trainerId, filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions
  };
}

// Hook for session CRUD operations
export function useSessionActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (data: CreateSessionData) => {
    setIsLoading(true);
    setError(null);
    const result = await sessionService.createSession(data);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const updateSession = async (data: UpdateSessionData) => {
    setIsLoading(true);
    setError(null);
    const result = await sessionService.updateSession(data);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const deleteSession = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await sessionService.deleteSession(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const confirmSession = async (id: string) => {
    return updateSession({ id, status: 'confirmed' });
  };

  const startSession = async (id: string) => {
    return updateSession({ 
      id, 
      status: 'in_progress',
      actualStartTime: new Date().toISOString()
    });
  };

  const completeSession = async (id: string, completionData?: {
    completionSummary?: string;
    memberRating?: number;
    trainerRating?: number;
    notes?: string;
  }) => {
    return updateSession({ 
      id, 
      status: 'completed',
      actualEndTime: new Date().toISOString(),
      ...completionData
    });
  };

  const cancelSession = async (id: string, reason?: string) => {
    return updateSession({ 
      id, 
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : undefined
    });
  };

  const rescheduleSession = async (id: string, newDate: string) => {
    return updateSession({ 
      id, 
      scheduledDate: newDate,
      status: 'rescheduled'
    });
  };

  const markNoShow = async (id: string) => {
    return updateSession({ id, status: 'no_show' });
  };

  return {
    createSession,
    updateSession,
    deleteSession,
    confirmSession,
    startSession,
    completeSession,
    cancelSession,
    rescheduleSession,
    markNoShow,
    isLoading,
    error
  };
}

// Hook for session comments
export function useSessionComments(sessionId: string) {
  const [comments, setComments] = useState<SessionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await sessionService.getSessionComments(sessionId);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setComments(data || []);
    }
    
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    refetch: fetchComments
  };
}

// Hook for comment actions
export function useCommentActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = async (sessionId: string, comment: string, commentType: SessionComment['commentType'], isPrivate = false) => {
    setIsLoading(true);
    setError(null);
    const result = await sessionService.addSessionComment(sessionId, comment, commentType, isPrivate);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  return {
    addComment,
    isLoading,
    error
  };
}

// Hook for conflict checking
export function useConflictCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkConflicts = useCallback(async (trainerId: string, scheduledDate: string, duration: number) => {
    setIsChecking(true);
    
    const conflicts = await sessionService.checkConflicts(trainerId, scheduledDate, duration);
    
    setIsChecking(false);
    
    return conflicts;
  }, []);

  return {
    checkConflicts,
    isChecking
  };
}

// Hook for session statistics
export function useSessionStats(filters?: SessionFilters) {
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    noShowSessions: 0,
    upcomingSessions: 0,
    completionRate: 0,
    averageRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get sessions for the last 30 days or custom date range
      const endDate = filters?.dateTo || new Date().toISOString();
      const startDate = filters?.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: sessions, error: fetchError } = await sessionService.getSessionsByDateRange(startDate, endDate, filters);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length;
      const noShowSessions = sessions.filter(s => s.status === 'no_show').length;
      const upcomingSessions = sessions.filter(s => 
        ['scheduled', 'confirmed'].includes(s.status) && 
        new Date(s.scheduledDate) > new Date()
      ).length;
      
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
      
      const ratingsSum = sessions
        .filter(s => s.memberRating)
        .reduce((sum, s) => sum + (s.memberRating || 0), 0);
      const ratingsCount = sessions.filter(s => s.memberRating).length;
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      setStats({
        totalSessions,
        completedSessions,
        cancelledSessions,
        noShowSessions,
        upcomingSessions,
        completionRate,
        averageRating
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch session statistics');
    }
    
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}