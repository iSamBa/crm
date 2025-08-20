import { BaseService, ServiceResponse } from './base-service';
import { User } from '@/types';
import { 
  UpdateUserProfileSchema, 
  ChangePasswordSchema,
  type UpdateUserProfileData,
  type ChangePasswordData 
} from '@/lib/schemas';

class UserService extends BaseService {
  private readonly tableName = 'users';
  
  /**
   * Database field mapping for transformations
   */
  private readonly fieldMap = {
    first_name: 'firstName',
    last_name: 'lastName',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  };
  /**
   * Get user profile by ID
   */
  async getUserById(id: string): Promise<ServiceResponse<User>> {
    return this.executeQuery(
      async () => {
        return this.db
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();
      },
      'Failed to fetch user',
      {
        logQuery: `Fetching user by ID: ${id}`,
        transform: (data: any) => data ? this.transformUserData(data) : null,
        allowEmpty: false
      }
    );
  }

  /**
   * Get all users (admins and trainers)
   */
  async getUsers(): Promise<ServiceResponse<User[]>> {
    return this.executeQuery(
      async () => {
        return this.db
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false });
      },
      'Failed to fetch users',
      {
        logQuery: 'Fetching all users',
        transform: (data: any[]) => data ? data.map(user => this.transformUserData(user)) : [],
        allowEmpty: true,
        expectArray: true
      }
    );
  }

  /**
   * Get all trainers
   */
  async getTrainers(): Promise<ServiceResponse<User[]>> {
    return this.executeQuery(
      async () => {
        return this.db
          .from(this.tableName)
          .select('*')
          .eq('role', 'trainer')
          .order('first_name', { ascending: true });
      },
      'Failed to fetch trainers',
      {
        logQuery: 'Fetching all trainers',
        transform: (data: any[]) => data ? data.map(user => this.transformUserData(user)) : [],
        allowEmpty: true,
        expectArray: true
      }
    );
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: string, data: UpdateUserProfileData): Promise<ServiceResponse<User>> {
    // Validate input data
    const validation = this.validateInput(UpdateUserProfileSchema, data);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.executeMutation(
      async () => {
        const dbData = this.transformToDbFields(validation.data!, this.fieldMap);
        dbData.updated_at = new Date().toISOString();
        
        return this.db
          .from(this.tableName)
          .update(dbData)
          .eq('id', userId)
          .select('*')
          .single();
      },
      'Failed to update user profile',
      {
        logOperation: `Updating profile for user: ${userId}`,
        transform: (data: any) => this.transformUserData(data)
      }
    );
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<ServiceResponse<boolean>> {
    // Validate input data
    const validation = this.validateInput(ChangePasswordSchema, data);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.executeMutation(
      async () => {
        // Use Supabase Auth API to change password
        const { error } = await this.db.auth.updateUser({
          password: validation.data!.newPassword
        });
        
        if (error) {
          throw error;
        }

        return { data: true, error: null };
      },
      'Failed to change password',
      {
        logOperation: `Changing password for user: ${userId}`,
        transform: () => true
      }
    );
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(
      async () => {
        return this.db
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      },
      'Failed to fetch user preferences',
      {
        logQuery: `Fetching preferences for user: ${userId}`,
        allowEmpty: true
      }
    );
  }

  /**
   * Update or create user preferences
   */
  async updateUserPreferences(userId: string, preferences: any): Promise<ServiceResponse<any>> {
    return this.executeMutation(
      async () => {
        const dataToUpsert = {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        };

        return this.db
          .from('user_preferences')
          .upsert(dataToUpsert, { onConflict: 'user_id' })
          .select('*')
          .single();
      },
      'Failed to update user preferences',
      {
        logOperation: `Updating preferences for user: ${userId}`
      }
    );
  }

  /**
   * Transform database user data to frontend User type
   */
  private transformUserData(dbUser: any): User {
    if (!dbUser) {
      throw new Error('Invalid user data: dbUser is null or undefined');
    }

    return this.transformFields(dbUser, this.fieldMap) as User;
  }
}

export const userService = new UserService();
export default userService;