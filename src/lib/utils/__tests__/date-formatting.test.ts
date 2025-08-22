import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateSync,
  formatTimeSync,
  formatDateTimeSync,
  dateUtils,
  relativeTime,
  shortDate,
  shortTime,
  shortDateTime,
  mediumDate,
  longDate,
  fullDate,
  DateFormats,
} from '../date-formatting';

describe('Date Formatting Utils', () => {
  // Mock current date for consistent testing
  const mockDate = new Date('2024-01-15T12:30:45Z'); // Monday
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateSync', () => {
    it('should format date with custom options', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateSync(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/15/);
    });

    it('should handle string input', () => {
      const result = formatDateSync('2024-01-15T10:30:00Z');
      expect(result).toMatch(/2024/);
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDateSync('invalid-date');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatDateSync(null)).toBe('');
      expect(formatDateSync(undefined)).toBe('');
    });
  });

  describe('shortDate', () => {
    it('should format date with short format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = shortDate(date);
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/15/);
    });

    it('should handle invalid date', () => {
      const result = shortDate('invalid-date');
      expect(result).toBe('');
    });
  });

  describe('formatTimeSync', () => {
    it('should format time', () => {
      const date = new Date('2024-01-15T14:30:45Z');
      const result = formatTimeSync(date, { hour: '2-digit', minute: '2-digit' });
      expect(result).toMatch(/14:30|02:30|2:30|03:30/); // Handles different timezones and formats
    });

    it('should handle invalid time', () => {
      const result = formatTimeSync('invalid-date');
      expect(result).toBe('');
    });
  });

  describe('formatDateTimeSync', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T14:30:45Z');
      const result = formatDateTimeSync(date);
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/15/);
    });

    it('should handle invalid datetime', () => {
      const result = formatDateTimeSync('invalid-date');
      expect(result).toBe('');
    });
  });

  describe('relativeTime', () => {
    it('should format relative time from now', () => {
      const pastDate = new Date(mockDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = relativeTime.fromNowSync(pastDate);
      expect(result).toMatch(/hour|minute/);
    });

    it('should handle invalid date', () => {
      const result = relativeTime.fromNowSync('invalid-date');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(relativeTime.fromNowSync(null)).toBe('');
      expect(relativeTime.fromNowSync(undefined)).toBe('');
    });
  });

  describe('dateUtils', () => {
    it('should validate dates correctly', () => {
      expect(dateUtils.isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(dateUtils.isValidDate('2024-01-15')).toBe(true);
      expect(dateUtils.isValidDate('invalid-date')).toBe(false);
      expect(dateUtils.isValidDate(null)).toBe(false);
      expect(dateUtils.isValidDate(undefined)).toBe(false);
    });

    it('should get current date and time', () => {
      const result = dateUtils.now();
      expect(result).toMatch(/2024/);
    });

    it('should get today\'s date', () => {
      const result = dateUtils.today();
      expect(result).toMatch(/2024/);
    });

    it('should calculate days between dates', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-20');
      const result = dateUtils.daysBetween(start, end);
      expect(result).toBe(5);
    });

    it('should handle invalid dates in daysBetween', () => {
      const result = dateUtils.daysBetween('invalid', 'invalid');
      expect(result).toBe(0);
    });
  });

  describe('date format presets', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format with different presets', () => {
      expect(shortDate(testDate)).toBeTruthy();
      expect(mediumDate(testDate)).toBeTruthy();
      expect(longDate(testDate)).toBeTruthy();
      expect(fullDate(testDate)).toBeTruthy();
      expect(shortTime(testDate)).toBeTruthy();
      expect(shortDateTime(testDate)).toBeTruthy();
    });

    it('should have consistent date formats', () => {
      expect(DateFormats.SHORT_DATE).toBe('dd/MM/yyyy');
      expect(DateFormats.MEDIUM_DATE).toBe('dd MMM yyyy');
      expect(DateFormats.LONG_DATE).toBe('dd MMMM yyyy');
      expect(DateFormats.SHORT_TIME).toBe('HH:mm');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(shortDate('')).toBe('');
      expect(shortTime('')).toBe('');
      expect(shortDateTime('')).toBe('');
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      const result = shortDate(leapYearDate);
      expect(result).toMatch(/29/);
    });

    it('should handle timezone differences', () => {
      const utcDate = new Date('2024-01-15T00:00:00Z');
      const result = shortDate(utcDate);
      expect(result).toBeTruthy();
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01');
      const result = shortDate(oldDate);
      expect(result).toMatch(/1900/);
    });

    it('should handle far future dates', () => {
      const futureDate = new Date('2100-12-31');
      const result = shortDate(futureDate);
      expect(result).toMatch(/2100/);
    });
  });

  describe('performance', () => {
    it('should format dates efficiently', () => {
      const startTime = performance.now();
      const date = new Date('2024-01-15');
      
      // Format 100 dates
      for (let i = 0; i < 100; i++) {
        shortDate(date);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms for 100 operations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('browser compatibility', () => {
    it('should work with different Intl support levels', () => {
      // Test basic functionality
      const date = new Date('2024-01-15');
      expect(() => shortDate(date)).not.toThrow();
      expect(() => shortTime(date)).not.toThrow();
      expect(() => shortDateTime(date)).not.toThrow();
    });

    it('should handle missing Intl API gracefully', () => {
      // Save original Intl
      const originalIntl = global.Intl;
      
      try {
        // Mock missing Intl
        delete (global as any).Intl;
        
        const date = new Date('2024-01-15');
        // Should not throw even without Intl
        expect(() => formatDateSync(date)).not.toThrow();
      } finally {
        // Restore Intl
        global.Intl = originalIntl;
      }
    });
  });
});