'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, Users, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { appConfig } from '@/lib/utils/app-config';

export default function RootNotFound() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to their appropriate dashboard
  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'trainer') return '/trainer/dashboard';
    return '/auth/login';
  };

  const getDashboardLabel = () => {
    if (user?.role === 'admin') return 'Admin Dashboard';
    if (user?.role === 'trainer') return 'Trainer Dashboard';
    return 'Login';
  };

  const getDashboardIcon = () => {
    if (user?.role === 'admin') return Users;
    if (user?.role === 'trainer') return UserCheck;
    return Home;
  };

  const DashboardIcon = getDashboardIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          
          <div className="pt-4">
            <Button 
              onClick={() => router.push(getDashboardPath())}
              className="flex items-center gap-2 w-full"
            >
              <DashboardIcon className="h-4 w-4" />
              {getDashboardLabel()}
            </Button>
          </div>
          
          {user && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Quick links for {user.role}s:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {user.role === 'admin' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/admin/members')}
                    >
                      Members
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/admin/trainers')}
                    >
                      Trainers
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/admin/calendar')}
                    >
                      Calendar
                    </Button>
                  </>
                )}
                {user.role === 'trainer' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/trainer/clients')}
                    >
                      My Clients
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/trainer/schedule')}
                    >
                      Schedule
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/trainer/sessions')}
                    >
                      Sessions
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {appConfig.name} • Error 404
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}