'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Eye, EyeOff } from 'lucide-react';
import { Trainer } from '@/types';
import { useTrainerActions } from '@/lib/hooks/use-trainers-modern';
import {
  CreateTrainerSchema,
  UpdateTrainerSchema,
  type CreateTrainerData,
  type UpdateTrainerData
} from '@/lib/schemas';

interface TrainerFormProps {
  trainer?: Trainer;
  onSuccess: () => void;
}

export function TrainerForm({ trainer, onSuccess }: TrainerFormProps) {
  const [specializations, setSpecializations] = useState<string[]>(
    trainer?.specializations || ['General Training']
  );
  const [certifications, setCertifications] = useState<string[]>(
    trainer?.certifications || []
  );
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { createTrainer, updateTrainer, isCreating, isUpdating } = useTrainerActions();
  const isEditing = !!trainer;
  const isLoading = isCreating || isUpdating;

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? UpdateTrainerSchema : CreateTrainerSchema),
    defaultValues: isEditing ? {
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone || '',
      hourlyRate: trainer.hourlyRate,
      specializations: trainer.specializations,
      certifications: trainer.certifications,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      hourlyRate: 50,
      specializations: ['General Training'],
      certifications: [],
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const formData = {
        ...data,
        specializations,
        certifications,
      };

      let result;
      if (isEditing) {
        result = await updateTrainer.mutateAsync(formData as UpdateTrainerData);
      } else {
        result = await createTrainer.mutateAsync(formData as CreateTrainerData);
      }

      if (result.data) {
        onSuccess();
      } else if (result.error) {
        // Error will be handled by the mutation
        console.error('Form submission error:', result.error);
      }
    } catch (error) {
      console.error('Unexpected form error:', error);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations([...specializations, newSpecialization.trim()]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    if (specializations.length > 1) { // Ensure at least one specialization
      setSpecializations(specializations.filter((_, i) => i !== index));
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const commonSpecializations = [
    'Personal Training',
    'Weight Training',
    'Cardio Training',
    'Yoga',
    'Pilates',
    'CrossFit',
    'HIIT',
    'Sports Training',
    'Rehabilitation',
    'Nutrition Coaching',
    'Group Fitness',
    'Bodybuilding'
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                placeholder="Enter first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.firstName?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                placeholder="Enter last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.lastName?.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="Enter email address"
              disabled={isEditing} // Don't allow email changes for existing trainers
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.email?.message}
              </p>
            )}
            {isEditing && (
              <p className="text-sm text-gray-600 mt-1">
                Email cannot be changed for existing trainers
              </p>
            )}
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  placeholder="Enter secure password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password?.message}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Must contain at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="Enter phone number"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                max="1000"
                step="5"
                {...form.register('hourlyRate', { valueAsNumber: true })}
                placeholder="50"
              />
              {form.formState.errors.hourlyRate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.hourlyRate?.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle>Specializations *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {spec}
                {specializations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeSpecialization(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="Add specialization..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
            />
            <Button type="button" onClick={addSpecialization} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Common specializations:</p>
            <div className="flex flex-wrap gap-2">
              {commonSpecializations
                .filter(spec => !specializations.includes(spec))
                .map(spec => (
                  <Button
                    key={spec}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSpecializations([...specializations, spec]);
                    }}
                  >
                    {spec}
                  </Button>
                ))
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, index) => (
              <Badge key={index} variant="outline" className="gap-1">
                {cert}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeCertification(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="Add certification..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
            />
            <Button type="button" onClick={addCertification} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              Add professional certifications such as NASM, ACE, ACSM, etc.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Trainer' : 'Create Trainer'}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  );
}