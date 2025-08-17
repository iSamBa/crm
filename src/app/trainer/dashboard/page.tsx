import { TrainerLayout } from '@/components/layout/trainer-layout';
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

export default function TrainerDashboard() {
  return (
    <TrainerLayout>
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
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                3 completed, 5 upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                80% of target (40h)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,280</div>
              <p className="text-xs text-muted-foreground">
                +15% from last week
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
    </TrainerLayout>
  );
}