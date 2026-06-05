import type { ReactNode } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { FONT_MJ } from '@/theme/fonts';
import type { StudentDetailView } from '../types';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

interface StudentDetailProps {
  view: StudentDetailView;
}

/** 定義リストの 1 行（見出し＋値）。値は文字列または任意の ReactNode。 */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '11rem 1fr' },
        columnGap: 2,
        rowGap: 0,
        py: 0.25,
      }}
    >
      <Typography
        component="dt"
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      <Typography component="dd" variant="body1" sx={{ m: 0, wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Box>
  );
}

/** 漢字（姓・名）にカナをルビとして対応付けた氏名。一覧と同じ <ruby>/<rt>/<rp> 構造。 */
function RubyName({
  family,
  given,
  kanaFamily,
  kanaGiven,
  fontSize,
}: {
  family: string;
  given: string;
  kanaFamily: string;
  kanaGiven: string;
  fontSize: string;
}) {
  return (
    <Box component="span" sx={{ fontSize, lineHeight: 1.5 }}>
      <Box component="ruby">
        {family}
        <rp>（</rp>
        <Box component="rt" sx={{ fontSize: '0.45em', color: 'text.secondary' }}>
          {kanaFamily}
        </Box>
        <rp>）</rp>
      </Box>
      {FULLWIDTH_SPACE}
      <Box component="ruby">
        {given}
        <rp>（</rp>
        <Box component="rt" sx={{ fontSize: '0.45em', color: 'text.secondary' }}>
          {kanaGiven}
        </Box>
        <rp>）</rp>
      </Box>
    </Box>
  );
}

/**
 * 生徒詳細（閲覧）。Drizzle 行ではなく StudentDetailView のみを受け取る。
 * 正式氏名は MJ特有文字を含みうるため IPAmjexMincho で大きく表示する。
 */
export default function StudentDetail({ view }: StudentDetailProps) {
  return (
    <Stack spacing={1.5}>
      {/* 氏名ヘッダ：正式氏名（MJ フォント）＋フリガナ */}
      <Card variant="outlined">
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="caption" color="text.secondary">
            正式氏名
          </Typography>
          <Box
            sx={{
              fontFamily: FONT_MJ,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              lineHeight: 1.3,
              userSelect: 'text',
            }}
          >
            {view.officialFamilyName}
            {FULLWIDTH_SPACE}
            {view.officialGivenName}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              表示名（フリガナ）
            </Typography>
            <RubyName
              family={view.preferredFamilyName}
              given={view.preferredGivenName}
              kanaFamily={view.kanaFamilyName}
              kanaGiven={view.kanaGivenName}
              fontSize="1.5rem"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 基本情報 */}
      <Card variant="outlined">
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="h6" component="h2" gutterBottom>
            基本情報
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Box component="dl" sx={{ m: 0 }}>
            <Field label="生年月日">{view.birthDateLabel}</Field>
            <Field label="性別">{view.sexLabel}</Field>
            <Field label="国籍">{view.nationalityLabel}</Field>
            <Field label="ミドルネーム">{view.preferredMiddleName}</Field>
            <Field label="ミドルネーム（カナ）">{view.kanaMiddleName}</Field>
          </Box>
        </CardContent>
      </Card>

      {/* 在籍 */}
      <Card variant="outlined">
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="h6" component="h2" gutterBottom>
            在籍
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Box component="dl" sx={{ m: 0 }}>
            <Field label="学年・組">{view.gradeClassLabel}</Field>
            <Field label="出席番号">{view.attendanceLabel}</Field>
            <Field label="在籍状態">{view.enrollmentStatusLabel}</Field>
            <Field label="学校コード">{view.schoolCodeLabel}</Field>
            <Field label="入学日">{view.admissionDateLabel}</Field>
            <Field label="転入日">{view.transferInDateLabel}</Field>
            <Field label="転出日">{view.transferOutDateLabel}</Field>
            <Field label="卒業日">{view.graduationDateLabel}</Field>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
