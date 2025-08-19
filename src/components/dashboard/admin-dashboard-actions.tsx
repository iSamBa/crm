'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar
} from 'lucide-react';

// Client Component for interactive quick actions
export function AdminDashboardActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'add-member',
      title: 'Add Member',
      icon: Users,
      onClick: () => {
        router.push('/admin/members');
      },
    },
    {
      id: 'schedule-session',
      title: 'Schedule Session',
      icon: Calendar,
      onClick: () => {
        router.push('/admin/calendar');
      },
    },
    {
      id: 'process-payment',
      title: 'Manage Subscriptions',
      icon: DollarSign,
      onClick: () => {
        router.push('/admin/subscriptions');
      },
    },
    {
      id: 'view-trainers',
      title: 'Manage Trainers',
      icon: TrendingUp,
      onClick: () => {
        router.push('/admin/trainers');
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Card 
            key={action.id}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group"
            onClick={action.onClick}
          >
            <CardContent className="p-4 text-center">
              <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
              <p className="font-medium">{action.title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}