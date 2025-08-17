import { supabase } from '@/lib/supabase/client';

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  memberId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'frozen' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  createdAt: string;
  plan?: MembershipPlan;
}

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

class SubscriptionService {
  // Get all membership plans
  async getMembershipPlans(): Promise<{ data: MembershipPlan[]; error: string | null }> {
    try {
      const { data: plans, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching membership plans:', error);
        return { data: [], error: error.message };
      }

      const transformedPlans = (plans || []).map(plan => this.transformMembershipPlanData(plan));
      return { data: transformedPlans, error: null };
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
      const updateData: any = {};
      
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

  // Transform database subscription data
  private transformSubscriptionData(dbSubscription: any): Subscription {
    return {
      id: dbSubscription.id,
      memberId: dbSubscription.member_id,
      planId: dbSubscription.plan_id,
      status: dbSubscription.status,
      startDate: dbSubscription.start_date,
      endDate: dbSubscription.end_date,
      autoRenew: dbSubscription.auto_renew,
      price: dbSubscription.price,
      createdAt: dbSubscription.created_at,
      plan: dbSubscription.membership_plans ? this.transformMembershipPlanData(dbSubscription.membership_plans) : undefined
    };
  }

  // Transform database membership plan data
  private transformMembershipPlanData(dbPlan: any): MembershipPlan {
    return {
      id: dbPlan.id,
      name: dbPlan.name,
      description: dbPlan.description || '',
      price: dbPlan.price,
      duration: dbPlan.duration,
      features: dbPlan.features || [],
      isActive: dbPlan.is_active,
      createdAt: dbPlan.created_at
    };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;