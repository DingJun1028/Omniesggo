import { AppShell } from '@/app/components/layout/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
