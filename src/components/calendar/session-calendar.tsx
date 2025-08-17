'use client';

import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useCalendarSessions } from '@/lib/hooks/use-sessions';
import { TrainingSession } from '@/lib/services/session-service';
import { SessionModal } from './session-modal';
import { SessionDetailModal } from './session-detail-modal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './session-calendar.css';

const localizer = momentLocalizer(moment);

interface SessionCalendarProps {
  className?: string;
}

export function SessionCalendar({ className }: SessionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [createSlot, setCreateSlot] = useState<SlotInfo | null>(null);
  const [filters, setFilters] = useState({
    trainerId: 'all',
    memberId: 'all',
    sessionType: 'all',
    status: 'all'
  });

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = moment(currentDate).startOf(currentView === 'month' ? 'month' : 'week');
    const end = moment(currentDate).endOf(currentView === 'month' ? 'month' : 'week');
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, [currentDate, currentView]);

  // Memoize the filters to prevent infinite re-renders
  const sessionFilters = useMemo(() => ({
    trainerId: filters.trainerId === 'all' ? undefined : filters.trainerId,
    memberId: filters.memberId === 'all' ? undefined : filters.memberId,
    type: filters.sessionType === 'all' ? undefined : filters.sessionType as TrainingSession['type'],
    status: filters.status === 'all' ? undefined : filters.status as TrainingSession['status']
  }), [filters.trainerId, filters.memberId, filters.sessionType, filters.status]);

  const { sessions, isLoading, refetch } = useCalendarSessions(
    dateRange.start,
    dateRange.end,
    sessionFilters
  );

  // Transform sessions for calendar display
  const calendarEvents = useMemo(() => {
    return sessions.map(session => ({
      id: session.id,
      title: session.title,
      start: new Date(session.scheduledDate),
      end: new Date(new Date(session.scheduledDate).getTime() + session.duration * 60000),
      resource: session,
      allDay: false
    }));
  }, [sessions]);

  // Slot selection disabled - use create button instead

  // Handle event selection (viewing existing session)
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedSession(event.resource);
    setIsDetailModalOpen(true);
  }, []);

  // Navigation handlers
  const onNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const onView = useCallback((newView: View) => {
    setCurrentView(newView);
  }, []);

  // Modern event styling based on session properties
  const eventStyleGetter = useCallback((event: any) => {
    const session: TrainingSession = event.resource;
    
    // All session types use consistent primary color

    // Status-based opacity adjustments
    let opacity = '1';
    if (session.status === 'cancelled' || session.status === 'no_show') {
      opacity = '0.6';
    } else if (session.status === 'completed') {
      opacity = '0.8';
    }

    return {
      style: {
        backgroundColor: 'oklch(0.65 0.22 28)',
        border: 'none',
        color: 'white',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        opacity,
        boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  }, []);

  // Get current week range for display
  const getWeekRange = () => {
    if (currentView === 'week') {
      const startOfWeek = moment(currentDate).startOf('week');
      const endOfWeek = moment(currentDate).endOf('week');
      return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
    }
    return moment(currentDate).format('MMMM YYYY');
  };

  // Year navigation
  const currentYear = moment(currentDate).year();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleYearChange = (year: string) => {
    const newDate = moment(currentDate).year(parseInt(year)).toDate();
    setCurrentDate(newDate);
  };

  // Custom event component for better text layout
  const CustomEvent = ({ event }: { event: any }) => {
    const session = event.resource;
    const memberName = session.member 
      ? `${session.member.firstName} ${session.member.lastName}`
      : `Member ID: ${session.memberId}`;
    const trainerName = session.trainer 
      ? `${session.trainer.firstName} ${session.trainer.lastName}`
      : `Trainer ID: ${session.trainerId}`;

    return (
      <div className="h-full flex flex-col justify-start text-xs">
        <div className="font-semibold text-[12px] leading-tight mb-0.5 truncate">
          {session.title}
        </div>
        <div className="text-[11px] leading-tight opacity-90 truncate">
          {memberName}
        </div>
        <div className="text-[11px] leading-tight opacity-90 truncate">
          {trainerName}
        </div>
      </div>
    );
  };

  // Modern custom toolbar
  const CustomToolbar = ({ onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-background to-muted/30 rounded-lg border shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('PREV')}
            title={currentView === 'week' ? 'Previous Week' : 'Previous'}
            className="hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('TODAY')}
            className="px-4 font-medium hover:bg-primary hover:text-primary-foreground"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('NEXT')}
            title={currentView === 'week' ? 'Next Week' : 'Next'}
            className="hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {getWeekRange()}
          </span>
          
          {/* Year Selector with modern styling */}
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-20 border-0 bg-muted/50 focus:ring-1 focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={currentView} onValueChange={(value: View) => onView(value)}>
          <SelectTrigger className="w-32 border-0 bg-muted/50 focus:ring-1 focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">📅 Week</SelectItem>
            <SelectItem value="month">🗓️ Month</SelectItem>
            <SelectItem value="day">📍 Day</SelectItem>
            <SelectItem value="agenda">📋 Agenda</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`calendar-container ${className || ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Training Schedule
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.sessionType} onValueChange={(value) => setFilters(prev => ({ ...prev, sessionType: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className="bg-green-600">Personal</Badge>
          <Badge className="bg-red-600">Group</Badge>
          <Badge className="bg-purple-600">Class</Badge>
          <Badge className="bg-primary">Assessment</Badge>
          <Badge className="bg-cyan-600">Consultation</Badge>
          <Badge className="bg-pink-600">Rehabilitation</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'auto' }}
              view={currentView}
              date={currentDate}
              onNavigate={onNavigate}
              onView={onView}
              onSelectEvent={handleSelectEvent}
              selectable={false}
              popup
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent
              }}
              step={15}
              timeslots={4}
              formats={{
                timeGutterFormat: 'HH:mm',
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                  `${localizer?.format(start, 'MMM DD', culture)} - ${localizer?.format(end, 'MMM DD', culture)}`,
                agendaTimeFormat: 'HH:mm',
                agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                  `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`
              }}
              min={new Date(0, 0, 0, 9, 0, 0)} // 9 AM
              max={new Date(0, 0, 0, 21, 0, 0)} // 9 PM
            />
            
            {/* Show helpful message when no sessions exist */}
            {sessions.length === 0 && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No sessions scheduled for this time period. Use the &quot;New Session&quot; button above to create a session.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Create Session Modal */}
      <SessionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateSlot(null);
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setCreateSlot(null);
          refetch();
        }}
        defaultDate={createSlot?.start}
        defaultEndDate={createSlot?.end}
      />

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSession(null);
          }}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </Card>
  );
}