'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Target,
  MessageSquare,
  Star,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { TrainingSession } from '@/types';
import { sessionService } from '@/lib/services/session-service';
import { dateFormatters } from '@/lib/utils/date-formatting';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { SessionModal } from '@/components/calendar/session-modal';
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

interface SessionsListProps {
  sessions: TrainingSession[];
  isLoading: boolean;
  error: any;
  entityId: string; // memberId or trainerId
  entityType: 'member' | 'trainer';
  showParticipant?: boolean; // Whether to show member/trainer info
  onScheduleSession?: () => void;
}

export function SessionsList({ 
  sessions,
  isLoading,
  error,
  entityId,
  entityType,
  showParticipant = true,
  onScheduleSession
}: SessionsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TrainingSession | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resultDialog, setResultDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });
  const queryClient = useQueryClient();

  const showResultDialog = (type: 'success' | 'error', title: string, message: string) => {
    setResultDialog({ isOpen: true, type, title, message });
  };

  // Session action handlers
  const handleModifySession = (session: TrainingSession) => {
    setSessionToEdit(session);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSessionToEdit(null);
    // Invalidate queries to refresh the list
    if (entityType === 'member') {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.member(entityId, undefined) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.trainer(entityId, undefined) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    showResultDialog('success', 'Session Updated', 'The training session has been updated successfully.');
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSessionToEdit(null);
  };

  const handleDeleteClick = (session: TrainingSession) => {
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      const { success, error } = await sessionService.deleteSession(sessionToDelete.id);
      
      if (success) {
        // Invalidate queries to refresh the list
        if (entityType === 'member') {
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.member(entityId, undefined) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.trainer(entityId, undefined) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
        console.log('Session deleted successfully');
        showResultDialog('success', 'Session Deleted', 'The training session has been deleted successfully.');
      } else {
        console.error('Failed to delete session:', error);
        showResultDialog('error', 'Delete Failed', error || 'Failed to delete the session. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showResultDialog('error', 'Delete Failed', 'An unexpected error occurred while deleting the session.');
    } finally {
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
  };

  // Filter sessions based on current filters
  const filteredSessions = sessions.filter(session => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false;
    if (typeFilter !== 'all' && session.type !== typeFilter) return false;
    return true;
  });

  const getStatusColor = (status: TrainingSession['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      case 'rescheduled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: TrainingSession['type']) => {
    switch (type) {
      case 'personal':
        return <User className="h-4 w-4" />;
      case 'group':
        return <User className="h-4 w-4" />;
      case 'class':
        return <User className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Error loading sessions: {String(error)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="personal">Personal Training</SelectItem>
              <SelectItem value="group">Group Session</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onScheduleSession && (
          <Button onClick={onScheduleSession}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No sessions match the current filters.' 
                : `This ${entityType} has no training sessions yet.`
              }
            </p>
            {onScheduleSession && (
              <Button variant="outline" onClick={onScheduleSession}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(session.type)}
                          <h3 className="font-semibold">{session.title}</h3>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground">{session.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{dateFormatters.fullDateTime(session.scheduledDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{session.duration} minutes</span>
                      </div>

                      {/* Show participant info based on entity type */}
                      {showParticipant && (
                        <>
                          {entityType === 'member' && session.trainer && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Trainer: {session.trainer.firstName} {session.trainer.lastName}</span>
                            </div>
                          )}
                          
                          {entityType === 'trainer' && session.member && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Client: {session.member.firstName} {session.member.lastName}</span>
                            </div>
                          )}
                        </>
                      )}

                      {session.sessionRoom && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{session.sessionRoom}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    {(session.sessionGoals || session.cost || session.memberRating) && (
                      <div className="flex items-center gap-4 pt-2 border-t">
                        {session.sessionGoals && (
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">{session.sessionGoals}</span>
                          </div>
                        )}

                        {session.cost && (
                          <div className="text-sm font-medium">
                            ${session.cost}
                          </div>
                        )}

                        {session.memberRating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{session.memberRating}/5</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes/Comments */}
                    {(session.notes || session.completionSummary) && (
                      <div className="pt-2 border-t">
                        {session.completionSummary && (
                          <div className="text-sm">
                            <span className="font-medium text-green-700">Summary: </span>
                            <span className="text-muted-foreground">{session.completionSummary}</span>
                          </div>
                        )}
                        {session.notes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes: </span>
                            <span className="text-muted-foreground">{session.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Show comments count if available */}
                    {session.comments && session.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{session.comments.length}</span>
                      </div>
                    )}
                    
                    {/* Modify button - only for scheduled/confirmed sessions */}
                    {(session.status === 'scheduled' || session.status === 'confirmed') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleModifySession(session)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modify
                      </Button>
                    )}
                    
                    {/* Delete button - not for completed sessions */}
                    {session.status !== 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteClick(session)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session Edit Modal */}
      <SessionModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        session={sessionToEdit || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training session? This action cannot be undone.
              {sessionToDelete && (
                <>
                  <br /><br />
                  <strong>Session:</strong> {sessionToDelete.title}
                  <br />
                  <strong>Date:</strong> {dateFormatters.fullDateTime(sessionToDelete.scheduledDate)}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Dialog */}
      <AlertDialog open={resultDialog.isOpen} onOpenChange={(open) => 
        setResultDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{resultDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {resultDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResultDialog(prev => ({ ...prev, isOpen: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}