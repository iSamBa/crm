'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member } from '@/types';
import { memberService } from '@/lib/services/member-service';

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
}

export function MemberForm({ member, onSuccess }: MemberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: member?.firstName || '',
      lastName: member?.lastName || '',
      email: member?.email || '',
      phone: member?.phone || '',
      membershipStatus: member?.membershipStatus || 'active',
      joinDate: member?.joinDate || new Date().toISOString().split('T')[0],
      emergencyContactName: member?.emergencyContact?.name || '',
      emergencyContactPhone: member?.emergencyContact?.phone || '',
      emergencyContactRelationship: member?.emergencyContact?.relationship || '',
      medicalConditions: member?.medicalConditions || '',
      fitnessGoals: member?.fitnessGoals || '',
      preferredTrainingTimes: member?.preferredTrainingTimes?.join(', ') || '',
    },
  });

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
        alert('Error saving member: ' + result.error);
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Unexpected error saving member');
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
            <SelectTrigger>
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
          <Input
            id="joinDate"
            type="date"
            {...register('joinDate')}
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
    </form>
  );
}