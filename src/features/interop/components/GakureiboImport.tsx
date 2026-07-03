'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import type { GakureiboRecord } from '@/server/services/gakureibo-import';
import { applyMappedFamilyAction } from '../actions';
import { applyMappedFamilyErrorMessage } from '../error-messages';
import FamilyMappingFields, { defaultChoice } from './FamilyMappingFields';

interface GakureiboImportProps {
  records: GakureiboRecord[];
}

export default function GakureiboImport({ records }: GakureiboImportProps) {
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(-1);
  const [selections, setSelections] = useState<string[]>([]);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(() => new Set());
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const current = records[idx];

  // レコードが変わったら、その氏の既定確定文字に初期化する（render 中の状態調整：
  // https://react.dev/learn/you-might-not-need-an-effect 推奨パターン）。
  // result は手動ナビゲーション時のみクリアし、保存成功→次へ移動でも成功表示が残るようにする。
  if (idx !== prevIdx) {
    setPrevIdx(idx);
    setSelections(current ? current.familyMapping.chars.map(defaultChoice) : []);
  }

  /** 手動ナビゲーション（前へ/スキップ）: 結果表示をクリアして移動。 */
  const goTo = (next: number) => {
    setResult(null);
    setIdx(next);
  };

  const assembledFamily = selections.join('');

  const canSave = useMemo(
    () =>
      current != null &&
      current.familyMapping.chars.length > 0 &&
      current.familyMapping.chars.every((_, i) => (selections[i] ?? '').length > 0),
    [current, selections],
  );

  if (records.length === 0) {
    return (
      <Alert severity="info">学齢簿データが読み込めませんでした。PoC 用の名簿ファイルを確認してください。</Alert>
    );
  }
  if (!current) return null;

  const setCharChoice = (i: number, value: string) => {
    setSelections((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await applyMappedFamilyAction({
        officialFamily: current.officialFamily,
        officialGiven: current.officialGiven,
        preferredFamily: assembledFamily,
      });
      if (res.ok) {
        setSavedIndices((prev) => new Set(prev).add(idx));
        setResult({ ok: true, message: `保存しました：${assembledFamily} ${current.preferredGiven}` });
        if (idx < records.length - 1) setIdx(idx + 1);
      } else {
        setResult({ ok: false, message: applyMappedFamilyErrorMessage(res.error) });
      }
    });
  };

  const isLast = idx === records.length - 1;

  return (
    <Box>
      {/* 進捗 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {idx + 1} / {records.length} 件
        </Typography>
        {savedIndices.has(idx) && (
          <Chip
            size="small"
            color="success"
            icon={<CheckCircleIcon />}
            label="保存済み"
            variant="outlined"
          />
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={((idx + 1) / records.length) * 100}
        sx={{ mb: 2 }}
      />

      {/* 概要 → 字ごとの 0213 対応付け → 確定プレビュー */}
      <FamilyMappingFields record={current} selections={selections} onCharChange={setCharChoice} />

      {result && (
        <Alert severity={result.ok ? 'success' : 'error'} sx={{ mt: 2, mb: 2 }} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ナビゲーション */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<NavigateBeforeIcon />}
          disabled={idx === 0 || pending}
          onClick={() => goTo(idx - 1)}
        >
          前へ
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!canSave || pending}
            onClick={handleSave}
          >
            {isLast ? '保存する' : '保存して次へ'}
          </Button>
          {!isLast && (
            <Button
              endIcon={<NavigateNextIcon />}
              disabled={pending}
              onClick={() => goTo(idx + 1)}
            >
              スキップ
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
