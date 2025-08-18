import { useState, useEffect, useCallback } from 'react';
import { 
  subscriptionService, 
  Subscription, 
  MembershipPlan, 
  CreateSubscriptionData, 
  UpdateSubscriptionData,
  SubscriptionWithMember,
  SubscriptionFilters,
  SubscriptionStats
} from '@/lib/services/subscription-service';

export function useMembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await subscriptionService.getMembershipPlans();
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setPlans(data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans
  };
}

export function useMemberSubscriptions(memberId: string) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!memberId) return;
    
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await subscriptionService.getMemberSubscriptions(memberId);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setSubscriptions(data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [memberId]);

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions
  };
}

export function useSubscriptionActions() {
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = async (data: CreateSubscriptionData) => {
    setIsLoading(true);
    const result = await subscriptionService.createSubscription(data);
    setIsLoading(false);
    return result;
  };

  const updateSubscription = async (data: UpdateSubscriptionData) => {
    setIsLoading(true);
    const result = await subscriptionService.updateSubscription(data);
    setIsLoading(false);
    return result;
  };

  const cancelSubscription = async (id: string) => {
    setIsLoading(true);
    const result = await subscriptionService.cancelSubscription(id);
    setIsLoading(false);
    return result;
  };

  const freezeSubscription = async (id: string) => {
    setIsLoading(true);
    const result = await subscriptionService.freezeSubscription(id);
    setIsLoading(false);
    return result;
  };

  const reactivateSubscription = async (id: string) => {
    setIsLoading(true);
    const result = await subscriptionService.reactivateSubscription(id);
    setIsLoading(false);
    return result;
  };

  return {
    createSubscription,
    updateSubscription,
    cancelSubscription,
    freezeSubscription,
    reactivateSubscription,
    isLoading
  };
}

// Admin-specific hooks for subscriptions management

export function useAllSubscriptions(filters?: SubscriptionFilters) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await subscriptionService.getAllSubscriptions(filters);
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setSubscriptions(data);
      }
    } catch (err) {
      console.error('Unexpected error in fetchSubscriptions:', err);
      setError('Unexpected error occurred');
    }
    
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions
  };
}

export function useSubscriptionStats() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await subscriptionService.getSubscriptionStats();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setStats(data);
      }
    } catch (err) {
      console.error('Unexpected error in fetchStats:', err);
      setError('Unexpected error occurred');
    }
    
    setIsLoading(false);
  }, []);

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