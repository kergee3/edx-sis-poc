import { Box, Card, CardContent, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AppFooter from '@/components/layout/AppFooter';
import GovPlaceholder from '@/features/gov/components/GovPlaceholder';
import SignInButton from '@/features/auth/components/SignInButton';
import { auth } from '@/server/auth/config';

export default async function GovPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            行政
          </Typography>
        </Box>

        {session?.user?.id ? (
          <GovPlaceholder />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              行政関連の証明書を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
