import { BaseService, ServiceResponse } from './base-service';
import { Member, Activity } from '@/types';
import { 
  arrayToCSV, 
  downloadCSV, 
  formatDateForCSV, 
  formatArrayForCSV, 
  formatObjectForCSV,
  CSVColumn 
} from '@/lib/utils/csv-export';
import { 
  CreateMemberSchema, 
  UpdateMemberSchema, 
  MemberFiltersSchema,
  type CreateMemberData,
  type UpdateMemberData,
  type MemberFilters
} from '@/lib/schemas';
import { shortDateTime } from '@/lib/utils/date-formatting';
import { queryKeys } from '@/lib/query-client';

// Types exported from schemas - no need to duplicate

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  frozenMembers: number;
  cancelledMembers: number;
  newThisMonth: number;
  newThisWeek: number;
  averageAge?: number;
  retentionRate?: number;
}

export interface MemberDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

class MemberService extends BaseService {
  private static readonly FIELD_MAP = {
    first_name: 'firstName',
    last_name: 'lastName',
    membership_status: 'membershipStatus',
    emergency_contact: 'emergencyContact',
    medical_conditions: 'medicalConditions',
    fitness_goals: 'fitnessGoals',
    preferred_training_times: 'preferredTrainingTimes',
    join_date: 'joinDate',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  };

  // Create a new member with validation and cache invalidation
  async createMember(data: CreateMemberData): Promise<ServiceResponse<Member>> {
    // Validate input data
    const validation = this.validateInput(CreateMemberSchema, data);
    if (validation.error) return { data: null, error: validation.error };
    
    const validatedData = validation.data!;
    const memberData = this.transformToDbFields({
      ...validatedData,
      joinDate: validatedData.joinDate || new Date().toISOString().split('T')[0],
    }, MemberService.FIELD_MAP);

    const result = await this.executeMutation(
      async () => await this.db.from('members').insert(memberData).select().single(),
      'Failed to create member',
      {
        logOperation: 'Creating member',
        invalidateQueries: [
          this.invalidate.members.all,
          this.invalidate.members.lists,
          this.invalidate.members.stats
        ],
        transform: (data) => this.transformMemberData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || null,
      error: result.error
    };
  }

  // Get a member by ID
  async getMemberById(id: string): Promise<ServiceResponse<Member>> {
    if (!id) {
      return { data: null, error: 'Member ID is required' };
    }

    const result = await this.executeQuery(
      async () => {
        const dbResult = await this.db.from('members').select('*').eq('id', id).single();
        return dbResult;
      },
      'Failed to fetch member',
      {
        logQuery: `Fetching member ${id}`,
        transform: (data) => {
          const transformed = this.transformMemberData(data as Record<string, unknown>);
          return transformed;
        }
      }
    );

    // Don't double-transform! The transform function already did it
    return {
      data: result.data || null,
      error: result.error
    };
  }

  // Get all members with optional filtering and validation
  async getMembers(filters?: MemberFilters): Promise<ServiceResponse<Member[]>> {
    // Validate filters if provided
    if (filters) {
      const validation = this.validateInput(MemberFiltersSchema, filters);
      if (validation.error) return { data: [], error: validation.error };
      filters = validation.data!;
    }

    const result = await this.executeQuery(
      async () => {
        let query = this.db.from('members').select('*');

        // Apply filters
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('membership_status', filters.status);
        }

        if (filters?.searchTerm && filters.searchTerm.trim()) {
          const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
          query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
        }

        if (filters?.joinDateFrom) {
          query = query.gte('join_date', filters.joinDateFrom);
        }

        if (filters?.joinDateTo) {
          query = query.lte('join_date', filters.joinDateTo);
        }

        if (filters?.hasEmergencyContact !== undefined) {
          if (filters.hasEmergencyContact) {
            query = query.not('emergency_contact', 'is', null);
          } else {
            query = query.is('emergency_contact', null);
          }
        }

        return query.order('created_at', { ascending: false });
      },
      'Failed to fetch members',
      {
        logQuery: `Fetching members with filters: ${JSON.stringify(filters)}`,
        allowEmpty: true
      }
    );

    return {
      data: result.data ? (result.data || []).map((member: unknown) => this.transformMemberData(member as Record<string, unknown>)) : [],
      error: result.error
    };
  }

  // Update a member with validation and cache invalidation
  async updateMember(data: UpdateMemberData): Promise<ServiceResponse<Member>> {
    // Validate input data
    const validation = this.validateInput(UpdateMemberSchema, data);
    if (validation.error) return { data: null, error: validation.error };
    
    const validatedData = validation.data!;
    const { id, ...updateFields } = validatedData;
    const updateData = this.transformToDbFields(updateFields, MemberService.FIELD_MAP);

    const result = await this.executeMutation(
      async () => await this.db.from('members').update(updateData).eq('id', id).select().single(),
      'Failed to update member',
      {
        logOperation: `Updating member ${id}`,
        invalidateQueries: [
          this.invalidate.members.all,
          this.invalidate.members.lists,
          () => this.invalidate.members.detail(id)
        ],
        optimisticUpdate: {
          queryKey: queryKeys.members.detail(id),
          updater: (oldData: unknown) => ({ ...(oldData as Member), ...updateFields })
        },
        transform: (data) => this.transformMemberData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || null,
      error: result.error
    };
  }

  // Delete a member with cache invalidation
  async deleteMember(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    if (!id) {
      return { data: null, error: 'Member ID is required' };
    }

    const result = await this.executeMutation(
      async () => await this.db.from('members').delete().eq('id', id),
      'Failed to delete member',
      {
        logOperation: `Deleting member ${id}`,
        invalidateQueries: [
          this.invalidate.members.all,
          this.invalidate.members.lists,
          this.invalidate.members.stats,
          () => this.invalidate.members.detail(id)
        ]
      }
    );

    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: { success: true }, error: null };
  }

  // Delete multiple members with cache invalidation
  async deleteMembers(ids: string[]): Promise<ServiceResponse<{ success: boolean }>> {
    if (!ids || ids.length === 0) {
      return { data: null, error: 'Member IDs are required' };
    }

    const result = await this.executeMutation(
      async () => await this.db.from('members').delete().in('id', ids),
      'Failed to delete members',
      {
        logOperation: `Deleting ${ids.length} members`,
        invalidateQueries: [
          this.invalidate.members.all,
          this.invalidate.members.lists,
          this.invalidate.members.stats
        ]
      }
    );

    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: { success: true }, error: null };
  }

  // Get member statistics with caching
  async getMemberStats(): Promise<ServiceResponse<MemberStats>> {
    return this.executeQuery(
      async () => {
        // Parallel queries for better performance
        const [
          totalResult,
          activeResult,
          inactiveResult,
          frozenResult,
          cancelledResult,
          monthResult,
          weekResult
        ] = await Promise.all([
          this.db.from('members').select('*', { count: 'exact', head: true }),
          this.db.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'active'),
          this.db.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'inactive'),
          this.db.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'frozen'),
          this.db.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'cancelled'),
          this.db.from('members').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          this.db.from('members').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const stats: MemberStats = {
          totalMembers: totalResult.count || 0,
          activeMembers: activeResult.count || 0,
          inactiveMembers: inactiveResult.count || 0,
          frozenMembers: frozenResult.count || 0,
          cancelledMembers: cancelledResult.count || 0,
          newThisMonth: monthResult.count || 0,
          newThisWeek: weekResult.count || 0,
        };

        return { data: stats, error: null };
      },
      'Failed to fetch member statistics',
      {
        logQuery: 'Fetching member statistics',
        allowEmpty: true
      }
    );
  }

  // Get member distribution for charts
  async getMemberDistribution(): Promise<ServiceResponse<MemberDistribution[]>> {
    const statsResult = await this.getMemberStats();
    
    if (statsResult.error || !statsResult.data) {
      return { data: null, error: statsResult.error || 'Failed to fetch stats' };
    }

    const stats = statsResult.data;
    const total = stats.totalMembers;
    
    if (total === 0) {
      return { data: [], error: null };
    }

    // Define monochrome colors that adapt to light/dark theme
    const isDarkMode = typeof document !== 'undefined' && 
      document.documentElement.classList.contains('dark');

    const statusColors = isDarkMode ? {
      // Dark mode: lighter colors on dark background
      active: 'rgb(230 230 230)',    // ~oklch(0.9 0 0) - Lightest for active
      inactive: 'rgb(191 191 191)',  // ~oklch(0.75 0 0) - Light gray for inactive  
      frozen: 'rgb(153 153 153)',    // ~oklch(0.6 0 0) - Medium gray for frozen
      cancelled: 'rgb(115 115 115)', // ~oklch(0.45 0 0) - Dark gray for cancelled
    } : {
      // Light mode: darker colors on light background - improved visibility
      active: 'rgb(102 102 102)',    // ~oklch(0.4 0 0) - Dark gray for active (more visible)
      inactive: 'rgb(153 153 153)',  // ~oklch(0.6 0 0) - Medium gray for inactive
      frozen: 'rgb(191 191 191)',    // ~oklch(0.75 0 0) - Light gray for frozen  
      cancelled: 'rgb(230 230 230)', // ~oklch(0.9 0 0) - Lightest gray for cancelled
    };

    const distribution: MemberDistribution[] = [
      {
        status: 'Active',
        count: stats.activeMembers,
        percentage: Math.round((stats.activeMembers / total) * 100),
        color: statusColors.active,
      },
      {
        status: 'Frozen',
        count: stats.frozenMembers,
        percentage: Math.round((stats.frozenMembers / total) * 100),
        color: statusColors.frozen,
      },
      {
        status: 'Inactive',
        count: stats.inactiveMembers,
        percentage: Math.round((stats.inactiveMembers / total) * 100),
        color: statusColors.inactive,
      },
      {
        status: 'Cancelled',
        count: stats.cancelledMembers,
        percentage: Math.round((stats.cancelledMembers / total) * 100),
        color: statusColors.cancelled,
      },
    ].filter(item => item.count > 0); // Only include statuses with members

    return { data: distribution, error: null };
  }

  // Search members by name, email, or phone
  async searchMembers(searchTerm: string): Promise<ServiceResponse<Member[]>> {
    return this.getMembers({ searchTerm });
  }

  // Get recent member activities with caching
  async getRecentMemberActivities(limit = 10): Promise<ServiceResponse<Activity[]>> {
    return this.executeQuery(
      async () => {
        const result = await this.db
          .from('members')
          .select('first_name, last_name, created_at, membership_status')
          .order('created_at', { ascending: false })
          .limit(limit);

        const activities = (result.data || []).map(member => ({
          type: 'member_joined',
          title: 'New member registration',
          description: `${member.first_name} ${member.last_name} joined`,
          time: shortDateTime(member.created_at),
          memberName: `${member.first_name} ${member.last_name}`,
          status: member.membership_status,
          timestamp: member.created_at,
        }));

        return { data: activities, error: result.error };
      },
      'Failed to fetch recent activities',
      {
        logQuery: `Fetching ${limit} recent activities`,
        allowEmpty: true
      }
    );
  }

  // Membership status update methods with validation and cache invalidation
  async freezeMembership(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return this.updateMemberStatus(id, 'frozen');
  }

  async unfreezeMembership(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return this.updateMemberStatus(id, 'active');
  }

  async cancelMembership(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return this.updateMemberStatus(id, 'cancelled');
  }

  async reactivateMembership(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    return this.updateMemberStatus(id, 'active');
  }

  // Update member status with optimistic updates
  private async updateMemberStatus(id: string, status: 'active' | 'inactive' | 'frozen' | 'cancelled'): Promise<ServiceResponse<{ success: boolean }>> {
    if (!id) {
      return { data: null, error: 'Member ID is required' };
    }

    const result = await this.executeMutation(
      async () => await this.db.from('members').update({ membership_status: status }).eq('id', id),
      'Failed to update member status',
      {
        logOperation: `Updating member ${id} status to ${status}`,
        invalidateQueries: [
          this.invalidate.members.all,
          this.invalidate.members.lists,
          this.invalidate.members.stats,
          () => this.invalidate.members.detail(id)
        ],
        optimisticUpdate: {
          queryKey: queryKeys.members.detail(id),
          updater: (oldData: unknown) => ({ ...(oldData as Member), membershipStatus: status })
        }
      }
    );

    return {
      data: result.error ? null : { success: true },
      error: result.error
    };
  }

  // Transform database member data to frontend Member type
  private transformMemberData(dbMember: Record<string, unknown>): Member {
    if (!dbMember) {
      throw new Error('Invalid member data: dbMember is null or undefined');
    }

    return {
      id: (dbMember.id as string) || '',
      firstName: (dbMember.first_name as string) || '',
      lastName: (dbMember.last_name as string) || '',
      email: (dbMember.email as string) || undefined,
      phone: (dbMember.phone as string) || undefined,
      membershipStatus: (dbMember.membership_status as 'active' | 'inactive' | 'frozen' | 'cancelled') || 'active',
      emergencyContact: (dbMember.emergency_contact as { name: string; phone: string; relationship: string } | null) || undefined,
      medicalConditions: (dbMember.medical_conditions as string) || undefined,
      fitnessGoals: (dbMember.fitness_goals as string) || undefined,
      preferredTrainingTimes: (dbMember.preferred_training_times as string[]) || [],
      joinDate: (dbMember.join_date as string) || new Date().toISOString().split('T')[0],
      createdAt: (dbMember.created_at as string) || new Date().toISOString(),
      updatedAt: (dbMember.updated_at as string) || new Date().toISOString(),
    };
  }

  // Export members to CSV
  async exportMembersToCSV(filters?: MemberFilters): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all members with filters applied
      const { data: members, error } = await this.getMembers(filters);
      
      if (error) {
        return { success: false, error };
      }

      if (!members || members.length === 0) {
        return { success: false, error: 'No members found to export' };
      }

      // Define CSV columns
      const columns: CSVColumn[] = [
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'membershipStatus', header: 'Membership Status' },
        { key: 'joinDate', header: 'Join Date', formatter: formatDateForCSV },
        { key: 'emergencyContact', header: 'Emergency Contact', formatter: formatObjectForCSV },
        { key: 'medicalConditions', header: 'Medical Conditions' },
        { key: 'fitnessGoals', header: 'Fitness Goals' },
        { key: 'preferredTrainingTimes', header: 'Preferred Training Times', formatter: formatArrayForCSV },
        { key: 'createdAt', header: 'Created Date', formatter: formatDateForCSV },
      ];

      // Convert to CSV
      const csvContent = arrayToCSV(members, columns);
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `members-export-${currentDate}.csv`;
      
      // Trigger download
      downloadCSV(csvContent, filename);

      return { success: true };
    } catch (error) {
      console.error('Unexpected error exporting members:', error);
      return { success: false, error: 'Failed to export members' };
    }
  }
}

export const memberService = new MemberService();
export default memberService;