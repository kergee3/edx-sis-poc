import type { ReactNode } from 'react';
import { Alert, Box, Link, Paper, Stack, Typography } from '@mui/material';
import SailingIcon from '@mui/icons-material/Sailing';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SignInButton from '@/features/auth/components/SignInButton';

interface HomePlaceholderProps {
  /** ログイン中ならアカウント情報、未ログインなら null。 */
  account: { userName: string; schoolName: string; studentCount: number; isGuest: boolean } | null;
}

/** 小さな中学校の生徒定員（各学年 4 名 × …ではなく PoC の上限）。 */
const CAPACITY = 25;

/** ゲスト（未ログイン）向けの案内文（ヒーローの「ようこそ！」を除く本文）。 */
const GUEST_LINES = [
  'ログインすると、南の海にある小さな島の小さな中学校の校長先生になれます。',
  '校長先生はワンオペで全校生徒に対する先生と事務を兼ね、校務を行います。',
  '現在、各学年 4 名で合計 12 名の生徒が学んでいます。生徒の転入や転出もありますが、小さな中学校なので定員は 25 名に制限されています。',
  '原因は不明ですが、この島の住人の苗字は、何故か難しい漢字ばかりのようです…！',
];

/** 海・島の世界観に合わせたグラデーションのヒーローバナー。 */
function Hero({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3, sm: 4 },
        color: '#fff',
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 45%, #26c6da 100%)',
      }}
    >
      {/* 右下にうっすら大きなアイコンを置いて奥行きを出す装飾。 */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          right: { xs: -16, sm: 8 },
          bottom: { xs: -24, sm: -16 },
          opacity: 0.18,
          '& svg': { fontSize: { xs: 120, sm: 160 } },
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.5} sx={{ position: 'relative' }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.92 }}>
          {subtitle}
        </Typography>
      </Stack>
    </Box>
  );
}

/** 在籍状況の数値タイル（在籍 / 定員 / 受入可）。 */
function StatTile({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        p: { xs: 1.5, sm: 2 },
        textAlign: 'center',
        borderRadius: 2,
      }}
    >
      <Box sx={{ color: 'primary.main', '& svg': { fontSize: 28 } }}>{icon}</Box>
      <Typography variant="h5" component="p" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
        {value}
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.25 }}>
          名
        </Typography>
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

/** 案内文の段落ブロック。 */
function Narrative({ lines }: { lines: string[] }) {
  return (
    <Stack spacing={1}>
      {lines.map((line) => (
        <Typography key={line} variant="body1" sx={{ lineHeight: 1.9 }}>
          {line}
        </Typography>
      ))}
    </Stack>
  );
}

/**
 * ホームの本文。ログイン状態で案内文を出し分け、ゲストにはログインボタンを添える。
 * 末尾の SIS-PoC 説明＋About リンクはログイン状態に関係なく表示する。
 */
export default function HomePlaceholder({ account }: HomePlaceholderProps) {
  const available = account ? Math.max(0, CAPACITY - account.studentCount) : 0;

  return (
    <Stack spacing={3}>
      {account ? (
        <>
          <Hero
            icon={<SchoolIcon />}
            title={`${account.userName} さん、おかえりなさい`}
            subtitle={`南の海にある小さな島の ${account.schoolName} 校長`}
          />

          {account.isGuest && (
            <Alert severity="info">
              ゲスト利用中です。データはこのブラウザだけに保存されます。ブラウザを変えたり Cookie
              を消したりすると名簿は復元できません。
            </Alert>
          )}

          {/* 在籍状況を一目で。文章での「現在◯名／定員25名」はここに集約する。 */}
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
            <StatTile icon={<GroupsIcon />} value={account.studentCount} label="在籍生徒" />
            <StatTile icon={<EventSeatIcon />} value={CAPACITY} label="定員" />
            <StatTile icon={<PersonAddAlt1Icon />} value={available} label="受入可能" />
          </Stack>

          <Narrative
            lines={[
              `あなたは南の海にある小さな島の ${account.schoolName} の校長先生です。`,
              '校長先生はワンオペで全校生徒に対する先生と事務を兼ね、校務を行います。',
              '生徒の転入や転出もありますが、小さな中学校なので定員は 25 名に制限されています。',
            ]}
          />
        </>
      ) : (
        <>
          <Hero
            icon={<SailingIcon />}
            title="ようこそ！"
            subtitle="南の海にある小さな島の小さな中学校へ"
          />

          <Narrative lines={GUEST_LINES} />

          {/* ログイン導線をひとまとめにして目立たせる。 */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: 'action.hover' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              校長先生としてログイン
            </Typography>
            <SignInButton direction="row" />
          </Paper>
        </>
      )}

      {/* ログイン状態に関係なく表示する SIS-PoC の説明＋About リンク。 */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          bgcolor: 'action.hover',
        }}
      >
        <InfoOutlinedIcon color="action" sx={{ mt: 0.25 }} />
        <Typography variant="body2" color="text.secondary">
          SIS-PoC（Student Information System - Proof of Concept）は、校務支援システムの実証実験アプリです。
          詳しくは、<Link href="/about">こちら</Link> を参照してください。
        </Typography>
      </Paper>
    </Stack>
  );
}
