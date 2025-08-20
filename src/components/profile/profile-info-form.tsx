'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '@/types';
import { UpdateUserProfileSchema, type UpdateUserProfileData } from '@/lib/schemas';
import { userService } from '@/lib/services/user-service';
import { useAuth } from '@/lib/auth/auth-context';
import { Loader2, Save, Upload } from 'lucide-react';

interface ProfileInfoFormProps {
  user: User;
}

export function ProfileInfoForm({ user }: ProfileInfoFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<UpdateUserProfileData>({
    resolver: zodResolver(UpdateUserProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || ''
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfileData) => {
      const response = await userService.updateProfile(user.id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async (updatedUser) => {
      // Update all relevant query caches
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      
      // Refresh auth context to update sidebar immediately
      await refreshUser();
      
      // Reset form with updated values
      reset({
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        email: updatedUser?.email,
        phone: updatedUser?.phone || '',
        avatar: updatedUser?.avatar || ''
      });
      
      setShowSuccess(true);
      setShowError(null);
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      setShowError(error.message || 'Failed to update profile');
    }
  });

  const onSubmit = (data: UpdateUserProfileData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <div className="flex gap-2">
            <Input
              id="avatar"
              {...register('avatar')}
              placeholder="https://example.com/avatar.jpg"
              className="flex-1"
            />
            <Button type="button" variant="outline" className="px-3">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {errors.avatar && (
            <p className="text-sm text-destructive">{errors.avatar.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Enter a URL to your profile picture or upload an image
          </p>
        </div>

        {showError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {showError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty || updateProfileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profile Updated</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile information has been successfully updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccess(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}