'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import PersonRemoveAlt1Icon from '@mui/icons-material/PersonRemoveAlt1';
import { FONT_MJ } from '@/theme/fonts';
import type { StudentDetailView } from '../types';
import { transferOutStudentAction } from '../actions';
import { transferOutErrorMessage } from '../error-messages';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

interface TransferOutStudentButtonProps {
  /** 削除対象の生徒 id（UUID）。認可はサーバ側で owner と突き合わせる。 */
  studentId: string;
  /** 確認ダイアログに表示する生徒の情報（Drizzle 行ではなく整形済み ViewModel）。 */
  view: StudentDetailView;
}

/** 概要カードの 1 項目（見出し＋値）。 */
function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}

/**
 * 生徒詳細の [転出] ボタン＋確認ダイアログ。
 * 押下で対象生徒の情報を確認ダイアログに表示し、[キャンセル]/[転出] で操作する。
 * [転出] 確定で在籍を「転出」にし転出日を記録する（行は消さず記録として残す。出席番号は
 * 再採番せず欠番になる）。転出後は名簿一覧・詳細ナビから外れ詳細ページも 404 になるため、
 * 一覧（/students）へ戻る。
 */
export default function TransferOutStudentButton({
  studentId,
  view,
}: TransferOutStudentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    setError(null);
    setOpen(true);
  };

  const closeDialog = () => {
    if (pending) return;
    setOpen(false);
  };

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await transferOutStudentAction(studentId);
      if (res.ok) {
        setOpen(false);
        // 転出後はこの生徒が名簿一覧から外れ詳細も辿れなくなるので一覧へ戻し、名簿を最新化する。
        router.push('/students');
        router.refresh();
      } else {
        setError(transferOutErrorMessage(res.error));
      }
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<PersonRemoveAlt1Icon />}
        onClick={openDialog}
        sx={{ whiteSpace: 'nowrap' }}
      >
        転出
      </Button>

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>転出の確認</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            次の生徒を転出させます。名簿の一覧からは外れますが、転出日つきで記録は残ります。内容を確認し、[転出]
            で確定してください。
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Item label="学年・組・出席番号">
                <Typography>
                  {view.gradeClassLabel}　出席番号:{view.attendanceLabel}
                </Typography>
              </Item>
              <Item label="正式氏名（MJ）">
                <Typography sx={{ fontFamily: FONT_MJ, fontSize: '2rem', lineHeight: 1.3 }}>
                  {view.officialFamilyName}
                  {FULLWIDTH_SPACE}
                  {view.officialGivenName}
                </Typography>
              </Item>
              <Item label="表示名">
                <Typography sx={{ fontSize: '1.4rem' }}>
                  {view.preferredFamilyName}
                  {FULLWIDTH_SPACE}
                  {view.preferredGivenName}
                </Typography>
              </Item>
              <Item label="フリガナ">
                <Typography>
                  {view.kanaFamilyName}
                  {FULLWIDTH_SPACE}
                  {view.kanaGivenName}
                </Typography>
              </Item>
              <Stack direction="row" spacing={4} useFlexGap flexWrap="wrap">
                <Item label="性別">
                  <Typography>{view.sexLabel}</Typography>
                </Item>
                <Item label="生年月日">
                  <Typography>{view.birthDateLabel}</Typography>
                </Item>
              </Stack>
            </Stack>
          </Paper>
          <Alert severity="warning" sx={{ mt: 2 }}>
            転出した出席番号は再採番せず、欠番になります。
          </Alert>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={pending}>
            キャンセル
          </Button>
          <Button variant="contained" color="error" onClick={confirm} disabled={pending}>
            転出
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
