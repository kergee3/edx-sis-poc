import { Box, Button, Card, CardContent, Link, Typography } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              {/* GET ダウンロード。Server Component から Next の Link を component に渡すと
                  関数が渡せずエラーになるため、素の <a>（component="a"）で受ける。 */}
              <Button
                component="a"
                href="/api/students/export"
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
              >
                Excel出力
              </Button>
            </Box>
            <StudentsTable items={(await listRosterForUser(session.user.id)).map(toView)} />
            <Box
              component="ul"
              sx={{ mt: 2, pl: 3, m: 0, '& li': { mt: 0.5 }, '& li:first-of-type': { mt: 0 } }}
            >
              <Typography component="li" variant="body2" color="text.secondary">
                丸で囲まれた出席番号をクリックすると、該当する生徒の詳細を確認できます。さらに、在学証明書も発行できます。
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
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
            </Box>
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
