'use client';

import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Tooltip,
} from '@mui/material';
import type { BottomNavigationActionProps } from '@mui/material';
import { forwardRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  NAV_DISABLED_TOOLTIP,
  isNavItemDisabled,
  type NavigationItem,
} from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';
import UserMenu from './UserMenu';

// BottomNavigation が子要素に clone で注入する props (selected / onChange / value / showLabels 等) を
// 内側の BottomNavigationAction に受け流しつつ Tooltip でラップするためのラッパ。
const DisabledBottomNavAction = forwardRef<HTMLSpanElement, BottomNavigationActionProps>(
  function DisabledBottomNavAction(props, ref) {
    return (
      <Tooltip title={NAV_DISABLED_TOOLTIP} arrow>
        <span
          ref={ref}
          style={{ display: 'inline-flex', flex: 1, minWidth: 0 }}
        >
          <BottomNavigationAction {...props} />
        </span>
      </Tooltip>
    );
  },
);

interface BottomNavBarProps {
  items: NavigationItem[];
  user: SessionUserView;
}

export default function BottomNavBar({ items, user }: BottomNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = user !== null;

  const currentIndex = items.findIndex((item) => item.path === pathname);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <BottomNavigation
          sx={{ flex: 1 }}
          value={currentIndex !== -1 ? currentIndex : false}
          onChange={(_event, newValue: number) => {
            const next = items[newValue];
            if (next && !isNavItemDisabled(next, isAuthenticated)) {
              router.push(next.path);
            }
          }}
          showLabels
        >
          {items.map((item) => {
            const disabled = isNavItemDisabled(item, isAuthenticated);
            const ActionComponent = disabled
              ? DisabledBottomNavAction
              : BottomNavigationAction;
            return (
              <ActionComponent
                key={item.path}
                label={item.label}
                icon={item.icon}
                disabled={disabled}
                sx={{ minWidth: 'auto', px: 0.5 }}
              />
            );
          })}
        </BottomNavigation>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          <UserMenu user={user} variant="compact" />
        </Box>
      </Box>
    </Paper>
  );
}
