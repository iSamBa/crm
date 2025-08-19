import { useQuery, useMutation } from '@tanstack/react-query';
import { SessionComment, SessionCommentData } from '@/types';
import { commentService } from '@/lib/services/comment-service';
import { queryKeys, queryClient } from '@/lib/query-client';

/**
 * Modern TanStack Query hook for fetching session comments
 */
export function useSessionComments(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessions.comments(sessionId),
    queryFn: () => commentService.getSessionComments(sessionId),
    select: (data) => data.data || [],
    enabled: !!sessionId,
    meta: {
      errorMessage: 'Failed to load session comments'
    }
  });
}

/**
 * Modern TanStack Query hook for adding comments with optimistic updates
 */
export function useAddComment() {
  return useMutation({
    mutationFn: (data: SessionCommentData) => commentService.addSessionComment(data),
    onSuccess: (_result, variables) => {
      // Invalidate and refetch on success to get real data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.sessions.comments(variables.sessionId) 
      });
    },
    meta: {
      successMessage: 'Comment added successfully',
      errorMessage: 'Failed to add comment'
    }
  });
}

/**
 * Modern TanStack Query hook for updating comments
 */
export function useUpdateComment() {
  return useMutation({
    mutationFn: ({ 
      commentId, 
      updates 
    }: { 
      commentId: string; 
      updates: Partial<Pick<SessionCommentData, 'comment' | 'commentType' | 'isPrivate'>> 
    }) => commentService.updateComment(commentId, updates),
    onSuccess: () => {
      // Invalidate all comment queries since we don't know which session
      queryClient.invalidateQueries({ queryKey: ['sessions', 'comments'] });
    },
    meta: {
      successMessage: 'Comment updated successfully',
      errorMessage: 'Failed to update comment'
    }
  });
}

/**
 * Modern TanStack Query hook for deleting comments
 */
export function useDeleteComment() {
  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onMutate: async (commentId) => {
      // Find and cancel queries for all sessions (since we don't know which session)
      await queryClient.cancelQueries({ queryKey: ['sessions', 'comments'] });

      // Find the comment in cache and remove it optimistically
      const queries = queryClient.getQueriesData({ queryKey: ['sessions', 'comments'] });
      const rollbackActions: (() => void)[] = [];

      queries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          const commentIndex = data.findIndex((comment: SessionComment) => comment.id === commentId);
          if (commentIndex !== -1) {
            const previousData = [...data];
            const updatedData = data.filter((comment: SessionComment) => comment.id !== commentId);
            
            queryClient.setQueryData(queryKey, updatedData);
            rollbackActions.push(() => queryClient.setQueryData(queryKey, previousData));
          }
        }
      });

      return { rollbackActions };
    },
    onError: (_err, _commentId, context) => {
      // Rollback optimistic updates
      context?.rollbackActions.forEach(rollback => rollback());
    },
    onSuccess: () => {
      // Invalidate all comment queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sessions', 'comments'] });
    },
    meta: {
      successMessage: 'Comment deleted successfully',
      errorMessage: 'Failed to delete comment'
    }
  });
}

/**
 * Combined hook for all comment actions
 */
export function useCommentActions() {
  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  return {
    addComment: addComment.mutate,
    updateComment: updateComment.mutate,
    deleteComment: deleteComment.mutate,
    isLoading: addComment.isPending || updateComment.isPending || deleteComment.isPending,
    error: addComment.error || updateComment.error || deleteComment.error
  };
}