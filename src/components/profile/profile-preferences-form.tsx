'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPreferencesSchema, type UserPreferencesData } from '@/lib/schemas';
import { userService } from '@/lib/services/user-service';
import { useTheme } from '@/lib/theme/theme-context';
import { Loader2, Save, Bell, Sun, Moon } from 'lucide-react';

interface ProfilePreferencesFormProps {
  userId: string;
}

const themeOptions = [
  { value: 'light', label: 'Light Mode', icon: Sun },
  { value: 'dark', label: 'Dark Mode', icon: Moon },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'UTC', label: 'UTC' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export function ProfilePreferencesForm({ userId }: ProfilePreferencesFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      const response = await userService.getUserPreferences(userId);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(UserPreferencesSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      sessionReminders: true,
      marketingEmails: false,
      theme: 'light',
      language: 'en',
      timezone: 'America/New_York'
    }
  });

  // Watch theme changes to update the app theme
  const watchedTheme = watch('theme');

  useEffect(() => {
    if (watchedTheme && watchedTheme !== theme) {
      setTheme(watchedTheme as 'light' | 'dark');
    }
  }, [watchedTheme, theme, setTheme]);

  // Reset form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      reset({
        emailNotifications: preferences.email_notifications ?? true,
        smsNotifications: preferences.sms_notifications ?? false,
        sessionReminders: preferences.session_reminders ?? true,
        marketingEmails: preferences.marketing_emails ?? false,
        theme: (preferences.theme as 'light' | 'dark') ?? 'light',
        language: preferences.language ?? 'en',
        timezone: preferences.timezone ?? 'America/New_York'
      });
    }
  }, [preferences, reset]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: UserPreferencesData) => {
      const response = await userService.updateUserPreferences(userId, {
        email_notifications: data.emailNotifications,
        sms_notifications: data.smsNotifications,
        session_reminders: data.sessionReminders,
        marketing_emails: data.marketingEmails,
        theme: data.theme,
        language: data.language,
        timezone: data.timezone
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setShowError(null);
    },
    onError: (error) => {
      console.error('Preferences update error:', error);
      setShowError(error.message || 'Failed to update preferences');
    }
  });

  const onSubmit = (data: any) => {
    updatePreferencesMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Notification Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h3>
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch
                {...register('emailNotifications')}
                onCheckedChange={(checked) => setValue('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive urgent alerts via text message
                </p>
              </div>
              <Switch
                {...register('smsNotifications')}
                onCheckedChange={(checked) => setValue('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Session Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming training sessions
                </p>
              </div>
              <Switch
                {...register('sessionReminders')}
                onCheckedChange={(checked) => setValue('sessionReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive promotional content and newsletters
                </p>
              </div>
              <Switch
                {...register('marketingEmails')}
                onCheckedChange={(checked) => setValue('marketingEmails', checked)}
              />
            </div>
          </div>
        </div>

        {/* Appearance & Localization */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance & Language</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                onValueChange={(value) => setValue('theme', value as any)}
                defaultValue={watchedTheme}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                onValueChange={(value) => setValue('language', value)}
                defaultValue={watch('language')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                onValueChange={(value) => setValue('timezone', value)}
                defaultValue={watch('timezone')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
            disabled={!isDirty || updatePreferencesMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preferences Updated</AlertDialogTitle>
            <AlertDialogDescription>
              Your account preferences have been successfully updated.
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