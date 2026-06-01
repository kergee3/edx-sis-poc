import { Box, Card, CardContent, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AppFooter from '@/components/layout/AppFooter';
import EduPlaceholder from '@/features/edu/components/EduPlaceholder';
import SignInButton from '@/features/auth/components/SignInButton';
import { auth } from '@/server/auth/config';

export default async function EduPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SchoolIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            教育
          </Typography>
        </Box>

        {session?.user?.id ? (
          <EduPlaceholder />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              教育関連の証明書を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
