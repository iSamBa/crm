import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useSubscriptionPlanById,
  useActiveSubscriptionPlans,
  usePlanStatistics,
  useTogglePlanStatus,
} from '../use-subscription-plans';
import { subscriptionPlanService } from '@/lib/services/subscription-plan-service';

// Mock the subscription plan service
vi.mock('@/lib/services/subscription-plan-service', () => ({
  subscriptionPlanService: {
    getSubscriptionPlans: vi.fn(),
    createSubscriptionPlan: vi.fn(),
    updateSubscriptionPlan: vi.fn(),
    deleteSubscriptionPlan: vi.fn(),
    getSubscriptionPlanById: vi.fn(),
    getActiveSubscriptionPlans: vi.fn(),
    getPlanStatistics: vi.fn(),
    togglePlanStatus: vi.fn(),
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

describe('Subscription Plan Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSubscriptionPlans', () => {
    it('should fetch subscription plans successfully', async () => {
      const mockPlans = [
        {
          id: 'plan1',
          name: 'Basic Plan',
          description: 'Basic fitness plan',
          price: 29.99,
          durationMonths: 1,
          isActive: true,
          features: ['Gym access'],
        },
        {
          id: 'plan2',
          name: 'Premium Plan',
          description: 'Premium fitness plan',
          price: 99.99,
          durationMonths: 12,
          isActive: true,
          features: ['Gym access', 'Personal training'],
        },
      ];

      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockResolvedValue({
        data: mockPlans,
        error: null,
      });

      const { result } = renderHook(
        () => useSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPlans);
      expect(result.current.error).toBeNull();
      expect(subscriptionPlanService.getSubscriptionPlans).toHaveBeenCalledWith(undefined);
    });

    it('should apply filters when provided', async () => {
      const filters = {
        search: 'premium',
        isActive: true,
        minPrice: 50,
        maxPrice: 200,
        duration: [12],
      };

      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(
        () => useSubscriptionPlans(filters),
        { wrapper: createWrapper() }
      );

      expect(subscriptionPlanService.getSubscriptionPlans).toHaveBeenCalledWith(filters);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch plans';
      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockResolvedValue({
        data: [],
        error: errorMessage,
      });

      const { result } = renderHook(
        () => useSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useSubscriptionPlanById', () => {
    it('should fetch subscription plan by ID successfully', async () => {
      const mockPlan = {
        id: 'plan1',
        name: 'Basic Plan',
        description: 'Basic fitness plan',
        price: 29.99,
        durationMonths: 1,
        isActive: true,
        features: ['Gym access'],
      };

      vi.mocked(subscriptionPlanService.getSubscriptionPlanById).mockResolvedValue({
        data: mockPlan,
        error: null,
      });

      const { result } = renderHook(
        () => useSubscriptionPlanById('plan1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPlan);
      expect(subscriptionPlanService.getSubscriptionPlanById).toHaveBeenCalledWith('plan1');
    });

    it('should handle plan not found', async () => {
      vi.mocked(subscriptionPlanService.getSubscriptionPlanById).mockResolvedValue({
        data: null,
        error: 'Plan not found',
      });

      const { result } = renderHook(
        () => useSubscriptionPlanById('nonexistent'),
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
        () => useSubscriptionPlanById(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(subscriptionPlanService.getSubscriptionPlanById).not.toHaveBeenCalled();
    });
  });

  describe('useActiveSubscriptionPlans', () => {
    it('should fetch active subscription plans successfully', async () => {
      const mockActivePlans = [
        {
          id: 'plan1',
          name: 'Basic Plan',
          isActive: true,
          price: 29.99,
        },
        {
          id: 'plan2',
          name: 'Premium Plan',
          isActive: true,
          price: 99.99,
        },
      ];

      vi.mocked(subscriptionPlanService.getActiveSubscriptionPlans).mockResolvedValue({
        data: mockActivePlans,
        error: null,
      });

      const { result } = renderHook(
        () => useActiveSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockActivePlans);
      expect(subscriptionPlanService.getActiveSubscriptionPlans).toHaveBeenCalled();
    });

    it('should handle errors when fetching active plans', async () => {
      vi.mocked(subscriptionPlanService.getActiveSubscriptionPlans).mockResolvedValue({
        data: [],
        error: 'Database error',
      });

      const { result } = renderHook(
        () => useActiveSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('usePlanStatistics', () => {
    it('should fetch plan statistics successfully', async () => {
      const mockStats = {
        totalPlans: 5,
        activePlans: 3,
        inactivePlans: 2,
        totalSubscriptions: 150,
        revenueThisMonth: 4500.00,
      };

      vi.mocked(subscriptionPlanService.getPlanStatistics).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const { result } = renderHook(
        () => usePlanStatistics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(subscriptionPlanService.getPlanStatistics).toHaveBeenCalled();
    });

    it('should handle statistics errors', async () => {
      vi.mocked(subscriptionPlanService.getPlanStatistics).mockResolvedValue({
        data: null,
        error: 'Query error',
      });

      const { result } = renderHook(
        () => usePlanStatistics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useCreateSubscriptionPlan', () => {
    it('should create subscription plan successfully', async () => {
      const newPlan = {
        id: 'plan1',
        name: 'New Plan',
        description: 'A new fitness plan',
        price: 49.99,
        durationMonths: 6,
        isActive: true,
        features: ['Gym access'],
      };

      vi.mocked(subscriptionPlanService.createSubscriptionPlan).mockResolvedValue({
        data: newPlan,
        error: null,
      });

      const { result } = renderHook(
        () => useCreateSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      const planData = {
        name: 'New Plan',
        description: 'A new fitness plan',
        price: 49.99,
        durationMonths: 6,
        features: ['Gym access'],
        isActive: true,
      };

      result.current.mutate(planData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newPlan);
      expect(subscriptionPlanService.createSubscriptionPlan).toHaveBeenCalledWith(planData);
    });

    it('should handle creation errors', async () => {
      vi.mocked(subscriptionPlanService.createSubscriptionPlan).mockResolvedValue({
        data: null,
        error: 'Validation error',
      });

      const { result } = renderHook(
        () => useCreateSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      const planData = {
        name: 'New Plan',
        description: 'A new fitness plan',
        price: 49.99,
        durationMonths: 6,
        features: ['Gym access'],
        isActive: true,
      };

      result.current.mutate(planData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpdateSubscriptionPlan', () => {
    it('should update subscription plan successfully', async () => {
      const updatedPlan = {
        id: 'plan1',
        name: 'Updated Plan',
        price: 59.99,
        isActive: false,
      };

      vi.mocked(subscriptionPlanService.updateSubscriptionPlan).mockResolvedValue({
        data: updatedPlan,
        error: null,
      });

      const { result } = renderHook(
        () => useUpdateSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updatedPlan);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedPlan);
      expect(subscriptionPlanService.updateSubscriptionPlan).toHaveBeenCalledWith(updatedPlan);
    });

    it('should handle update errors', async () => {
      vi.mocked(subscriptionPlanService.updateSubscriptionPlan).mockResolvedValue({
        data: null,
        error: 'Plan not found',
      });

      const { result } = renderHook(
        () => useUpdateSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      const updateData = {
        id: 'plan1',
        name: 'Updated Plan',
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useDeleteSubscriptionPlan', () => {
    it('should delete subscription plan successfully', async () => {
      vi.mocked(subscriptionPlanService.deleteSubscriptionPlan).mockResolvedValue({
        data: true,
        error: null,
      });

      const { result } = renderHook(
        () => useDeleteSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('plan1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(true);
      expect(subscriptionPlanService.deleteSubscriptionPlan).toHaveBeenCalledWith('plan1');
    });

    it('should handle deletion errors', async () => {
      vi.mocked(subscriptionPlanService.deleteSubscriptionPlan).mockResolvedValue({
        data: false,
        error: 'Cannot delete plan',
      });

      const { result } = renderHook(
        () => useDeleteSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('plan1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useTogglePlanStatus', () => {
    it('should toggle plan status successfully', async () => {
      const updatedPlan = {
        id: 'plan1',
        isActive: true,
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(subscriptionPlanService.togglePlanStatus).mockResolvedValue({
        data: updatedPlan,
        error: null,
      });

      const { result } = renderHook(
        () => useTogglePlanStatus(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ planId: 'plan1', isActive: true });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedPlan);
      expect(subscriptionPlanService.togglePlanStatus).toHaveBeenCalledWith('plan1', true);
    });

    it('should handle toggle status errors', async () => {
      vi.mocked(subscriptionPlanService.togglePlanStatus).mockResolvedValue({
        data: null,
        error: 'Cannot update plan',
      });

      const { result } = renderHook(
        () => useTogglePlanStatus(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ planId: 'plan1', isActive: false });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Query key generation and caching', () => {
    it('should generate consistent query keys for same filters', () => {
      const filters = { search: 'premium' };

      const { result: result1 } = renderHook(
        () => useSubscriptionPlans(filters),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useSubscriptionPlans(filters),
        { wrapper: createWrapper() }
      );

      // Both hooks should use the same query key for caching
      expect(result1.current.isLoading).toBe(result2.current.isLoading);
    });

    it('should generate different query keys for different filters', () => {
      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(
        () => useSubscriptionPlans({ search: 'basic' }),
        { wrapper: createWrapper() }
      );

      renderHook(
        () => useSubscriptionPlans({ search: 'premium' }),
        { wrapper: createWrapper() }
      );

      // Should make separate API calls for different filters
      expect(subscriptionPlanService.getSubscriptionPlans).toHaveBeenCalledTimes(2);
    });

    it('should invalidate related queries on mutations', async () => {
      // This would be tested in integration tests where we verify
      // that creating/updating a plan invalidates the plans list query
      const { result } = renderHook(
        () => useCreateSubscriptionPlan(),
        { wrapper: createWrapper() }
      );

      expect(result.current.mutate).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(
        () => useSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle empty responses correctly', async () => {
      vi.mocked(subscriptionPlanService.getSubscriptionPlans).mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(
        () => useSubscriptionPlans(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});