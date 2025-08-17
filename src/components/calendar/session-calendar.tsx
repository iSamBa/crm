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

  const { sessions, isLoading, refetch } = useCalendarSessions(
    dateRange.start,
    dateRange.end,
    {
      trainerId: filters.trainerId === 'all' ? undefined : filters.trainerId,
      memberId: filters.memberId === 'all' ? undefined : filters.memberId,
      type: filters.sessionType === 'all' ? undefined : filters.sessionType as TrainingSession['type'],
      status: filters.status === 'all' ? undefined : filters.status as TrainingSession['status']
    }
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

  // Handle slot selection (creating new session)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setCreateSlot(slotInfo);
    setIsCreateModalOpen(true);
  }, []);

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

  // Event styling based on session properties
  const eventStyleGetter = useCallback((event: any) => {
    const session: TrainingSession = event.resource;
    
    let backgroundColor = '#3174ad';
    let borderColor = '#265985';
    
    // Color by session type
    switch (session.type) {
      case 'personal':
        backgroundColor = '#059669'; // green
        borderColor = '#047857';
        break;
      case 'group':
        backgroundColor = '#dc2626'; // red
        borderColor = '#b91c1c';
        break;
      case 'class':
        backgroundColor = '#7c3aed'; // purple
        borderColor = '#6d28d9';
        break;
      case 'assessment':
        backgroundColor = '#ea580c'; // orange
        borderColor = '#c2410c';
        break;
      case 'consultation':
        backgroundColor = '#0891b2'; // cyan
        borderColor = '#0e7490';
        break;
      case 'rehabilitation':
        backgroundColor = '#be185d'; // pink
        borderColor = '#9d174d';
        break;
    }

    // Adjust opacity based on status
    if (session.status === 'cancelled' || session.status === 'no_show') {
      backgroundColor += '80'; // 50% opacity
    } else if (session.status === 'completed') {
      backgroundColor += 'b3'; // 70% opacity
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: '1px solid ' + borderColor,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
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
    return label;
  };

  // Year navigation
  const currentYear = moment(currentDate).year();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleYearChange = (year: string) => {
    const newDate = moment(currentDate).year(parseInt(year)).toDate();
    setCurrentDate(newDate);
  };

  // Custom toolbar
  const CustomToolbar = ({ onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('PREV')}
            title={currentView === 'week' ? 'Previous Week' : 'Previous'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('TODAY')}
            className="px-3"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('NEXT')}
            title={currentView === 'week' ? 'Next Week' : 'Next'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {getWeekRange()}
          </span>
          
          {/* Year Selector for quick year navigation */}
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-20">
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
      
      <div className="flex items-center gap-2">
        <Select value={currentView} onValueChange={(value: View) => onView(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={() => setIsCreateModalOpen(true)}>
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
          <Badge className="bg-orange-600">Assessment</Badge>
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
              style={{ height: 600 }}
              view={currentView}
              date={currentDate}
              onNavigate={onNavigate}
              onView={onView}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              popup
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar
              }}
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 6, 0, 0)} // 6 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
            />
            
            {/* Show helpful message when no sessions exist */}
            {sessions.length === 0 && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    No sessions scheduled for this time period. Click on any time slot to create a new session.
                  </p>
                  <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </Button>
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