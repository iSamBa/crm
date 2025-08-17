import { supabase } from '@/lib/supabase/client';

// Enhanced TrainingSession interface to match our database schema
export interface TrainingSession {
  id: string;
  memberId: string;
  trainerId: string;
  type: 'personal' | 'group' | 'class' | 'assessment' | 'consultation' | 'rehabilitation';
  title: string;
  description?: string;
  scheduledDate: string; // ISO string
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  notes?: string;
  cost?: number;
  
  // Enhanced fields
  sessionRoom?: string;
  equipmentNeeded?: string[];
  sessionGoals?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  recurringPattern?: RecurringPattern;
  createdBy?: string;
  preparationNotes?: string;
  completionSummary?: string;
  memberRating?: number; // 1-5
  trainerRating?: number; // 1-5
  
  createdAt: string;
  
  // Related data (populated when needed)
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  comments?: SessionComment[];
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number; // every X weeks/months
  daysOfWeek?: number[]; // for weekly patterns
  endDate?: string;
  occurrences?: number;
}

export interface SessionComment {
  id: string;
  sessionId: string;
  userId: string;
  comment: string;
  commentType: 'note' | 'progress' | 'issue' | 'goal' | 'equipment' | 'feedback' | 'reminder';
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Populated user info
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateSessionData {
  memberId: string;
  trainerId: string;
  type: TrainingSession['type'];
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  cost?: number;
  sessionRoom?: string;
  equipmentNeeded?: string[];
  sessionGoals?: string;
  preparationNotes?: string;
  recurringPattern?: RecurringPattern;
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  id: string;
  status?: TrainingSession['status'];
  actualStartTime?: string;
  actualEndTime?: string;
  completionSummary?: string;
  memberRating?: number;
  trainerRating?: number;
  notes?: string;
}

export interface SessionFilters {
  memberId?: string;
  trainerId?: string;
  status?: TrainingSession['status'];
  type?: TrainingSession['type'];
  dateFrom?: string;
  dateTo?: string;
  sessionRoom?: string;
}

export interface TrainerAvailability {
  id: string;
  trainerId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;
  isAvailable: boolean;
  effectiveDate: string;
  endDate?: string;
}

export interface SessionConflict {
  id: string;
  sessionId: string;
  conflictType: 'trainer_unavailable' | 'member_booked' | 'room_occupied' | 'equipment_unavailable';
  conflictDetails: any;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

class SessionService {
  // Calendar and session retrieval methods
  async getSessionsByDateRange(
    startDate: string, 
    endDate: string, 
    filters?: SessionFilters
  ): Promise<{ data: TrainingSession[]; error: string | null }> {
    try {
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          members:member_id (
            id, first_name, last_name, email
          ),
          users:trainer_id (
            id, first_name, last_name, email
          )
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });

      // Apply filters
      if (filters?.memberId) query = query.eq('member_id', filters.memberId);
      if (filters?.trainerId) query = query.eq('trainer_id', filters.trainerId);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.sessionRoom) query = query.eq('session_room', filters.sessionRoom);

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching sessions by date range:', error);
        // If training_sessions table columns don't exist yet, return empty array
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('column')) {
          console.warn('Training sessions table may be missing columns. Please run database setup.');
          return { data: [], error: null };
        }
        return { data: [], error: error.message };
      }

      const transformedSessions = (sessions || []).map(session => this.transformSessionData(session));
      return { data: transformedSessions, error: null };
    } catch (error) {
      console.error('Unexpected error fetching sessions by date range:', error);
      return { data: [], error: 'Failed to fetch sessions' };
    }
  }

  // CRUD operations
  async createSession(data: CreateSessionData): Promise<{ data: TrainingSession | null; error: string | null }> {
    try {
      // Check for conflicts before creating
      const conflicts = await this.checkConflicts(data.trainerId, data.scheduledDate, data.duration);
      if (conflicts.length > 0) {
        return { 
          data: null, 
          error: `Schedule conflict detected: ${conflicts.map(c => c.type).join(', ')}` 
        };
      }

      const sessionData = {
        member_id: data.memberId,
        trainer_id: data.trainerId,
        type: data.type,
        title: data.title,
        description: data.description,
        scheduled_date: data.scheduledDate,
        duration: data.duration,
        cost: data.cost,
        session_room: data.sessionRoom,
        equipment_needed: data.equipmentNeeded,
        session_goals: data.sessionGoals,
        preparation_notes: data.preparationNotes,
        recurring_pattern: data.recurringPattern,
        status: 'scheduled',
        created_by: undefined // Will be set by RLS/auth context
      };

      const { data: session, error } = await supabase
        .from('training_sessions')
        .insert(sessionData)
        .select(`
          *,
          members:member_id (
            id, first_name, last_name, email
          ),
          users:trainer_id (
            id, first_name, last_name, email
          )
        `)
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return { data: null, error: error.message };
      }

      // Handle recurring sessions
      if (data.recurringPattern) {
        await this.createRecurringSessions(session.id, data);
      }

      return { data: this.transformSessionData(session), error: null };
    } catch (error) {
      console.error('Unexpected error creating session:', error);
      return { data: null, error: 'Failed to create session' };
    }
  }

  async updateSession(data: UpdateSessionData): Promise<{ data: TrainingSession | null; error: string | null }> {
    try {
      const updateData: any = {};

      // Basic fields
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.scheduledDate) updateData.scheduled_date = data.scheduledDate;
      if (data.duration) updateData.duration = data.duration;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.status) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Enhanced fields
      if (data.sessionRoom !== undefined) updateData.session_room = data.sessionRoom;
      if (data.equipmentNeeded !== undefined) updateData.equipment_needed = data.equipmentNeeded;
      if (data.sessionGoals !== undefined) updateData.session_goals = data.sessionGoals;
      if (data.actualStartTime !== undefined) updateData.actual_start_time = data.actualStartTime;
      if (data.actualEndTime !== undefined) updateData.actual_end_time = data.actualEndTime;
      if (data.preparationNotes !== undefined) updateData.preparation_notes = data.preparationNotes;
      if (data.completionSummary !== undefined) updateData.completion_summary = data.completionSummary;
      if (data.memberRating !== undefined) updateData.member_rating = data.memberRating;
      if (data.trainerRating !== undefined) updateData.trainer_rating = data.trainerRating;

      const { data: session, error } = await supabase
        .from('training_sessions')
        .update(updateData)
        .eq('id', data.id)
        .select(`
          *,
          members:member_id (
            id, first_name, last_name, email
          ),
          users:trainer_id (
            id, first_name, last_name, email
          )
        `)
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformSessionData(session), error: null };
    } catch (error) {
      console.error('Unexpected error updating session:', error);
      return { data: null, error: 'Failed to update session' };
    }
  }

  async deleteSession(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error deleting session:', error);
      return { success: false, error: 'Failed to delete session' };
    }
  }

  // Session comments
  async addSessionComment(
    sessionId: string, 
    comment: string, 
    commentType: SessionComment['commentType'],
    isPrivate = false
  ): Promise<{ data: SessionComment | null; error: string | null }> {
    try {
      const { data: commentData, error } = await supabase
        .from('session_comments')
        .insert({
          session_id: sessionId,
          comment,
          comment_type: commentType,
          is_private: isPrivate,
          user_id: undefined // Will be set by RLS/auth context
        })
        .select(`
          *,
          users:user_id (
            first_name, last_name, role
          )
        `)
        .single();

      if (error) {
        console.error('Error adding session comment:', error);
        return { data: null, error: error.message };
      }

      return { data: this.transformCommentData(commentData), error: null };
    } catch (error) {
      console.error('Unexpected error adding session comment:', error);
      return { data: null, error: 'Failed to add comment' };
    }
  }

  async getSessionComments(sessionId: string): Promise<{ data: SessionComment[]; error: string | null }> {
    try {
      const { data: comments, error } = await supabase
        .from('session_comments')
        .select(`
          *,
          users:user_id (
            first_name, last_name, role
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session comments:', error);
        return { data: [], error: error.message };
      }

      const transformedComments = (comments || []).map(comment => this.transformCommentData(comment));
      return { data: transformedComments, error: null };
    } catch (error) {
      console.error('Unexpected error fetching session comments:', error);
      return { data: [], error: 'Failed to fetch comments' };
    }
  }

  // Conflict detection and availability
  async checkConflicts(trainerId: string, scheduledDate: string, duration: number): Promise<Array<{ type: string; details: any }>> {
    try {
      const sessionStart = new Date(scheduledDate);
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

      const conflicts: Array<{ type: string; details: any }> = [];

      // Check trainer availability
      const dayOfWeek = sessionStart.getDay();
      const timeStr = sessionStart.toTimeString().slice(0, 5); // HH:MM

      const { data: availability } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      const isAvailable = availability?.some(slot => 
        timeStr >= slot.start_time && timeStr <= slot.end_time
      );

      if (!isAvailable) {
        conflicts.push({
          type: 'trainer_unavailable',
          details: { trainerId, dayOfWeek, time: timeStr }
        });
      }

      // Check for overlapping sessions
      const { data: overlappingSessions } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('trainer_id', trainerId)
        .gte('scheduled_date', sessionStart.toISOString())
        .lt('scheduled_date', sessionEnd.toISOString())
        .neq('status', 'cancelled');

      if (overlappingSessions && overlappingSessions.length > 0) {
        conflicts.push({
          type: 'trainer_booked',
          details: { overlappingSessions: overlappingSessions.length }
        });
      }

      return conflicts;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  }

  // Member and trainer specific queries
  async getMemberSessions(memberId: string, filters?: SessionFilters): Promise<{ data: TrainingSession[]; error: string | null }> {
    return this.getSessionsByDateRange(
      filters?.dateFrom || '2020-01-01',
      filters?.dateTo || '2030-12-31',
      { ...filters, memberId }
    );
  }

  async getTrainerSessions(trainerId: string, filters?: SessionFilters): Promise<{ data: TrainingSession[]; error: string | null }> {
    return this.getSessionsByDateRange(
      filters?.dateFrom || '2020-01-01',
      filters?.dateTo || '2030-12-31',
      { ...filters, trainerId }
    );
  }

  // Helper methods
  private async createRecurringSessions(parentSessionId: string, data: CreateSessionData): Promise<void> {
    // Implementation for creating recurring sessions
    // This would create multiple sessions based on the recurring pattern
    console.log('Creating recurring sessions for:', parentSessionId, data.recurringPattern);
    // TODO: Implement recurring session logic
  }

  private transformSessionData(dbSession: any): TrainingSession {
    return {
      id: dbSession.id,
      memberId: dbSession.member_id,
      trainerId: dbSession.trainer_id,
      type: dbSession.type,
      title: dbSession.title,
      description: dbSession.description,
      scheduledDate: dbSession.scheduled_date,
      duration: dbSession.duration,
      status: dbSession.status,
      notes: dbSession.notes,
      cost: dbSession.cost,
      sessionRoom: dbSession.session_room,
      equipmentNeeded: dbSession.equipment_needed || [],
      sessionGoals: dbSession.session_goals,
      actualStartTime: dbSession.actual_start_time,
      actualEndTime: dbSession.actual_end_time,
      recurringPattern: dbSession.recurring_pattern,
      createdBy: dbSession.created_by,
      preparationNotes: dbSession.preparation_notes,
      completionSummary: dbSession.completion_summary,
      memberRating: dbSession.member_rating,
      trainerRating: dbSession.trainer_rating,
      createdAt: dbSession.created_at,
      member: dbSession.members ? {
        id: dbSession.members.id,
        firstName: dbSession.members.first_name,
        lastName: dbSession.members.last_name,
        email: dbSession.members.email
      } : undefined,
      trainer: dbSession.users ? {
        id: dbSession.users.id,
        firstName: dbSession.users.first_name,
        lastName: dbSession.users.last_name,
        email: dbSession.users.email
      } : undefined
    };
  }

  private transformCommentData(dbComment: any): SessionComment {
    return {
      id: dbComment.id,
      sessionId: dbComment.session_id,
      userId: dbComment.user_id,
      comment: dbComment.comment,
      commentType: dbComment.comment_type,
      isPrivate: dbComment.is_private,
      createdAt: dbComment.created_at,
      updatedAt: dbComment.updated_at,
      user: dbComment.users ? {
        firstName: dbComment.users.first_name,
        lastName: dbComment.users.last_name,
        role: dbComment.users.role
      } : undefined
    };
  }
}

export const sessionService = new SessionService();
export default sessionService;