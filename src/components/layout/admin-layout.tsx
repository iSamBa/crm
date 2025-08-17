'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Sidebar, adminNavItems } from './sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-background">
        <Sidebar items={adminNavItems} role="admin" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}