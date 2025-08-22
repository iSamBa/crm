export interface User {
  id: string;
  email: string;
  role: 'admin' | 'trainer';
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipStatus: 'active' | 'inactive' | 'frozen' | 'cancelled';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions?: string;
  fitnessGoals?: string;
  preferredTrainingTimes?: string[];
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trainer extends User {
  role: 'trainer';
  specializations: string[];
  certifications: string[];
  hourlyRate: number;
  availability: {
    [key: string]: { start: string; end: string }[];
  };
  bio?: string;
  yearsExperience?: number;
}

export interface Subscription {
  id: string;
  memberId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'frozen' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  createdAt: string;
  updatedAt: string;
  plan?: MembershipPlan;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  maxSessionsPerMonth?: number;
  includesPersonalTraining: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = MembershipPlan;

export interface Payment {
  id: string;
  memberId: string;
  subscriptionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'bank_transfer';
  transactionDate: string;
  description?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
}

export type SessionCommentData = {
  sessionId: string;
  comment: string;
  commentType: 'note' | 'progress' | 'issue' | 'goal' | 'equipment' | 'feedback' | 'reminder';
  isPrivate: boolean;
};

export interface TrainingSession {
  id: string;
  memberId: string;
  trainerId: string;
  type: 'personal' | 'group' | 'class' | 'assessment' | 'consultation' | 'rehabilitation';
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  notes?: string;
  cost?: number;
  
  // Enhanced fields for comprehensive session management
  sessionRoom?: string;
  equipmentNeeded?: string[];
  sessionGoals?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  recurringPattern?: RecurringPattern;
  createdBy?: string;
  preparationNotes?: string;
  completionSummary?: string;
  memberRating?: number; // 1-5
  trainerRating?: number; // 1-5
  createdAt: string;
  updatedAt: string;
  
  // Related data (populated when needed)
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  comments?: SessionComment[];
}

export interface SessionComment {
  id: string;
  sessionId: string;
  userId: string;
  comment: string;
  commentType: 'note' | 'progress' | 'issue' | 'goal' | 'equipment' | 'feedback' | 'reminder';
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Populated user info
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface BodyMeasurement {
  id: string;
  memberId: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  photos?: string[];
  notes?: string;
  recordedDate: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  sessionType?: 'gym' | 'class' | 'personal_training';
}

export interface TrainerAvailability {
  id: string;
  trainerId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;
  isAvailable: boolean;
  effectiveDate: string;
  endDate?: string;
}

export interface TrainerUnavailableDetails {
  trainerId: string;
  trainerName: string;
  conflictingSchedule?: {
    start: string;
    end: string;
    type: string;
  };
}

export interface MemberBookedDetails {
  memberId: string;
  memberName: string;
  conflictingSessionId: string;
  conflictingSessionTime: {
    start: string;
    end: string;
  };
}

export interface RoomOccupiedDetails {
  roomId: string;
  roomName: string;
  occupyingSessionId: string;
  timeSlot: {
    start: string;
    end: string;
  };
}

export interface EquipmentUnavailableDetails {
  equipmentIds: string[];
  equipmentNames: string[];
  unavailableReason: 'maintenance' | 'reserved' | 'broken' | 'in_use';
  expectedAvailableAt?: string;
}

export type SessionConflictDetails = 
  | TrainerUnavailableDetails
  | MemberBookedDetails
  | RoomOccupiedDetails
  | EquipmentUnavailableDetails;

export interface SessionConflict {
  id: string;
  sessionId: string;
  conflictType: 'trainer_unavailable' | 'member_booked' | 'room_occupied' | 'equipment_unavailable';
  conflictDetails: SessionConflictDetails;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}