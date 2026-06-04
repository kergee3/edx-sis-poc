import { Box, Card, CardContent, Link, Typography } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AppFooter from '@/components/layout/AppFooter';
import SignInButton from '@/features/auth/components/SignInButton';
import StudentsTable from '@/features/students/components/StudentsTable';
import { toView } from '@/features/students/services/format';
import { listRosterForUser } from '@/server/services/students';
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
          <>
            <StudentsTable items={(await listRosterForUser(session.user.id)).map(toView)} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              正式苗字は{' '}
              <Link
                href="https://ipamjexmincho.shumy.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                IPAmjexMincho Web フォント
              </Link>
              で表示しているため、JIS X 0213に含まれない文字情報基盤の文字も正しく表示されます。
            </Typography>
          </>
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
