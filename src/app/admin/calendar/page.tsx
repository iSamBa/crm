'use client';

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

        <FullCalendarSession />
      </div>
    </AdminLayout>
  );
}