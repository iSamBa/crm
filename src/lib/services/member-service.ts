import { supabase } from '@/lib/supabase/client';
import { Member } from '@/types';
import { 
  arrayToCSV, 
  downloadCSV, 
  formatDateForCSV, 
  formatArrayForCSV, 
  formatObjectForCSV,
  CSVColumn 
} from '@/lib/utils/csv-export';

export interface CreateMemberData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipStatus: 'active' | 'inactive' | 'frozen' | 'cancelled';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions?: string;
  fitnessGoals?: string;
  preferredTrainingTimes?: string[];
  joinDate?: string;
}

export interface UpdateMemberData extends Partial<CreateMemberData> {
  id: string;
}

export interface MemberFilters {
  status?: string;
  searchTerm?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  hasEmergencyContact?: boolean;
}

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

class MemberService {
  // Create a new member
  async createMember(data: CreateMemberData): Promise<{ data: Member | null; error: string | null }> {
    try {
      const memberData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        membership_status: data.membershipStatus,
        join_date: data.joinDate || new Date().toISOString().split('T')[0],
      };

      // Only add optional fields if they have values
      if (data.email) memberData.email = data.email;
      if (data.phone) memberData.phone = data.phone;
      if (data.emergencyContact) memberData.emergency_contact = data.emergencyContact;
      if (data.medicalConditions) memberData.medical_conditions = data.medicalConditions;
      if (data.fitnessGoals) memberData.fitness_goals = data.fitnessGoals;
      if (data.preferredTrainingTimes && data.preferredTrainingTimes.length > 0) {
        memberData.preferred_training_times = data.preferredTrainingTimes;
      }

      console.log('Creating member with data:', memberData);

      const { data: member, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single();

      if (error) {
        console.error('Error creating member:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformMemberData(member), error: null };
    } catch (error) {
      console.error('Unexpected error creating member:', error);
      return { data: null, error: 'Failed to create member' };
    }
  }

  // Get a member by ID
  async getMemberById(id: string): Promise<{ data: Member | null; error: string | null }> {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformMemberData(member), error: null };
    } catch (error) {
      console.error('Unexpected error fetching member:', error);
      return { data: null, error: 'Failed to fetch member' };
    }
  }

  // Get all members with optional filtering
  async getMembers(filters?: MemberFilters): Promise<{ data: Member[]; error: string | null }> {
    try {
      console.log('Fetching members with filters:', filters);
      
      let query = supabase.from('members').select('*');

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

      query = query.order('created_at', { ascending: false });

      console.log('Executing Supabase query...');
      const { data: members, error } = await query;

      console.log('Query result:', { members, error });

      if (error) {
        console.error('Supabase error fetching members:', error);
        return { data: [], error: error.message || 'Unknown database error' };
      }

      const transformedMembers = members?.map(member => this.transformMemberData(member)) || [];
      console.log('Transformed members:', transformedMembers);
      
      return { data: transformedMembers, error: null };
    } catch (error) {
      console.error('Unexpected error fetching members:', error);
      return { data: [], error: 'Failed to fetch members' };
    }
  }

  // Update a member
  async updateMember(data: UpdateMemberData): Promise<{ data: Member | null; error: string | null }> {
    try {
      const updateData: any = {};

      if (data.firstName) updateData.first_name = data.firstName;
      if (data.lastName) updateData.last_name = data.lastName;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.membershipStatus) updateData.membership_status = data.membershipStatus;
      if (data.emergencyContact !== undefined) updateData.emergency_contact = data.emergencyContact;
      if (data.medicalConditions !== undefined) updateData.medical_conditions = data.medicalConditions || null;
      if (data.fitnessGoals !== undefined) updateData.fitness_goals = data.fitnessGoals || null;
      if (data.preferredTrainingTimes !== undefined) updateData.preferred_training_times = data.preferredTrainingTimes;
      if (data.joinDate) updateData.join_date = data.joinDate;

      console.log('Updating member with data:', updateData);

      const { data: member, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating member:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformMemberData(member), error: null };
    } catch (error) {
      console.error('Unexpected error updating member:', error);
      return { data: null, error: 'Failed to update member' };
    }
  }

  // Delete a member
  async deleteMember(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting member:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error deleting member:', error);
      return { success: false, error: 'Failed to delete member' };
    }
  }

  // Delete multiple members
  async deleteMembers(ids: string[]): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting members:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error deleting members:', error);
      return { success: false, error: 'Failed to delete members' };
    }
  }

  // Get member statistics
  async getMemberStats(): Promise<{ data: MemberStats | null; error: string | null }> {
    try {
      // Get total counts
      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'active');

      const { count: inactiveMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'inactive');

      const { count: frozenMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'frozen');

      const { count: cancelledMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'cancelled');

      // Get new members this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { count: newThisMonth } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get new members this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { count: newThisWeek } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString());

      const stats: MemberStats = {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        inactiveMembers: inactiveMembers || 0,
        frozenMembers: frozenMembers || 0,
        cancelledMembers: cancelledMembers || 0,
        newThisMonth: newThisMonth || 0,
        newThisWeek: newThisWeek || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Unexpected error fetching member stats:', error);
      return { data: null, error: 'Failed to fetch member statistics' };
    }
  }

  // Get member distribution for charts
  async getMemberDistribution(): Promise<{ data: MemberDistribution[] | null; error: string | null }> {
    try {
      const { data: stats, error: statsError } = await this.getMemberStats();
      
      if (statsError || !stats) {
        return { data: null, error: statsError || 'Failed to fetch stats' };
      }

      const total = stats.totalMembers;
      if (total === 0) {
        return { data: [], error: null };
      }

      // Define colors that match the dashboard theme
      const statusColors = {
        active: '#cb8589', // Dusty rose
        frozen: '#d7b29d', // Warm beige
        inactive: '#e8d2ae', // Light cream  
        cancelled: '#DDE8B9', // Soft green
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
    } catch (error) {
      console.error('Unexpected error fetching member distribution:', error);
      return { data: null, error: 'Failed to fetch member distribution' };
    }
  }

  // Search members by name, email, or phone
  async searchMembers(searchTerm: string): Promise<{ data: Member[]; error: string | null }> {
    return this.getMembers({ searchTerm });
  }

  // Get recent member activities
  async getRecentMemberActivities(limit = 10): Promise<{ data: any[]; error: string | null }> {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select('first_name, last_name, created_at, membership_status')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent activities:', error);
        return { data: [], error: error.message };
      }

      const activities = (members || []).map(member => ({
        type: 'member_joined',
        title: 'New member registration',
        description: `${member.first_name} ${member.last_name} joined`,
        time: new Date(member.created_at).toLocaleString(),
        memberName: `${member.first_name} ${member.last_name}`,
        status: member.membership_status,
        timestamp: member.created_at,
      }));

      return { data: activities, error: null };
    } catch (error) {
      console.error('Unexpected error fetching recent activities:', error);
      return { data: [], error: 'Failed to fetch recent activities' };
    }
  }

  // Freeze a member's membership
  async freezeMembership(id: string): Promise<{ success: boolean; error: string | null }> {
    return this.updateMemberStatus(id, 'frozen');
  }

  // Unfreeze a member's membership
  async unfreezeMembership(id: string): Promise<{ success: boolean; error: string | null }> {
    return this.updateMemberStatus(id, 'active');
  }

  // Cancel a member's membership
  async cancelMembership(id: string): Promise<{ success: boolean; error: string | null }> {
    return this.updateMemberStatus(id, 'cancelled');
  }

  // Reactivate a member's membership
  async reactivateMembership(id: string): Promise<{ success: boolean; error: string | null }> {
    return this.updateMemberStatus(id, 'active');
  }

  // Update member status
  private async updateMemberStatus(id: string, status: 'active' | 'inactive' | 'frozen' | 'cancelled'): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('members')
        .update({ 
          membership_status: status
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating member status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error updating member status:', error);
      return { success: false, error: 'Failed to update member status' };
    }
  }

  // Transform database member data to frontend Member type
  private transformMemberData(dbMember: any): Member {
    if (!dbMember) {
      throw new Error('Invalid member data: dbMember is null or undefined');
    }

    return {
      id: dbMember.id || '',
      firstName: dbMember.first_name || '',
      lastName: dbMember.last_name || '',
      email: dbMember.email || undefined,
      phone: dbMember.phone || undefined,
      membershipStatus: dbMember.membership_status || 'active',
      emergencyContact: dbMember.emergency_contact || undefined,
      medicalConditions: dbMember.medical_conditions || undefined,
      fitnessGoals: dbMember.fitness_goals || undefined,
      preferredTrainingTimes: dbMember.preferred_training_times || [],
      joinDate: dbMember.join_date || new Date().toISOString().split('T')[0],
      createdAt: dbMember.created_at || new Date().toISOString(),
      updatedAt: dbMember.updated_at || new Date().toISOString(),
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
      console.error('Error exporting members to CSV:', error);
      return { success: false, error: 'Failed to export members' };
    }
  }
}

export const memberService = new MemberService();
export default memberService;