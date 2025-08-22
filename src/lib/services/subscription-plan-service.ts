import { BaseService, ServiceResponse, ServiceResult } from './base-service';
import { 
  CreateSubscriptionPlanSchema, 
  UpdateSubscriptionPlanSchema,
  type CreateSubscriptionPlanData,
  type UpdateSubscriptionPlanData,
  type SubscriptionPlanFilters
} from '@/lib/schemas';
import type { SubscriptionPlan } from '@/types';

export interface SubscriptionPlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalSubscribers: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  annualRevenue: number;
}

class SubscriptionPlanService extends BaseService {
  private readonly tableName = 'membership_plans';
  
  /**
   * Database field mapping for transformations
   */
  private readonly fieldMap = {
    created_at: 'createdAt',
    max_sessions_per_month: 'maxSessionsPerMonth',
    includes_personal_training: 'includesPersonalTraining',
    is_active: 'isActive'
  };

  /**
   * Get all subscription plans with filtering and sorting
   */
  async getPlans(filters?: SubscriptionPlanFilters): Promise<ServiceResponse<SubscriptionPlan[]>> {
    const result = await this.executeQuery(
      async () => {
        let query = this.db
          .from(this.tableName)
          .select('*')
          .order(filters?.sortBy || 'created_at', { 
            ascending: filters?.sortOrder === 'asc' 
          });

        // Apply filters
        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }

        if (filters?.duration) {
          query = query.eq('duration', filters.duration);
        }

        if (filters?.includesPersonalTraining !== undefined) {
          query = query.eq('includes_personal_training', filters.includesPersonalTraining);
        }

        if (filters?.priceMin !== undefined) {
          query = query.gte('price', filters.priceMin);
        }

        if (filters?.priceMax !== undefined) {
          query = query.lte('price', filters.priceMax);
        }

        if (filters?.searchTerm) {
          query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
        }

        return query;
      },
      'Failed to fetch subscription plans',
      {
        logQuery: 'Fetching subscription plans',
        transform: (data: unknown) => (data as Record<string, unknown>[]).map(plan => this.transformPlanData(plan)),
        allowEmpty: true,
        expectArray: true
      }
    );
    
    // Ensure we return an empty array instead of null for array responses
    if (result.error && !result.data) {
      return { data: [], error: result.error };
    }
    return result as ServiceResponse<SubscriptionPlan[]>;
  }

  /**
   * Get a single subscription plan by ID
   */
  async getPlanById(id: string): Promise<ServiceResponse<SubscriptionPlan>> {
    const result = await this.executeQuery(
      async () => this.db
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single(),
      'Failed to fetch subscription plan',
      {
        logQuery: `Fetching subscription plan: ${id}`,
        transform: (data: unknown) => this.transformPlanData(data as Record<string, unknown>)
      }
    );

    if (result.error) {
      return { data: null as any, error: result.error };
    }

    if (!result.data) {
      return { data: null as any, error: 'Subscription plan not found' };
    }

    return { data: result.data, error: null };
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(data: CreateSubscriptionPlanData): Promise<ServiceResponse<SubscriptionPlan>> {
    // Validate input
    const validation = this.validateInput(CreateSubscriptionPlanSchema, data);
    if (validation.error) {
      return { data: null as any, error: validation.error };
    }

    const validatedData = validation.data!;

    const result = await this.executeMutation(
      async () => {
        const dbData = this.transformToDbFields(validatedData, this.fieldMap);
        
        return this.db
          .from(this.tableName)
          .insert(dbData)
          .select()
          .single();
      },
      'Failed to create subscription plan',
      {
        logOperation: `Creating subscription plan: ${validatedData.name}`,
        invalidateQueries: [
          this.invalidate.subscriptionPlans.all,
          this.invalidate.subscriptionPlans.lists
        ],
        transform: (data: unknown) => this.transformPlanData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || (null as any),
      error: result.error
    };
  }

  /**
   * Update an existing subscription plan
   */
  async updatePlan(data: UpdateSubscriptionPlanData): Promise<ServiceResponse<SubscriptionPlan>> {
    // Validate input
    const validation = this.validateInput(UpdateSubscriptionPlanSchema, data);
    if (validation.error) {
      return { data: null as any, error: validation.error };
    }

    const validatedData = validation.data!;
    const { id, ...updateData } = validatedData;

    const result = await this.executeMutation(
      async () => {
        const dbData = this.transformToDbFields(updateData, this.fieldMap);
        
        return this.db
          .from(this.tableName)
          .update(dbData)
          .eq('id', id)
          .select()
          .single();
      },
      'Failed to update subscription plan',
      {
        logOperation: `Updating subscription plan: ${id}`,
        invalidateQueries: [
          this.invalidate.subscriptionPlans.all,
          this.invalidate.subscriptionPlans.lists
        ],
        optimisticUpdate: {
          queryKey: ['subscription-plans', 'list'],
          updater: (oldData: unknown) => 
            (oldData as SubscriptionPlan[])?.map(plan => 
              plan.id === id ? { ...plan, ...updateData } : plan
            ) || []
        },
        transform: (data: unknown) => this.transformPlanData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || (null as any),
      error: result.error
    };
  }

  /**
   * Delete a subscription plan (soft delete by setting isActive to false)
   */
  async deletePlan(id: string): Promise<ServiceResult> {
    return this.executeMutation(
      async () => {
        // Check if plan has active subscriptions
        const { data: subscriptions } = await this.db
          .from('subscriptions')
          .select('id')
          .eq('plan_id', id)
          .eq('status', 'active')
          .limit(1);

        if (subscriptions && subscriptions.length > 0) {
          return { 
            data: null, 
            error: { 
              message: 'Cannot delete plan with active subscriptions. Please set it as inactive instead.' 
            } 
          };
        }

        // Soft delete by setting is_active to false
        return this.db
          .from(this.tableName)
          .update({ 
            is_active: false
          })
          .eq('id', id)
          .select()
          .single();
      },
      'Failed to delete subscription plan',
      {
        logOperation: `Deleting subscription plan: ${id}`,
        invalidateQueries: [
          this.invalidate.subscriptionPlans.all,
          this.invalidate.subscriptionPlans.lists
        ],
        optimisticUpdate: {
          queryKey: ['subscription-plans', 'list'],
          updater: (oldData: unknown) => 
            (oldData as SubscriptionPlan[])?.filter(plan => plan.id !== id) || []
        }
      }
    ).then(result => ({
      success: !result.error,
      error: result.error
    }));
  }

  /**
   * Toggle plan active status
   */
  async togglePlanStatus(id: string, isActive: boolean): Promise<ServiceResponse<SubscriptionPlan>> {
    const result = await this.executeMutation(
      async () => this.db
        .from(this.tableName)
        .update({ 
          is_active: isActive
        })
        .eq('id', id)
        .select()
        .single(),
      'Failed to update plan status',
      {
        logOperation: `${isActive ? 'Activating' : 'Deactivating'} subscription plan: ${id}`,
        invalidateQueries: [
          this.invalidate.subscriptionPlans.all,
          this.invalidate.subscriptionPlans.lists
        ],
        optimisticUpdate: {
          queryKey: ['subscription-plans', 'list'],
          updater: (oldData: unknown) => 
            (oldData as SubscriptionPlan[])?.map(plan => 
              plan.id === id ? { ...plan, isActive } : plan
            ) || []
        },
        transform: (data: unknown) => this.transformPlanData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || (null as any),
      error: result.error
    };
  }

  /**
   * Get subscription plan statistics
   */
  async getPlanStats(): Promise<ServiceResponse<SubscriptionPlanStats>> {
    return this.executeQuery(
      async () => {
        // Get plans count
        const [plansResult, subscriptionsResult] = await Promise.all([
          this.db.from(this.tableName).select('*'),
          this.db.from('subscriptions').select('*, membership_plans(duration, price)')
        ]);

        if (plansResult.error) throw plansResult.error;
        if (subscriptionsResult.error) throw subscriptionsResult.error;

        const plans = plansResult.data || [];
        const subscriptions = subscriptionsResult.data || [];

        const stats: SubscriptionPlanStats = {
          totalPlans: plans.length,
          activePlans: plans.filter(p => p.is_active).length,
          inactivePlans: plans.filter(p => !p.is_active).length,
          totalSubscribers: subscriptions.filter(s => s.status === 'active').length,
          monthlyRevenue: 0,
          quarterlyRevenue: 0,
          annualRevenue: 0
        };

        // Calculate revenue by duration using actual subscription prices
        subscriptions
          .filter(s => s.status === 'active')
          .forEach(sub => {
            const plan = sub.membership_plans;
            // Use actual subscription price, not plan base price
            const actualPrice = parseFloat(sub.price || '0');
            if (plan) {
              switch (plan.duration) {
                case 'monthly':
                  stats.monthlyRevenue += actualPrice;
                  break;
                case 'quarterly':
                  stats.quarterlyRevenue += actualPrice;
                  break;
                case 'annual':
                  stats.annualRevenue += actualPrice;
                  break;
              }
            }
          });

        return { data: stats, error: null };
      },
      'Failed to fetch subscription plan statistics',
      {
        logQuery: 'Fetching subscription plan statistics'
      }
    );
  }

  /**
   * Transform database subscription plan data to frontend format
   */
  private transformPlanData(dbPlan: Record<string, unknown>): SubscriptionPlan {
    return this.transformFields(dbPlan, this.fieldMap) as SubscriptionPlan;
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
export default subscriptionPlanService;