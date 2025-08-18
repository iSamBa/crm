export const USER_ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FROZEN: 'frozen',
  CANCELLED: 'cancelled',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  FROZEN: 'frozen',
  EXPIRED: 'expired',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const;

export const SESSION_TYPES = {
  PERSONAL: 'personal',
  GROUP: 'group',
  CLASS: 'class',
  ASSESSMENT: 'assessment',
  CONSULTATION: 'consultation',
  REHABILITATION: 'rehabilitation',
} as const;

export const PAYMENT_METHODS = {
  CARD: 'card',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const MEMBERSHIP_PLANS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip',
} as const;

export const DURATION_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
} as const;

export const COMMENT_TYPES = {
  NOTE: 'note',
  PROGRESS: 'progress',
  ISSUE: 'issue',
  GOAL: 'goal',
  EQUIPMENT: 'equipment',
  FEEDBACK: 'feedback',
  REMINDER: 'reminder',
} as const;

export const RECURRING_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const;

export const CONFLICT_TYPES = {
  TRAINER_UNAVAILABLE: 'trainer_unavailable',
  MEMBER_BOOKED: 'member_booked',
  ROOM_OCCUPIED: 'room_occupied',
  EQUIPMENT_UNAVAILABLE: 'equipment_unavailable',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    MEMBERS: '/admin/members',
    SUBSCRIPTIONS: '/admin/subscriptions',
    PAYMENTS: '/admin/payments',
    TRAINERS: '/admin/trainers',
    REPORTS: '/admin/reports',
    CALENDAR: '/admin/calendar',
  },
  TRAINER: {
    DASHBOARD: '/trainer/dashboard',
    SCHEDULE: '/trainer/schedule',
    CLIENTS: '/trainer/clients',
    SESSIONS: '/trainer/sessions',
    PROGRESS: '/trainer/progress',
  },
} as const;