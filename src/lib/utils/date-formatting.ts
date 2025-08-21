/**
 * Centralized date and time formatting utilities using browser locale
 * This ensures consistent date/time display throughout the application
 */

import { format, formatDistance, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// Get browser locale for date-fns (fallback to English if not available)
function getBrowserLocale() {
  if (typeof window === 'undefined') return undefined;
  
  const browserLocale = window.navigator.language;
  
  // Import the appropriate locale dynamically based on browser language
  try {
    switch (browserLocale.split('-')[0]) {
      case 'fr':
        return import('date-fns/locale/fr').then(m => m.fr);
      case 'es':
        return import('date-fns/locale/es').then(m => m.es);
      case 'de':
        return import('date-fns/locale/de').then(m => m.de);
      case 'it':
        return import('date-fns/locale/it').then(m => m.it);
      case 'pt':
        return import('date-fns/locale/pt').then(m => m.pt);
      case 'nl':
        return import('date-fns/locale/nl').then(m => m.nl);
      case 'ru':
        return import('date-fns/locale/ru').then(m => m.ru);
      case 'zh':
        return import('date-fns/locale/zh-CN').then(m => m.zhCN);
      case 'ja':
        return import('date-fns/locale/ja').then(m => m.ja);
      case 'ko':
        return import('date-fns/locale/ko').then(m => m.ko);
      case 'ar':
        return import('date-fns/locale/ar').then(m => m.ar);
      default:
        return Promise.resolve(undefined); // Use default English locale
    }
  } catch {
    return Promise.resolve(undefined);
  }
}

// Browser locale configuration (async)
let LOCALE_CACHE: any = undefined;
let LOCALE_PROMISE: Promise<any> | null = null;

async function getLocale() {
  if (LOCALE_CACHE !== undefined) return LOCALE_CACHE;
  
  if (!LOCALE_PROMISE) {
    LOCALE_PROMISE = getBrowserLocale() || Promise.resolve(undefined);
  }
  
  LOCALE_CACHE = await LOCALE_PROMISE;
  return LOCALE_CACHE;
}

/**
 * Standard date format configurations (locale-agnostic patterns)
 */
export const DateFormats = {
  // Basic formats
  SHORT_DATE: 'dd/MM/yyyy', // 01/12/2024 (will adapt to locale)
  MEDIUM_DATE: 'dd MMM yyyy', // 01 Dec 2024 (will use locale month names)
  LONG_DATE: 'dd MMMM yyyy', // 01 December 2024 (will use locale month names)
  FULL_DATE: 'EEEE dd MMMM yyyy', // Monday 01 December 2024 (will use locale day/month names)
  
  // Time formats (universal)
  SHORT_TIME: 'HH:mm', // 14:30
  MEDIUM_TIME: 'HH:mm:ss', // 14:30:15
  
  // Combined date/time formats
  SHORT_DATETIME: 'dd/MM/yyyy HH:mm', // 01/12/2024 14:30
  MEDIUM_DATETIME: 'dd MMM yyyy HH:mm', // 01 Dec 2024 14:30
  LONG_DATETIME: 'dd MMMM yyyy HH:mm', // 01 December 2024 14:30 (removed "à" for locale compatibility)
  FULL_DATETIME: 'EEEE dd MMMM yyyy HH:mm', // Monday 01 December 2024 14:30
  
  // Calendar/scheduling formats
  CALENDAR_HEADER: 'MMMM yyyy', // December 2024 (will use locale month names)
  CALENDAR_DAY: 'EEEE dd', // Monday 01 (will use locale day names)
  
  // Input formats (HTML input compatibility - ISO standard)
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
 * Format date using browser locale
 */
export async function formatDate(date: string | Date | null | undefined, formatStr: string = DateFormats.SHORT_DATE): Promise<string> {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    const locale = await getLocale();
    return format(parsedDate, formatStr, { locale });
  } catch {
    return '';
  }
}

/**
 * Synchronous fallback using native browser formatting
 */
export function formatDateSync(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    // Use browser's native locale
    return parsedDate.toLocaleDateString(undefined, options);
  } catch {
    return '';
  }
}

/**
 * Synchronous time formatting using native browser formatting
 */
export function formatTimeSync(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    // Use browser's native locale
    return parsedDate.toLocaleTimeString(undefined, options);
  } catch {
    return '';
  }
}

/**
 * Synchronous date-time formatting using native browser formatting
 */
export function formatDateTimeSync(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return '';
  
  try {
    // Use browser's native locale with both date and time
    return parsedDate.toLocaleString(undefined, options);
  } catch {
    return '';
  }
}

/**
 * Common date formatting functions using browser locale
 * Provides both async (date-fns with locale) and sync (native Intl) options
 */
export const dateFormatters = {
  // Async formatters (date-fns with locale support)
  async: {
    shortDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_DATE),
    mediumDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_DATE),
    longDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.LONG_DATE),
    fullDate: (date: string | Date | null | undefined) => formatDate(date, DateFormats.FULL_DATE),
    
    shortTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_TIME),
    mediumTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_TIME),
    
    shortDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.SHORT_DATETIME),
    mediumDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.MEDIUM_DATETIME),
    longDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.LONG_DATETIME),
    fullDateTime: (date: string | Date | null | undefined) => formatDate(date, DateFormats.FULL_DATETIME),
    
    calendarHeader: (date: string | Date | null | undefined) => formatDate(date, DateFormats.CALENDAR_HEADER),
    calendarDay: (date: string | Date | null | undefined) => formatDate(date, DateFormats.CALENDAR_DAY),
    
    dateInput: (date: string | Date | null | undefined) => formatDate(date, DateFormats.DATE_INPUT),
    dateTimeInput: (date: string | Date | null | undefined) => formatDate(date, DateFormats.DATETIME_INPUT),
  },
  
  // Sync formatters (native Intl API - recommended for most use cases)
  sync: {
    shortDate: (date: string | Date | null | undefined) => 
      formatDateSync(date, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    mediumDate: (date: string | Date | null | undefined) => 
      formatDateSync(date, { year: 'numeric', month: 'short', day: '2-digit' }),
    longDate: (date: string | Date | null | undefined) => 
      formatDateSync(date, { year: 'numeric', month: 'long', day: '2-digit' }),
    fullDate: (date: string | Date | null | undefined) => 
      formatDateSync(date, { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' }),
    
    shortTime: (date: string | Date | null | undefined) => 
      formatTimeSync(date, { hour: '2-digit', minute: '2-digit', hour12: false }),
    mediumTime: (date: string | Date | null | undefined) => 
      formatTimeSync(date, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    
    shortDateTime: (date: string | Date | null | undefined) => 
      formatDateTimeSync(date, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
    mediumDateTime: (date: string | Date | null | undefined) => 
      formatDateTimeSync(date, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
    longDateTime: (date: string | Date | null | undefined) => 
      formatDateTimeSync(date, { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
    fullDateTime: (date: string | Date | null | undefined) => 
      formatDateTimeSync(date, { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
    
    calendarHeader: (date: string | Date | null | undefined) => 
      formatDateSync(date, { year: 'numeric', month: 'long' }),
    calendarDay: (date: string | Date | null | undefined) => 
      formatDateSync(date, { weekday: 'long', day: '2-digit' }),
    
    // Input formats remain ISO for compatibility
    dateInput: (date: string | Date | null | undefined) => {
      const parsedDate = safeParseDate(date);
      if (!parsedDate) return '';
      try {
        return format(parsedDate, DateFormats.DATE_INPUT);
      } catch {
        return '';
      }
    },
    dateTimeInput: (date: string | Date | null | undefined) => {
      const parsedDate = safeParseDate(date);
      if (!parsedDate) return '';
      try {
        return format(parsedDate, DateFormats.DATETIME_INPUT);
      } catch {
        return '';
      }
    },
  }
} as const;

// Default to sync formatters for backward compatibility and better performance
export const {
  shortDate,
  mediumDate,
  longDate,
  fullDate,
  shortTime,
  mediumTime,
  shortDateTime,
  mediumDateTime,
  longDateTime,
  fullDateTime,
  calendarHeader,
  calendarDay,
  dateInput,
  dateTimeInput,
} = dateFormatters.sync;

/**
 * Relative time formatting using browser locale
 */
export const relativeTime = {
  /**
   * Async format relative time from now using date-fns with locale
   */
  async fromNow(date: string | Date | null | undefined): Promise<string> {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '';
    
    try {
      const locale = await getLocale();
      return formatDistanceToNow(parsedDate, { 
        locale, 
        addSuffix: true 
      });
    } catch {
      return '';
    }
  },
  
  /**
   * Async format distance between two dates using date-fns with locale
   */
  async between(dateLeft: string | Date | null | undefined, dateRight: string | Date | null | undefined): Promise<string> {
    const leftDate = safeParseDate(dateLeft);
    const rightDate = safeParseDate(dateRight);
    
    if (!leftDate || !rightDate) return '';
    
    try {
      const locale = await getLocale();
      return formatDistance(leftDate, rightDate, { locale });
    } catch {
      return '';
    }
  },

  /**
   * Sync format relative time from now using native Intl.RelativeTimeFormat
   */
  fromNowSync: (date: string | Date | null | undefined): string => {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) return '';
    
    try {
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      const diffInMs = parsedDate.getTime() - Date.now();
      
      // Convert to appropriate unit
      const diffInMinutes = Math.round(diffInMs / (1000 * 60));
      const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
      const diffInMonths = Math.round(diffInMs / (1000 * 60 * 60 * 24 * 30));
      const diffInYears = Math.round(diffInMs / (1000 * 60 * 60 * 24 * 365));
      
      if (Math.abs(diffInYears) >= 1) {
        return rtf.format(diffInYears, 'year');
      } else if (Math.abs(diffInMonths) >= 1) {
        return rtf.format(diffInMonths, 'month');
      } else if (Math.abs(diffInDays) >= 1) {
        return rtf.format(diffInDays, 'day');
      } else if (Math.abs(diffInHours) >= 1) {
        return rtf.format(diffInHours, 'hour');
      } else {
        return rtf.format(diffInMinutes, 'minute');
      }
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
   * Get current date and time in browser locale
   */
  now: () => shortDateTime(new Date()),
  
  /**
   * Get today's date in browser locale
   */
  today: () => shortDate(new Date()),
  
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
 * @deprecated Use shortDate instead
 */
export const formatDateFR = shortDate;

/**
 * @deprecated Use shortDateTime instead  
 */
export const formatDateTimeFR = shortDateTime;