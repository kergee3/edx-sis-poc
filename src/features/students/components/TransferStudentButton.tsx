'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CasinoIcon from '@mui/icons-material/Casino';
import { FONT_MJ, displayFontFamily } from '@/theme/fonts';
import { useSettings } from '@/contexts/settings-context';
import {
  generateTransferStudentAction,
  commitTransferStudentAction,
} from '../actions';
import type { TransferStudentDraft } from '@/server/services/transfer-student';
import type { SurnameMapping } from '@/server/services/mji-mapping';
import type { MappingRecordView } from './FamilyMappingFields';
import TransferDisplayNameEditor from './TransferDisplayNameEditor';
import {
  generateTransferErrorMessage,
  commitTransferErrorMessage,
} from '../error-messages';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

const birthDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
});

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
 * 生徒一覧の [転入] ボタン＋確認ダイアログ。
 * 押下で転入生を自動生成（generateTransferStudentAction）し、[表示名の編集]風の確認
 * ダイアログに表示する。[別の生徒を生成] で再抽選、[キャンセル]/[転入] で確定する。
 * 転入成功時は router.refresh() で一覧を最新化する。
 */
export default function TransferStudentButton() {
  const router = useRouter();
  const { displayFont } = useSettings();
  const nameFont = displayFontFamily(displayFont);
  const theme = useTheme();
  // xs（スマホ幅）ではボタンのアイコンを隠し、文言の折り返しを防ぐ。
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TransferStudentDraft | null>(null);
  // 表示名（姓）編集用の写像。draft と 1:1 で generate のたびに差し替える。
  const [familyMapping, setFamilyMapping] = useState<SurnameMapping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateTransferStudentAction();
      if (res.ok) {
        setDraft(res.draft);
        setFamilyMapping(res.familyMapping);
      } else {
        setDraft(null);
        setFamilyMapping(null);
        setError(generateTransferErrorMessage(res.error));
      }
    });
  };

  // 下書き＋写像から表示名（姓）編集用のビューを組み立てる（DB 未登録なので commit まで保存しない）。
  const editRecord: MappingRecordView | null =
    draft && familyMapping
      ? {
          grade: draft.grade,
          officialFamily: draft.officialFamily,
          officialGiven: draft.officialGiven,
          preferredGiven: draft.preferredGiven,
          kanaFamily: draft.kanaFamily,
          kanaGiven: draft.kanaGiven,
          sex: draft.sex,
          familyMapping,
          currentPreferredFamily: draft.preferredFamily,
        }
      : null;

  const openDialog = () => {
    setDraft(null);
    setFamilyMapping(null);
    setError(null);
    setOpen(true);
    generate();
  };

  const closeDialog = () => {
    if (pending) return;
    setOpen(false);
  };

  const commit = () => {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const res = await commitTransferStudentAction(draft);
      if (res.ok) {
        setOpen(false);
        setDraft(null);
        setFamilyMapping(null);
        // 生徒一覧（Server Component）を再取得し、転入生を反映する。
        router.refresh();
      } else {
        setError(commitTransferErrorMessage(res.error));
      }
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PersonAddAlt1Icon />}
        onClick={openDialog}
      >
        転入
      </Button>

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>転入生の確認</DialogTitle>
        <DialogContent dividers>
          {draft ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                次の転入生を登録します。内容を確認し、[転入] で確定してください。別の候補にするには
                [再生成] を押します。表示名を編集する場合には[表示名編集]ボタンを押します。
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Item label="学年・組">
                    <Typography>{draft.grade}年1組</Typography>
                  </Item>
                  <Item label="正式氏名（MJ）">
                    <Typography sx={{ fontFamily: FONT_MJ, fontSize: '2rem', lineHeight: 1.3 }}>
                      {draft.officialFamily}
                      {FULLWIDTH_SPACE}
                      {draft.officialGiven}
                    </Typography>
                  </Item>
                  <Item label="表示名">
                    <Typography sx={{ fontFamily: nameFont, fontSize: '1.4rem' }}>
                      {draft.preferredFamily}
                      {FULLWIDTH_SPACE}
                      {draft.preferredGiven}
                    </Typography>
                  </Item>
                  <Item label="フリガナ">
                    <Typography sx={{ fontFamily: nameFont }}>
                      {draft.kanaFamily}
                      {FULLWIDTH_SPACE}
                      {draft.kanaGiven}
                    </Typography>
                  </Item>
                  <Stack direction="row" spacing={4} useFlexGap flexWrap="wrap">
                    <Item label="性別">
                      <Typography>{draft.sex}</Typography>
                    </Item>
                    <Item label="生年月日">
                      <Typography>{birthDateFormatter.format(new Date(draft.birthDateMs))}</Typography>
                    </Item>
                  </Stack>
                </Stack>
              </Paper>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4 }}>
              {pending && <CircularProgress size={24} />}
              <Typography variant="body2" color="text.secondary">
                {pending ? '転入生を生成しています…' : '転入生を生成できませんでした。'}
              </Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={isXs ? undefined : <CasinoIcon />}
            onClick={generate}
            disabled={pending}
          >
            再生成
          </Button>
          {editRecord && (
            <TransferDisplayNameEditor
              record={editRecord}
              disabled={pending}
              hideIcon={isXs}
              onApply={(preferredFamily) =>
                setDraft((prev) => (prev ? { ...prev, preferredFamily } : prev))
              }
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeDialog} disabled={pending}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={commit} disabled={!draft || pending}>
            転入
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
