'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Sidebar, trainerNavItems } from './sidebar';

interface TrainerLayoutProps {
  children: React.ReactNode;
}

export function TrainerLayout({ children }: TrainerLayoutProps) {
  return (
    <ProtectedRoute requiredRole="trainer">
      <div className="flex h-screen bg-background">
        <Sidebar items={trainerNavItems} role="trainer" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}