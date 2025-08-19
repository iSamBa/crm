import { Metadata } from 'next';
import { AdminLayout } from '@/components/layout/admin-layout';
import { SubscriptionPlansClient } from '@/components/subscription-plans/subscription-plans-client';

export const metadata: Metadata = {
  title: 'Subscription Plans | Admin Dashboard',
  description: 'Manage subscription plans, pricing, and membership offerings',
};

export default function SubscriptionPlansPage() {
  return (
    <AdminLayout>
      <SubscriptionPlansClient />
    </AdminLayout>
  );
}