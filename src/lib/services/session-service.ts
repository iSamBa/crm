import { supabase } from '@/lib/supabase/client';
import { TrainingSession, SessionComment, RecurringPattern } from '@/types';
import { calculateSessionEndTime } from '@/lib/utils/session-utils';

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
      // TODO: Implement recurring session logic
      // if (data.recurringPattern) {
      //   await this.createRecurringSessions(session.id, data);
      // }

      return { data: this.transformSessionData(session), error: null };
    } catch (error) {
      console.error('Unexpected error creating session:', error);
      return { data: null, error: 'Failed to create session' };
    }
  }

  async updateSession(data: UpdateSessionData): Promise<{ data: TrainingSession | null; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {};

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
  async checkConflicts(trainerId: string, scheduledDate: string, duration: number): Promise<Array<{ type: string; details: Record<string, unknown> }>> {
    try {
      const sessionStart = new Date(scheduledDate);
      const sessionEnd = calculateSessionEndTime(sessionStart, duration);

      const conflicts: Array<{ type: string; details: Record<string, unknown> }> = [];

      // Check trainer availability
      const dayOfWeek = sessionStart.getDay();
      const sessionTime = sessionStart.toTimeString().slice(0, 8); // HH:MM:SS
      const sessionEndTime = sessionEnd.toTimeString().slice(0, 8); // HH:MM:SS

      const { data: availability } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('day_of_week', dayOfWeek);

      const isAvailable = availability?.some(slot => 
        sessionTime >= slot.start_time && sessionEndTime <= slot.end_time
      );

      if (!isAvailable) {
        conflicts.push({
          type: 'trainer_unavailable',
          details: { trainerId, dayOfWeek, time: sessionTime, availability }
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

  // Get recently created sessions for activities feed
  async getRecentlyCreatedSessions(limit = 10): Promise<{ data: TrainingSession[]; error: string | null }> {
    try {
      
      const query = supabase
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
        .order('created_at', { ascending: false }) // Order by creation date, not scheduled date
        .limit(limit);

      const { data: sessions, error } = await query;


      if (error) {
        console.error('Error fetching recently created sessions:', error);
        // If training_sessions table columns don't exist yet, return empty array
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('column')) {
          return { data: [], error: null };
        }
        return { data: [], error: error.message };
      }

      const transformedSessions = (sessions || []).map(session => this.transformSessionData(session));
      
      return { data: transformedSessions, error: null };
    } catch (error) {
      console.error('Unexpected error fetching recently created sessions:', error);
      return { data: [], error: 'Failed to fetch recently created sessions' };
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
  // TODO: Implement recurring session creation logic when needed

  private transformSessionData(dbSession: Record<string, unknown>): TrainingSession {
    return {
      id: dbSession.id as string,
      memberId: dbSession.member_id as string,
      trainerId: dbSession.trainer_id as string,
      type: dbSession.type as 'personal' | 'group' | 'class' | 'assessment' | 'consultation' | 'rehabilitation',
      title: dbSession.title as string,
      description: dbSession.description as string | undefined,
      scheduledDate: dbSession.scheduled_date as string,
      duration: dbSession.duration as number,
      status: dbSession.status as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled',
      notes: dbSession.notes as string | undefined,
      cost: dbSession.cost as number | undefined,
      sessionRoom: dbSession.session_room as string | undefined,
      equipmentNeeded: (dbSession.equipment_needed as string[]) || [],
      sessionGoals: dbSession.session_goals as string | undefined,
      actualStartTime: dbSession.actual_start_time as string | undefined,
      actualEndTime: dbSession.actual_end_time as string | undefined,
      recurringPattern: dbSession.recurring_pattern as any | undefined,
      createdBy: dbSession.created_by as string | undefined,
      preparationNotes: dbSession.preparation_notes as string | undefined,
      completionSummary: dbSession.completion_summary as string | undefined,
      memberRating: dbSession.member_rating as number | undefined,
      trainerRating: dbSession.trainer_rating as number | undefined,
      createdAt: dbSession.created_at as string,
      updatedAt: dbSession.updated_at as string,
      member: dbSession.members ? {
        id: (dbSession.members as any).id as string,
        firstName: (dbSession.members as any).first_name as string,
        lastName: (dbSession.members as any).last_name as string,
        email: (dbSession.members as any).email as string | undefined
      } : undefined,
      trainer: dbSession.users ? {
        id: (dbSession.users as any).id as string,
        firstName: (dbSession.users as any).first_name as string,
        lastName: (dbSession.users as any).last_name as string,
        email: (dbSession.users as any).email as string | undefined
      } : undefined
    };
  }

  private transformCommentData(dbComment: Record<string, unknown>): SessionComment {
    return {
      id: dbComment.id as string,
      sessionId: dbComment.session_id as string,
      userId: dbComment.user_id as string,
      comment: dbComment.comment as string,
      commentType: dbComment.comment_type as 'note' | 'progress' | 'issue' | 'goal' | 'equipment' | 'feedback' | 'reminder',
      isPrivate: dbComment.is_private as boolean,
      createdAt: dbComment.created_at as string,
      updatedAt: dbComment.updated_at as string,
      user: dbComment.users ? {
        firstName: (dbComment.users as any).first_name as string,
        lastName: (dbComment.users as any).last_name as string,
        role: (dbComment.users as any).role as string
      } : undefined
    };
  }
}

export const sessionService = new SessionService();
export default sessionService;