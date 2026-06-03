import { Box, Card, CardContent, Typography } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AppFooter from '@/components/layout/AppFooter';
import StudentsPlaceholder from '@/features/students/components/StudentsPlaceholder';
import SignInButton from '@/features/auth/components/SignInButton';
import { auth } from '@/server/auth/config';

export default async function StudentsPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleAltIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            生徒一覧
          </Typography>
        </Box>

        {session?.user?.id ? (
          <StudentsPlaceholder />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              生徒名簿を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
