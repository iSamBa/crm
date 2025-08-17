'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types';
import { userService } from '@/lib/services/user-service';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (role: User['role']) => boolean;
  isAdmin: boolean;
  isTrainer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await userService.getUserById(supabaseUser.id);

      if (error && error === 'User not found') {
        console.warn('AuthContext: User authenticated but no profile found. Signing out stale session.');
        // Sign out the user since they don't have a valid profile
        await supabase.auth.signOut();
        return null;
      }

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.error('AuthContext: No user profile found for ID:', supabaseUser.id);
        // Also sign out in this case
        await supabase.auth.signOut();
        return null;
      }

      return data;
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: Session error:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('AuthContext: Found existing session for:', session.user.email);
          setSupabaseUser(session.user);
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else {
          console.log('AuthContext: No existing session found');
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        // Clear any corrupted auth state
        await supabase.auth.signOut();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSupabaseUser(session.user);
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: User['role']) => {
    return user?.role === role;
  };

  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer';

  const value = {
    user,
    supabaseUser,
    isLoading,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isTrainer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}