import { TrainerLayout } from '@/components/layout/trainer-layout';

export default function TrainerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerLayout>{children}</TrainerLayout>;
}