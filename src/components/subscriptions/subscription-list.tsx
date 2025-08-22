'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pause,
  Play,
  X,
  Calendar,
  DollarSign,
  RefreshCw,
  Edit
} from 'lucide-react';
import { useMemberSubscriptionsModern, useSubscriptionActions } from '@/lib/hooks/use-subscriptions';
import { shortDate } from '@/lib/utils/date-formatting';
import { Subscription } from '@/types';

interface SubscriptionListProps {
  memberId: string;
  onEdit?: (subscription: Subscription) => void;
}

export function SubscriptionList({ memberId, onEdit }: SubscriptionListProps) {
  const { data: subscriptions = [], isLoading, refetch } = useMemberSubscriptionsModern(memberId);
  const { 
    cancelSubscription, 
    freezeSubscription, 
    reactivateSubscription, 
    isLoading: actionLoading 
  } = useSubscriptionActions();

  const [actionSubscription, setActionSubscription] = useState<Subscription | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'freeze' | 'reactivate' | null>(null);

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

  const handleAction = async () => {
    if (!actionSubscription || !actionType) return;

    let result;
    switch (actionType) {
      case 'cancel':
        result = await cancelSubscription(actionSubscription.id);
        break;
      case 'freeze':
        result = await freezeSubscription(actionSubscription.id);
        break;
      case 'reactivate':
        result = await reactivateSubscription(actionSubscription.id);
        break;
    }

    if (result.success) {
      refetch();
    } else {
      console.error(`Error ${actionType}ing subscription:`, result.error);
    }

    setActionSubscription(null);
    setActionType(null);
  };

  const openActionDialog = (subscription: Subscription, action: 'cancel' | 'freeze' | 'reactivate') => {
    setActionSubscription(subscription);
    setActionType(action);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Subscriptions</h3>
            <p>This member doesn&apos;t have any subscriptions yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Subscription History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                    {subscription.plan?.name || 'Unknown Plan'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscription.plan ? getDurationLabel(subscription.plan.duration) : 'N/A'}
                  </TableCell>
                  <TableCell>${subscription.price}</TableCell>
                  <TableCell>
                    {shortDate(subscription.startDate)}
                  </TableCell>
                  <TableCell>
                    {shortDate(subscription.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.autoRenew ? 'default' : 'outline'}>
                      {subscription.autoRenew ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Edit button - always available for non-expired subscriptions */}
                      {subscription.status !== 'expired' && onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(subscription)}
                          title="Edit subscription"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {subscription.status === 'active' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openActionDialog(subscription, 'freeze')}
                            title="Freeze subscription"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openActionDialog(subscription, 'cancel')}
                            className="text-red-600 hover:text-red-700"
                            title="Cancel subscription"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(subscription.status === 'frozen' || subscription.status === 'cancelled') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openActionDialog(subscription, 'reactivate')}
                          className="text-green-600 hover:text-green-700"
                          title="Reactivate subscription"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {subscription.status === 'expired' && (
                        <span className="text-sm text-muted-foreground">No actions</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionSubscription && !!actionType} onOpenChange={() => {
        setActionSubscription(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'cancel' && 'Cancel Subscription'}
              {actionType === 'freeze' && 'Freeze Subscription'}
              {actionType === 'reactivate' && 'Reactivate Subscription'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cancel' && 
                'Are you sure you want to cancel this subscription? This action cannot be undone.'
              }
              {actionType === 'freeze' && 
                'Are you sure you want to freeze this subscription? The member will temporarily lose access.'
              }
              {actionType === 'reactivate' && 
                'Are you sure you want to reactivate this subscription? The member will regain access.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'cancel' && 'Cancel Subscription'}
                  {actionType === 'freeze' && 'Freeze Subscription'}
                  {actionType === 'reactivate' && 'Reactivate Subscription'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}