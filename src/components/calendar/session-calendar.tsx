'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus,
  Filter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useCalendarSessions } from '@/lib/hooks/use-sessions';
import { TrainingSession } from '@/types';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import { SessionModal } from './session-modal';
import { SessionDetailModal } from './session-detail-modal';
import { dateFormatters } from '@/lib/utils/date-formatting';
import { calculateSessionEndTime } from '@/lib/utils/session-utils';
import './session-calendar.css';

interface SessionCalendarProps {
  className?: string;
}

export function SessionCalendar({ className }: SessionCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [createSlot, setCreateSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [filters, setFilters] = useState({
    trainerId: 'all',
    memberId: 'all',
    sessionType: 'all',
    status: 'all'
  });

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (currentView === 'dayGridMonth') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else {
      // Week view
      const startOfWeek = start.getDate() - start.getDay();
      start.setDate(startOfWeek);
      end.setDate(startOfWeek + 6);
    }
    
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

  // Transform sessions for FullCalendar format
  const calendarEvents = useMemo(() => {
    return sessions.map(session => {
      const startDate = new Date(session.scheduledDate);
      const endDate = calculateSessionEndTime(startDate, session.duration);
      
      return {
        id: session.id,
        title: session.title,
        start: startDate,
        end: endDate,
        extendedProps: {
          session,
          memberName: session.member 
            ? `${session.member.firstName} ${session.member.lastName}`
            : `Member ID: ${session.memberId}`,
          trainerName: session.trainer 
            ? `${session.trainer.firstName} ${session.trainer.lastName}`
            : `Trainer ID: ${session.trainerId}`
        },
        backgroundColor: 'var(--fc-event-bg-color)',
        borderColor: 'var(--fc-event-border-color)',
        textColor: 'var(--fc-event-text-color)',
        classNames: [`session-${session.type}`, `status-${session.status}`]
      };
    });
  }, [sessions]);

  // Handle event clicks
  const handleEventClick = useCallback((info: EventClickArg) => {
    const session = info.event.extendedProps.session;
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  }, []);

  // Handle date selection for creating new sessions
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setCreateSlot({
      start: selectInfo.start,
      end: selectInfo.end
    });
    setIsCreateModalOpen(true);
  }, []);

  // Handle view changes
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  }, []);

  // Handle navigation
  const handleNavigation = useCallback((action: string) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      switch (action) {
        case 'prev':
          calendarApi.prev();
          break;
        case 'next':
          calendarApi.next();
          break;
        case 'today':
          calendarApi.today();
          break;
      }
      setCurrentDate(calendarApi.getDate());
    }
  }, []);

  // Custom event content renderer
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const { session, memberName, trainerName } = eventInfo.event.extendedProps;
    
    // Format start and end times
    const startTime = dateFormatters.shortTime(eventInfo.event.start);
    const endTime = dateFormatters.shortTime(eventInfo.event.end);
    
    return (
      <div className="p-1 flex flex-col gap-0.5 h-full justify-start">
        <div className="font-bold text-xs leading-tight mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{session.title}</div>
        <div className="text-[9px] font-medium leading-none opacity-85 mb-px whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">{startTime} - {endTime}</div>
        <div className="text-[10px] leading-none opacity-90 whitespace-nowrap overflow-hidden text-ellipsis">{memberName}</div>
        <div className="text-[10px] leading-none opacity-90 whitespace-nowrap overflow-hidden text-ellipsis">{trainerName}</div>
      </div>
    );
  }, []);

  return (
    <Card className={`relative w-full max-w-full overflow-hidden h-auto ${className || ''}`}>
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
        
        {/* Custom Toolbar */}
        <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-background to-muted/30 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('prev')}
                className="hover:bg-muted"
              >
                ←
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('today')}
                className="px-4 font-medium hover:bg-primary hover:text-primary-foreground"
              >
                This week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('next')}
                className="hover:bg-muted"
              >
                →
              </Button>
            </div>
            
            {/* Current date display */}
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {dateFormatters.calendarHeader(currentDate)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View selector */}
            <Select value={currentView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-32 border-0 bg-muted/50 focus:ring-1 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeGridWeek">📅 Week</SelectItem>
                <SelectItem value="dayGridMonth">🗓️ Month</SelectItem>
                <SelectItem value="timeGridDay">📍 Day</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Create session button */}
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
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
            <div className="[&_.fc-scroller::-webkit-scrollbar]:w-2 [&_.fc-scroller::-webkit-scrollbar-track]:bg-muted [&_.fc-scroller::-webkit-scrollbar-track]:rounded [&_.fc-scroller::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&_.fc-scroller::-webkit-scrollbar-thumb]:rounded [&_.fc-scroller::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50">
              <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              initialDate={currentDate}
              headerToolbar={false} // We use custom toolbar
              height="auto"
              slotMinTime="09:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="00:30:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              allDaySlot={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={calendarEvents}
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventContent={renderEventContent}
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
                startTime: '09:00',
                endTime: '22:00',
              }}
              />
            </div>
            
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