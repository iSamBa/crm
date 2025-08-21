/**
 * Session utility functions for calculations and transformations
 * Following the established pattern of extracting business logic into utilities
 */

/**
 * Duration constants in minutes for common session types
 */
export const SessionDurations = {
  DEFAULT: 60,
  CONSULTATION: 45,
  ASSESSMENT: 60,
  PERSONAL: 60,
  GROUP: 75,
  CLASS: 90,
  REHABILITATION: 60
} as const;

/**
 * Calculate default duration based on session type
 */
export function getDefaultDurationByType(sessionType?: string): number {
  switch (sessionType) {
    case 'consultation':
      return SessionDurations.CONSULTATION;
    case 'assessment':
      return SessionDurations.ASSESSMENT;
    case 'personal':
      return SessionDurations.PERSONAL;
    case 'group':
      return SessionDurations.GROUP;
    case 'class':
      return SessionDurations.CLASS;
    case 'rehabilitation':
      return SessionDurations.REHABILITATION;
    default:
      return SessionDurations.DEFAULT;
  }
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationBetweenDates(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate) {
    return SessionDurations.DEFAULT;
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  // Ensure minimum duration of 15 minutes
  return Math.max(durationMinutes, 15);
}

/**
 * Calculate session end time based on start time and duration
 */
export function calculateSessionEndTime(startTime: Date, durationMinutes: number): Date {
  return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDurationToString(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes} minutes`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
  const minuteText = `${minutes} minutes`;
  
  return `${hourText} ${minuteText}`;
}

/**
 * Get available duration options for session forms
 */
export function getAvailableDurationOptions(): Array<{ value: number; label: string }> {
  const durations = [15, 30, 45, 60, 75, 90, 120, 150, 180];
  
  return durations.map(duration => ({
    value: duration,
    label: formatDurationToString(duration)
  }));
}

/**
 * Validate session duration constraints
 */
export function validateSessionDuration(duration: number): { valid: boolean; error?: string } {
  if (duration < 15) {
    return { valid: false, error: 'Duration must be at least 15 minutes' };
  }
  
  if (duration > 480) { // 8 hours max
    return { valid: false, error: 'Duration cannot exceed 8 hours' };
  }
  
  return { valid: true };
}

/**
 * Calculate session slots for a given time range
 * Useful for calendar time slot generation
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 22,
  intervalMinutes: number = 30
): Array<{ value: string; label: string; hour: number; minute: number }> {
  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({
        value: timeString,
        label: timeString,
        hour,
        minute
      });
    }
  }
  
  return slots;
}

/**
 * Check if two sessions have overlapping times
 */
export function doSessionsOverlap(
  session1Start: Date,
  session1Duration: number,
  session2Start: Date,
  session2Duration: number,
  bufferMinutes: number = 0
): boolean {
  const session1End = calculateSessionEndTime(session1Start, session1Duration + bufferMinutes);
  const session2End = calculateSessionEndTime(session2Start, session2Duration + bufferMinutes);
  
  return (
    (session1Start <= session2Start && session1End > session2Start) ||
    (session2Start <= session1Start && session2End > session1Start)
  );
}

/**
 * Session utility types for better type safety
 */
export type SessionDuration = {
  minutes: number;
  formatted: string;
  valid: boolean;
  error?: string;
};

export type TimeSlot = {
  value: string;
  label: string;
  hour: number;
  minute: number;
};