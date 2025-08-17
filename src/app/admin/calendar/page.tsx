'use client';

import { SessionCalendar } from '@/components/calendar/session-calendar';
import { FullCalendarSession } from '@/components/calendar/fullcalendar-session';
import { AdminLayout } from '@/components/layout/admin-layout';

export default function AdminCalendarPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Training Schedule</h1>
          <p className="text-muted-foreground">
            Manage training sessions, view schedules, and coordinate member-trainer appointments.
          </p>
        </div>

        <div className="relative space-y-6">
          {/* New FullCalendar Implementation */}
          <FullCalendarSession />
          
          {/* Original react-big-calendar (for comparison) */}
          <details className="mt-8">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-4">
              Show Original Calendar (react-big-calendar)
            </summary>
            <SessionCalendar />
          </details>
        </div>
      </div>
    </AdminLayout>
  );
}