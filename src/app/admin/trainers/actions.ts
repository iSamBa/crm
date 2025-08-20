'use server';

import { createClient } from '@supabase/supabase-js';
import { TrainerFilters } from '@/lib/schemas';

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface ServerTrainer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specializations: string[];
  certifications: string[];
  hourlyRate: number;
  availability?: any;
  bio?: string;
  yearsExperience?: number;
  createdAt: string;
  updatedAt: string;
}

export async function getTrainersServer(filters?: TrainerFilters): Promise<{
  data: ServerTrainer[];
  error: string | null;
}> {
  try {
    console.log('Fetching trainers server-side...');
    
    // Start from users table and join trainers - this allows proper sorting by user fields
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar,
        role,
        created_at,
        updated_at,
        trainers!inner(
          specializations,
          certifications,
          hourly_rate,
          availability,
          bio,
          years_experience
        )
      `)
      .eq('role', 'trainer');

    // Apply filters
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`
      );
    }

    if (filters?.specialization) {
      query = query.contains('trainers.specializations', [filters.specialization]);
    }

    if (filters?.hourlyRateMin !== undefined) {
      query = query.gte('trainers.hourly_rate', filters.hourlyRateMin);
    }

    if (filters?.hourlyRateMax !== undefined) {
      query = query.lte('trainers.hourly_rate', filters.hourlyRateMax);
    }

    // Apply sorting - now we can sort by user fields properly
    const sortOrder = { ascending: filters?.sortOrder === 'asc' };
    const sortBy = filters?.sortBy || 'name';
    
    switch (sortBy) {
      case 'name':
        query = query.order('first_name', sortOrder);
        break;
      case 'email':
        query = query.order('email', sortOrder);
        break;
      case 'hourlyRate':
        // Can't sort by joined table columns easily, fallback to name sorting
        query = query.order('first_name', sortOrder);
        break;
      case 'createdAt':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('first_name', sortOrder);
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Trainer query error:', error);
      throw error;
    }

    // Transform data to match expected format (structure changed since we start from users table)
    const trainers: ServerTrainer[] = (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      specializations: user.trainers.specializations || [],
      certifications: user.trainers.certifications || [],
      hourlyRate: user.trainers.hourly_rate || 0,
      availability: user.trainers.availability || {},
      bio: user.trainers.bio,
      yearsExperience: user.trainers.years_experience,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    console.log(`Successfully fetched ${trainers.length} trainers`);
    return { data: trainers, error: null };

  } catch (error) {
    console.error('Error fetching trainers:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch trainers' 
    };
  }
}

export async function getTrainerByIdServer(trainerId: string): Promise<{
  data: ServerTrainer | null;
  error: string | null;
}> {
  try {
    console.log('Fetching trainer by ID server-side:', trainerId);
    
    // Get single trainer with user data
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar,
        role,
        created_at,
        updated_at,
        trainers!inner(
          specializations,
          certifications,
          hourly_rate,
          availability,
          bio,
          years_experience
        )
      `)
      .eq('role', 'trainer')
      .eq('id', trainerId)
      .single();

    if (error) {
      console.error('Trainer query error:', error);
      throw error;
    }

    if (!data) {
      return { data: null, error: 'Trainer not found' };
    }

    // Transform data to match expected format
    const trainer: ServerTrainer = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      specializations: data.trainers[0]?.specializations || [],
      certifications: data.trainers[0]?.certifications || [],
      hourlyRate: data.trainers[0]?.hourly_rate || 0,
      availability: data.trainers[0]?.availability || {},
      bio: data.trainers[0]?.bio,
      yearsExperience: data.trainers[0]?.years_experience,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    console.log(`Successfully fetched trainer: ${trainer.firstName} ${trainer.lastName}`);
    return { data: trainer, error: null };

  } catch (error) {
    console.error('Error fetching trainer:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch trainer' 
    };
  }
}

export async function getTrainerStatsServer(): Promise<{
  data: {
    totalTrainers: number;
    activeTrainers: number;
    averageHourlyRate: number;
    topSpecializations: { name: string; count: number }[];
    newThisMonth: number;
    totalCertifications: number;
  } | null;
  error: string | null;
}> {
  try {
    const { data: trainers, error } = await getTrainersServer();
    
    if (error || !trainers) {
      return { data: null, error: error || 'Failed to fetch trainers' };
    }

    const stats = {
      totalTrainers: trainers.length,
      activeTrainers: trainers.length, // All trainers are considered active
      averageHourlyRate: trainers.length > 0 
        ? trainers.reduce((sum, t) => sum + (t.hourlyRate || 0), 0) / trainers.length 
        : 0,
      topSpecializations: [] as { name: string; count: number }[],
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

  } catch (error) {
    console.error('Error fetching trainer stats:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch trainer statistics' 
    };
  }
}