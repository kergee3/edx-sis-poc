import { Box, Card, CardContent, Typography } from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AppFooter from '@/components/layout/AppFooter';
import InteropPlaceholder from '@/features/interop/components/InteropPlaceholder';
import SignInButton from '@/features/auth/components/SignInButton';
import { auth } from '@/server/auth/config';

export default async function InteropPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SyncAltIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            データ連携
          </Typography>
        </Box>

        {session?.user?.id ? (
          <InteropPlaceholder />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              データ連携を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
