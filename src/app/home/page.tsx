import { Box, Card, CardContent, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AppFooter from '@/components/layout/AppFooter';
import HomePlaceholder from '@/features/home/components/HomePlaceholder';
import { listRosterForUser } from '@/server/services/students';
import { getSchoolProfileForUser } from '@/server/services/user-preferences';
import { auth } from '@/server/auth/config';

export default async function HomePage() {
  const session = await auth();

  // ログイン時のみ学校名と在籍数を取得して案内文に差し込む。
  let account: { userName: string; schoolName: string; studentCount: number } | null = null;
  if (session?.user?.id) {
    const [roster, school] = await Promise.all([
      listRosterForUser(session.user.id),
      getSchoolProfileForUser(session.user.id, session.user.name ?? null),
    ]);
    account = {
      userName: session.user.name ?? (school.principalName || '校長先生'),
      schoolName: school.schoolName,
      studentCount: roster.length,
    };
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HomeIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            ホーム
          </Typography>
        </Box>

        <HomePlaceholder account={account} />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
