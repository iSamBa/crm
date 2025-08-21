'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Users, 
  MapPin, 
  Target, 
  AlertTriangle,
  Search
} from 'lucide-react';
import { useSessionActions, useConflictCheck } from '@/lib/hooks/use-sessions';
import { useMembers } from '@/lib/hooks/use-members';
import { useTrainers } from '@/lib/hooks/use-trainers';
import { TrainingSession } from '@/types';
import { CreateSessionData } from '@/lib/services/session-service';
import { 
  calculateDurationBetweenDates, 
  getDefaultDurationByType,
  getAvailableDurationOptions 
} from '@/lib/utils/session-utils';

const sessionSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  trainerId: z.string().min(1, 'Please select a trainer'),
  type: z.enum(['personal', 'group', 'class', 'assessment', 'consultation', 'rehabilitation']),
  title: z.string().min(1, 'Session title is required'),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, 'Date and time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  cost: z.number().min(0).optional(),
  sessionRoom: z.string().optional(),
  equipmentNeeded: z.string().optional(),
  sessionGoals: z.string().optional(),
  preparationNotes: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSession?: TrainingSession) => void;
  session?: TrainingSession; // For editing
  defaultDate?: Date;
  defaultEndDate?: Date;
  defaultMemberId?: string;
  defaultTrainerId?: string;
}

export function SessionModal({
  isOpen,
  onClose,
  onSuccess,
  session,
  defaultDate,
  defaultEndDate,
  defaultMemberId,
  defaultTrainerId
}: SessionModalProps) {
  const [memberSearch, setMemberSearch] = useState('');
  const [conflicts, setConflicts] = useState<Array<{ type: string; details: any }>>([]);
  
  const { createSession, updateSession, isLoading } = useSessionActions();
  const { checkConflicts, isChecking } = useConflictCheck();
  const { members } = useMembers(); // Remove searchTerm from here to prevent infinite loop
  const { trainers, isLoading: trainersLoading, error: trainersError } = useTrainers();

  const isEditing = !!session;

  // Calculate default duration using utility functions
  const defaultDuration = defaultDate && defaultEndDate 
    ? calculateDurationBetweenDates(defaultDate, defaultEndDate)
    : getDefaultDurationByType('personal');

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  // The database stores UTC time, but datetime-local input expects local time format
  const formatDateTimeLocal = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      // The Date constructor automatically converts UTC to local time for display
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      memberId: session?.memberId || defaultMemberId || '',
      trainerId: session?.trainerId || defaultTrainerId || '',
      type: session?.type || 'personal',
      title: session?.title || '',
      description: session?.description || '',
      scheduledDate: formatDateTimeLocal(session?.scheduledDate) || (defaultDate?.toISOString().slice(0, 16)) || '',
      duration: session?.duration || defaultDuration,
      cost: session?.cost ?? undefined,
      sessionRoom: session?.sessionRoom || '',
      equipmentNeeded: session?.equipmentNeeded?.join(', ') || '',
      sessionGoals: session?.sessionGoals || '',
      preparationNotes: session?.preparationNotes || '',
    },
  });

  const watchedTrainerId = form.watch('trainerId');
  const watchedScheduledDate = form.watch('scheduledDate');

  // Update form when session changes (for editing different sessions)
  useEffect(() => {
    if (session && isOpen) {
      form.reset({
        memberId: session.memberId || '',
        trainerId: session.trainerId || '',
        type: session.type || 'personal',
        title: session.title || '',
        description: session.description || '',
        scheduledDate: formatDateTimeLocal(session.scheduledDate) || '',
        duration: session.duration || defaultDuration,
        cost: session.cost ?? undefined,
        sessionRoom: session.sessionRoom || '',
        equipmentNeeded: session.equipmentNeeded?.join(', ') || '',
        sessionGoals: session.sessionGoals || '',
        preparationNotes: session.preparationNotes || '',
      });
    } else if (!session && isOpen) {
      // Reset form for new session
      form.reset({
        memberId: defaultMemberId || '',
        trainerId: defaultTrainerId || '',
        type: 'personal',
        title: '',
        description: '',
        scheduledDate: defaultDate?.toISOString().slice(0, 16) || '',
        duration: defaultDuration,
        cost: undefined,
        sessionRoom: '',
        equipmentNeeded: '',
        sessionGoals: '',
        preparationNotes: '',
      });
    }
  }, [session, isOpen, defaultMemberId, defaultTrainerId, defaultDate, defaultDuration, form]);
  const watchedDuration = form.watch('duration');

  // Check for conflicts when trainer, date, or duration changes
  useEffect(() => {
    const checkSessionConflicts = async () => {
      if (watchedTrainerId && watchedScheduledDate && watchedDuration) {
        const conflictResults = await checkConflicts(
          watchedTrainerId,
          watchedScheduledDate,
          watchedDuration
        );
        setConflicts(conflictResults);
      } else {
        setConflicts([]);
      }
    };

    if (!isEditing) { // Only check conflicts for new sessions
      checkSessionConflicts();
    }
  }, [watchedTrainerId, watchedScheduledDate, watchedDuration, checkConflicts, isEditing]);

  const onSubmit = async (data: SessionFormData) => {
    try {
      // Convert datetime-local value (YYYY-MM-DDTHH:mm) to proper ISO string
      // The datetime-local input gives us local time, so we need to create a Date object
      // that represents that local time and then convert to ISO string
      let scheduledDateISO = data.scheduledDate;
      if (data.scheduledDate) {
        const localDate = new Date(data.scheduledDate);
        scheduledDateISO = localDate.toISOString();
      }

      const sessionData: CreateSessionData = {
        memberId: data.memberId,
        trainerId: data.trainerId,
        type: data.type,
        title: data.title,
        description: data.description,
        scheduledDate: scheduledDateISO,
        duration: data.duration,
        cost: data.cost || undefined,
        sessionRoom: data.sessionRoom,
        equipmentNeeded: data.equipmentNeeded ? data.equipmentNeeded.split(',').map(e => e.trim()) : undefined,
        sessionGoals: data.sessionGoals,
        preparationNotes: data.preparationNotes,
      };

      let result;
      if (isEditing && session) {
        result = await updateSession({
          id: session.id,
          ...sessionData
        });
      } else {
        result = await createSession(sessionData);
      }

      if (result.error) {
        console.error('Error saving session:', result.error);
        return;
      }

      onSuccess(result.data || undefined);
    } catch (error) {
      console.error('Error submitting session:', error);
    }
  };

  // Use real trainer data
  const availableTrainers = trainers.map(trainer => ({
    id: trainer.id,
    name: `${trainer.firstName} ${trainer.lastName}`,
    specialization: trainer.specializations.join(', ') || 'General Training'
  }));

  // Filtered members based on search - use useMemo to prevent unnecessary re-calculations
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) {
      return members;
    }
    return members.filter(member =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.email?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[67vw] !w-[67vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Session' : 'Create New Session'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Conflicts Alert */}
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Scheduling conflicts detected:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        {conflict.type === 'trainer_unavailable' && 'Trainer is not available at this time'}
                        {conflict.type === 'trainer_booked' && 'Trainer has overlapping sessions'}
                        {conflict.type === 'member_booked' && 'Member has conflicting appointments'}
                        {conflict.type === 'room_occupied' && 'Selected room is occupied'}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Session Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal">Personal Training</SelectItem>
                                <SelectItem value="group">Group Session</SelectItem>
                                <SelectItem value="class">Fitness Class</SelectItem>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="consultation">Consultation</SelectItem>
                                <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Upper Body Strength Training" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Session description and objectives..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Schedule & Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time</FormLabel>
                          <FormControl>
                            <DateTimePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select date and time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value?.toString()} 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableDurationOptions().map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = parseFloat(value);
                                  field.onChange(isNaN(numValue) ? undefined : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Participants & Location */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  placeholder="Search members..."
                                  value={memberSearch}
                                  onChange={(e) => setMemberSearch(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.firstName} {member.lastName}
                                      {member.email && (
                                        <span className="text-sm text-muted-foreground ml-2">
                                          {member.email}
                                        </span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trainerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trainer</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder={trainersLoading ? "Loading trainers..." : "Select a trainer"} />
                              </SelectTrigger>
                              <SelectContent>
                                {trainersLoading ? (
                                  <SelectItem value="" disabled>Loading trainers...</SelectItem>
                                ) : trainersError ? (
                                  <SelectItem value="" disabled>Error loading trainers: {trainersError}</SelectItem>
                                ) : availableTrainers.length === 0 ? (
                                  <SelectItem value="" disabled>No trainers found</SelectItem>
                                ) : (
                                  availableTrainers.map((trainer) => (
                                    <SelectItem key={trainer.id} value={trainer.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{trainer.name}</span>
                                        <Badge 
                                          variant="secondary" 
                                          className="ml-2 text-xs bg-muted/50 text-foreground hover:bg-muted/70 transition-colors"
                                        >
                                          {trainer.specialization}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                          {isChecking && (
                            <div className="text-sm text-muted-foreground">
                              Checking availability...
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location & Equipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sessionRoom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room/Location</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a room" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gym-floor">Main Gym Floor</SelectItem>
                                <SelectItem value="studio-a">Studio A</SelectItem>
                                <SelectItem value="studio-b">Studio B</SelectItem>
                                <SelectItem value="private-room">Private Training Room</SelectItem>
                                <SelectItem value="outdoor">Outdoor Area</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="equipmentNeeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Needed</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., dumbbells, resistance bands, yoga mats"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Full Width - Goals and Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Goals & Preparation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sessionGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What are the specific goals for this session?"
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preparationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preparation Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special preparation needed for this session?"
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (conflicts.length > 0 && !isEditing)}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}