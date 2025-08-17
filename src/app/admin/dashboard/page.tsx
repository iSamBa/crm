import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CreditCard,
  UserCheck,
  Activity
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your fitness studio operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Today&apos;s activity
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">New member registration</p>
                      <p className="text-sm text-muted-foreground">John Doe joined Premium plan</p>
                    </div>
                  </div>
                  <Badge variant="secondary">2 min ago</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Payment received</p>
                      <p className="text-sm text-muted-foreground">$89 monthly subscription</p>
                    </div>
                  </div>
                  <Badge variant="secondary">5 min ago</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Session scheduled</p>
                      <p className="text-sm text-muted-foreground">Personal training with Sarah</p>
                    </div>
                  </div>
                  <Badge variant="secondary">10 min ago</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">Add Member</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">Schedule Session</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">Process Payment</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">View Reports</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}