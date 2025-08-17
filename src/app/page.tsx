'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/constants';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(ROUTES.LOGIN);
      } else {
        switch (user.role) {
          case 'admin':
            router.push(ROUTES.ADMIN.DASHBOARD);
            break;
          case 'trainer':
            router.push(ROUTES.TRAINER.DASHBOARD);
            break;
          default:
            router.push(ROUTES.LOGIN);
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
