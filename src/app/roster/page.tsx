import { Box, Card, CardContent, Typography } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AppFooter from '@/components/layout/AppFooter';
import RosterPlaceholder from '@/features/roster/components/RosterPlaceholder';
import SignInButton from '@/features/auth/components/SignInButton';
import { auth } from '@/server/auth/config';

export default async function RosterPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleAltIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            名簿
          </Typography>
        </Box>

        {session?.user?.id ? (
          <RosterPlaceholder />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              名簿情報を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
