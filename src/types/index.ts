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
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  isActive: boolean;
}

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
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    occurrences?: number;
  };
  createdBy?: string;
  preparationNotes?: string;
  completionSummary?: string;
  memberRating?: number; // 1-5
  trainerRating?: number; // 1-5
  createdAt: string;
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