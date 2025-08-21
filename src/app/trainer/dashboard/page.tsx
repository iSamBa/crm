import { TrainerLayout } from '@/components/layout/trainer-layout';
import { Metadata } from 'next';
import { TrainerDashboardContent } from '@/components/trainers/trainer-dashboard-content';
import { generatePageMetadata } from '@/lib/utils/app-config';

export const metadata: Metadata = generatePageMetadata('Trainer Dashboard', 'Manage your training sessions and track client progress');

export default function TrainerDashboard() {
  return (
    <TrainerLayout>
      <TrainerDashboardContent />
    </TrainerLayout>
  );
}