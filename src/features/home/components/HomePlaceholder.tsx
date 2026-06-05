import { Box, Link, Stack, Typography } from '@mui/material';
import SignInButton from '@/features/auth/components/SignInButton';

interface HomePlaceholderProps {
  /** ログイン中ならアカウント情報、ゲスト（未ログイン）なら null。 */
  account: { userName: string; schoolName: string; studentCount: number } | null;
}

/** ゲスト（未ログイン）向けの案内文。 */
const GUEST_LINES = [
  'ようこそ！',
  'ログインすると、南の海にある小さな島の小さな中学校の校長先生になれます。',
  '校長先生はワンオペで全校生徒に対する先生と事務を兼ね、校務を行います。',
  '最初は、各学年 4 名で合計 12 名の生徒が学んでいます。',
  '生徒の転入や転出もありますが、小さな中学校なので定員は 25 名に制限されています。',
];

/**
 * ホームの本文。ログイン状態で案内文を出し分け、ゲストにはログインボタンを添える。
 * 末尾の SIS-PoC 説明＋About リンクはログイン状態に関係なく表示する。
 */
export default function HomePlaceholder({ account }: HomePlaceholderProps) {
  const lines = account
    ? [
        `${account.userName}さん、あなたは南の海にある小さな島の${account.schoolName}の校長先生です。`,
        '校長先生はワンオペで全校生徒に対する先生と事務を兼ね、校務を行います。',
        `現在、${account.studentCount} 名の生徒が学んでいます。`,
        '生徒の転入や転出もありますが、小さな中学校なので定員は 25 名に制限されています。',
      ]
    : GUEST_LINES;

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        {lines.map((line) => (
          <Typography key={line} variant="body1">
            {line}
          </Typography>
        ))}
      </Stack>

      {!account && (
        <Box sx={{ mb: 3 }}>
          <SignInButton />
        </Box>
      )}

      <Typography variant="body2" color="text.secondary">
        SIS-PoC（Student Information System - Proof of Concept）は、校務支援システムの実証実験アプリです。
        詳しくは、<Link href="/about">こちら</Link> を参照してください。
      </Typography>
    </Box>
  );
}
