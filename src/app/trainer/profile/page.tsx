import { Metadata } from 'next';
import { UserProfilePage } from '@/components/profile/user-profile-page';
import { generatePageMetadata } from '@/lib/utils/app-config';

export const metadata: Metadata = generatePageMetadata('Trainer Profile', 'Manage your trainer profile settings and preferences');

export default function TrainerProfilePage() {
  return <UserProfilePage role="trainer" />;
}