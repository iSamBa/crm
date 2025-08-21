import { Metadata } from 'next';
import { UserProfilePage } from '@/components/profile/user-profile-page';
import { generatePageMetadata } from '@/lib/utils/app-config';

export const metadata: Metadata = generatePageMetadata('Admin Profile', 'Manage your admin profile settings and preferences');

export default function AdminProfilePage() {
  return <UserProfilePage role="admin" />;
}