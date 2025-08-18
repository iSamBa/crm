import { supabase } from '@/lib/supabase/client';
import { Trainer } from '@/types';

export interface TrainerFilters {
  searchTerm?: string;
  specialization?: string;
  isActive?: boolean;
}

class TrainerService {
  async getTrainers(filters?: TrainerFilters) {
    try {
      // First try the proper trainer join query
      let query = supabase
        .from('trainers')
        .select(`
          *,
          users(*)
        `)
        .order('users.first_name', { ascending: true });

      // Apply filters
      if (filters?.searchTerm) {
        query = query.or(
          `users.first_name.ilike.%${filters.searchTerm}%,users.last_name.ilike.%${filters.searchTerm}%,users.email.ilike.%${filters.searchTerm}%`
        );
      }

      if (filters?.specialization) {
        query = query.contains('specializations', [filters.specialization]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trainers with trainer table:', error);
        
        // Fallback: Get all users with role 'trainer' if trainers table query fails
        console.log('Falling back to users table for trainers');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'trainer')
          .order('first_name', { ascending: true });

        if (userError) {
          console.error('Error fetching trainer users:', userError);
          return { data: [], error: userError.message };
        }

        // Transform user data to trainer format
        const trainers: Trainer[] = (userData || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          specializations: ['General Training'], // Default specialization
          certifications: [],
          hourlyRate: 50, // Default rate
          availability: {}
        }));

        return { data: trainers, error: null };
      }

      // Transform the data to match our Trainer interface
      const trainers: Trainer[] = (data || []).map((item: any) => ({
        id: item.users.id,
        email: item.users.email,
        role: item.users.role,
        firstName: item.users.first_name,
        lastName: item.users.last_name,
        phone: item.users.phone,
        avatar: item.users.avatar,
        createdAt: item.users.created_at,
        updatedAt: item.users.updated_at,
        specializations: item.specializations || [],
        certifications: item.certifications || [],
        hourlyRate: item.hourly_rate || 0,
        availability: item.availability || {}
      }));

      return { data: trainers, error: null };
    } catch (error) {
      console.error('TrainerService.getTrainers error:', error);
      return { data: [], error: 'Failed to fetch trainers' };
    }
  }

  async getTrainerById(id: string) {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching trainer:', error);
        return { data: null, error: error.message };
      }

      // Transform the data
      const trainer: Trainer = {
        id: data.users.id,
        email: data.users.email,
        role: data.users.role,
        firstName: data.users.first_name,
        lastName: data.users.last_name,
        phone: data.users.phone,
        avatar: data.users.avatar,
        createdAt: data.users.created_at,
        updatedAt: data.users.updated_at,
        specializations: data.specializations || [],
        certifications: data.certifications || [],
        hourlyRate: data.hourly_rate || 0,
        availability: data.availability || {}
      };

      return { data: trainer, error: null };
    } catch (error) {
      console.error('TrainerService.getTrainerById error:', error);
      return { data: null, error: 'Failed to fetch trainer' };
    }
  }

  async getTrainerAvailability(trainerId: string, date: string) {
    try {
      // This would check trainer_availability table when implemented
      // For now, return a simplified availability check
      const { data, error } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('day_of_week', new Date(date).getDay())
        .eq('is_available', true);

      if (error && error.code !== 'PGRST116') { // Table doesn't exist yet
        console.error('Error checking trainer availability:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('TrainerService.getTrainerAvailability error:', error);
      return { data: [], error: 'Failed to check trainer availability' };
    }
  }
}

export const trainerService = new TrainerService();