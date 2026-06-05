import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/layout/AppFooter';
import SignInButton from '@/features/auth/components/SignInButton';
import StudentDetail from '@/features/students/components/StudentDetail';
import { toDetailView } from '@/features/students/services/format';
import { getStudentForUser } from '@/server/services/students';
import { auth } from '@/server/auth/config';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              生徒の詳細を見るにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
          <AppFooter />
        </CardContent>
      </Card>
    );
  }

  const entry = await getStudentForUser(session.user.id, id);
  if (!entry) {
    notFound();
  }

  const view = toDetailView(entry);

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Link href="/students" style={{ textDecoration: 'none' }}>
            <Button component="span" startIcon={<ArrowBackIcon />} size="small">
              生徒一覧へ戻る
            </Button>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PeopleAltIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ mb: 0 }}>
            生徒詳細
          </Typography>
        </Box>

        <StudentDetail view={view} />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
