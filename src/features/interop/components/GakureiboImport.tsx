'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { FONT_MJ } from '@/theme/fonts';
import type { CharMapping, JisLevel } from '@/server/services/mji-mapping';
import type { GakureiboRecord } from '@/server/services/gakureibo-import';
import { applyMappedFamilyAction } from '../actions';

function levelLabel(level: JisLevel | null): string {
  return level ? `第${level}水準` : '水準なし';
}

/** その字の既定の確定文字（0213にある字＝そのまま、要選択＝先頭候補、非漢字＝原字）。 */
function defaultChoice(c: CharMapping): string {
  if (c.kind === 'in_x0213') return c.raw;
  if (c.kind === 'needs_choice') return c.candidates[0]?.char ?? '';
  return c.raw; // non_kanji: 原字（カナ・記号等。JISで表示可能なことが多い）をそのまま
}

/** 原字の分類ラベル（JIS: 第N水準 / MJ特有文字 / 非漢字）。 */
function roleLabel(c: CharMapping): string {
  if (c.kind === 'in_x0213') return c.level ? `JIS: 第${c.level}水準` : 'JIS';
  if (c.kind === 'needs_choice') return 'MJ特有文字';
  return '非漢字';
}

/** 原字のコード表記（IVS付きは "U+xxxx_E01xx"、無しは "U+xxxx"）。 */
function originalCode(raw: string): string {
  const cps = Array.from(raw).map((ch) => ch.codePointAt(0) ?? 0);
  const base = cps[0] ?? 0;
  const baseHex = base.toString(16).toUpperCase().padStart(4, '0');
  const vs = cps[1];
  if (vs !== undefined && vs >= 0xe0100 && vs <= 0xe01ef) {
    return `U+${baseHex}_${vs.toString(16).toUpperCase()}`;
  }
  return `U+${baseHex}`;
}

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
        const msg =
          res.error === 'not_found'
            ? '一致する生徒が見つかりませんでした（正式氏名の不一致）。'
            : res.error === 'invalid_input'
              ? '入力が不正です。'
              : res.error === 'unauthorized'
                ? 'サインインが必要です。'
                : '保存に失敗しました。';
        setResult({ ok: false, message: msg });
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

      {/* レコード概要 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <Box>
            <Typography variant="caption" color="text.secondary">学年</Typography>
            <Typography>{current.grade} 年</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">正式氏名（MJ）</Typography>
            <Typography sx={{ fontFamily: FONT_MJ, fontSize: '1.5rem', lineHeight: 1.3 }}>
              {current.officialFamily}　{current.officialGiven}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">フリガナ</Typography>
            <Typography>
              {current.kanaFamily}　{current.kanaGiven}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">性別</Typography>
            <Typography>{current.sex || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">現在の表示名（姓）</Typography>
            <Typography>{current.currentPreferredFamily ?? '-'}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* 氏（姓）の字ごとのマッピング */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        正式氏名（姓）の各字を JIS X 0213 へ対応付け
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {current.familyMapping.chars.map((c, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              {/* 原字（MJ）の字形 */}
              <Box sx={{ minWidth: 56, textAlign: 'center' }}>
                <Typography sx={{ fontFamily: FONT_MJ, fontSize: '2rem', lineHeight: 1.1 }}>
                  {c.raw}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, minWidth: 240 }}>
                {/* 分類ラベル（塗りつぶしの丸枠チップ）＋ 原字のコード */}
                <Chip
                  size="small"
                  color={
                    c.kind === 'in_x0213'
                      ? 'success'
                      : c.kind === 'needs_choice'
                        ? 'error'
                        : 'default'
                  }
                  label={roleLabel(c)}
                  sx={{ mb: 0.5 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: c.kind === 'in_x0213' ? 0 : 1 }}
                >
                  {originalCode(c.raw)}
                </Typography>
              </Box>
            </Box>

            {/* 「対応付け候補」〜「確定する字」はインデントせずカード左端に左寄せ */}
            {c.kind === 'needs_choice' && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  対応付け候補
                </Typography>
                {c.candidates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    候補がありません。下の欄に手入力してください。
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    {c.candidates.map((cand, ci) => {
                      const selected = (selections[i] ?? '') === cand.char && cand.char !== '';
                      return (
                        <Button
                          key={ci}
                          onClick={() => setCharChoice(i, cand.char)}
                          variant={selected ? 'contained' : 'outlined'}
                          sx={{ flexDirection: 'column', textTransform: 'none', py: 0.5, minWidth: 76 }}
                        >
                          {/* IVS 異体字も正しい字形で見せるため IPAmjexMincho で描画 */}
                          <Box sx={{ fontFamily: FONT_MJ, fontSize: '1.6rem', lineHeight: 1.1 }}>
                            {cand.char || '□'}
                          </Box>
                          <Box sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                            {levelLabel(cand.level)}・{cand.isRepresentative ? '代表字' : '異体字'}
                          </Box>
                          <Box sx={{ fontSize: '0.6rem', opacity: 0.7 }}>
                            {cand.ivs ? `U+${cand.ivs}` : cand.ucs}
                          </Box>
                        </Button>
                      );
                    })}
                  </Stack>
                )}
                <TextField
                  size="small"
                  label="確定する字（手入力可）"
                  value={selections[i] ?? ''}
                  onChange={(e) => setCharChoice(i, e.target.value)}
                  sx={{ width: 220 }}
                />
              </Box>
            )}

            {c.kind === 'non_kanji' && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  必要なら手入力で修正してください。
                </Typography>
                <TextField
                  size="small"
                  label="確定する字"
                  value={selections[i] ?? ''}
                  onChange={(e) => setCharChoice(i, e.target.value)}
                  sx={{ width: 220 }}
                />
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      {/* 確定プレビュー */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary">確定する表示名（JIS）</Typography>
        <Typography sx={{ fontSize: '1.5rem' }}>
          {assembledFamily || '（未確定）'}　{current.preferredGiven}
        </Typography>
      </Paper>

      {result && (
        <Alert severity={result.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

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
