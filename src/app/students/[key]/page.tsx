import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/layout/AppFooter';
import SignInButton from '@/features/auth/components/SignInButton';
import StudentDetail from '@/features/students/components/StudentDetail';
import StudentDetailNav from '@/features/students/components/StudentDetailNav';
import StudentDisplayNameEditor from '@/features/students/components/StudentDisplayNameEditor';
import TransferOutStudentButton from '@/features/students/components/TransferOutStudentButton';
import EnrollmentCertificateButton from '@/features/students/components/EnrollmentCertificateButton';
import { toCertificateView, toDetailView } from '@/features/students/services/format';
import {
  buildStudentKey,
  enrollmentMatchesKey,
  parseStudentKey,
} from '@/features/students/services/student-key';
import { listRosterForUser } from '@/server/services/students';
import { buildMappingRecordFromRoster } from '@/server/services/gakureibo-import';
import { getSchoolProfileForUser } from '@/server/services/user-preferences';
import { auth } from '@/server/auth/config';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
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

  // URL の自然キー（学年-組-出席番号）を解析。形式不一致は 404。
  const parsed = parseStudentKey(key);
  if (!parsed) {
    notFound();
  }

  // 名簿（学年→出席番号順）。認可は repository のクエリ条件に内包されるため、自分の生徒のみ。
  const roster = await listRosterForUser(session.user.id);
  const index = roster.findIndex((e) => enrollmentMatchesKey(e.enrollment, parsed));
  if (index < 0) {
    notFound();
  }
  const entry = roster[index]!;

  // 前後ナビは名簿順（findRosterByOwner が学年→出席番号 昇順）で隣の生徒の自然キーへ。
  const prevKey = index > 0 ? buildStudentKey(roster[index - 1]!.enrollment) : null;
  const nextKey =
    index < roster.length - 1 ? buildStudentKey(roster[index + 1]!.enrollment) : null;

  const view = toDetailView(entry);

  // 表示名（姓）編集ダイアログ用に、正式氏名 → JIS X 0213 の写像を組み立てる。
  const mappingRecord = await buildMappingRecordFromRoster(entry);

  // 在学証明書には学校プロフィール（学校名・住所・校長氏名）と発行日（本日）を合成する。
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

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <StudentDetailNav
            prevKey={prevKey}
            nextKey={nextKey}
            position={index + 1}
            total={roster.length}
          />
          <StudentDisplayNameEditor record={mappingRecord} />
          <TransferOutStudentButton studentId={entry.student.id} view={view} />
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
