'use client';

import { AppBar, Box, Toolbar, Tabs, Tab, Tooltip, Typography } from '@mui/material';
import type { TabProps } from '@mui/material';
import { forwardRef, type ReactElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  NAV_DISABLED_TOOLTIP,
  isNavItemDisabled,
  type NavigationItem,
} from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';
import UserMenu from './UserMenu';

// Tabs が子要素に clone で注入する props (fullWidth / selected / indicator / textColor 等) を
// 内側の Tab に受け流しつつ Tooltip でラップするためのラッパ。
// 直接 <Tooltip><span><Tab/></span></Tooltip> と書くと注入 props が span まで漏れて
// DOM 警告になるため forwardRef のコンポーネントを Tabs の直下に置く。
const DisabledTab = forwardRef<HTMLSpanElement, TabProps>(
  function DisabledTab(props, ref) {
    return (
      <Tooltip title={NAV_DISABLED_TOOLTIP} arrow>
        <span ref={ref} style={{ display: 'inline-flex' }}>
          <Tab {...props} />
        </span>
      </Tooltip>
    );
  },
);

interface TopTabsProps {
  items: NavigationItem[];
  user: SessionUserView;
}

export default function TopTabs({ items, user }: TopTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = user !== null;

  const currentIndex = items.findIndex((item) => item.path === pathname);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <Typography variant="h6" component="div" sx={{ mr: 0.5, flexShrink: 0 }}>
          SSS-PoC
        </Typography>
        <Tabs
          value={currentIndex !== -1 ? currentIndex : false}
          onChange={(_event, newValue: number) => {
            const next = items[newValue];
            if (next && !isNavItemDisabled(next, isAuthenticated)) {
              router.push(next.path);
            }
          }}
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            ml: 0,
            '& .MuiTabs-scrollButtons': {
              color: 'inherit',
              '&.Mui-disabled': {
                display: 'none',
                width: 0,
                opacity: 0,
              },
            },
            '& .MuiTabs-flexContainer': {
              gap: 0,
            },
          }}
        >
          {items.map((item) => {
            const disabled = isNavItemDisabled(item, isAuthenticated);
            const TabComponent = disabled ? DisabledTab : Tab;
            return (
              <TabComponent
                key={item.path}
                label={item.label}
                icon={item.icon as ReactElement}
                iconPosition="start"
                disabled={disabled}
                sx={{ minHeight: 64, minWidth: 'auto', px: 1 }}
              />
            );
          })}
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <UserMenu user={user} variant="default" />
      </Toolbar>
    </AppBar>
  );
}
