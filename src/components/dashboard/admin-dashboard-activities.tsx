'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useRecentActivities } from '@/lib/hooks/use-dashboard-stats';
import { Activity } from '@/types';


// Client Component for real-time activity feed
export function AdminDashboardActivities() {
  const { activities, isLoading, error } = useRecentActivities(5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined':
        return { icon: UserCheck, color: 'text-primary' };
      case 'session_scheduled':
        return { icon: Calendar, color: 'text-purple-500' };
      case 'payment':
        return { icon: DollarSign, color: 'text-blue-500' };
      default:
        return { icon: UserCheck, color: 'text-muted-foreground' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading activities...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Error loading activities</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: Activity, index: number) => {
              const { icon: IconComponent, color } = getActivityIcon(String(activity.type));
              return (
                <div key={`${String(activity.type)}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${color}`} />
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
        )}
      </CardContent>
    </Card>
  );
}