'use client';

import HomeIcon from '@mui/icons-material/Home';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AppLayout from '@/components/layout/AppLayout';
import { SettingsProvider } from '@/contexts/settings-context';
import ClientEnricher from '@/features/login-history/components/ClientEnricher';
import type { NavigationItem } from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';

const navigationItems: NavigationItem[] = [
  { label: 'ホーム', path: '/home', icon: <HomeIcon /> },
  { label: '生徒一覧', path: '/students', icon: <PeopleAltIcon />, requiresAuth: true },
  { label: 'データ連携', path: '/interop', icon: <SyncAltIcon />, requiresAuth: true },
];

interface ClientLayoutProps {
  children: React.ReactNode;
  user: SessionUserView;
}

export default function ClientLayout({ children, user }: ClientLayoutProps) {
  return (
    <SettingsProvider>
      <ClientEnricher />
      <AppLayout navigationItems={navigationItems} user={user}>
        {children}
      </AppLayout>
    </SettingsProvider>
  );
}
