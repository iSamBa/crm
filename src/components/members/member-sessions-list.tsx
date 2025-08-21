'use client';

import { useState } from 'react';
import { useMemberSessions } from '@/lib/hooks/use-member-sessions';
import { SessionsList } from '@/components/sessions/sessions-list';
import { SessionModal } from '@/components/calendar/session-modal';

interface MemberSessionsListProps {
  memberId: string;
}

export function MemberSessionsList({ memberId }: MemberSessionsListProps) {
  const { data: sessions = [], isLoading, error, refetch } = useMemberSessions(memberId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleScheduleSession = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <SessionsList
        sessions={sessions}
        isLoading={isLoading}
        error={error}
        entityId={memberId}
        entityType="member"
        showParticipant={true}
        onScheduleSession={handleScheduleSession}
      />

      {/* Create Session Modal */}
      <SessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
        defaultMemberId={memberId}
      />
    </>
  );
}