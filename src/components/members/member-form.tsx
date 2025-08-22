'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member } from '@/types';
import { memberService } from '@/lib/services/member-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  membershipStatus: z.enum(['active', 'inactive', 'frozen', 'cancelled']),
  joinDate: z.string().min(1, 'Join date is required'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  medicalConditions: z.string().optional(),
  fitnessGoals: z.string().optional(),
  preferredTrainingTimes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Member;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function MemberForm({ member, onSuccess }: MemberFormProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      membershipStatus: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      medicalConditions: '',
      fitnessGoals: '',
      preferredTrainingTimes: '',
    },
  });

  // Reset form values when member data changes (for edit mode)
  useEffect(() => {
    
    if (member && isEditing) {
      
      const formData = {
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phone: member.phone || '',
        membershipStatus: member.membershipStatus || 'active',
        joinDate: member.joinDate || new Date().toISOString().split('T')[0],
        emergencyContactName: member.emergencyContact?.name || '',
        emergencyContactPhone: member.emergencyContact?.phone || '',
        emergencyContactRelationship: member.emergencyContact?.relationship || '',
        medicalConditions: member.medicalConditions || '',
        fitnessGoals: member.fitnessGoals || '',
        preferredTrainingTimes: member.preferredTrainingTimes?.join(', ') || '',
      };
      
      
      // Small delay to ensure form is properly initialized
      setTimeout(() => {
        reset(formData);
      }, 0);
      
    } else if (!isEditing) {
      // Reset to empty form for new member creation
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        membershipStatus: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        medicalConditions: '',
        fitnessGoals: '',
        preferredTrainingTimes: '',
      });
    }
  }, [member, isEditing, reset]);

  const membershipStatus = watch('membershipStatus');

  const onSubmit = async (data: MemberFormData) => {
    setIsLoading(true);
    try {
      const memberData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        membershipStatus: data.membershipStatus,
        joinDate: data.joinDate,
        emergencyContact: data.emergencyContactName
          ? {
              name: data.emergencyContactName,
              phone: data.emergencyContactPhone || '',
              relationship: data.emergencyContactRelationship || '',
            }
          : undefined,
        medicalConditions: data.medicalConditions || undefined,
        fitnessGoals: data.fitnessGoals || undefined,
        preferredTrainingTimes: data.preferredTrainingTimes
          ? data.preferredTrainingTimes.split(',').map((time) => time.trim())
          : [],
      };

      let result;
      if (isEditing) {
        result = await memberService.updateMember({
          id: member.id,
          ...memberData,
        });
      } else {
        result = await memberService.createMember(memberData);
      }

      if (result.error) {
        console.error('Error saving member:', result.error);
        setErrorDialog({
          isOpen: true,
          message: 'Error saving member: ' + result.error
        });
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving member:', error);
      setErrorDialog({
        isOpen: true,
        message: 'Unexpected error saving member. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="membershipStatus">Membership Status</Label>
          <Select
            value={membershipStatus}
            onValueChange={(value) => setValue('membershipStatus', value as 'active' | 'inactive' | 'frozen' | 'cancelled')}
          >
            <SelectTrigger id="membershipStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="joinDate">Join Date *</Label>
          <DatePicker
            value={watch('joinDate')}
            onChange={(value) => setValue('joinDate', value)}
            placeholder="Select join date"
          />
          {errors.joinDate && (
            <p className="text-sm text-red-600 mt-1">{errors.joinDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input
              id="emergencyContactName"
              {...register('emergencyContactName')}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input
              id="emergencyContactPhone"
              {...register('emergencyContactPhone')}
              placeholder="Emergency contact phone"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
          <Input
            id="emergencyContactRelationship"
            {...register('emergencyContactRelationship')}
            placeholder="Relationship (e.g., Spouse, Parent)"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="medicalConditions">Medical Conditions</Label>
        <Textarea
          id="medicalConditions"
          {...register('medicalConditions')}
          placeholder="Any medical conditions or allergies"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="fitnessGoals">Fitness Goals</Label>
        <Textarea
          id="fitnessGoals"
          {...register('fitnessGoals')}
          placeholder="Member's fitness goals and objectives"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="preferredTrainingTimes">Preferred Training Times</Label>
        <Input
          id="preferredTrainingTimes"
          {...register('preferredTrainingTimes')}
          placeholder="e.g., morning, evening, weekends"
        />
        <p className="text-sm text-gray-500 mt-1">
          Separate multiple times with commas
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Member' : 'Add Member'}
        </Button>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.isOpen} onOpenChange={() => setErrorDialog({isOpen: false, message: ''})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}