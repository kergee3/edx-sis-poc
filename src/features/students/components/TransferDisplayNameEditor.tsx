'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FamilyMappingFields, {
  defaultChoice,
  type MappingRecordView,
} from '@/features/interop/components/FamilyMappingFields';

interface TransferDisplayNameEditorProps {
  /** 編集対象（転入生の下書き＋正式苗字の JIS X 0213 写像）から組み立てたビュー。 */
  record: MappingRecordView;
  /** 確定した表示名（姓）を親（下書き）へ反映するコールバック。 */
  onApply: (preferredFamily: string) => void;
  /** 生成／登録中は無効化する。 */
  disabled?: boolean;
}

/**
 * 転入の確認ダイアログ内で表示名（姓）を編集するボタン＋ダイアログ。
 * 生徒詳細の [表示名の編集]（StudentDisplayNameEditor）と同じ編集 UI（FamilyMappingFields）を
 * 再利用するが、生徒はまだ未登録なので DB へは書かず、[更新] で下書きの preferredFamily を
 * 親の state に反映するだけにする（実際の保存は [転入] 確定時の commit で行う）。
 */
export default function TransferDisplayNameEditor({
  record,
  onApply,
  disabled,
}: TransferDisplayNameEditorProps) {
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState<string[]>([]);

  const openDialog = () => {
    setSelections(record.familyMapping.chars.map(defaultChoice));
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

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
    onApply(assembledFamily);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<EditIcon />}
        onClick={openDialog}
        disabled={disabled}
        sx={{ whiteSpace: 'nowrap' }}
      >
        表示名の編集
      </Button>

      <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>表示名の編集</DialogTitle>
        <DialogContent dividers>
          <FamilyMappingFields
            record={record}
            selections={selections}
            onCharChange={setCharChoice}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>キャンセル</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!canSave}>
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
