'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
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
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 w-full"
              >
                <Home className="h-4 w-4" />
                Admin Dashboard
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Popular admin pages:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/admin/reports')}
                >
                  Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}