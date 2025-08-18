'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  Activity,
  UserPlus,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useMemberStats, useRecentMemberActivities } from '@/lib/hooks/use-members-modern';

export default function MemberDashboard() {
  const { data: stats, isLoading: statsLoading } = useMemberStats();
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentMemberActivities(5);
  
  const isLoading = statsLoading || activitiesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Management</h1>
        <p className="text-muted-foreground">
          Comprehensive member management and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats && stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}% of total members
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
              From member subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Member facility usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Member Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!recentActivities || recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activities
                </p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{activity.time}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/members">
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">Add Member</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/members">
                <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                    <p className="font-medium">View All Members</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                  <p className="font-medium">Member Reports</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
                  <p className="font-medium">Analytics</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Membership Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Active</span>
                </div>
                <span className="text-sm font-medium">{stats?.activeMembers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Frozen</span>
                </div>
                <span className="text-sm font-medium">{stats ? Math.max(0, stats.totalMembers - stats.activeMembers) : 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Inactive</span>
                </div>
                <span className="text-sm font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Members</span>
                <Badge variant="secondary">{stats?.newThisMonth || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <Badge variant="destructive">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Frozen</span>
                <Badge variant="outline">0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Monthly Revenue</span>
                <span className="text-sm font-medium">$3,769</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Retention</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Check-ins</span>
                <span className="text-sm font-medium">12/month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </AdminLayout>
  );
}