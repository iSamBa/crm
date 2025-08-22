import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useSessionById,
  useSessionConflicts,
} from '../use-sessions';
import { sessionService } from '@/lib/services/session-service';

// Mock the session service
vi.mock('@/lib/services/session-service', () => ({
  sessionService: {
    getSessionsByDateRange: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    getSessionById: vi.fn(),
    checkConflicts: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Session Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSessions', () => {
    it('should fetch sessions successfully', async () => {
      const mockSessions = [
        {
          id: 'session1',
          title: 'Personal Training',
          scheduledDate: '2024-01-15T10:00:00Z',
          duration: 60,
          status: 'scheduled' as const,
          member: { id: 'member1', firstName: 'John', lastName: 'Doe' },
          trainer: { id: 'trainer1', firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      vi.mocked(sessionService.getSessionsByDateRange).mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const { result } = renderHook(
        () => useSessions('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(result.current.error).toBeNull();
      expect(sessionService.getSessionsByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        undefined
      );
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch sessions';
      vi.mocked(sessionService.getSessionsByDateRange).mockResolvedValue({
        data: [],
        error: errorMessage,
      });

      const { result } = renderHook(
        () => useSessions('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    it('should apply filters when provided', async () => {
      const filters = {
        memberId: 'member1',
        trainerId: 'trainer1',
        status: 'scheduled' as const,
      };

      vi.mocked(sessionService.getSessionsByDateRange).mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(
        () => useSessions('2024-01-01', '2024-01-31', filters),
        { wrapper: createWrapper() }
      );

      expect(sessionService.getSessionsByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        filters
      );
    });

    it('should be disabled when dates are not provided', () => {
      const { result } = renderHook(
        () => useSessions('', ''),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(sessionService.getSessionsByDateRange).not.toHaveBeenCalled();
    });
  });

  describe('useSessionById', () => {
    it('should fetch session by ID successfully', async () => {
      const mockSession = {
        id: 'session1',
        title: 'Personal Training',
        scheduledDate: '2024-01-15T10:00:00Z',
        duration: 60,
        status: 'scheduled' as const,
      };

      vi.mocked(sessionService.getSessionById).mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const { result } = renderHook(
        () => useSessionById('session1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSession);
      expect(sessionService.getSessionById).toHaveBeenCalledWith('session1');
    });

    it('should handle session not found', async () => {
      vi.mocked(sessionService.getSessionById).mockResolvedValue({
        data: null,
        error: 'Session not found',
      });

      const { result } = renderHook(
        () => useSessionById('nonexistent'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should be disabled when ID is not provided', () => {
      const { result } = renderHook(
        () => useSessionById(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(sessionService.getSessionById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateSession', () => {
    it('should create session successfully', async () => {
      const newSession = {
        id: 'session1',
        title: 'Personal Training',
        scheduledDate: '2024-01-15T10:00:00Z',
        duration: 60,
        status: 'scheduled' as const,
      };

      vi.mocked(sessionService.createSession).mockResolvedValue({
        data: newSession,
        error: null,
      });

      const { result } = renderHook(
        () => useCreateSession(),
        { wrapper: createWrapper() }
      );

      const sessionData = {
        memberId: 'member1',
        trainerId: 'trainer1',
        type: 'personal' as const,
        title: 'Personal Training',
        scheduledDate: '2024-01-15T10:00:00Z',
        duration: 60,
      };

      result.current.mutate(sessionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newSession);
      expect(sessionService.createSession).toHaveBeenCalledWith(sessionData);
    });

    it('should handle creation errors', async () => {
      vi.mocked(sessionService.createSession).mockResolvedValue({
        data: null,
        error: 'Validation error',
      });

      const { result } = renderHook(
        () => useCreateSession(),
        { wrapper: createWrapper() }
      );

      const sessionData = {
        memberId: 'member1',
        trainerId: 'trainer1',
        type: 'personal' as const,
        title: 'Personal Training',
        scheduledDate: '2024-01-15T10:00:00Z',
        duration: 60,
      };

      result.current.mutate(sessionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpdateSession', () => {
    it('should update session successfully', async () => {
      const updatedSession = {
        id: 'session1',
        title: 'Updated Training',
        status: 'completed' as const,
      };

      vi.mocked(sessionService.updateSession).mockResolvedValue({
        data: updatedSession,
        error: null,
      });

      const { result } = renderHook(
        () => useUpdateSession(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updatedSession);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedSession);
      expect(sessionService.updateSession).toHaveBeenCalledWith(updatedSession);
    });

    it('should handle update errors', async () => {
      vi.mocked(sessionService.updateSession).mockResolvedValue({
        data: null,
        error: 'Session not found',
      });

      const { result } = renderHook(
        () => useUpdateSession(),
        { wrapper: createWrapper() }
      );

      const updateData = {
        id: 'session1',
        title: 'Updated Training',
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useDeleteSession', () => {
    it('should delete session successfully', async () => {
      vi.mocked(sessionService.deleteSession).mockResolvedValue({
        data: true,
        error: null,
      });

      const { result } = renderHook(
        () => useDeleteSession(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('session1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(true);
      expect(sessionService.deleteSession).toHaveBeenCalledWith('session1');
    });

    it('should handle deletion errors', async () => {
      vi.mocked(sessionService.deleteSession).mockResolvedValue({
        data: false,
        error: 'Cannot delete session',
      });

      const { result } = renderHook(
        () => useDeleteSession(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('session1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useSessionConflicts', () => {
    it('should check for conflicts successfully', async () => {
      const mockConflicts = [
        {
          id: 'conflict1',
          title: 'Existing Session',
          scheduledDate: '2024-01-15T10:30:00Z',
        },
      ];

      vi.mocked(sessionService.checkConflicts).mockResolvedValue(mockConflicts);

      const { result } = renderHook(
        () => useSessionConflicts('trainer1', '2024-01-15T10:00:00Z', 60),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockConflicts);
      expect(sessionService.checkConflicts).toHaveBeenCalledWith(
        'trainer1',
        '2024-01-15T10:00:00Z',
        60
      );
    });

    it('should handle no conflicts', async () => {
      vi.mocked(sessionService.checkConflicts).mockResolvedValue([]);

      const { result } = renderHook(
        () => useSessionConflicts('trainer1', '2024-01-15T10:00:00Z', 60),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should be disabled when required params are missing', () => {
      const { result } = renderHook(
        () => useSessionConflicts('', '', 0),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(sessionService.checkConflicts).not.toHaveBeenCalled();
    });

    it('should handle conflict check errors', async () => {
      vi.mocked(sessionService.checkConflicts).mockRejectedValue(
        new Error('Conflict check failed')
      );

      const { result } = renderHook(
        () => useSessionConflicts('trainer1', '2024-01-15T10:00:00Z', 60),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Query key generation', () => {
    it('should generate consistent query keys for sessions', () => {
      const { result: result1 } = renderHook(
        () => useSessions('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useSessions('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      // Both hooks should use the same query key for caching
      expect(result1.current.isLoading).toBe(result2.current.isLoading);
    });

    it('should generate different query keys for different parameters', () => {
      vi.mocked(sessionService.getSessionsByDateRange).mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(
        () => useSessions('2024-01-01', '2024-01-31'),
        { wrapper: createWrapper() }
      );

      renderHook(
        () => useSessions('2024-02-01', '2024-02-28'),
        { wrapper: createWrapper() }
      );

      // Should make separate API calls for different date ranges
      expect(sessionService.getSessionsByDateRange).toHaveBeenCalledTimes(2);
    });
  });
});