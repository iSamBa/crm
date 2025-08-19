import { TrainerLayout } from '@/components/layout/trainer-layout';
import { Metadata } from 'next';
import { TrainerDashboardContent } from '@/components/trainers/trainer-dashboard-content';

export const metadata: Metadata = {
  title: 'Trainer Dashboard - Fitness Studio CRM',
  description: 'Manage your training sessions and track client progress',
};

export default function TrainerDashboard() {
  return (
    <TrainerLayout>
      <TrainerDashboardContent />
    </TrainerLayout>
  );
}