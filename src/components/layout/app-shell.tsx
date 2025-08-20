'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar, adminNavItems, trainerNavItems } from './sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Don't show sidebar for login page or public pages
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
  
  // Don't show sidebar if not authenticated or still loading
  if (isLoading || !user || isPublicPage) {
    return <>{children}</>;
  }

  // Determine role and navigation items
  const isAdminRoute = pathname.startsWith('/admin');
  const isTrainerRoute = pathname.startsWith('/trainer');
  
  let role: 'admin' | 'trainer' | null = null;
  let navItems = [];

  if (isAdminRoute && user?.role === 'admin') {
    role = 'admin';
    navItems = adminNavItems;
  } else if (isTrainerRoute && user?.role === 'trainer') {
    role = 'trainer';
    navItems = trainerNavItems;
  }

  // If no role matches or user doesn't have permission, render without sidebar
  if (!role) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={navItems} role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}