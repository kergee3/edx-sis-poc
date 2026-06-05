import { Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

interface StudentDetailNavProps {
  /** 前の生徒の id。最初の生徒なら null（左矢印をグレーアウト）。 */
  prevId: string | null;
  /** 次の生徒の id。最後の生徒なら null（右矢印をグレーアウト）。 */
  nextId: string | null;
}

/** 枠付きの矢印ボタン 1 つ。id があれば Link、なければ disabled（グレーアウト）。 */
function NavArrow({
  id,
  label,
  icon,
}: {
  id: string | null;
  label: string;
  icon: React.ReactNode;
}) {
  const sx = { border: 1, borderColor: 'divider', borderRadius: 1 } as const;

  if (id == null) {
    return (
      <IconButton disabled aria-label={label} sx={sx}>
        {icon}
      </IconButton>
    );
  }
  return (
    <Link href={`/students/${id}`} aria-label={label} style={{ textDecoration: 'none' }}>
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
export default function StudentDetailNav({ prevId, nextId }: StudentDetailNavProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
      <NavArrow id={prevId} label="前の生徒" icon={<ArrowBackIcon />} />
      <NavArrow id={nextId} label="次の生徒" icon={<ArrowForwardIcon />} />
    </Box>
  );
}
