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
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const SESSION_TYPES = {
  PERSONAL: 'personal',
  GROUP: 'group',
  CLASS: 'class',
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
  },
  TRAINER: {
    DASHBOARD: '/trainer/dashboard',
    SCHEDULE: '/trainer/schedule',
    CLIENTS: '/trainer/clients',
    SESSIONS: '/trainer/sessions',
    PROGRESS: '/trainer/progress',
  },
} as const;