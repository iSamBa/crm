'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMembershipPlans, useSubscriptionActions } from '@/lib/hooks/use-subscriptions';
import { useMembers } from '@/lib/hooks/use-members';
import { subscriptionService } from '@/lib/services/subscription-service';
import { Check, User } from 'lucide-react';

const subscriptionSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  planId: z.string().min(1, 'Please select a membership plan'),
  startDate: z.string().min(1, 'Start date is required'),
  autoRenew: z.boolean(),
  customPrice: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  memberId?: string;
  onSuccess?: () => void;
}

export function SubscriptionForm({ memberId, onSuccess }: SubscriptionFormProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const { plans, isLoading: plansLoading } = useMembershipPlans();
  const { members, isLoading: membersLoading } = useMembers({});
  const { createSubscription, isLoading } = useSubscriptionActions();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      memberId: memberId || '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      autoRenew: true,
      customPrice: '',
    },
  });

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  const onSubmit = async (data: SubscriptionFormData) => {
    if (!selectedPlan) return;

    const price = data.customPrice ? parseFloat(data.customPrice) : selectedPlan.price;
    const endDate = subscriptionService.calculateEndDate(data.startDate, selectedPlan.duration);

    const subscriptionData = {
      memberId: data.memberId,
      planId: data.planId,
      startDate: data.startDate,
      endDate,
      autoRenew: data.autoRenew,
      price,
    };

    const { data: subscription, error } = await createSubscription(subscriptionData);

    if (error) {
      console.error('Error creating subscription:', error);
      // You might want to show a toast notification here
    } else {
      console.log('Subscription created successfully:', subscription);
      onSuccess?.();
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    form.setValue('planId', planId);
  };

  if (plansLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedMember = members.find(member => member.id === form.watch('memberId'));

  return (
    <div className="space-y-6">
      {/* Member Selection (only if memberId not provided) */}
      {!memberId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Member
            </CardTitle>
            <CardDescription>
              Choose the member for this subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedMember && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="font-medium">
                  {selectedMember.firstName} {selectedMember.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedMember.email} • Status: {selectedMember.membershipStatus}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Membership Plans Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Membership Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all ${
                selectedPlanId === plan.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {selectedPlanId === plan.id && (
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <Badge variant="outline" className="text-xs">
                    {plan.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Details Form */}
      {selectedPlan && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>
                  Configure the subscription settings for {selectedPlan.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Custom Price (optional)
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          Default: ${selectedPlan.price}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={selectedPlan.price.toString()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoRenew"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Auto-renewal</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Automatically renew subscription when it expires
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Subscription Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Subscription Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span>{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{selectedPlan.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>
                        ${form.watch('customPrice') || selectedPlan.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>
                        {form.watch('startDate') ? 
                          new Date(form.watch('startDate')).toLocaleDateString() : 
                          'Not set'
                        }
                      </span>
                    </div>
                    {form.watch('startDate') && (
                      <div className="flex justify-between">
                        <span>End Date:</span>
                        <span>
                          {new Date(
                            subscriptionService.calculateEndDate(
                              form.watch('startDate'), 
                              selectedPlan.duration
                            )
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating Subscription...' : 'Create Subscription'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}