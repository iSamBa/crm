'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMember } from '@/lib/hooks/use-members-modern';
import { MemberHeader } from './member-header';
import { MemberInfoCard } from './member-info-card';
import { EmergencyContactCard } from './emergency-contact-card';
import { MemberTabs } from './member-tabs';

interface MemberDetailViewProps {
  memberId: string;
  onBack: () => void;
}

export function MemberDetailView({ memberId, onBack }: MemberDetailViewProps) {
  const { data: member, isLoading, error } = useMember(memberId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleMemberUpdated = () => {
    setIsEditDialogOpen(false);
    // TanStack Query will automatically refetch and update cache
  };

  const handleSubscriptionUpdated = () => {
    // TanStack Query will automatically refetch and update cache
  };

  // Go back if member not found or error
  if (error && !isLoading) {
    onBack();
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Member not found</h2>
        <p className="text-muted-foreground mb-4">The member you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={onBack}>Back to Members</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MemberHeader 
        member={member}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        onMemberUpdated={handleMemberUpdated}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MemberInfoCard member={member} />
        <EmergencyContactCard member={member} />
      </div>

      <MemberTabs 
        member={member}
        onSubscriptionUpdated={handleSubscriptionUpdated}
      />
    </div>
  );
}