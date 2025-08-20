'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';

interface TrainerLayoutProps {
  children: React.ReactNode;
}

export function TrainerLayout({ children }: TrainerLayoutProps) {
  return (
    <ProtectedRoute requiredRole="trainer">
      {children}
    </ProtectedRoute>
  );
}