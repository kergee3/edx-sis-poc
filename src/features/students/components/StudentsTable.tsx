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

type SortKey = 'gradeClass' | 'sex' | 'birthDate';
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
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  }, []);

  const rows = useMemo(() => {
    const filtered = items.filter(
      (i) => visibleGradeClass.has(i.gradeClassLabel) && visibleSex.has(i.sexLabel),
    );
    if (!sort) return filtered;

    const dir = sort.dir === 'asc' ? 1 : -1;
    // Array.prototype.sort は安定なので、同値は元の順（学年→出席番号）を保つ
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'gradeClass') {
        cmp = a.gradeSort - b.gradeSort;
        if (cmp === 0) cmp = a.gradeClassLabel.localeCompare(b.gradeClassLabel, 'ja');
      } else if (sort.key === 'sex') {
        cmp = a.sexLabel.localeCompare(b.sexLabel, 'ja');
      } else {
        cmp = a.birthDateMs - b.birthDateMs;
      }
      return cmp * dir;
    });
  }, [items, visibleGradeClass, visibleSex, sort]);

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
              sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1, textAlign: 'center' }}
            >
              出席番号
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <TableSortLabel
                  active={sort?.key === 'gradeClass'}
                  direction={sort?.key === 'gradeClass' ? sort.dir : 'asc'}
                  onClick={() => handleSort('gradeClass')}
                >
                  学年・組
                </TableSortLabel>
                <ColumnFilter
                  label="学年・組"
                  options={gradeClassOptions}
                  visible={visibleGradeClass}
                  onChange={setVisibleGradeClass}
                />
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              氏名
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              正式苗字
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                <TableSortLabel
                  active={sort?.key === 'sex'}
                  direction={sort?.key === 'sex' ? sort.dir : 'asc'}
                  onClick={() => handleSort('sex')}
                >
                  性別
                </TableSortLabel>
                <ColumnFilter
                  label="性別"
                  options={sexOptions}
                  visible={visibleSex}
                  onChange={setVisibleSex}
                />
              </Box>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              <TableSortLabel
                active={sort?.key === 'birthDate'}
                direction={sort?.key === 'birthDate' ? sort.dir : 'asc'}
                onClick={() => handleSort('birthDate')}
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
                <TableCell sx={{ px: 1, textAlign: 'center' }}>{item.attendanceLabel}</TableCell>
                <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>{item.gradeClassLabel}</TableCell>
                <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
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
                  sx={{ px: 1, whiteSpace: 'nowrap', fontFamily: FONT_MJ, fontSize: '1.575rem' }}
                >
                  {item.isOfficialSameAsPreferred ? (
                    <FamilyNameZoom familyName={item.officialFamilyName}>←</FamilyNameZoom>
                  ) : (
                    <FamilyNameZoom familyName={item.officialFamilyName} fontFamily={FONT_MJ}>
                      {item.officialFamilyName}
                    </FamilyNameZoom>
                  )}
                </TableCell>
                <TableCell sx={{ px: 1, textAlign: 'center' }}>{item.sexLabel}</TableCell>
                <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>{item.birthDateLabel}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
