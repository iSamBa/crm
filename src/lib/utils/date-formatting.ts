/**
 * Centralized date and time formatting utilities for French locale (FR)
 * This ensures consistent date/time display throughout the application
 */

import { format, formatDistance, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// French locale configuration
const LOCALE = fr;

/**
 * Standard date format configurations for French locale
 */
export const DateFormats = {
  // Basic formats
  SHORT_DATE: 'dd/MM/yyyy', // 01/12/2024
  MEDIUM_DATE: 'dd MMM yyyy', // 01 déc. 2024
  LONG_DATE: 'dd MMMM yyyy', // 01 décembre 2024
  FULL_DATE: 'EEEE dd MMMM yyyy', // lundi 01 décembre 2024
  
  // Time formats
  SHORT_TIME: 'HH:mm', // 14:30
  MEDIUM_TIME: 'HH:mm:ss', // 14:30:15
  
  // Combined date/time formats
  SHORT_DATETIME: 'dd/MM/yyyy HH:mm', // 01/12/2024 14:30
  MEDIUM_DATETIME: 'dd MMM yyyy HH:mm', // 01 déc. 2024 14:30
  LONG_DATETIME: 'dd MMMM yyyy à HH:mm', // 01 décembre 2024 à 14:30
  FULL_DATETIME: 'EEEE dd MMMM yyyy à HH:mm', // lundi 01 décembre 2024 à 14:30
  
  // Calendar/scheduling formats
  CALENDAR_HEADER: 'MMMM yyyy', // décembre 2024
  CALENDAR_DAY: 'EEEE dd', // lundi 01
  
  // Input formats (HTML input compatibility)
  DATE_INPUT: 'yyyy-MM-dd', // 2024-12-01
  DATETIME_INPUT: "yyyy-MM-dd'T'HH:mm", // 2024-12-01T14:30
} as const;

/**
 * Safe date parser that handles various input types
 */
function safeParseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  
  try {
    // Try parsing ISO string first
    const parsed = parseISO(date);
    if (isValid(parsed)) return parsed;
    
    // Fallback to Date constructor
    const fallback = new Date(date);
    return isValid(fallback) ? fallback : null;
  } catch {
    return null;
  }
}

/**
 * Format date using French locale
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = DateFormats.SHORT_DATE): string {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    return format(parsedDate, formatStr, { locale: LOCALE });
  } catch {
    return '';
  }
}

/**
 * Common date formatting functions with French locale
 */
export const dateFormatters = {
  // Basic date formats
  shortDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_DATE),
  mediumDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_DATE),
  longDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.LONG_DATE),
  fullDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.FULL_DATE),
  
  // Time formats
  shortTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_TIME),
  mediumTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_TIME),
  
  // Combined formats
  shortDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_DATETIME),
  mediumDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_DATETIME),
  longDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.LONG_DATETIME),
  fullDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.FULL_DATETIME),
  
  // Calendar formats
  calendarHeader: (date: string | Date | null | undefined) => formatDate(date, DateFormats.CALENDAR_HEADER),
  calendarDay: (date: string | Date | null | undefined) => formatDate(date, DateFormats.CALENDAR_DAY),
  
  // Input formats (for HTML inputs)
  dateInput: (date: string | Date | null | undefined) => formatDate(date, DateFormats.DATE_INPUT),
  dateTimeInput: (date: string | Date | null | undefined) => formatDate(date, DateFormats.DATETIME_INPUT),
} as const;

/**
 * Relative time formatting with French locale
 */
export const relativeTime = {
  /**
   * Format relative time from now (e.g., "il y a 2 heures", "dans 3 jours")
   */
  fromNow: (date: string | Date | null | undefined): string => {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '';
    
    try {
      return formatDistanceToNow(parsedDate, { 
        locale: LOCALE, 
        addSuffix: true 
      });
    } catch {
      return '';
    }
  },
  
  /**
   * Format distance between two dates (e.g., "2 heures", "3 jours")
   */
  between: (dateLeft: string | Date | null | undefined, dateRight: string | Date | null | undefined): string => {
    const leftDate = safeParseDate(dateLeft);
    const rightDate = safeParseDate(dateRight);
    
    if (!leftDate || !rightDate) return '';
    
    try {
      return formatDistance(leftDate, rightDate, { locale: LOCALE });
    } catch {
      return '';
    }
  }
};

/**
 * CSV export date formatting (should remain consistent across locales)
 */
export function formatDateForCSV(date: string | Date | null | undefined): string {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  // Use ISO format for CSV to ensure consistency across different systems
  try {
    return format(parsedDate, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '';
  }
}

/**
 * Utility functions for date manipulation
 */
export const dateUtils = {
  /**
   * Check if a date is valid
   */
  isValidDate: (date: string | Date | null | undefined): boolean => {
    return safeParseDate(date) !== null;
  },
  
  /**
   * Get current date in French format
   */
  now: () => formatDate(new Date(), DateFormats.SHORT_DATETIME),
  
  /**
   * Get today's date in short format
   */
  today: () => formatDate(new Date(), DateFormats.SHORT_DATE),
  
  /**
   * Calculate days between dates
   */
  daysBetween: (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number => {
    const start = safeParseDate(startDate);
    const end = safeParseDate(endDate);
    
    if (!start || !end) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

/**
 * Legacy support - maintain backward compatibility
 * @deprecated Use dateFormatters.shortDate instead
 */
export const formatDateFR = dateFormatters.shortDate;

/**
 * @deprecated Use dateFormatters.shortDateTime instead  
 */
export const formatDateTimeFR = dateFormatters.shortDateTime;