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
  let account: {
    userName: string;
    schoolName: string;
    studentCount: number;
    isGuest: boolean;
  } | null = null;
  if (session?.user?.id) {
    const [roster, school] = await Promise.all([
      listRosterForUser(session.user.id),
      getSchoolProfileForUser(session.user.id, session.user.name ?? null),
    ]);
    account = {
      // ヒーローの呼びかけは設定の「校長氏名」を優先（未設定なら既定でログイン名が入る）。
      userName: school.principalName || session.user.name || '校長先生',
      schoolName: school.schoolName,
      studentCount: roster.length,
      isGuest: session.user.isGuest,
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
