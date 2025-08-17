import { supabase } from '@/lib/supabase/client';
import { User } from '@/types';

class UserService {
  // Get user profile by ID
  async getUserById(id: string): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

      if (error) {
        console.error('Error fetching user:', error);
        return { data: null, error: error.message };
      }

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      return { data: this.transformUserData(user), error: null };
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return { data: null, error: 'Failed to fetch user' };
    }
  }

  // Get all users (admins and trainers)
  async getUsers(): Promise<{ data: User[]; error: string | null }> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return { data: [], error: error.message };
      }

      const transformedUsers = users?.map(user => this.transformUserData(user)) || [];
      
      return { data: transformedUsers, error: null };
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      return { data: [], error: 'Failed to fetch users' };
    }
  }

  // Get all trainers
  async getTrainers(): Promise<{ data: User[]; error: string | null }> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'trainer')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching trainers:', error);
        return { data: [], error: error.message };
      }

      const transformedUsers = users?.map(user => this.transformUserData(user)) || [];
      
      return { data: transformedUsers, error: null };
    } catch (error) {
      console.error('Unexpected error fetching trainers:', error);
      return { data: [], error: 'Failed to fetch trainers' };
    }
  }

  // Transform database user data to frontend User type
  private transformUserData(dbUser: any): User {
    if (!dbUser) {
      throw new Error('Invalid user data: dbUser is null or undefined');
    }

    return {
      id: dbUser.id || '',
      email: dbUser.email || '',
      role: dbUser.role || 'trainer',
      firstName: dbUser.first_name || '',
      lastName: dbUser.last_name || '',
      phone: dbUser.phone || undefined,
      avatar: dbUser.avatar || undefined,
      createdAt: dbUser.created_at || new Date().toISOString(),
      updatedAt: dbUser.updated_at || new Date().toISOString(),
    };
  }
}

export const userService = new UserService();
export default userService;