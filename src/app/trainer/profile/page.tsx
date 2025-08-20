import { Metadata } from 'next';
import { UserProfilePage } from '@/components/profile/user-profile-page';

export const metadata: Metadata = {
  title: 'Trainer Profile | Fitness Studio CRM',
  description: 'Manage your trainer profile settings and preferences',
};

export default function TrainerProfilePage() {
  return <UserProfilePage role="trainer" />;
}