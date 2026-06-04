import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FONT_MJ } from '@/theme/fonts';
import type { StudentView } from '../types';
import FamilyNameZoom from './FamilyNameZoom';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

interface StudentsTableProps {
  items: StudentView[];
}

export default function StudentsTable({ items }: StudentsTableProps) {
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
              学年・組
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              氏名
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              正式苗字
            </TableCell>
            <TableCell
              sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1, textAlign: 'center' }}
            >
              性別
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}>
              生年月日
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ px: 1, textAlign: 'center' }}>{item.attendanceLabel}</TableCell>
              <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>{item.gradeClassLabel}</TableCell>
              <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {/* 表示名（preferred・JIS文字）は通常フォント */}
                  <Typography component="span" sx={{ fontSize: '1.05rem', lineHeight: 1.4 }}>
                    {item.preferredFamilyName}
                    {FULLWIDTH_SPACE}
                    {item.preferredGivenName}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary">
                    {item.kanaName}
                  </Typography>
                </Box>
              </TableCell>
              {/* 正式苗字は MJ特有文字を含みうるため IPAmjexMincho で表示。preferred と同じなら ← */}
              <TableCell
                sx={{ px: 1, whiteSpace: 'nowrap', fontFamily: FONT_MJ, fontSize: '1.05rem' }}
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
