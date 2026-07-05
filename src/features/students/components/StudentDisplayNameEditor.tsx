'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { applyMappedFamilyAction } from '../actions';
import { applyMappedFamilyErrorMessage } from '../error-messages';
import FamilyMappingFields, {
  defaultChoice,
  type MappingRecordView,
} from './FamilyMappingFields';

interface StudentDisplayNameEditorProps {
  /** この生徒の正式氏名（姓）マッピング。正式氏名は DB 値なので action が同一行に一致する。 */
  record: MappingRecordView;
}

/**
 * 生徒詳細で表示名（姓）を編集するボタン＋ダイアログ。
 * ダイアログ内は学齢簿ウィザードと同じマッピング編集 UI（FamilyMappingFields）を再利用し、
 * [キャンセル]/[更新] で操作する。更新成功時は router.refresh() で詳細表示を最新化する。
 */
export default function StudentDisplayNameEditor({ record }: StudentDisplayNameEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    setSelections(record.familyMapping.chars.map(defaultChoice));
    setError(null);
    setOpen(true);
  };

  const closeDialog = () => {
    if (pending) return;
    setOpen(false);
  };

  const setCharChoice = (i: number, value: string) => {
    setSelections((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const assembledFamily = selections.join('');
  const canSave =
    record.familyMapping.chars.length > 0 &&
    record.familyMapping.chars.every((_, i) => (selections[i] ?? '').length > 0);

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await applyMappedFamilyAction({
        officialFamily: record.officialFamily,
        officialGiven: record.officialGiven,
        preferredFamily: assembledFamily,
      });
      if (res.ok) {
        setOpen(false);
        // 詳細ページ（Server Component）を再取得し、更新後の表示名を反映する。
        router.refresh();
      } else {
        setError(applyMappedFamilyErrorMessage(res.error));
      }
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<EditIcon />}
        onClick={openDialog}
        sx={{ whiteSpace: 'nowrap' }}
      >
        表示名編集
      </Button>

      <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>表示名編集</DialogTitle>
        <DialogContent dividers>
          <FamilyMappingFields
            record={record}
            selections={selections}
            onCharChange={setCharChoice}
          />
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
          <Button variant="contained" onClick={handleUpdate} disabled={!canSave || pending}>
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
