'use client';

import { useMemberSessions } from '@/lib/hooks/use-member-sessions';
import { SessionsList } from '@/components/sessions/sessions-list';

interface MemberSessionsListProps {
  memberId: string;
}

export function MemberSessionsList({ memberId }: MemberSessionsListProps) {
  const { data: sessions = [], isLoading, error } = useMemberSessions(memberId);

  const handleScheduleSession = () => {
    // TODO: Implement session scheduling modal
    console.log('Schedule session for member:', memberId);
  };

  return (
    <SessionsList
      sessions={sessions}
      isLoading={isLoading}
      error={error}
      entityId={memberId}
      entityType="member"
      showParticipant={true}
      onScheduleSession={handleScheduleSession}
    />
  );
}