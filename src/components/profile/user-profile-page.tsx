'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth/auth-context';
import { ProfileInfoForm } from './profile-info-form';
import { PasswordChangeForm } from './password-change-form';
import { ProfilePreferencesForm } from './profile-preferences-form';
import { User, Mail, Phone, Calendar, Shield, Settings, Lock } from 'lucide-react';

interface UserProfilePageProps {
  role: 'admin' | 'trainer';
}

export function UserProfilePage({ role }: UserProfilePageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleConfig = {
    admin: {
      title: 'Admin Profile',
      description: 'Manage your admin account settings and preferences',
      badgeColor: 'bg-primary text-primary-foreground'
    },
    trainer: {
      title: 'Trainer Profile', 
      description: 'Manage your trainer account settings and preferences',
      badgeColor: 'bg-secondary text-secondary-foreground'
    }
  };

  const config = roleConfig[role];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-lg font-semibold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <Badge className={config.badgeColor}>
              <Shield className="h-3 w-3 mr-1" />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
          
          <p className="text-muted-foreground">{config.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileInfoForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Customize your notification settings and app preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePreferencesForm userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}