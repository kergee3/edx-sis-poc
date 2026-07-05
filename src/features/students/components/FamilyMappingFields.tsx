'use client';

import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { FONT_MJ, displayFontFamily } from '@/theme/fonts';
import { useSettings } from '@/contexts/settings-context';
import type { CharMapping, JisLevel, SurnameMapping } from '@/server/services/mji-mapping';

/**
 * 表示名（姓）の JIS X 0213 マッピングを編集する対象 1 件のビュー。
 * 生徒詳細（1 名）と転入（下書き 1 件）の両方で共通利用する
 * （gakureibo-import の GakureiboRecord もこの型を構造的に満たす）。
 */
export interface MappingRecordView {
  grade: number;
  officialFamily: string;
  officialGiven: string;
  preferredGiven: string;
  kanaFamily: string;
  kanaGiven: string;
  sex: string;
  /** 正式氏名（姓）の MJ → JIS X 0213 写像結果。 */
  familyMapping: SurnameMapping;
  /** 現在 students に保存されている表示名（姓）。未保存なら null。 */
  currentPreferredFamily: string | null;
}

function levelLabel(level: JisLevel | null): string {
  return level ? `第${level}水準` : '水準なし';
}

/** その字の既定の確定文字（0213にある字＝そのまま、要選択＝先頭候補、非漢字＝原字）。 */
export function defaultChoice(c: CharMapping): string {
  if (c.kind === 'in_x0213') return c.raw;
  if (c.kind === 'needs_choice') return c.candidates[0]?.char ?? '';
  return c.raw; // non_kanji: 原字（カナ・記号等。JISで表示可能なことが多い）をそのまま
}

/** 原字の分類ラベル（JIS: 第N水準 / JIS異体字 / MJ特有文字 / 非漢字）。 */
function roleLabel(c: CharMapping): string {
  if (c.kind === 'in_x0213') return c.level ? `JIS: 第${c.level}水準` : 'JIS';
  if (c.kind === 'needs_choice') {
    // 入力図形自体は 0213（IVS 付き）→ 基底字へ寄せる要選択。MJ特有文字と区別して示す。
    if (c.sourceInX0213) {
      return c.sourceInX0213.level ? `JIS異体字: 第${c.sourceInX0213.level}水準` : 'JIS異体字';
    }
    return 'MJ特有文字';
  }
  return '非漢字';
}

/** 分類チップの色（0213基底字=成功 / IVS異体字=警告 / MJ特有文字=エラー / 非漢字=既定）。 */
function roleColor(c: CharMapping): 'success' | 'warning' | 'error' | 'default' {
  if (c.kind === 'in_x0213') return 'success';
  if (c.kind === 'needs_choice') return c.sourceInX0213 ? 'warning' : 'error';
  return 'default';
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

interface FamilyMappingFieldsProps {
  /** 編集対象 1 件。 */
  record: MappingRecordView;
  /** 各字の確定文字（record.familyMapping.chars と同じ長さ・順序）。 */
  selections: string[];
  /** i 番目の字の確定文字を変更する。 */
  onCharChange: (i: number, value: string) => void;
}

/**
 * 表示名（姓）マッピングの編集本体（概要 → 字ごとの 0213 対応付け → 確定プレビュー）。
 * 選択状態は親が保持する制御コンポーネント。ナビゲーション/保存ボタンは親側で用意する。
 */
export default function FamilyMappingFields({
  record,
  selections,
  onCharChange,
}: FamilyMappingFieldsProps) {
  const { displayFont } = useSettings();
  const nameFont = displayFontFamily(displayFont);
  const assembledFamily = selections.join('');

  return (
    <Box>
      {/* レコード概要 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <Box>
            <Typography variant="caption" color="text.secondary">学年</Typography>
            <Typography>{record.grade} 年</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">正式氏名（MJ）</Typography>
            <Typography sx={{ fontFamily: FONT_MJ, fontSize: '1.5rem', lineHeight: 1.3 }}>
              {record.officialFamily}　{record.officialGiven}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">フリガナ</Typography>
            <Typography sx={{ fontFamily: nameFont }}>
              {record.kanaFamily}　{record.kanaGiven}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">性別</Typography>
            <Typography>{record.sex || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">現在の表示名（姓）</Typography>
            <Typography sx={{ fontFamily: nameFont }}>
              {record.currentPreferredFamily ?? '-'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* 氏（姓）の字ごとのマッピング */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        正式氏名（姓）の各字を JIS X 0213 へ対応付け
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {record.familyMapping.chars.map((c, i) => (
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
                  color={roleColor(c)}
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
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  対応付け候補
                </Typography>
                {c.candidates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    候補がありません。下の欄に手入力してください。
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
                    {c.candidates.map((cand, ci) => {
                      const selected = (selections[i] ?? '') === cand.char && cand.char !== '';
                      return (
                        <Button
                          key={ci}
                          onClick={() => onCharChange(i, cand.char)}
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
                  onChange={(e) => onCharChange(i, e.target.value)}
                  sx={{ width: 220, '& input': { fontFamily: nameFont, fontSize: '1.6rem' } }}
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
                  onChange={(e) => onCharChange(i, e.target.value)}
                  sx={{ width: 220, '& input': { fontFamily: nameFont, fontSize: '1.6rem' } }}
                />
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      {/* 確定プレビュー */}
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary">確定する表示名（JIS）</Typography>
        <Typography sx={{ fontFamily: nameFont, fontSize: '1.6rem' }}>
          {assembledFamily || '（未確定）'}　{record.preferredGiven}
        </Typography>
      </Paper>
    </Box>
  );
}
