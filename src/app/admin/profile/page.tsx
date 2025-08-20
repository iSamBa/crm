import { Metadata } from 'next';
import { UserProfilePage } from '@/components/profile/user-profile-page';

export const metadata: Metadata = {
  title: 'Admin Profile | Fitness Studio CRM',
  description: 'Manage your admin profile settings and preferences',
};

export default function AdminProfilePage() {
  return <UserProfilePage role="admin" />;
}