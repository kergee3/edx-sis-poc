'use client';

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import {
  NAV_DISABLED_TOOLTIP,
  isNavItemDisabled,
  type NavigationItem,
} from '@/types/navigation';
import type { SessionUserView } from '@/features/auth/types';
import BugReportButton from './BugReportButton';
import UserMenu from './UserMenu';

interface SidebarProps {
  items: NavigationItem[];
  user: SessionUserView;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  width?: number;
}

export const DRAWER_WIDTH = 240;
export const MOBILE_DRAWER_WIDTH = 160;

export default function Sidebar({ items, user, isMobile = false, onClose, width }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerWidth = width ?? (isMobile ? MOBILE_DRAWER_WIDTH : DRAWER_WIDTH);
  const isAuthenticated = user !== null;

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <Box
      sx={{
        width: `calc(${drawerWidth}px + env(safe-area-inset-left))`,
        flexShrink: 0,
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        bottom: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
        zIndex: 1200,
        paddingLeft: 'env(safe-area-inset-left)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <List sx={{ pt: 1, px: 0 }}>
        {items.map((item) => {
          const disabled = isNavItemDisabled(item, isAuthenticated);
          const button = (
            <ListItemButton
              selected={pathname === item.path}
              disabled={disabled}
              onClick={() => {
                if (!disabled) handleNavigation(item.path);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
          return (
            <ListItem key={item.path} disablePadding>
              {disabled ? (
                <Tooltip title={NAV_DISABLED_TOOLTIP} placement="right" arrow>
                  <span style={{ width: '100%' }}>{button}</span>
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <BugReportButton user={user} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <UserMenu user={user} variant="compact" />
        </Box>
      </Box>
    </Box>
  );
}
