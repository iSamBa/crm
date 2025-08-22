import { BaseService, ServiceResponse } from './base-service';
import { supabase } from '@/lib/supabase/client';
import { MembershipPlan, Subscription } from '@/types';

export interface CreateSubscriptionData {
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
  price: number;
}

export interface UpdateSubscriptionData {
  id: string;
  status?: 'active' | 'cancelled' | 'frozen' | 'expired';
  endDate?: string;
  autoRenew?: boolean;
  price?: number;
}

export interface SubscriptionFilters {
  status?: string;
  memberId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface SubscriptionWithMember extends Subscription {
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    membershipStatus: string;
  };
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiringSoon: number;
  totalRevenue: number;
  statusDistribution: { [key: string]: number };
  planDistribution: { [key: string]: number };
}

class SubscriptionService extends BaseService {
  // Get all membership plans
  async getMembershipPlans(): Promise<ServiceResponse<MembershipPlan[]>> {
    try {
      const result = await this.executeQuery(
        async () => this.db
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true }),
        'Failed to fetch membership plans',
        {
          logQuery: 'Fetching membership plans',
          transform: (data: unknown) => (data as Record<string, unknown>[]).map(plan => this.transformMembershipPlanData(plan)),
          allowEmpty: true,
          expectArray: true
        }
      );

      return {
        data: result.data || [],
        error: result.error
      };
    } catch (error) {
      console.error('Unexpected error fetching membership plans:', error);
      return { data: [], error: 'Failed to fetch membership plans' };
    }
  }

  // Get subscriptions for a specific member
  async getMemberSubscriptions(memberId: string): Promise<{ data: Subscription[]; error: string | null }> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          membership_plans:plan_id (
            id,
            name,
            description,
            price,
            duration,
            features
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching member subscriptions:', error);
        return { data: [], error: error.message };
      }

      const transformedSubscriptions = (subscriptions || []).map(sub => this.transformSubscriptionData(sub));
      return { data: transformedSubscriptions, error: null };
    } catch (error) {
      console.error('Unexpected error fetching member subscriptions:', error);
      return { data: [], error: 'Failed to fetch subscriptions' };
    }
  }

  // Create a new subscription
  async createSubscription(data: CreateSubscriptionData): Promise<{ data: Subscription | null; error: string | null }> {
    try {
      const subscriptionData = {
        member_id: data.memberId,
        plan_id: data.planId,
        start_date: data.startDate,
        end_date: data.endDate,
        auto_renew: data.autoRenew || true,
        price: data.price,
        status: 'active'
      };

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select(`
          *,
          membership_plans:plan_id (
            id,
            name,
            description,
            price,
            duration,
            features
          )
        `)
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformSubscriptionData(subscription), error: null };
    } catch (error) {
      console.error('Unexpected error creating subscription:', error);
      return { data: null, error: 'Failed to create subscription' };
    }
  }

  // Update a subscription
  async updateSubscription(data: UpdateSubscriptionData): Promise<{ data: Subscription | null; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (data.status) updateData.status = data.status;
      if (data.endDate) updateData.end_date = data.endDate;
      if (data.autoRenew !== undefined) updateData.auto_renew = data.autoRenew;
      if (data.price !== undefined) updateData.price = data.price;

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', data.id)
        .select(`
          *,
          membership_plans:plan_id (
            id,
            name,
            description,
            price,
            duration,
            features
          )
        `)
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformSubscriptionData(subscription), error: null };
    } catch (error) {
      console.error('Unexpected error updating subscription:', error);
      return { data: null, error: 'Failed to update subscription' };
    }
  }

  // Cancel a subscription
  async cancelSubscription(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        console.error('Error cancelling subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  // Freeze a subscription
  async freezeSubscription(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'frozen' })
        .eq('id', id);

      if (error) {
        console.error('Error freezing subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error freezing subscription:', error);
      return { success: false, error: 'Failed to freeze subscription' };
    }
  }

  // Reactivate a subscription
  async reactivateSubscription(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) {
        console.error('Error reactivating subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error reactivating subscription:', error);
      return { success: false, error: 'Failed to reactivate subscription' };
    }
  }

  // Calculate end date based on plan duration
  calculateEndDate(startDate: string, duration: 'monthly' | 'quarterly' | 'annual'): string {
    const start = new Date(startDate);
    
    switch (duration) {
      case 'monthly':
        start.setMonth(start.getMonth() + 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() + 3);
        break;
      case 'annual':
        start.setFullYear(start.getFullYear() + 1);
        break;
    }
    
    return start.toISOString().split('T')[0];
  }

  // Get all subscriptions with member info (Admin view)
  async getAllSubscriptions(filters?: SubscriptionFilters): Promise<{ data: SubscriptionWithMember[]; error: string | null }> {
    try {
      // First get subscriptions with basic filters
      let query = supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply server-side filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.memberId) {
          query = query.eq('member_id', filters.memberId);
        }
        if (filters.planId) {
          query = query.eq('plan_id', filters.planId);
        }
        if (filters.startDate) {
          query = query.gte('start_date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('end_date', filters.endDate);
        }
      }

      const { data: subscriptions, error } = await query;

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return { data: [], error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return { data: [], error: null };
      }

      // Get unique member IDs and plan IDs
      const memberIds = [...new Set(subscriptions.map(sub => sub.member_id))];
      const planIds = [...new Set(subscriptions.map(sub => sub.plan_id))];

      // Fetch members and plans separately
      const [membersResult, plansResult] = await Promise.all([
        supabase
          .from('members')
          .select('id, first_name, last_name, email, membership_status')
          .in('id', memberIds),
        supabase
          .from('membership_plans')
          .select('id, name, description, price, duration, features')
          .in('id', planIds)
      ]);

      if (membersResult.error) {
        console.error('Error fetching members:', membersResult.error);
        return { data: [], error: 'Failed to fetch member data' };
      }

      if (plansResult.error) {
        console.error('Error fetching plans:', plansResult.error);
        return { data: [], error: 'Failed to fetch plan data' };
      }

      const membersMap = new Map(membersResult.data?.map(member => [member.id, member]) || []);
      const plansMap = new Map(plansResult.data?.map(plan => [plan.id, plan]) || []);

      // Transform subscriptions with member and plan data
      let transformedSubscriptions: SubscriptionWithMember[] = subscriptions.map(sub => {
        const member = membersMap.get(sub.member_id);
        const plan = plansMap.get(sub.plan_id);

        return {
          id: sub.id as string,
          memberId: sub.member_id as string,
          planId: sub.plan_id as string,
          status: sub.status as any,
          startDate: sub.start_date as string,
          endDate: sub.end_date as string,
          autoRenew: sub.auto_renew as boolean,
          price: sub.price as number,
          createdAt: sub.created_at as string,
          updatedAt: sub.updated_at as string,
          member: member ? {
            id: member.id as string,
            firstName: member.first_name as string,
            lastName: member.last_name as string,
            email: member.email as string,
            membershipStatus: member.membership_status as any
          } : undefined,
          plan: plan ? {
            id: plan.id as string,
            name: plan.name as string,
            description: (plan.description as string) || '',
            price: plan.price as number,
            duration: plan.duration as any,
            features: (plan.features as string[]) || [],
            maxSessionsPerMonth: (plan as any).max_sessions_per_month as number | undefined,
            includesPersonalTraining: (plan as any).includes_personal_training as boolean || false,
            isActive: true,
            createdAt: (plan as any).created_at as string || new Date().toISOString(),
            updatedAt: (plan as any).updated_at as string || new Date().toISOString()
          } : undefined
        } as SubscriptionWithMember;
      });

      // Apply search term filter (client-side)
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        transformedSubscriptions = transformedSubscriptions.filter(sub => 
          sub.member?.firstName.toLowerCase().includes(searchLower) ||
          sub.member?.lastName.toLowerCase().includes(searchLower) ||
          sub.member?.email.toLowerCase().includes(searchLower) ||
          sub.plan?.name.toLowerCase().includes(searchLower)
        );
      }

      return { data: transformedSubscriptions, error: null };
    } catch (error) {
      console.error('Unexpected error fetching all subscriptions:', error);
      return { data: [], error: 'Failed to fetch subscriptions' };
    }
  }

  // Get subscription statistics (Admin dashboard)
  async getSubscriptionStats(): Promise<{ data: SubscriptionStats | null; error: string | null }> {
    try {
      // Get subscriptions and plans separately
      const [subscriptionsResult, plansResult] = await Promise.all([
        this.db.from('subscriptions').select('*'),
        this.db.from('membership_plans').select('id, name')
      ]);

      if (subscriptionsResult.error) {
        console.error('Error fetching subscription stats:', subscriptionsResult.error);
        return { data: null, error: subscriptionsResult.error.message };
      }

      if (plansResult.error) {
        console.error('Error fetching plans for stats:', plansResult.error);
        return { data: null, error: plansResult.error.message };
      }

      const subscriptions = subscriptionsResult.data || [];
      const plansMap = new Map(plansResult.data?.map(plan => [plan.id, plan.name]) || []);

      const stats: SubscriptionStats = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: 0,
        expiringSoon: 0,
        totalRevenue: 0,
        statusDistribution: {},
        planDistribution: {}
      };

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      subscriptions.forEach(sub => {
        // Count active subscriptions
        if (sub.status === 'active') {
          stats.activeSubscriptions++;
        }

        // Count expiring soon (within 30 days)
        if (sub.status === 'active' && new Date(sub.end_date) <= thirtyDaysFromNow) {
          stats.expiringSoon++;
        }

        // Calculate total revenue from active subscriptions
        if (sub.status === 'active') {
          stats.totalRevenue += parseFloat(sub.price || '0');
        }

        // Status distribution
        stats.statusDistribution[sub.status] = (stats.statusDistribution[sub.status] || 0) + 1;

        // Plan distribution
        const planName = plansMap.get(sub.plan_id) || 'Unknown Plan';
        stats.planDistribution[planName] = (stats.planDistribution[planName] || 0) + 1;
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Unexpected error fetching subscription stats:', error);
      return { data: null, error: 'Failed to fetch subscription statistics' };
    }
  }

  // Transform database subscription data
  private transformSubscriptionData(dbSubscription: Record<string, unknown>): Subscription {
    return {
      id: dbSubscription.id as string,
      memberId: dbSubscription.member_id as string,
      planId: dbSubscription.plan_id as string,
      status: dbSubscription.status as 'active' | 'cancelled' | 'frozen' | 'expired',
      startDate: dbSubscription.start_date as string,
      endDate: dbSubscription.end_date as string,
      autoRenew: dbSubscription.auto_renew as boolean,
      price: dbSubscription.price as number,
      createdAt: dbSubscription.created_at as string,
      updatedAt: dbSubscription.updated_at as string,
      plan: dbSubscription.membership_plans ? this.transformMembershipPlanData(dbSubscription.membership_plans as Record<string, unknown>) : undefined
    };
  }

  // Transform database membership plan data
  private transformMembershipPlanData(dbPlan: Record<string, unknown>): MembershipPlan {
    return {
      id: dbPlan.id as string,
      name: dbPlan.name as string,
      description: (dbPlan.description as string) || '',
      price: dbPlan.price as number,
      duration: dbPlan.duration as 'monthly' | 'quarterly' | 'annual',
      features: (dbPlan.features as string[]) || [],
      maxSessionsPerMonth: dbPlan.max_sessions_per_month as number | undefined,
      includesPersonalTraining: dbPlan.includes_personal_training as boolean,
      isActive: dbPlan.is_active as boolean,
      createdAt: dbPlan.created_at as string,
      updatedAt: dbPlan.updated_at as string
    };
  }

}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;