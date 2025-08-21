import { useState, useEffect, useCallback } from 'react';
import { memberService, type MemberStats } from '@/lib/services/member-service';
import { type MemberFilters, type CreateMemberData, type UpdateMemberData } from '@/lib/schemas';
import { Member } from '@/types';

// Hook for managing member list
export function useMembers(filters?: MemberFilters) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await memberService.getMembers(filters);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setMembers(data || []);
    }
    
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    isLoading,
    error,
    refetch: fetchMembers,
  };
}

// Hook for managing a single member
export function useMember(id: string | null) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await memberService.getMemberById(id);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setMember(data);
    }
    
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return {
    member,
    isLoading,
    error,
    refetch: fetchMember,
  };
}

// Hook for member statistics
export function useMemberStats() {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await memberService.getMemberStats();
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setStats(data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// Hook for member actions (create, update, delete)
export function useMemberActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMember = async (data: CreateMemberData) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.createMember(data);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const updateMember = async (data: UpdateMemberData) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.updateMember(data);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const deleteMember = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.deleteMember(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const deleteMembers = async (ids: string[]) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.deleteMembers(ids);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const freezeMembership = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.freezeMembership(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const unfreezeMembership = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.unfreezeMembership(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const cancelMembership = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.cancelMembership(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  const reactivateMembership = async (id: string) => {
    setIsLoading(true);
    setError(null);
    const result = await memberService.reactivateMembership(id);
    setIsLoading(false);
    if (result.error) setError(result.error);
    return result;
  };

  return {
    createMember,
    updateMember,
    deleteMember,
    deleteMembers,
    freezeMembership,
    unfreezeMembership,
    cancelMembership,
    reactivateMembership,
    isLoading,
    error,
  };
}

// Hook for recent member activities
export function useRecentMemberActivities(limit = 10) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await memberService.getRecentMemberActivities(limit);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setActivities(data || []);
    }
    
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  };
}