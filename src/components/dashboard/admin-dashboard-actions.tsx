'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar
} from 'lucide-react';

// Client Component for interactive quick actions
export function AdminDashboardActions() {
  const actions = [
    {
      id: 'add-member',
      title: 'Add Member',
      icon: Users,
      onClick: () => {
        // Navigate to add member page
        window.location.href = '/admin/members';
      },
    },
    {
      id: 'schedule-session',
      title: 'Schedule Session',
      icon: Calendar,
      onClick: () => {
        // Navigate to calendar
        window.location.href = '/admin/calendar';
      },
    },
    {
      id: 'process-payment',
      title: 'Process Payment',
      icon: DollarSign,
      onClick: () => {
        // Navigate to subscriptions
        window.location.href = '/admin/subscriptions';
      },
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      icon: TrendingUp,
      onClick: () => {
        // Navigate to reports (future feature)
        console.log('Reports feature coming soon');
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