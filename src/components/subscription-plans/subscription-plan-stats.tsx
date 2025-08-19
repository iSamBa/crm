'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptionPlanStats } from '@/lib/hooks/use-subscription-plans';
import { Package, CheckCircle, XCircle, Users, DollarSign, TrendingUp } from 'lucide-react';

export function SubscriptionPlanStats() {
  const { data: stats, isLoading } = useSubscriptionPlanStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Total Plans',
      value: stats?.totalPlans || 0,
      icon: Package,
      description: 'Available subscription plans',
    },
    {
      title: 'Active Plans',
      value: stats?.activePlans || 0,
      icon: CheckCircle,
      description: 'Currently available to customers',
      className: 'text-green-600',
    },
    {
      title: 'Inactive Plans',
      value: stats?.inactivePlans || 0,
      icon: XCircle,
      description: 'Hidden from customers',
      className: 'text-red-600',
    },
    {
      title: 'Total Subscribers',
      value: stats?.totalSubscribers || 0,
      icon: Users,
      description: 'Active subscriptions across all plans',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      description: 'From monthly plans',
      className: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(
        (stats?.monthlyRevenue || 0) + 
        (stats?.quarterlyRevenue || 0) + 
        (stats?.annualRevenue || 0)
      ),
      icon: TrendingUp,
      description: 'All active subscriptions',
      className: 'text-primary',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.className || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className || ''}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}