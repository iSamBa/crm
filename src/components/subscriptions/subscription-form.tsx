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
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMembershipPlans, useSubscriptionActions } from '@/lib/hooks/use-subscriptions';
import { useMembers } from '@/lib/hooks/use-members';
import { subscriptionService, SubscriptionWithMember } from '@/lib/services/subscription-service';
import { Check, User } from 'lucide-react';
import { shortDate } from '@/lib/utils/date-formatting';

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
  subscription?: SubscriptionWithMember;
  onSuccess?: () => void;
}

export function SubscriptionForm({ memberId, subscription, onSuccess }: SubscriptionFormProps) {
  const isEditing = !!subscription;
  const [selectedPlanId, setSelectedPlanId] = useState<string>(subscription?.plan?.id || '');
  const { plans, isLoading: plansLoading } = useMembershipPlans();
  const { members, isLoading: membersLoading } = useMembers({});
  const { createSubscription, updateSubscription, isLoading } = useSubscriptionActions();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      memberId: subscription?.member?.id || memberId || '',
      planId: subscription?.plan?.id || '',
      startDate: subscription?.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      autoRenew: subscription?.autoRenew ?? true,
      customPrice: subscription && subscription.price !== subscription.plan?.price ? subscription.price.toString() : '',
    },
  });

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  const onSubmit = async (data: SubscriptionFormData) => {
    if (!selectedPlan) return;

    const price = data.customPrice ? parseFloat(data.customPrice) : selectedPlan.price;
    const endDate = subscriptionService.calculateEndDate(data.startDate, selectedPlan.duration);

    if (isEditing && subscription) {
      // Update existing subscription
      const updateData = {
        id: subscription.id,
        planId: data.planId,
        startDate: data.startDate,
        endDate,
        autoRenew: data.autoRenew,
        price,
      };

      const { error } = await updateSubscription(updateData);

      if (error) {
        console.error('Error updating subscription:', error);
      } else {
        onSuccess?.();
      }
    } else {
      // Create new subscription
      const subscriptionData = {
        memberId: data.memberId,
        planId: data.planId,
        startDate: data.startDate,
        endDate,
        autoRenew: data.autoRenew,
        price,
      };

      const { error } = await createSubscription(subscriptionData);

      if (error) {
        console.error('Error creating subscription:', error);
      } else {
        onSuccess?.();
      }
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
    <Form {...form}>
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
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Membership Plan</h3>
          <p className="text-gray-600">Choose the perfect plan for your member&apos;s fitness journey</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Mark second plan as popular
            const isSelected = selectedPlanId === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5 shadow-xl' 
                    : 'hover:shadow-lg border-gray-200'
                } ${isPopular ? 'border-primary border-2' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                    <Check className="h-5 w-5" />
                  </div>
                )}

                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900 truncate">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm line-clamp-2">{plan.description}</CardDescription>
                  
                  <div className="mt-3">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500 ml-1 text-sm">/{plan.duration.split(' ')[0]}</span>
                    </div>
                    <Badge 
                      variant={isPopular ? "default" : "outline"} 
                      className="mt-2 text-xs"
                    >
                      {plan.duration}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4">
                  <ul className="space-y-2 min-h-[120px]">
                    {plan.features.slice(0, 4).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700 leading-tight">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-gray-500 italic">+{plan.features.length - 4} more features</li>
                    )}
                  </ul>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Button 
                      variant={isSelected ? "default" : "outline"}
                      className="w-full text-sm"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Benefits Section */}
        <div className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">All Plans Include</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                24/7 Gym Access
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                Equipment Training
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                Progress Tracking
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details Form */}
      {selectedPlan && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Fields - 2/3 width */}
              <div className="lg:col-span-2">
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
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                        />
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

                  </CardContent>
                </Card>
              </div>

              {/* Summary Sidebar - 1/3 width */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                    <CardDescription>Review your subscription details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Plan Preview */}
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <div className="text-center">
                        <h4 className="font-semibold text-primary">{selectedPlan.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
                        <div className="mt-3">
                          <span className="text-2xl font-bold text-gray-900">
                            ${form.watch('customPrice') || selectedPlan.price}
                          </span>
                          <span className="text-gray-500 text-sm">/{selectedPlan.duration.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedPlan.duration}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">
                          ${form.watch('customPrice') || selectedPlan.price}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">
                          {form.watch('startDate') ? 
                            shortDate(form.watch('startDate')) : 
                            'Not set'
                          }
                        </span>
                      </div>
                      {form.watch('startDate') && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium">
                            {shortDate(
                              subscriptionService.calculateEndDate(
                                form.watch('startDate'), 
                                selectedPlan.duration
                              )
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                        {isLoading 
                          ? (isEditing ? 'Updating Subscription...' : 'Creating Subscription...') 
                          : (isEditing ? 'Update Subscription' : 'Create Subscription')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
      )}
      </div>
    </Form>
  );
}