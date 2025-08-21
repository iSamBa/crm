import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboardStats } from '@/components/dashboard/admin-dashboard-stats';
import { AdminDashboardActivities } from '@/components/dashboard/admin-dashboard-activities';
import { AdminDashboardActions } from '@/components/dashboard/admin-dashboard-actions';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/utils/app-config';

export const metadata: Metadata = generatePageMetadata('Admin Dashboard', 'Overview of your fitness studio operations');

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your fitness studio operations
        </p>
      </div>

      <AdminDashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminDashboardActivities />

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDashboardActions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}