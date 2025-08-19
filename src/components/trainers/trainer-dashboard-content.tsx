'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTrainerStats } from '@/lib/hooks/use-trainer-stats';

export function TrainerDashboardContent() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useTrainerStats(user?.id || null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your training sessions and track client progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <span className="animate-pulse bg-muted h-6 w-8 rounded inline-block"></span>
              ) : (
                stats?.todaysSessions.total || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? (
                <span className="animate-pulse bg-muted h-3 w-24 rounded inline-block"></span>
              ) : (
                `${stats?.todaysSessions.completed || 0} completed, ${stats?.todaysSessions.upcoming || 0} upcoming`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <span className="animate-pulse bg-muted h-6 w-8 rounded inline-block"></span>
              ) : (
                stats?.activeClients || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <span className="animate-pulse bg-muted h-6 w-8 rounded inline-block"></span>
              ) : (
                `${stats?.hoursThisWeek || 0}h`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <span className="animate-pulse bg-muted h-6 w-8 rounded inline-block"></span>
              ) : (
                `$${stats?.earningsThisWeek || 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">9:00 AM - Personal Training</p>
                    <p className="text-sm text-muted-foreground">with Sarah Johnson</p>
                  </div>
                </div>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">10:30 AM - Personal Training</p>
                    <p className="text-sm text-muted-foreground">with Mike Davis</p>
                  </div>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">2:00 PM - Group Training</p>
                    <p className="text-sm text-muted-foreground">HIIT Class (6 people)</p>
                  </div>
                </div>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Progress Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Lost 5 lbs this month</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary">Goal Achieved</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Mike Davis</p>
                    <p className="text-sm text-muted-foreground">Increased bench press by 20 lbs</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Strength +</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Lisa Chen</p>
                    <p className="text-sm text-muted-foreground">Improved cardio endurance</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">Cardio +</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}