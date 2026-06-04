'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FONT_MJ } from '@/theme/fonts';
import type { StudentView } from '../types';
import FamilyNameZoom from './FamilyNameZoom';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

/** セル左右パディング。xs（スマホ）ではスクロール無しで多くの列を見せるため狭める。 */
const CELL_PX = { xs: 0.25, sm: 1 };

type SortDir = 'asc' | 'desc';

interface StudentsTableProps {
  items: StudentView[];
}

/** 見出しに付ける列フィルタ（チェックボックスで表示する値を選ぶ Excel 風）。 */
function ColumnFilter({
  label,
  options,
  visible,
  onChange,
}: {
  label: string;
  options: string[];
  visible: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isFiltered = options.some((o) => !visible.has(o));

  const toggle = useCallback(
    (value: string) => {
      const next = new Set(visible);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      onChange(next);
    },
    [visible, onChange],
  );

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={`${label}で絞り込み`}
        color={isFiltered ? 'primary' : 'default'}
        sx={{ p: 0.25 }}
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
        <MenuItem dense onClick={() => onChange(new Set(options))}>
          <ListItemText>すべて表示</ListItemText>
        </MenuItem>
        <Divider />
        {options.map((o) => (
          <MenuItem key={o} dense onClick={() => toggle(o)}>
            <Checkbox size="small" checked={visible.has(o)} sx={{ p: 0.5, mr: 1 }} />
            <ListItemText>{o}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function StudentsTable({ items }: StudentsTableProps) {
  const gradeClassOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.gradeClassLabel))),
    [items],
  );
  const sexOptions = useMemo(() => Array.from(new Set(items.map((i) => i.sexLabel))), [items]);

  const [visibleGradeClass, setVisibleGradeClass] = useState<Set<string>>(
    () => new Set(items.map((i) => i.gradeClassLabel)),
  );
  const [visibleSex, setVisibleSex] = useState<Set<string>>(
    () => new Set(items.map((i) => i.sexLabel)),
  );
  // 生年月日のみ並べ替え可能（未ソート時は元の順＝学年→出席番号）
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const handleBirthDateSort = useCallback(() => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const rows = useMemo(() => {
    const filtered = items.filter(
      (i) => visibleGradeClass.has(i.gradeClassLabel) && visibleSex.has(i.sexLabel),
    );
    if (!sortDir) return filtered;

    const dir = sortDir === 'asc' ? 1 : -1;
    // Array.prototype.sort は安定なので、同値は元の順（学年→出席番号）を保つ
    return [...filtered].sort((a, b) => (a.birthDateMs - b.birthDateMs) * dir);
  }, [items, visibleGradeClass, visibleSex, sortDir]);

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        在籍する生徒がいません。
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX, textAlign: 'center' }}
            >
              {/* xs（スマホ）では幅節約のため短縮表記 */}
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>出席番号</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>出席#</Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                学年・組
                <ColumnFilter
                  label="学年・組"
                  options={gradeClassOptions}
                  visible={visibleGradeClass}
                  onChange={setVisibleGradeClass}
                />
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX }}>
              氏名
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX }}>
              正式苗字
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                性別
                <ColumnFilter
                  label="性別"
                  options={sexOptions}
                  visible={visibleSex}
                  onChange={setVisibleSex}
                />
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: CELL_PX }}>
              <TableSortLabel
                active={sortDir !== null}
                direction={sortDir ?? 'asc'}
                onClick={handleBirthDateSort}
              >
                生年月日
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  条件に一致する生徒がいません。
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ px: CELL_PX, textAlign: 'center' }}>{item.attendanceLabel}</TableCell>
                <TableCell sx={{ px: CELL_PX, whiteSpace: 'nowrap' }}>{item.gradeClassLabel}</TableCell>
                <TableCell sx={{ px: CELL_PX, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography component="span" variant="caption" color="text.secondary">
                      {item.kanaName}
                    </Typography>
                    {/* 表示名（preferred・JIS文字）は通常フォント */}
                    <Typography component="span" sx={{ fontSize: '1.05rem', lineHeight: 1.4 }}>
                      {item.preferredFamilyName}
                      {FULLWIDTH_SPACE}
                      {item.preferredGivenName}
                    </Typography>
                  </Box>
                </TableCell>
                {/* 正式苗字は MJ特有文字を含みうるため IPAmjexMincho で表示。preferred と同じなら ← */}
                <TableCell
                  sx={{ px: CELL_PX, whiteSpace: 'nowrap', fontFamily: FONT_MJ, fontSize: '1.575rem' }}
                >
                  {item.isOfficialSameAsPreferred ? (
                    <FamilyNameZoom familyName={item.officialFamilyName}>←</FamilyNameZoom>
                  ) : (
                    <FamilyNameZoom familyName={item.officialFamilyName} fontFamily={FONT_MJ}>
                      {item.officialFamilyName}
                    </FamilyNameZoom>
                  )}
                </TableCell>
                <TableCell sx={{ px: CELL_PX, textAlign: 'center' }}>{item.sexLabel}</TableCell>
                <TableCell sx={{ px: CELL_PX, whiteSpace: 'nowrap' }}>{item.birthDateLabel}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
