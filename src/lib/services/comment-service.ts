import { SessionComment, SessionCommentData } from '@/types';
import { BaseService, ServiceResponse } from './base-service';
import { SessionCommentSchema } from '@/lib/schemas';

export class CommentService extends BaseService {

  /**
   * Get all comments for a session
   */
  async getSessionComments(sessionId: string): Promise<ServiceResponse<SessionComment[]>> {
    if (!sessionId) {
      return { data: [], error: 'Session ID is required' };
    }

    const result = await this.executeQuery(
      async () => {
        const queryResult = await this.db
          .from('session_comments')
          .select(`
            *,
            users:user_id (
              first_name, last_name, role
            )
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        return queryResult;
      },
      'Failed to fetch session comments',
      {
        logQuery: `Fetching comments for session ${sessionId}`,
        allowEmpty: true,
        transform: (data) => (data as unknown[])?.map((comment: unknown) => this.transformCommentData(comment as Record<string, unknown>)) || []
      }
    );

    return {
      data: result.data || [],
      error: result.error
    };
  }

  /**
   * Add a new comment to a session
   */
  async addSessionComment(data: SessionCommentData): Promise<ServiceResponse<SessionComment>> {
    // Validate input data
    const validation = this.validateInput(SessionCommentSchema, data);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    const validatedData = validation.data!;

    return this.executeMutation(
      async () => {
        const result = await this.db
          .from('session_comments')
          .insert({
            session_id: validatedData.sessionId,
            comment: validatedData.comment,
            comment_type: validatedData.commentType,
            is_private: validatedData.isPrivate,
            user_id: (await this.db.auth.getUser()).data.user?.id
          })
          .select(`
            *,
            users:user_id (
              first_name, last_name, role
            )
          `)
          .single();
        
        return result;
      },
      'Failed to add comment',
      {
        logOperation: `Adding comment to session ${validatedData.sessionId}`,
        transform: (data) => this.transformCommentData(data as Record<string, unknown>),
        invalidateQueries: [
          () => this.invalidate.sessionComments.session(validatedData.sessionId),
          () => this.invalidate.sessions.all()
        ]
      }
    );
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    commentId: string,
    updates: Partial<Pick<SessionCommentData, 'comment' | 'commentType' | 'isPrivate'>>
  ): Promise<ServiceResponse<SessionComment>> {
    if (!commentId) {
      return { data: null, error: 'Comment ID is required' };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.commentType !== undefined) updateData.comment_type = updates.commentType;
    if (updates.isPrivate !== undefined) updateData.is_private = updates.isPrivate;

    return this.executeMutation(
      async () => {
        const result = await this.db
          .from('session_comments')
          .update(updateData)
          .eq('id', commentId)
          .select(`
            *,
            users:user_id (
              first_name, last_name, role
            )
          `)
          .single();
        
        return result;
      },
      'Failed to update comment',
      {
        logOperation: `Updating comment ${commentId}`,
        transform: (data) => this.transformCommentData(data as Record<string, unknown>),
        invalidateQueries: [
          () => this.invalidate.sessionComments.all(),
          () => this.invalidate.sessions.all()
        ]
      }
    );
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<ServiceResponse<boolean>> {
    if (!commentId) {
      return { data: false, error: 'Comment ID is required' };
    }

    const result = await this.executeMutation(
      async () => {
        const deleteResult = await this.db
          .from('session_comments')
          .delete()
          .eq('id', commentId);
        
        return deleteResult;
      },
      'Failed to delete comment',
      {
        logOperation: `Deleting comment ${commentId}`,
        transform: () => true as boolean,
        invalidateQueries: [
          () => this.invalidate.sessionComments.all(),
          () => this.invalidate.sessions.all()
        ]
      }
    );

    return {
      data: result.data !== null ? true : false,
      error: result.error
    };
  }

  /**
   * Transform database comment data to frontend format
   */
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

export const commentService = new CommentService();
export default commentService;