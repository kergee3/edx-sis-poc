'use client';

import { useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { resetRosterToDefaultAction } from '../actions';

/**
 * 「既定の名簿に設定する」設定。
 * マスタ名簿 xlsx（public/poc-data/master-student-roster.xlsx）の内容で名簿を初期化し直す。
 * 既存名簿を破棄する破壊的操作のため、実行前に確認ダイアログを挟む。
 */
export default function DefaultRosterSetting() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await resetRosterToDefaultAction();
      setConfirmOpen(false);
      if (result.ok) {
        setSnack({ severity: 'success', message: '既定の名簿で初期化しました' });
        return;
      }
      const message =
        result.error === 'unauthorized'
          ? 'サインインが必要です'
          : '名簿の初期化に失敗しました。時間をおいて再度お試しください';
      setSnack({ severity: 'error', message });
    });
  };

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GroupAddIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          名簿の初期化
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        既定の名簿（マスタ名簿）の内容で名簿を作り直します。現在の名簿は破棄されます。
      </Typography>
      <Button
        variant="outlined"
        color="error"
        startIcon={<GroupAddIcon />}
        onClick={() => setConfirmOpen(true)}
        loading={isPending}
      >
        既定の名簿に設定する
      </Button>

      <Dialog open={confirmOpen} onClose={() => (isPending ? undefined : setConfirmOpen(false))}>
        <DialogTitle>既定の名簿に設定しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            現在の名簿をすべて破棄し、既定の名簿（マスタ名簿）の内容で作り直します。
            この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} color="error" variant="contained" loading={isPending}>
            初期化する
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack !== null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
