import { BaseService, ServiceResponse } from './base-service';
import { Trainer } from '@/types';
import { 
  CreateTrainerSchema, 
  UpdateTrainerSchema, 
  TrainerFiltersSchema,
  type CreateTrainerData,
  type UpdateTrainerData,
  type TrainerFilters
} from '@/lib/schemas';
import { queryKeys, queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase/client';

export interface TrainerStats {
  totalTrainers: number;
  activeTrainers: number;
  averageHourlyRate: number;
  topSpecializations: { name: string; count: number }[];
  newThisMonth: number;
  totalCertifications: number;
}

class TrainerService extends BaseService {

  // Create a new trainer with authentication account
  async createTrainer(data: CreateTrainerData): Promise<ServiceResponse<Trainer>> {
    // Validate input data
    const validation = this.validateInput(CreateTrainerSchema, data);
    if (validation.error) return { data: null, error: validation.error };
    
    const validatedData = validation.data!;

    // Start a transaction-like operation
    try {
      // 1. Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true,
        user_metadata: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          role: 'trainer'
        }
      });

      if (authError) {
        return { data: null, error: `Failed to create trainer account: ${authError.message}` };
      }

      // 2. Create user profile
      const userProfileData = {
        id: authUser.user.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || null,
        role: 'trainer'
      };

      const { error: userError } = await this.db
        .from('users')
        .insert(userProfileData);

      if (userError) {
        // Cleanup: delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return { data: null, error: `Failed to create user profile: ${userError.message}` };
      }

      // 3. Create trainer-specific data
      const trainerData = {
        id: authUser.user.id,
        specializations: validatedData.specializations,
        certifications: validatedData.certifications || [],
        hourly_rate: validatedData.hourlyRate || 50,
        availability: validatedData.availability || {}
      };

      const { data: trainerRecord, error: trainerError } = await this.db
        .from('trainers')
        .insert(trainerData)
        .select(`
          *,
          users(*)
        `)
        .single();

      if (trainerError) {
        // Cleanup: delete auth user and profile if trainer creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        await this.db.from('users').delete().eq('id', authUser.user.id);
        return { data: null, error: `Failed to create trainer record: ${trainerError.message}` };
      }

      // Invalidate related queries
      this.invalidateTrainerQueries.all();
      this.invalidateTrainerQueries.lists();
      this.invalidateTrainerQueries.stats();

      return { data: this.transformTrainerData(trainerRecord), error: null };
    } catch (error) {
      console.error('Unexpected error creating trainer:', error);
      return { data: null, error: 'Failed to create trainer' };
    }
  }

  // Get a trainer by ID
  async getTrainerById(id: string): Promise<ServiceResponse<Trainer>> {
    if (!id) {
      return { data: null, error: 'Trainer ID is required' };
    }

    const result = await this.executeQuery(
      async () => {
        // Try trainer table first
        const { data, error } = await this.db
          .from('trainers')
          .select(`
            *,
            users(*)
          `)
          .eq('id', id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Fallback to users table if trainers table doesn't exist
          const { data: userData, error: userError } = await this.db
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('role', 'trainer')
            .single();

          if (userError) throw userError;
          
          // Create mock trainer data
          return {
            data: {
              id: userData.id,
              specializations: ['General Training'],
              certifications: [],
              hourly_rate: 50,
              availability: {},
              users: userData
            },
            error: null
          };
        }

        if (error) throw error;
        return { data, error: null };
      },
      'Failed to fetch trainer',
      {
        logQuery: `Fetching trainer ${id}`,
        transform: (data) => this.transformTrainerData(data)
      }
    );

    return {
      data: result.data || null,
      error: result.error
    };
  }

  // Get all trainers with optional filtering and validation
  async getTrainers(filters?: TrainerFilters): Promise<ServiceResponse<Trainer[]>> {
    // Validate filters if provided
    if (filters) {
      const validation = this.validateInput(TrainerFiltersSchema, filters);
      if (validation.error) return { data: [], error: validation.error };
      filters = validation.data!;
    }

    const result = await this.executeQuery(
      async () => {
        try {
          // First, try to get trainers with user data join
          let query = this.db
            .from('trainers')
            .select(`
              id,
              specializations,
              certifications,
              hourly_rate,
              availability,
              bio,
              years_experience,
              users!inner(
                id,
                email,
                first_name,
                last_name,
                phone,
                avatar,
                role,
                created_at,
                updated_at
              )
            `);

          // Apply filters
          if (filters?.searchTerm) {
            const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
            query = query.or(
              `users.first_name.ilike.${searchTerm},users.last_name.ilike.${searchTerm},users.email.ilike.${searchTerm}`
            );
          }

          if (filters?.specialization) {
            query = query.contains('specializations', [filters.specialization]);
          }

          if (filters?.hourlyRateMin !== undefined) {
            query = query.gte('hourly_rate', filters.hourlyRateMin);
          }

          if (filters?.hourlyRateMax !== undefined) {
            query = query.lte('hourly_rate', filters.hourlyRateMax);
          }

          // Apply sorting - order by trainers table id since we can't order by joined table columns in Supabase
          const sortOrder = { ascending: filters?.sortOrder === 'asc' };
          query = query.order('id', sortOrder);

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          return { data: data || [], error: null };

        } catch {
          // Fallback to users table only
          const { data: userData, error: userError } = await this.db
            .from('users')
            .select('*')
            .eq('role', 'trainer')
            .order('first_name', { ascending: true });

          if (userError) throw userError;

          // Transform user data to trainer format
          const trainers = (userData || []).map((user: unknown) => {
            const userRecord = user as Record<string, unknown>;
            return {
              id: userRecord.id,
              specializations: ['General Training'],
              certifications: [],
              hourly_rate: 50,
              availability: {},
              users: userRecord
            };
          });

          return { data: trainers, error: null };
        }
      },
      'Failed to fetch trainers',
      {
        logQuery: `Fetching trainers with filters: ${JSON.stringify(filters)}`,
        allowEmpty: true
      }
    );

    return {
      data: result.data ? (result.data || []).map((trainer: unknown) => this.transformTrainerData(trainer as Record<string, unknown>)) : [],
      error: result.error
    };
  }

  // Update a trainer with validation and cache invalidation
  async updateTrainer(data: UpdateTrainerData): Promise<ServiceResponse<Trainer>> {
    // Validate input data
    const validation = this.validateInput(UpdateTrainerSchema, data);
    if (validation.error) return { data: null, error: validation.error };
    
    const validatedData = validation.data!;
    const { id, ...updateFields } = validatedData;

    const result = await this.executeMutation(
      async () => {
        // Update user profile if basic info changed
        const userUpdates: Record<string, unknown> = {};
        if (updateFields.firstName) userUpdates.first_name = updateFields.firstName;
        if (updateFields.lastName) userUpdates.last_name = updateFields.lastName;
        if (updateFields.email) userUpdates.email = updateFields.email;
        if (updateFields.phone !== undefined) userUpdates.phone = updateFields.phone;

        if (Object.keys(userUpdates).length > 0) {
          const { error: userError } = await this.db
            .from('users')
            .update(userUpdates)
            .eq('id', id);
          
          if (userError) throw userError;
        }

        // Update trainer-specific data
        const trainerUpdates: Record<string, unknown> = {};
        if (updateFields.specializations) trainerUpdates.specializations = updateFields.specializations;
        if (updateFields.certifications) trainerUpdates.certifications = updateFields.certifications;
        if (updateFields.hourlyRate !== undefined) trainerUpdates.hourly_rate = updateFields.hourlyRate;
        if (updateFields.availability) trainerUpdates.availability = updateFields.availability;

        if (Object.keys(trainerUpdates).length > 0) {
          const { data: trainerData, error: trainerError } = await this.db
            .from('trainers')
            .update(trainerUpdates)
            .eq('id', id)
            .select(`
              *,
              users(*)
            `)
            .single();

          if (trainerError) throw trainerError;
          return { data: trainerData, error: null };
        }

        // If no trainer updates, just fetch current data
        const { data: currentData, error: fetchError } = await this.db
          .from('trainers')
          .select(`
            *,
            users(*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        return { data: currentData, error: null };
      },
      'Failed to update trainer',
      {
        logOperation: `Updating trainer ${id}`,
        invalidateQueries: [
          () => this.invalidateTrainerQueries.all(),
          () => this.invalidateTrainerQueries.lists(),
          () => this.invalidateTrainerQueries.detail(id)
        ],
        optimisticUpdate: {
          queryKey: queryKeys.trainers.detail(id),
          updater: (oldData: unknown) => ({ ...(oldData as Trainer), ...updateFields })
        },
        transform: (data: unknown) => this.transformTrainerData(data as Record<string, unknown>)
      }
    );

    return {
      data: result.data || null,
      error: result.error
    };
  }

  // Delete a trainer with proper cleanup
  async deleteTrainer(id: string): Promise<ServiceResponse<{ success: boolean }>> {
    if (!id) {
      return { data: null, error: 'Trainer ID is required' };
    }

    const result = await this.executeMutation(
      async () => {
        // Delete trainer record first
        const { error: trainerError } = await this.db
          .from('trainers')
          .delete()
          .eq('id', id);

        if (trainerError) throw trainerError;

        // Delete user profile
        const { error: userError } = await this.db
          .from('users')
          .delete()
          .eq('id', id);

        if (userError) throw userError;

        // Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) {
          console.warn('Failed to delete auth user:', authError);
          // Don't fail the operation if auth deletion fails
        }

        return { data: { success: true }, error: null };
      },
      'Failed to delete trainer',
      {
        logOperation: `Deleting trainer ${id}`,
        invalidateQueries: [
          () => this.invalidateTrainerQueries.all(),
          () => this.invalidateTrainerQueries.lists(),
          () => this.invalidateTrainerQueries.stats(),
          () => this.invalidateTrainerQueries.detail(id)
        ]
      }
    );

    return {
      data: result.error ? null : { success: true },
      error: result.error
    };
  }

  // Get trainer statistics
  async getTrainerStats(): Promise<ServiceResponse<TrainerStats>> {
    return this.executeQuery(
      async () => {
        const { data: trainers, error } = await this.getTrainers();
        
        if (error || !trainers) throw new Error(error || 'Failed to fetch trainers');

        const stats: TrainerStats = {
          totalTrainers: trainers.length,
          activeTrainers: trainers.length, // All trainers are considered active
          averageHourlyRate: trainers.length > 0 
            ? trainers.reduce((sum, t) => sum + (t.hourlyRate || 0), 0) / trainers.length 
            : 0,
          topSpecializations: [],
          newThisMonth: 0,
          totalCertifications: trainers.reduce((sum, t) => sum + (t.certifications?.length || 0), 0)
        };

        // Calculate specialization distribution
        const specializationCounts: { [key: string]: number } = {};
        trainers.forEach(trainer => {
          trainer.specializations?.forEach(spec => {
            specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
          });
        });

        stats.topSpecializations = Object.entries(specializationCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate new trainers this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        stats.newThisMonth = trainers.filter(trainer => 
          trainer.createdAt && new Date(trainer.createdAt) >= thisMonth
        ).length;

        return { data: stats, error: null };
      },
      'Failed to fetch trainer statistics',
      {
        logQuery: 'Fetching trainer statistics',
        allowEmpty: true
      }
    );
  }

  // Transform database trainer data to frontend Trainer type
  private transformTrainerData(dbTrainer: Record<string, unknown>): Trainer {
    if (!dbTrainer || !dbTrainer.users) {
      throw new Error('Invalid trainer data: missing user information');
    }

    const users = dbTrainer.users as Record<string, unknown>;

    return {
      id: (users.id as string) || '',
      email: (users.email as string) || '',
      role: 'trainer',
      firstName: (users.first_name as string) || '',
      lastName: (users.last_name as string) || '',
      phone: (users.phone as string) || null,
      avatar: (users.avatar as string) || null,
      createdAt: (users.created_at as string) || new Date().toISOString(),
      updatedAt: (users.updated_at as string) || new Date().toISOString(),
      specializations: (dbTrainer.specializations as string[]) || ['General Training'],
      certifications: (dbTrainer.certifications as string[]) || [],
      hourlyRate: (dbTrainer.hourly_rate as number) || 50,
      availability: (dbTrainer.availability as { [key: string]: { start: string; end: string }[] }) || {}
    };
  }

  // Enhanced invalidation helpers
  private invalidateTrainerQueries = {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.trainers.detail(id) }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.trainers.stats() })
  };
}

export const trainerService = new TrainerService();
export default trainerService;