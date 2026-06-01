'use client';

import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import { useSettings } from '@/contexts/settings-context';
import type { NavigationItem } from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';
import BottomNavBar from './BottomNavBar';
import Sidebar, { DRAWER_WIDTH, MOBILE_DRAWER_WIDTH } from './Sidebar';
import TopTabs from './TopTabs';

interface AppLayoutProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  user: SessionUserView;
}

export default function AppLayout({ children, navigationItems, user }: AppLayoutProps) {
  const deviceInfo = useDeviceDetection();
  const { navigationPosition } = useSettings();

  let showBottomNav = false;
  let showSidebar = false;
  let showTopTabs = false;

  if (navigationPosition === 'auto') {
    showBottomNav =
      deviceInfo.deviceType === 'mobile-portrait' ||
      deviceInfo.deviceType === 'tablet-portrait';
    showSidebar =
      deviceInfo.deviceType === 'mobile-landscape' ||
      deviceInfo.deviceType === 'tablet-landscape';
    showTopTabs = deviceInfo.deviceType === 'desktop';
  } else if (navigationPosition === 'top') {
    showTopTabs = true;
  } else if (navigationPosition === 'left') {
    showSidebar = true;
  } else if (navigationPosition === 'bottom') {
    showBottomNav = true;
  }

  const isMobileLandscape = deviceInfo.deviceType === 'mobile-landscape';

  let sidebarWidth = DRAWER_WIDTH;
  if (navigationPosition === 'auto' && isMobileLandscape) {
    sidebarWidth = MOBILE_DRAWER_WIDTH;
  } else if (navigationPosition === 'left') {
    sidebarWidth = deviceInfo.isMobile ? MOBILE_DRAWER_WIDTH : DRAWER_WIDTH;
  }

  useEffect(() => {
    const handleOrientationChange = () => {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        );
      }
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showTopTabs && <TopTabs items={navigationItems} user={user} />}

      <Box sx={{ display: 'flex', flex: 1 }}>
        {showSidebar && (
          <Sidebar items={navigationItems} user={user} isMobile={false} width={sidebarWidth} />
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            marginLeft: showSidebar ? `calc(${sidebarWidth}px + env(safe-area-inset-left))` : 0,
            marginTop: showTopTabs ? '64px' : 0,
            marginBottom: showBottomNav ? 'calc(56px + env(safe-area-inset-bottom))' : 0,
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>

      {showBottomNav && <BottomNavBar items={navigationItems} user={user} />}
    </Box>
  );
}
