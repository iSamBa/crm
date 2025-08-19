import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar,
  UserCheck
} from 'lucide-react';

// Server Component for static activity feed
export function AdminDashboardActivities() {
  // In a real app, you could fetch recent activities on the server
  const activities = [
    {
      id: '1',
      type: 'member_registration',
      title: 'New member registration',
      description: 'John Doe joined Premium plan',
      icon: UserCheck,
      iconColor: 'text-primary',
      time: '2 min ago',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment received',
      description: '$89 monthly subscription',
      icon: DollarSign,
      iconColor: 'text-blue-500',
      time: '5 min ago',
    },
    {
      id: '3',
      type: 'session',
      title: 'Session scheduled',
      description: 'Personal training with Sarah',
      icon: Calendar,
      iconColor: 'text-purple-500',
      time: '10 min ago',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-5 w-5 ${activity.iconColor}`} />
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{activity.time}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}