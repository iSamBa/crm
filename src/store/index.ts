import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Member, Trainer, Subscription, Payment, TrainingSession } from '@/types';

interface AppState {
  members: Member[];
  trainers: Trainer[];
  subscriptions: Subscription[];
  payments: Payment[];
  sessions: TrainingSession[];
  isLoading: boolean;
  
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  removeMember: (id: string) => void;
  
  setTrainers: (trainers: Trainer[]) => void;
  addTrainer: (trainer: Trainer) => void;
  updateTrainer: (id: string, updates: Partial<Trainer>) => void;
  removeTrainer: (id: string) => void;
  
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  
  setSessions: (sessions: TrainingSession[]) => void;
  addSession: (session: TrainingSession) => void;
  updateSession: (id: string, updates: Partial<TrainingSession>) => void;
  cancelSession: (id: string) => void;
  
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  members: [],
  trainers: [],
  subscriptions: [],
  payments: [],
  sessions: [],
  isLoading: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setMembers: (members) => set({ members }),
      addMember: (member) => set((state) => ({ 
        members: [...state.members, member] 
      })),
      updateMember: (id, updates) => set((state) => ({
        members: state.members.map((member) =>
          member.id === id ? { ...member, ...updates } : member
        ),
      })),
      removeMember: (id) => set((state) => ({
        members: state.members.filter((member) => member.id !== id),
      })),
      
      setTrainers: (trainers) => set({ trainers }),
      addTrainer: (trainer) => set((state) => ({ 
        trainers: [...state.trainers, trainer] 
      })),
      updateTrainer: (id, updates) => set((state) => ({
        trainers: state.trainers.map((trainer) =>
          trainer.id === id ? { ...trainer, ...updates } : trainer
        ),
      })),
      removeTrainer: (id) => set((state) => ({
        trainers: state.trainers.filter((trainer) => trainer.id !== id),
      })),
      
      setSubscriptions: (subscriptions) => set({ subscriptions }),
      addSubscription: (subscription) => set((state) => ({ 
        subscriptions: [...state.subscriptions, subscription] 
      })),
      updateSubscription: (id, updates) => set((state) => ({
        subscriptions: state.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, ...updates } : sub
        ),
      })),
      
      setPayments: (payments) => set({ payments }),
      addPayment: (payment) => set((state) => ({ 
        payments: [...state.payments, payment] 
      })),
      
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((state) => ({ 
        sessions: [...state.sessions, session] 
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === id ? { ...session, ...updates } : session
        ),
      })),
      cancelSession: (id) => set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === id ? { ...session, status: 'cancelled' as const } : session
        ),
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set(initialState),
    }),
    {
      name: 'fitness-studio-store',
    }
  )
);