import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

interface StudentDetailNavProps {
  /** 前の生徒の自然キー。最初の生徒なら null（左矢印をグレーアウト）。 */
  prevKey: string | null;
  /** 次の生徒の自然キー。最後の生徒なら null（右矢印をグレーアウト）。 */
  nextKey: string | null;
  /** 名簿順での現在地（1 始まり）。 */
  position: number;
  /** 名簿の総数。 */
  total: number;
}

/** 枠付きの矢印ボタン 1 つ。key があれば Link、なければ disabled（グレーアウト）。 */
function NavArrow({
  navKey,
  label,
  icon,
}: {
  navKey: string | null;
  label: string;
  icon: React.ReactNode;
}) {
  const sx = { border: 1, borderColor: 'divider', borderRadius: 1 } as const;

  if (navKey == null) {
    return (
      <IconButton disabled aria-label={label} sx={sx}>
        {icon}
      </IconButton>
    );
  }
  return (
    <Link href={`/students/${navKey}`} aria-label={label} style={{ textDecoration: 'none' }}>
      <IconButton component="span" color="primary" sx={sx}>
        {icon}
      </IconButton>
    </Link>
  );
}

/**
 * 生徒詳細の前後ナビゲーション。名簿順（学年→出席番号）で前/次の生徒へ移動する。
 * 最初/最後の生徒では対応する矢印をグレーアウト（disabled）にする。
 */
export default function StudentDetailNav({
  prevKey,
  nextKey,
  position,
  total,
}: StudentDetailNavProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
      <NavArrow navKey={prevKey} label="前の生徒" icon={<ArrowBackIcon />} />
      <NavArrow navKey={nextKey} label="次の生徒" icon={<ArrowForwardIcon />} />
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {position}/{total}
      </Typography>
    </Box>
  );
}
