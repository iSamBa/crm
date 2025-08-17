'use client';

import { SessionCalendar } from '@/components/calendar/session-calendar';

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training Schedule</h1>
        <p className="text-muted-foreground">
          Manage training sessions, view schedules, and coordinate member-trainer appointments.
        </p>
      </div>

      <SessionCalendar />
    </div>
  );
}