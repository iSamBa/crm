'use client';

import { useState, useEffect } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { longDateTime } from '@/lib/utils/date-formatting';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  User, 
  Users, 
  MapPin, 
  Target, 
  DollarSign,
  Calendar,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Play,
  Square,
  CheckCircle,
  XCircle,
  UserX
} from 'lucide-react';
import { 
  useSessionActions
} from '@/lib/hooks/use-sessions';
import { 
  useSessionComments, 
  useCommentActions 
} from '@/lib/hooks/use-session-comments';
import { TrainingSession } from '@/types';
import { SessionModal } from './session-modal';

interface SessionDetailModalProps {
  session: TrainingSession;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function SessionDetailModal({
  session,
  isOpen,
  onClose,
  onUpdate
}: SessionDetailModalProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'progress' | 'issue' | 'goal' | 'equipment' | 'feedback' | 'reminder'>('note');
  const [memberRating, setMemberRating] = useState(session.memberRating || 0);
  const [trainerRating, setTrainerRating] = useState(session.trainerRating || 0);
  const [completionSummary, setCompletionSummary] = useState(session.completionSummary || '');

  const { 
    confirmSession,
    startSession,
    completeSession,
    cancelSession,
    markNoShow,
    deleteSession,
    isLoading: isActionLoading
  } = useSessionActions();

  const { data: comments = [], isLoading: isCommentsLoading } = useSessionComments(currentSession.id);
  const { addComment, isLoading: isCommentLoading, error: commentError } = useCommentActions();

  // Reset states when session changes
  useEffect(() => {
    setCurrentSession(session);
    setMemberRating(session.memberRating || 0);
    setTrainerRating(session.trainerRating || 0);
    setCompletionSummary(session.completionSummary || '');
  }, [session]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;


    try {
      addComment({
        sessionId: currentSession.id,
        comment: newComment,
        commentType,
        isPrivate: false
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCompleteSession = async () => {
    const result = await completeSession(currentSession.id, {
      completionSummary,
      memberRating: memberRating || undefined,
      trainerRating: trainerRating || undefined
    });
    
    if (!result.error && result.data) {
      setCurrentSession(result.data);
      onUpdate();
    }
  };

  const handleStatusChange = async (action: string) => {
    let result;
    
    switch (action) {
      case 'confirm':
        result = await confirmSession(currentSession.id);
        break;
      case 'start':
        result = await startSession(currentSession.id);
        break;
      case 'complete':
        await handleCompleteSession();
        return;
      case 'cancel':
        result = await cancelSession(currentSession.id);
        break;
      case 'no_show':
        result = await markNoShow(currentSession.id);
        break;
      case 'delete':
        setIsDeleteDialogOpen(true);
        return;
    }

    if (result && !result.error && result.data) {
      setCurrentSession(result.data);
      onUpdate();
    }
  };

  const getStatusColor = (status: TrainingSession['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-gray-500';
      case 'rescheduled': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: TrainingSession['type']) => {
    switch (type) {
      case 'personal': return 'bg-green-600';
      case 'group': return 'bg-red-600';
      case 'class': return 'bg-purple-600';
      case 'assessment': return 'bg-primary';
      case 'consultation': return 'bg-cyan-600';
      case 'rehabilitation': return 'bg-pink-600';
      default: return 'bg-gray-600';
    }
  };

  const sessionDuration = currentSession.actualStartTime && currentSession.actualEndTime
    ? intervalToDuration({
        start: new Date(currentSession.actualStartTime),
        end: new Date(currentSession.actualEndTime)
      })
    : null;

  const isUpcoming = new Date(currentSession.scheduledDate) > new Date();
  const isCompleted = currentSession.status === 'completed';
  const canStart = currentSession.status === 'confirmed' && !isUpcoming;
  const canComplete = currentSession.status === 'in_progress';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-[67vw] !w-[67vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>{currentSession.title}</span>
                <Badge className={getStatusColor(currentSession.status)}>
                  {currentSession.status.replace('_', ' ')}
                </Badge>
                <Badge className={getTypeColor(currentSession.type)}>
                  {currentSession.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('delete')}
                  disabled={isActionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              View and manage session details, including participant information, timing, and session notes.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Session Details</TabsTrigger>
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
              {isCompleted && (
                <TabsTrigger value="completion">Completion</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentSession.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange('confirm')}
                        disabled={isActionLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                    )}
                    {canStart && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange('start')}
                        disabled={isActionLoading}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange('complete')}
                        disabled={isActionLoading}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    {!isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange('cancel')}
                          disabled={isActionLoading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange('no_show')}
                          disabled={isActionLoading}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          No Show
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Scheduled:</span>
                      <span>{longDateTime(currentSession.scheduledDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Duration:</span>
                      <span>{currentSession.duration} minutes</span>
                    </div>
                    {currentSession.actualStartTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Actual Start:</span>
                        <span>{longDateTime(currentSession.actualStartTime)}</span>
                      </div>
                    )}
                    {currentSession.actualEndTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Actual End:</span>
                        <span>{longDateTime(currentSession.actualEndTime)}</span>
                      </div>
                    )}
                    {sessionDuration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Actual Duration:</span>
                        <span>{formatDuration(sessionDuration)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Member:</span>
                      <span>{currentSession.member ? `${currentSession.member.firstName} ${currentSession.member.lastName}` : `Member ID: ${currentSession.memberId}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Trainer:</span>
                      <span>{currentSession.trainer ? `${currentSession.trainer.firstName} ${currentSession.trainer.lastName}` : `Trainer ID: ${currentSession.trainerId}`}</span>
                    </div>
                    {currentSession.cost && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Cost:</span>
                        <span>${currentSession.cost}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location & Equipment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location & Equipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentSession.sessionRoom && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Room:</span>
                        <span>{currentSession.sessionRoom}</span>
                      </div>
                    )}
                    {currentSession.equipmentNeeded && currentSession.equipmentNeeded.length > 0 && (
                      <div>
                        <span className="font-medium">Equipment:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentSession.equipmentNeeded.map((equipment, index) => (
                            <Badge key={index} variant="outline">
                              {equipment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Goals & Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Goals & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentSession.sessionGoals && (
                      <div>
                        <span className="font-medium">Session Goals:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSession.sessionGoals}
                        </p>
                      </div>
                    )}
                    {currentSession.preparationNotes && (
                      <div>
                        <span className="font-medium">Preparation Notes:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSession.preparationNotes}
                        </p>
                      </div>
                    )}
                    {currentSession.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSession.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ratings */}
              {(currentSession.memberRating || currentSession.trainerRating) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Ratings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {currentSession.memberRating && (
                      <div>
                        <span className="font-medium">Member Rating:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < currentSession.memberRating! 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm">({currentSession.memberRating}/5)</span>
                        </div>
                      </div>
                    )}
                    {currentSession.trainerRating && (
                      <div>
                        <span className="font-medium">Trainer Rating:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < currentSession.trainerRating! 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm">({currentSession.trainerRating}/5)</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              {/* Add New Comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Comment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value as any)}
                      className="border rounded-md p-2"
                    >
                      <option value="note">Note</option>
                      <option value="progress">Progress Update</option>
                      <option value="issue">Issue</option>
                      <option value="goal">Goal Update</option>
                      <option value="equipment">Equipment</option>
                      <option value="feedback">Feedback</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={isCommentLoading || !newComment.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isCommentLoading ? 'Adding...' : 'Add Comment'}
                  </Button>
                  {commentError && (
                    <p className="text-sm text-red-500 mt-2">
                      Error: {commentError.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Comments List */}
              {isCommentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comments.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                    No comments yet. Add the first comment above.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{comment.commentType}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {longDateTime(comment.createdAt)}
                              </span>
                              {comment.isPrivate && (
                                <Badge variant="secondary">Private</Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {isCompleted && (
              <TabsContent value="completion" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Session Completion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentSession.completionSummary && (
                      <div>
                        <span className="font-medium">Completion Summary:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSession.completionSummary}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {currentSession.memberRating && (
                        <div>
                          <span className="font-medium">Member Rating:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < currentSession.memberRating! 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2">({session.memberRating}/5)</span>
                          </div>
                        </div>
                      )}
                      
                      {currentSession.trainerRating && (
                        <div>
                          <span className="font-medium">Trainer Rating:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < currentSession.trainerRating! 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2">({session.trainerRating}/5)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <SessionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updatedSession) => {
          if (updatedSession) {
            setCurrentSession(updatedSession);
          }
          setIsEditModalOpen(false);
          onUpdate();
        }}
        session={currentSession}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently remove the session data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                const result = await deleteSession(currentSession.id);
                if (!result.error) {
                  setIsDeleteDialogOpen(false);
                  onClose();
                } else {
                  // Keep dialog open on error so user can retry
                }
              }}
              disabled={isActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? 'Deleting...' : 'Delete Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}