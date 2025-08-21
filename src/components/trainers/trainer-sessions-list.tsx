'use client';

import { useTrainerSessions } from '@/lib/hooks/use-member-sessions';
import { SessionsList } from '@/components/sessions/sessions-list';

interface TrainerSessionsListProps {
  trainerId: string;
}

export function TrainerSessionsList({ trainerId }: TrainerSessionsListProps) {
  const { data: sessions = [], isLoading, error } = useTrainerSessions(trainerId);

  const handleScheduleSession = () => {
    // TODO: Implement session scheduling modal
  };

  return (
    <SessionsList
      sessions={sessions}
      isLoading={isLoading}
      error={error}
      entityId={trainerId}
      entityType="trainer"
      showParticipant={true}
      onScheduleSession={handleScheduleSession}
    />
  );
}