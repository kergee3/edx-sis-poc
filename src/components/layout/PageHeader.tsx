import type { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  settingsHref?: string;
}

export default function PageHeader({ icon, title, settingsHref }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Box
          sx={{
            mr: 1.5,
            display: 'flex',
            alignItems: 'center',
            '& .MuiSvgIcon-root': { fontSize: 32, color: 'primary.main' },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h4" component="h1" sx={{ mb: 0 }}>
          {title}
        </Typography>
      </Box>
      {settingsHref && (
        <Link href={settingsHref} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Button
            component="span"
            startIcon={<SettingsIcon />}
            sx={{
              minWidth: 'auto',
              px: { xs: 1.25, sm: 2 },
              '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
            }}
          >
            設定
          </Button>
        </Link>
      )}
    </Box>
  );
}
