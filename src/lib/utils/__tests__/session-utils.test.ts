import { describe, it, expect } from 'vitest';

// Simple utility functions for session management
export const sessionUtils = {
  /**
   * Calculate session end time
   */
  getSessionEndTime: (startTime: string, durationMinutes: number): string => {
    try {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) {
        return '';
      }
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      return end.toISOString();
    } catch {
      return '';
    }
  },

  /**
   * Check if sessions overlap
   */
  doSessionsOverlap: (
    session1Start: string,
    session1Duration: number,
    session2Start: string,
    session2Duration: number
  ): boolean => {
    const s1Start = new Date(session1Start).getTime();
    const s1End = s1Start + session1Duration * 60 * 1000;
    const s2Start = new Date(session2Start).getTime();
    const s2End = s2Start + session2Duration * 60 * 1000;

    return s1Start < s2End && s2Start < s1End;
  },

  /**
   * Format session duration
   */
  formatDuration: (minutes: number): string => {
    if (minutes < 0) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  },

  /**
   * Calculate session status based on dates
   */
  getSessionStatus: (scheduledDate: string): 'upcoming' | 'in-progress' | 'completed' => {
    try {
      const now = new Date();
      const sessionDate = new Date(scheduledDate);
      
      if (isNaN(sessionDate.getTime())) {
        return 'completed'; // Default for invalid dates
      }
      
      const sessionEnd = new Date(sessionDate.getTime() + 60 * 60 * 1000); // Assume 1 hour default

      if (now < sessionDate) {
        return 'upcoming';
      } else if (now >= sessionDate && now <= sessionEnd) {
        return 'in-progress';
      } else {
        return 'completed';
      }
    } catch {
      return 'completed'; // Default for errors
    }
  },

  /**
   * Generate time slots for a day
   */
  generateTimeSlots: (startHour: number = 9, endHour: number = 21, intervalMinutes: number = 30): string[] => {
    const slots: string[] = [];
    
    if (intervalMinutes <= 0 || startHour >= endHour) {
      return slots;
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  }
};

describe('Session Utils', () => {
  describe('getSessionEndTime', () => {
    it('should calculate correct end time', () => {
      const startTime = '2024-01-15T10:00:00Z';
      const duration = 60; // 60 minutes
      
      const endTime = sessionUtils.getSessionEndTime(startTime, duration);
      
      expect(endTime).toBe('2024-01-15T11:00:00.000Z');
    });

    it('should handle 30-minute sessions', () => {
      const startTime = '2024-01-15T14:30:00Z';
      const duration = 30;
      
      const endTime = sessionUtils.getSessionEndTime(startTime, duration);
      
      expect(endTime).toBe('2024-01-15T15:00:00.000Z');
    });

    it('should handle sessions spanning midnight', () => {
      const startTime = '2024-01-15T23:30:00Z';
      const duration = 60;
      
      const endTime = sessionUtils.getSessionEndTime(startTime, duration);
      
      expect(endTime).toBe('2024-01-16T00:30:00.000Z');
    });
  });

  describe('doSessionsOverlap', () => {
    it('should detect overlapping sessions', () => {
      const session1Start = '2024-01-15T10:00:00Z';
      const session1Duration = 60; // 10:00-11:00
      const session2Start = '2024-01-15T10:30:00Z';
      const session2Duration = 60; // 10:30-11:30
      
      const overlap = sessionUtils.doSessionsOverlap(
        session1Start, session1Duration,
        session2Start, session2Duration
      );
      
      expect(overlap).toBe(true);
    });

    it('should detect non-overlapping sessions', () => {
      const session1Start = '2024-01-15T10:00:00Z';
      const session1Duration = 60; // 10:00-11:00
      const session2Start = '2024-01-15T11:00:00Z';
      const session2Duration = 60; // 11:00-12:00
      
      const overlap = sessionUtils.doSessionsOverlap(
        session1Start, session1Duration,
        session2Start, session2Duration
      );
      
      expect(overlap).toBe(false);
    });

    it('should handle sessions with different durations', () => {
      const session1Start = '2024-01-15T10:00:00Z';
      const session1Duration = 90; // 10:00-11:30
      const session2Start = '2024-01-15T11:00:00Z';
      const session2Duration = 30; // 11:00-11:30
      
      const overlap = sessionUtils.doSessionsOverlap(
        session1Start, session1Duration,
        session2Start, session2Duration
      );
      
      expect(overlap).toBe(true);
    });

    it('should handle edge case - sessions touching but not overlapping', () => {
      const session1Start = '2024-01-15T10:00:00Z';
      const session1Duration = 60; // 10:00-11:00
      const session2Start = '2024-01-15T11:00:00Z';
      const session2Duration = 60; // 11:00-12:00
      
      const overlap = sessionUtils.doSessionsOverlap(
        session1Start, session1Duration,
        session2Start, session2Duration
      );
      
      expect(overlap).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(sessionUtils.formatDuration(30)).toBe('30min');
      expect(sessionUtils.formatDuration(45)).toBe('45min');
    });

    it('should format hours only', () => {
      expect(sessionUtils.formatDuration(60)).toBe('1h');
      expect(sessionUtils.formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(sessionUtils.formatDuration(90)).toBe('1h 30min');
      expect(sessionUtils.formatDuration(150)).toBe('2h 30min');
    });

    it('should handle zero duration', () => {
      expect(sessionUtils.formatDuration(0)).toBe('0min');
    });
  });

  describe('getSessionStatus', () => {
    it('should return upcoming for future sessions', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
      
      const status = sessionUtils.getSessionStatus(futureDate);
      
      expect(status).toBe('upcoming');
    });

    it('should return completed for past sessions', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
      
      const status = sessionUtils.getSessionStatus(pastDate);
      
      expect(status).toBe('completed');
    });

    it('should handle edge cases around current time', () => {
      const now = new Date().toISOString();
      
      // This test might be flaky depending on exact timing, but should generally work
      const status = sessionUtils.getSessionStatus(now);
      
      expect(['upcoming', 'in-progress']).toContain(status);
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate default time slots (9 AM to 9 PM, 30-min intervals)', () => {
      const slots = sessionUtils.generateTimeSlots();
      
      expect(slots).toContain('09:00');
      expect(slots).toContain('09:30');
      expect(slots).toContain('12:00');
      expect(slots).toContain('18:30');
      expect(slots).not.toContain('21:00'); // Should not include end hour
      expect(slots.length).toBe(24); // 12 hours * 2 slots per hour
    });

    it('should generate custom time slots', () => {
      const slots = sessionUtils.generateTimeSlots(10, 16, 60); // 10 AM to 4 PM, 1-hour intervals
      
      expect(slots).toEqual(['10:00', '11:00', '12:00', '13:00', '14:00', '15:00']);
    });

    it('should handle 15-minute intervals', () => {
      const slots = sessionUtils.generateTimeSlots(9, 10, 15); // 9-10 AM, 15-min intervals
      
      expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45']);
    });

    it('should handle single hour range', () => {
      const slots = sessionUtils.generateTimeSlots(9, 10, 30); // 9-10 AM, 30-min intervals
      
      expect(slots).toEqual(['09:00', '09:30']);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid dates gracefully', () => {
      expect(sessionUtils.getSessionEndTime('invalid-date', 60)).toBe('');
      expect(sessionUtils.getSessionStatus('invalid-date')).toBe('completed');
    });

    it('should handle negative durations', () => {
      expect(sessionUtils.formatDuration(-30)).toBe('-30min');
    });

    it('should handle very large durations', () => {
      const largeDuration = 1440; // 24 hours
      expect(sessionUtils.formatDuration(largeDuration)).toBe('24h');
    });

    it('should handle invalid time slot parameters', () => {
      // End hour before start hour
      const slots = sessionUtils.generateTimeSlots(15, 10, 30);
      expect(slots).toEqual([]);
    });

    it('should handle zero interval', () => {
      // This would create infinite loop, but should return empty array
      expect(sessionUtils.generateTimeSlots(9, 10, 0)).toEqual([]);
    });
  });
});