'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AppFooter from '@/components/layout/AppFooter';

export default function PrivatePage() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LockIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            Private
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          このページはナビゲーションバーには表示されません。URL を直接指定した場合のみアクセスできます。
        </Typography>

        <AppFooter />
      </CardContent>
    </Card>
  );
}
