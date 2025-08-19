'use client';

import { TrainerLayout } from '@/components/layout/trainer-layout';
import { TrainerSessionsList } from '@/components/trainers/trainer-sessions-list';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent } from '@/components/ui/card';

export default function TrainerSessionsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <TrainerLayout>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Please log in to view your sessions.</p>
          </CardContent>
        </Card>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Training Sessions</h1>
          <p className="text-muted-foreground">
            View and manage all your training sessions with clients
          </p>
        </div>

        <TrainerSessionsList trainerId={user.id} />
      </div>
    </TrainerLayout>
  );
}