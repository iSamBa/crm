'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { User } from '@/types';
import { ROUTES } from '@/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User['role'];
  allowedRoles?: User['role'][];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  fallbackPath = ROUTES.LOGIN,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        const roleBasedRedirect = getRoleBasedRedirect(user.role);
        router.push(roleBasedRedirect);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        const roleBasedRedirect = getRoleBasedRedirect(user.role);
        router.push(roleBasedRedirect);
        return;
      }
    }
  }, [user, isLoading, router, requiredRole, allowedRoles, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

function getRoleBasedRedirect(role: User['role']): string {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.DASHBOARD;
    case 'trainer':
      return ROUTES.TRAINER.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}