'use client';

import { useState, useTransition } from 'react';
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Snackbar,
  Typography,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { saveMjMappingSourceAction } from '../actions';
import type { MjMappingSourceInput } from '../schema/mj-mapping-source';

interface MjMappingSourceSettingProps {
  /** サーバから取得した初期値。 */
  initial: MjMappingSourceInput;
}

/**
 * 表示名編集（生徒詳細・転入）の「JIS X 0213 対応付け候補」の生成元設定。
 * ローカルの MJ 縮退マップ（複数候補を提示）か、maji.shumi.dev の MJ→JIS 変換 Web API
 * （1 字につき候補 1 件を提示）かを選ぶ。user_preferences に永続化（学校情報と同系統）。
 */
export default function MjMappingSourceSetting({ initial }: MjMappingSourceSettingProps) {
  const [value, setValue] = useState<MjMappingSourceInput>(initial);
  const [snack, setSnack] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value as MjMappingSourceInput;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const result = await saveMjMappingSourceAction(next);
      if (result.ok) {
        setSnack({ severity: 'success', message: '対応付け候補の生成元を保存しました' });
        return;
      }
      setValue(prev);
      const message =
        result.error === 'unauthorized' ? 'サインインが必要です' : '保存に失敗しました。時間をおいて再度お試しください';
      setSnack({ severity: 'error', message });
    });
  };

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TranslateIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          JIS X 0213 対応付け候補の生成元
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        表示名編集（生徒詳細・転入）で、正式氏名（姓）の MJ 特有文字を JIS X 0213
        へ対応付ける際の候補の出し方です。
      </Typography>
      <FormControl component="fieldset" disabled={isPending}>
        <FormLabel component="legend" sx={{ display: 'none' }}>
          JIS X 0213 対応付け候補の生成元
        </FormLabel>
        <RadioGroup
          aria-label="mj-mapping-source"
          name="mj-mapping-source"
          value={value}
          onChange={handleChange}
        >
          <FormControlLabel
            value="api"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">Web API（maji.shumi.dev）（既定）</Typography>
                <Typography variant="caption" color="text.secondary">
                  外部の MJ→JIS 変換 API で 1 字につき候補 1 件を提示（一意に解決）。
                  通信できない場合は自動的にローカルへ切り替わります
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="local"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">ローカル</Typography>
                <Typography variant="caption" color="text.secondary">
                  アプリ内蔵の MJ 縮退マップから、代表字・異体字を複数候補として提示
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

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
