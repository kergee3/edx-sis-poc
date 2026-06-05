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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seq?: string }>;
}) {
  const { id } = await params;
  const { seq } = await searchParams;
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

  // 名簿（学年→出席番号順）。認可は repository のクエリ条件に内包されるため、自分の生徒のみ。
  const roster = await listRosterForUser(session.user.id);
  const entry = roster.find((e) => e.student.id === id) ?? null;
  if (!entry) {
    notFound();
  }

  // ナビ順序＝一覧で見えていた順（seq）を尊重する。クライアントを信用せず、
  // 自分の名簿に実在する id だけを seq の順で残す。seq が無い/現在地を含まない場合は名簿順。
  const rosterIds = new Set(roster.map((e) => e.student.id));
  const seqIds = seq ? seq.split(',').filter((sid) => rosterIds.has(sid)) : [];
  const useSeq = seqIds.length > 0 && seqIds.includes(id);
  const orderIds = useSeq ? seqIds : roster.map((e) => e.student.id);

  const index = orderIds.indexOf(id);
  const prevId = index > 0 ? (orderIds[index - 1] ?? null) : null;
  const nextId = index < orderIds.length - 1 ? (orderIds[index + 1] ?? null) : null;
  // 前後ナビでも同じフィルタ文脈を保つため seq を引き継ぐ（名簿順フォールバック時は付けない）。
  const navSeq = useSeq ? orderIds.join(',') : null;

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
          <StudentDetailNav
            prevId={prevId}
            nextId={nextId}
            position={index + 1}
            total={orderIds.length}
            seq={navSeq}
          />
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
