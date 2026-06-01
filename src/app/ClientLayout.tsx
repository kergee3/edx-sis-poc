'use client';

import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AppLayout from '@/components/layout/AppLayout';
import { SettingsProvider } from '@/contexts/settings-context';
import ClientEnricher from '@/features/login-history/components/ClientEnricher';
import type { NavigationItem } from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';

const navigationItems: NavigationItem[] = [
  { label: 'ホーム', path: '/home', icon: <HomeIcon /> },
  { label: '教育', path: '/edu', icon: <SchoolIcon />, requiresAuth: true },
  { label: '行政', path: '/gov', icon: <AccountBalanceIcon />, requiresAuth: true },
  { label: '名簿', path: '/roster', icon: <PeopleAltIcon />, requiresAuth: true },
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
