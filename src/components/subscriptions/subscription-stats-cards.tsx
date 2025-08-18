'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useSubscriptionStats } from '@/lib/hooks/use-subscriptions';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

function StatsCard({ title, value, icon, description, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionStatsCards() {
  const { stats, isLoading, error } = useSubscriptionStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Statistics</h3>
            <p className="text-muted-foreground">
              {error || 'Failed to fetch subscription statistics'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getExpiringDescription = (count: number) => {
    if (count === 0) return 'No subscriptions expiring soon';
    if (count === 1) return '1 subscription expires within 30 days';
    return `${count} subscriptions expire within 30 days`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Subscriptions"
        value={stats.totalSubscriptions}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        description={`All subscriptions in system`}
      />
      
      <StatsCard
        title="Active Subscriptions"
        value={stats.activeSubscriptions}
        icon={<Activity className="h-4 w-4 text-green-600" />}
        description={`Currently active memberships`}
      />
      
      <StatsCard
        title="Monthly Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        description="From active subscriptions"
      />
      
      <StatsCard
        title="Expiring Soon"
        value={stats.expiringSoon}
        icon={<Calendar className="h-4 w-4 text-orange-600" />}
        description={getExpiringDescription(stats.expiringSoon)}
        className={stats.expiringSoon > 0 ? 'border-orange-200' : ''}
      />

      {/* Status Distribution */}
      {Object.keys(stats.statusDistribution).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.statusDistribution).map(([status, count]) => (
                <Badge 
                  key={status}
                  variant="outline"
                  className={getStatusBadgeColor(status)}
                >
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Distribution */}
      {Object.keys(stats.planDistribution).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Popular Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.planDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([plan, count]) => (
                  <div key={plan} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{plan}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'frozen':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}