'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { signInWithGoogle, signInWithLine, signOutAction } from '@/features/auth/actions';
import type { SessionUserView } from '@/features/auth/types';

interface UserMenuProps {
  user: SessionUserView;
  variant?: 'default' | 'compact';
}

export default function UserMenu({ user, variant = 'default' }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const label = user?.name ?? user?.email ?? 'ゲスト';

  const avatar =
    user?.image != null ? (
      <Avatar src={user.image} alt={label} sx={{ width: 24, height: 24 }} />
    ) : (
      <AccountCircleIcon />
    );

  const isCompact = variant === 'compact';

  const menuAnchorOrigin = isCompact
    ? ({ vertical: 'top', horizontal: 'left' } as const)
    : ({ vertical: 'bottom', horizontal: 'right' } as const);

  const menuTransformOrigin = isCompact
    ? ({ vertical: 'bottom', horizontal: 'left' } as const)
    : ({ vertical: 'top', horizontal: 'right' } as const);

  const buttonSx = isCompact
    ? {
        color: 'text.primary',
        textTransform: 'none' as const,
        maxWidth: '100%',
        justifyContent: 'flex-start',
        '& .MuiButton-startIcon': { mr: 1 },
      }
    : {
        color: 'inherit',
        textTransform: 'none' as const,
        maxWidth: 220,
      };

  return (
    <>
      <Button
        onClick={handleOpen}
        startIcon={avatar}
        size={isCompact ? 'small' : 'medium'}
        sx={buttonSx}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={menuAnchorOrigin}
        transformOrigin={menuTransformOrigin}
      >
        {user ? (
          [
            <MenuItem key="settings" component={Link} href="/settings" onClick={handleClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>設定</ListItemText>
            </MenuItem>,
            <MenuItem key="about" component={Link} href="/about" onClick={handleClose}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>About</ListItemText>
            </MenuItem>,
            <MenuItem
              key="login-history"
              component={Link}
              href="/login-history"
              onClick={handleClose}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>ログイン履歴</ListItemText>
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem
              key="logout"
              onClick={() => {
                handleClose();
                void signOutAction();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>ログアウト</ListItemText>
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="about" component={Link} href="/about" onClick={handleClose}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>About</ListItemText>
            </MenuItem>,
            <MenuItem
              key="login-google"
              onClick={() => {
                handleClose();
                void signInWithGoogle();
              }}
            >
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Google でログイン</ListItemText>
            </MenuItem>,
            <MenuItem
              key="login-line"
              onClick={() => {
                handleClose();
                void signInWithLine();
              }}
            >
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>LINE でログイン</ListItemText>
            </MenuItem>,
          ]
        )}
      </Menu>
    </>
  );
}
