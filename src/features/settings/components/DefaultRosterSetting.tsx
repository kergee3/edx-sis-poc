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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { resetRosterToDefaultAction } from '../actions';

interface DefaultRosterSettingProps {
  /** 初期名簿 xlsx のシート名（ファイル内の並び順。先頭が既定）。 */
  sheetNames: string[];
}

/**
 * 「名簿の初期化」設定。
 * 初期名簿 xlsx（public/poc-data/initial-student-roster.xlsx）から選んだシートの内容で
 * 名簿を初期化し直す。既定は先頭のシート（現在は "v2"）。
 * 既存名簿を破棄する破壊的操作のため、実行前に確認ダイアログを挟む。
 */
export default function DefaultRosterSetting({ sheetNames }: DefaultRosterSettingProps) {
  const [sheet, setSheet] = useState(sheetNames[0] ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleSheetChange = (e: SelectChangeEvent) => setSheet(e.target.value);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await resetRosterToDefaultAction(sheet || undefined);
      setConfirmOpen(false);
      if (result.ok) {
        setSnack({ severity: 'success', message: `「${sheet}」で名簿を初期化しました` });
        return;
      }
      const message =
        result.error === 'unauthorized'
          ? 'サインインが必要です'
          : result.error === 'invalid_input'
            ? '選択したシートが見つかりませんでした。ページを再読み込みしてください'
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
        初期名簿ファイルの選んだシートの内容で名簿を作り直します。現在の名簿は破棄されます。
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }} disabled={sheetNames.length === 0 || isPending}>
          <InputLabel id="roster-sheet-label">名簿シート</InputLabel>
          <Select
            labelId="roster-sheet-label"
            label="名簿シート"
            value={sheet}
            onChange={handleSheetChange}
          >
            {sheetNames.map((name, i) => (
              <MenuItem key={name} value={name}>
                {name}
                {i === 0 ? '（既定）' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          color="error"
          startIcon={<GroupAddIcon />}
          onClick={() => setConfirmOpen(true)}
          loading={isPending}
          disabled={sheet === ''}
        >
          この名簿で初期化する
        </Button>
      </Box>

      {sheetNames.length === 0 && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          初期名簿ファイルのシートを読み込めませんでした。
        </Typography>
      )}

      <Dialog open={confirmOpen} onClose={() => (isPending ? undefined : setConfirmOpen(false))}>
        <DialogTitle>名簿を初期化しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            現在の名簿をすべて破棄し、シート「{sheet}」の内容で作り直します。
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
