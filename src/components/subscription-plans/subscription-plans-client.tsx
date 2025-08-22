'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubscriptionPlans, useDeleteSubscriptionPlan, useToggleSubscriptionPlanStatus } from '@/lib/hooks/use-subscription-plans';
import { SubscriptionPlanForm } from './subscription-plan-form';
import { SubscriptionPlanStats } from './subscription-plan-stats';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Package } from 'lucide-react';
import type { SubscriptionPlan } from '@/types';
import type { SubscriptionPlanFilters } from '@/lib/schemas';

export function SubscriptionPlansClient() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [filters, setFilters] = useState<SubscriptionPlanFilters | undefined>({
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Apply search filter
  const finalFilters: SubscriptionPlanFilters = filters ? {
    ...filters,
    searchTerm: searchTerm.trim() || undefined,
  } : {
    sortBy: 'name',
    sortOrder: 'asc',
    searchTerm: searchTerm.trim() || undefined,
  };

  const { data: plans = [], isLoading, error } = useSubscriptionPlans(finalFilters);
  const deletePlanMutation = useDeleteSubscriptionPlan();
  const toggleStatusMutation = useToggleSubscriptionPlanStatus();

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      await deletePlanMutation.mutateAsync(planToDelete);
      setPlanToDelete(null);
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: plan.id,
        isActive: !plan.isActive,
      });
    } catch (error) {
      console.error('Failed to toggle plan status:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual',
    };
    return labels[duration] || duration;
  };

  if (!isHydrated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <h3 className="mt-4 text-lg font-semibold">Loading subscription plans...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Error loading subscription plans</h3>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Manage pricing, features, and membership plan offerings
          </p>
        </div>
        <Button onClick={handleCreatePlan} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats */}
      <SubscriptionPlanStats />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  key="search-input"
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              key="duration-filter"
              value={filters?.duration || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  sortBy: 'name',
                  sortOrder: 'asc',
                  ...prev,
                  duration: value === 'all' ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
            <Select
              key="status-filter"
              value={filters?.isActive === undefined ? 'all' : filters.isActive.toString()}
              onValueChange={(value) =>
                setFilters(prev => ({
                  sortBy: 'name',
                  sortOrder: 'asc',
                  ...prev,
                  isActive: value === 'all' ? undefined : value === 'true',
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No subscription plans found</h3>
            <p className="text-muted-foreground text-center mt-2">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first subscription plan.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreatePlan} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {!plan.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      {plan.includesPersonalTraining && (
                        <Badge variant="outline" className="text-xs">
                          PT Included
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getDurationLabel(plan.duration)} • {formatPrice(plan.price)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {plan.description}
                  </p>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{plan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                {plan.maxSessionsPerMonth && (
                  <div className="text-sm">
                    <span className="font-medium">Sessions: </span>
                    <span className="text-muted-foreground">
                      {plan.maxSessionsPerMonth}/month
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(plan)}
                    disabled={toggleStatusMutation.isPending}
                    className="gap-1"
                  >
                    {plan.isActive ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {plan.isActive ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlanToDelete(plan.id)}
                    disabled={deletePlanMutation.isPending}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <SubscriptionPlanForm
        plan={selectedPlan}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedPlan(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription plan? This action will set the plan as inactive.
              Plans with active subscriptions cannot be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={deletePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlanMutation.isPending ? 'Deleting...' : 'Delete Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}