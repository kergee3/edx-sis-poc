'use client';

import { useState, useTransition } from 'react';
import { Alert, Box, Button, Snackbar, Stack, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { saveSchoolProfileAction } from '../actions';
import type { SchoolProfileInput } from '../schema/school-profile';

interface SchoolProfileFormProps {
  /** サーバから取得した初期値（未保存なら既定値が入っている）。 */
  initial: SchoolProfileInput;
}

type FieldErrors = Partial<Record<keyof SchoolProfileInput, string>>;

export default function SchoolProfileForm({ initial }: SchoolProfileFormProps) {
  const [values, setValues] = useState<SchoolProfileInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [snack, setSnack] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleChange =
    (field: keyof SchoolProfileInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValues((prev) => ({ ...prev, [field]: next }));
      setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSchoolProfileAction(values);
      if (result.ok) {
        setValues(result.values);
        setFieldErrors({});
        setSnack({ severity: 'success', message: '学校情報を保存しました' });
        return;
      }
      if (result.error === 'invalid_input') {
        setFieldErrors(result.fieldErrors ?? {});
        setSnack({ severity: 'error', message: '入力内容を確認してください' });
        return;
      }
      const message =
        result.error === 'unauthorized'
          ? 'サインインが必要です'
          : '保存に失敗しました。時間をおいて再度お試しください';
      setSnack({ severity: 'error', message });
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
        <TextField
          label="学校名"
          value={values.schoolName}
          onChange={handleChange('schoolName')}
          required
          fullWidth
          disabled={isPending}
          error={Boolean(fieldErrors.schoolName)}
          helperText={fieldErrors.schoolName ?? ' '}
        />
        <TextField
          label="校長氏名"
          value={values.principalName}
          onChange={handleChange('principalName')}
          required
          fullWidth
          disabled={isPending}
          error={Boolean(fieldErrors.principalName)}
          helperText={fieldErrors.principalName ?? 'ログインユーザー名が初期値です'}
        />
        <TextField
          label="学校住所"
          value={values.schoolAddress}
          onChange={handleChange('schoolAddress')}
          required
          fullWidth
          disabled={isPending}
          error={Boolean(fieldErrors.schoolAddress)}
          helperText={fieldErrors.schoolAddress ?? ' '}
        />
        <Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            loading={isPending}
          >
            保存
          </Button>
        </Box>
      </Stack>

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
