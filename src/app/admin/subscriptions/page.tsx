'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Download,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  X,
  DollarSign,
  Users
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { dateFormatters } from '@/lib/utils/date-formatting';
import { SubscriptionStatsCards } from '@/components/subscriptions/subscription-stats-cards';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { useAllSubscriptions, useSubscriptionActions, useMembershipPlans } from '@/lib/hooks/use-subscriptions';
import { SubscriptionWithMember, SubscriptionFilters } from '@/lib/services/subscription-service';

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithMember | null>(null);
  
  // Build filters object (memoized to prevent infinite re-renders)
  const filters: SubscriptionFilters = useMemo(() => ({
    searchTerm: searchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    planId: planFilter !== 'all' ? planFilter : undefined,
  }), [searchTerm, statusFilter, planFilter]);

  const { subscriptions, isLoading, refetch } = useAllSubscriptions(filters);
  const { plans } = useMembershipPlans();
  const { 
    cancelSubscription, 
    freezeSubscription, 
    reactivateSubscription, 
    isLoading: actionLoading 
  } = useSubscriptionActions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'annual':
        return 'Annual';
      default:
        return duration;
    }
  };

  const handleAction = async (subscription: SubscriptionWithMember, action: 'cancel' | 'freeze' | 'reactivate') => {
    if (!confirm(`Are you sure you want to ${action} this subscription?`)) return;

    let result;
    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscription.id);
        break;
      case 'freeze':
        result = await freezeSubscription(subscription.id);
        break;
      case 'reactivate':
        result = await reactivateSubscription(subscription.id);
        break;
    }

    if (result.success) {
      refetch();
    } else {
      console.error(`Error ${action}ing subscription:`, result.error);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage member subscriptions and membership plans
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
              </DialogHeader>
              <SubscriptionForm 
                memberId=""
                onSuccess={handleCreateSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <SubscriptionStatsCards />

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members or plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                {/* Plan Filter */}
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardContent className="p-0">
            {subscriptions.length === 0 ? (
              <div className="text-center p-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Subscriptions Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                    ? 'No subscriptions match your current filters.' 
                    : 'No subscriptions have been created yet.'
                  }
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Subscription
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Auto-renew</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">
                            {subscription.member?.firstName} {subscription.member?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.member?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.plan?.name || 'Unknown Plan'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.plan?.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.plan ? getDurationLabel(subscription.plan.duration) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(parseFloat(subscription.price.toString()))}
                      </TableCell>
                      <TableCell>
                        {dateFormatters.shortDate(subscription.startDate)}
                      </TableCell>
                      <TableCell>
                        <div className={
                          new Date(subscription.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-orange-600 font-medium'
                            : ''
                        }>
                          {dateFormatters.shortDate(subscription.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscription.autoRenew ? 'default' : 'outline'}>
                          {subscription.autoRenew ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedSubscription(subscription)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {subscription.status === 'active' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(subscription, 'freeze')}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Freeze
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(subscription, 'cancel')}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            {(subscription.status === 'frozen' || subscription.status === 'cancelled') && (
                              <DropdownMenuItem 
                                onClick={() => handleAction(subscription, 'reactivate')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Subscription Detail Modal (if needed later) */}
        {selectedSubscription && (
          <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Subscription Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Member</h4>
                    <p>{selectedSubscription.member?.firstName} {selectedSubscription.member?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{selectedSubscription.member?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Plan</h4>
                    <p>{selectedSubscription.plan?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedSubscription.plan?.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Status</h4>
                    <Badge className={getStatusColor(selectedSubscription.status)}>
                      {selectedSubscription.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium">Price</h4>
                    <p>{formatCurrency(parseFloat(selectedSubscription.price.toString()))}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}