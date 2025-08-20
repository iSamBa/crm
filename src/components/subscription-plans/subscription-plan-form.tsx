'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSubscriptionPlan, useUpdateSubscriptionPlan } from '@/lib/hooks/use-subscription-plans';
import { CreateSubscriptionPlanSchema, UpdateSubscriptionPlanSchema } from '@/lib/schemas';
import type { SubscriptionPlan } from '@/types';
import type { CreateSubscriptionPlanData, UpdateSubscriptionPlanData } from '@/lib/schemas';
import { X, Plus } from 'lucide-react';

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionPlanForm({ 
  plan, 
  open, 
  onOpenChange, 
  onSuccess 
}: SubscriptionPlanFormProps) {
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  
  const isEditing = !!plan;
  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();

  const form = useForm({
    resolver: zodResolver(isEditing ? UpdateSubscriptionPlanSchema : CreateSubscriptionPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 'monthly',
      features: [],
      maxSessionsPerMonth: undefined,
      includesPersonalTraining: false,
      isActive: true,
    },
  });

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      form.reset({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        maxSessionsPerMonth: plan.maxSessionsPerMonth || undefined,
        includesPersonalTraining: plan.includesPersonalTraining,
        isActive: plan.isActive,
      });
      setFeatures(plan.features);
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        duration: 'monthly',
        features: [],
        maxSessionsPerMonth: undefined,
        includesPersonalTraining: false,
        isActive: true,
      });
      setFeatures([]);
    }
  }, [plan, form]);

  // Update form when features change
  useEffect(() => {
    form.setValue('features', features);
  }, [features, form]);

  const onSubmit = async (data: CreateSubscriptionPlanData | UpdateSubscriptionPlanData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data as UpdateSubscriptionPlanData);
      } else {
        await createMutation.mutateAsync(data as CreateSubscriptionPlanData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save subscription plan:', error);
      // Error is already handled by the mutation hook
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the subscription plan details below.'
              : 'Create a new subscription plan with pricing and features.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Membership" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this plan includes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="99.99"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSessionsPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Sessions/Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Unlimited if empty"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited sessions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Features</FormLabel>
              <div className="space-y-3 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFeature}
                    disabled={!newFeature.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {features.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No features added yet. Add features to describe what&apos;s included in this plan.
                  </p>
                )}
              </div>
              {form.formState.errors.features && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.features.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="includesPersonalTraining"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Personal Training</FormLabel>
                      <FormDescription>
                        Include personal training sessions
                      </FormDescription>
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Plan</FormLabel>
                      <FormDescription>
                        Make plan available to customers
                      </FormDescription>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                  ? 'Update Plan'
                  : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}