import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/layout/AppFooter';
import SignInButton from '@/features/auth/components/SignInButton';
import StudentDetail from '@/features/students/components/StudentDetail';
import StudentDetailNav from '@/features/students/components/StudentDetailNav';
import EnrollmentCertificateButton from '@/features/students/components/EnrollmentCertificateButton';
import { toCertificateView, toDetailView } from '@/features/students/services/format';
import { listRosterForUser } from '@/server/services/students';
import { getSchoolProfileForUser } from '@/server/services/user-preferences';
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

  // 名簿（学年→出席番号順）から現在地を求め、前/次の生徒 id を割り出す。
  // 認可は repository のクエリ条件に内包されるため、ここに出る id は自分の生徒のみ。
  const roster = await listRosterForUser(session.user.id);
  const index = roster.findIndex((e) => e.student.id === id);
  const entry = index === -1 ? null : roster[index];
  if (!entry) {
    notFound();
  }

  const prevId = index > 0 ? (roster[index - 1]?.student.id ?? null) : null;
  const nextId = index < roster.length - 1 ? (roster[index + 1]?.student.id ?? null) : null;

  const view = toDetailView(entry);

  // 在籍証明書には学校プロフィール（学校名・住所・校長氏名）と発行日（本日）を合成する。
  const school = await getSchoolProfileForUser(session.user.id, session.user.name ?? null);
  const certificate = toCertificateView(entry, school, new Date());

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 0.5 }}>
          <Link href="/students" style={{ textDecoration: 'none' }}>
            <Button component="span" startIcon={<ArrowBackIcon />} size="small">
              生徒一覧へ戻る
            </Button>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <StudentDetailNav prevId={prevId} nextId={nextId} />
          <Box sx={{ ml: 'auto' }}>
            <EnrollmentCertificateButton certificate={certificate} />
          </Box>
        </Box>

        <StudentDetail view={view} />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
