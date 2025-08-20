import { z } from 'zod';

// =============================================
// MEMBER SCHEMAS
// =============================================

const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  relationship: z.string().min(1, 'Relationship is required'),
});

export const CreateMemberSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  membershipStatus: z.enum(['active', 'inactive', 'frozen', 'cancelled'])
    .default('active'),
  emergencyContact: EmergencyContactSchema.optional(),
  medicalConditions: z.string()
    .max(500, 'Medical conditions must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  fitnessGoals: z.string()
    .max(500, 'Fitness goals must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  preferredTrainingTimes: z.array(z.string()).default([]),
  joinDate: z.string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')),
});

export const UpdateMemberSchema = CreateMemberSchema.partial().extend({
  id: z.string().uuid('Invalid member ID'),
});

export const MemberFiltersSchema = z.object({
  status: z.string().optional(),
  searchTerm: z.string().optional(),
  joinDateFrom: z.string().optional(),
  joinDateTo: z.string().optional(),
  hasEmergencyContact: z.boolean().optional(),
}).optional();

// =============================================
// SESSION SCHEMAS
// =============================================

export const RecurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1).max(12),
  endDate: z.string().datetime().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
});

export const CreateSessionSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  trainerId: z.string().uuid('Invalid trainer ID'),
  type: z.enum(['personal', 'group', 'class', 'consultation']),
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  scheduledDate: z.string().datetime('Invalid date format'),
  duration: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  cost: z.number()
    .min(0, 'Cost cannot be negative')
    .optional(),
  sessionRoom: z.string()
    .max(50, 'Room name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  equipmentNeeded: z.array(z.string()).default([]),
  sessionGoals: z.string()
    .max(500, 'Session goals must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  preparationNotes: z.string()
    .max(500, 'Preparation notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  recurringPattern: RecurringPatternSchema.optional(),
});

export const UpdateSessionSchema = CreateSessionSchema.partial().extend({
  id: z.string().uuid('Invalid session ID'),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  actualStartTime: z.string().datetime().optional(),
  actualEndTime: z.string().datetime().optional(),
  completionSummary: z.string()
    .max(1000, 'Completion summary must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  memberRating: z.number().min(1).max(5).optional(),
  trainerRating: z.number().min(1).max(5).optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

export const SessionFiltersSchema = z.object({
  memberId: z.string().uuid().optional(),
  trainerId: z.string().uuid().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sessionRoom: z.string().optional(),
}).optional();

export const SessionCommentSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  comment: z.string()
    .min(1, 'Comment is required')
    .max(1000, 'Comment must be less than 1000 characters'),
  commentType: z.enum(['note', 'progress', 'issue', 'goal', 'equipment', 'feedback', 'reminder']),
  isPrivate: z.boolean().default(false),
});

// =============================================
// SUBSCRIPTION SCHEMAS
// =============================================

export const CreateSubscriptionSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  planId: z.string().uuid('Invalid plan ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  autoRenew: z.boolean().default(false),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price cannot exceed $10,000'),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const UpdateSubscriptionSchema = z.object({
  id: z.string().uuid('Invalid subscription ID'),
  status: z.enum(['active', 'cancelled', 'frozen', 'expired']).optional(),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional(),
  price: z.number().min(0).max(10000).optional(),
});

export const SubscriptionFiltersSchema = z.object({
  status: z.string().optional(),
  memberId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  searchTerm: z.string().optional(),
}).optional();

// =============================================
// SUBSCRIPTION PLAN SCHEMAS
// =============================================

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string()
    .min(1, 'Plan name is required')
    .max(100, 'Plan name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price cannot exceed $10,000'),
  duration: z.enum(['monthly', 'quarterly', 'annual']),
  features: z.array(z.string().min(1, 'Feature cannot be empty'))
    .min(1, 'At least one feature is required')
    .max(20, 'Maximum 20 features allowed'),
  maxSessionsPerMonth: z.number()
    .min(0, 'Sessions cannot be negative')
    .max(100, 'Maximum 100 sessions per month')
    .optional(),
  includesPersonalTraining: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateSubscriptionPlanSchema = CreateSubscriptionPlanSchema.partial().extend({
  id: z.string().uuid('Invalid plan ID'),
});

export const SubscriptionPlanFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  duration: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  includesPersonalTraining: z.boolean().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'duration', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
}).optional();

// =============================================
// USER PROFILE SCHEMAS  
// =============================================

export const UpdateUserProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  phone: z.string()
    .regex(/^[\+]?[(]?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal(''))
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  sessionReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.string().default('en'),
  timezone: z.string().default('America/New_York')
});

// =============================================
// TRAINER SCHEMAS
// =============================================


// =============================================
// COMMON VALIDATION HELPERS
// =============================================

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// =============================================
// TYPE EXPORTS
// =============================================

export type CreateMemberData = z.infer<typeof CreateMemberSchema>;
export type UpdateMemberData = z.infer<typeof UpdateMemberSchema>;
export type MemberFilters = z.infer<typeof MemberFiltersSchema>;

export type CreateSessionData = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionData = z.infer<typeof UpdateSessionSchema>;
export type SessionFilters = z.infer<typeof SessionFiltersSchema>;
export type SessionCommentData = z.infer<typeof SessionCommentSchema>;

export type CreateSubscriptionData = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionData = z.infer<typeof UpdateSubscriptionSchema>;
export type SubscriptionFilters = z.infer<typeof SubscriptionFiltersSchema>;

export type CreateSubscriptionPlanData = z.infer<typeof CreateSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanData = z.infer<typeof UpdateSubscriptionPlanSchema>;
export type SubscriptionPlanFilters = z.infer<typeof SubscriptionPlanFiltersSchema>;

export type TrainerAvailabilityData = z.infer<typeof TrainerAvailabilitySchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;

// =============================================
// VALIDATION HELPERS
// =============================================

export const validateMemberData = (data: unknown) => CreateMemberSchema.parse(data);
export const validateSessionData = (data: unknown) => CreateSessionSchema.parse(data);
export const validateSubscriptionData = (data: unknown) => CreateSubscriptionSchema.parse(data);
export const validateSubscriptionPlanData = (data: unknown) => CreateSubscriptionPlanSchema.parse(data);

// Safe parsing with error handling
// ============================
// TRAINER SCHEMAS
// ============================

export const TrainerAvailabilitySlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
});

export const TrainerAvailabilitySchema = z.record(
  z.string(), 
  z.array(TrainerAvailabilitySlotSchema)
).optional();

export const CreateTrainerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  phone: z.string()
    .regex(/^[\+]?[(]?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  specializations: z.array(z.string().min(1, 'Specialization cannot be empty'))
    .min(1, 'At least one specialization is required')
    .max(10, 'Maximum 10 specializations allowed'),
  certifications: z.array(z.string().min(1, 'Certification cannot be empty'))
    .max(15, 'Maximum 15 certifications allowed')
    .optional()
    .default([]),
  hourlyRate: z.number()
    .min(0, 'Hourly rate cannot be negative')
    .max(1000, 'Hourly rate seems too high')
    .optional()
    .default(50),
  availability: TrainerAvailabilitySchema.optional().default({}),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

export const UpdateTrainerSchema = z.object({
  id: z.string().uuid('Invalid trainer ID'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  phone: z.string()
    .regex(/^[\+]?[(]?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  specializations: z.array(z.string().min(1, 'Specialization cannot be empty'))
    .min(1, 'At least one specialization is required')
    .max(10, 'Maximum 10 specializations allowed')
    .optional(),
  certifications: z.array(z.string().min(1, 'Certification cannot be empty'))
    .max(15, 'Maximum 15 certifications allowed')
    .optional(),
  hourlyRate: z.number()
    .min(0, 'Hourly rate cannot be negative')
    .max(1000, 'Hourly rate seems too high')
    .optional(),
  availability: TrainerAvailabilitySchema.optional()
});

export const TrainerFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean().optional(),
  hourlyRateMin: z.number().min(0).optional(),
  hourlyRateMax: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'email', 'hourlyRate', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
}).optional();

// Export types
export type CreateTrainerData = z.infer<typeof CreateTrainerSchema>;
export type UpdateTrainerData = z.infer<typeof UpdateTrainerSchema>;
export type TrainerFilters = z.infer<typeof TrainerFiltersSchema>;

export type UpdateUserProfileData = z.infer<typeof UpdateUserProfileSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type UserPreferencesData = z.infer<typeof UserPreferencesSchema>;

export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return { success: false, errors };
  }
  return { success: true, data: result.data };
};