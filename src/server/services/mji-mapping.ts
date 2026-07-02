import {
  findMjiByImplementedUcs,
  findMjiByIvs,
  findShrinkCandidatesByMjId,
  findX0213VariantsByCorrespondingUcs,
  findX0213VariantsByShrinkTarget,
} from '@/server/repositories/mji';
import type { MjiCharacterRow } from '@/server/db/turso/schema/mji';

/**
 * 苗字（MJ文字・IVS付き）を JIS X 0213 へ写像する処理。
 * 設計: docs/design/mji-jisx0213-mapping-design.md §5。
 *
 * レイヤ責務: 文字照合・縮退ロジックはここ（service）に集約し、Drizzle クエリは
 * server/repositories/mji.ts に閉じる。UI（事務の手動選択）は features/* から本 service を呼ぶ。
 */

export type JisLevel = 1 | 2 | 3 | 4;

/**
 * JIS X 0213 面区点（例 "1-25-66"）→ JIS 水準（1〜4）。非漢字 / 0213外は null。
 * 規則は設計書 §4。**scripts/import-mji.mjs の jisLevel() と同一ロジックに保つこと**
 * （import 時に mji_characters.jis_level へ事前計算済み。本関数は縮退候補の
 *  target_x0213 など事前計算が無い面区点の水準算出に使う）。
 */
export function jisLevel(menKuTen: string | null | undefined): JisLevel | null {
  if (!menKuTen) return null;
  const [men, ku, ten] = menKuTen.split('-').map((n) => Number.parseInt(n, 10));
  if (men === undefined || ku === undefined || ten === undefined) return null;
  if (!Number.isFinite(men) || !Number.isFinite(ku) || !Number.isFinite(ten)) return null;
  if (men === 2) return 4;
  if (men !== 1) return null;
  if (ku >= 1 && ku <= 13) return null; // 非漢字（記号・かな等）
  if (ku === 14 || ku === 15) return 3;
  if (ku >= 16 && ku <= 46) return 1;
  if (ku === 47) return ten <= 51 ? 1 : 3;
  if (ku >= 48 && ku <= 83) return 2;
  if (ku === 84) return ten <= 6 ? 2 : 3;
  if (ku >= 85 && ku <= 94) return 3;
  return null;
}

// 異体字セレクタ（IVS）の範囲 U+E0100〜U+E01EF。SVS(FE00-FE0F) は本 PoC では基底として扱う。
const IVS_MIN = 0xe0100;
const IVS_MAX = 0xe01ef;

interface Grapheme {
  raw: string;
  base: number; // 基底符号位置のコードポイント
  vs?: number; // 異体字セレクタのコードポイント（IVS）
}

/** 入力文字列を「基底符号位置 + 任意の IVS」の書記素クラスタへ分割する。 */
export function segment(input: string): Grapheme[] {
  const out: Grapheme[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp >= IVS_MIN && cp <= IVS_MAX) {
      const last = out[out.length - 1];
      if (last && last.vs === undefined) {
        last.vs = cp;
        last.raw += ch;
        continue;
      }
    }
    out.push({ raw: ch, base: cp });
  }
  return out;
}

/** コードポイント → "U+XXXX"（mji の D/E 列形式）。 */
function ucsKey(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

/** 基底+IVS → "BASE_VS"（mji の F 列形式。例 9F4A_E0103）。 */
function ivsKey(base: number, vs: number): string {
  return base.toString(16).toUpperCase().padStart(4, '0') + '_' + vs.toString(16).toUpperCase();
}

/** "U+XXXX" → 実際の文字（表示・保存用）。失敗時は空文字。 */
function ucsToChar(ucs: string | null | undefined): string {
  const m = /^U\+([0-9A-Fa-f]+)$/.exec((ucs ?? '').trim());
  if (!m || !m[1]) return '';
  try {
    return String.fromCodePoint(Number.parseInt(m[1], 16));
  } catch {
    return '';
  }
}

/** "BASE_VS"（F 列形式）→ IVS 字形の文字列（基底＋異体字セレクタ）。失敗時は空文字。 */
function ivsToChar(ivs: string | null | undefined): string {
  const parts = (ivs ?? '').split('_');
  const [b, v] = parts;
  if (!b || !v) return '';
  try {
    return String.fromCodePoint(Number.parseInt(b, 16), Number.parseInt(v, 16));
  } catch {
    return '';
  }
}

export type X0213Via =
  | 'same_codepoint' // 同一符号位置（対応するUCS が同じ）の異体字
  | 'jis_ucs' // 縮退マップ: JIS包摂規準・UCS統合規則
  | 'koseki' // 縮退マップ: 法務省戸籍法関連通達・通知
  | 'kokuji582' // 縮退マップ: 法務省告示582号別表第四
  | 'dict' // 縮退マップ: 辞書類等による関連字
  | 'reading_shape' // 縮退マップ: 読み・字形による類推
  | 'rep_variant'; // 代表字の異体字（代表字に縮退してくる 0213 の文字。縮退マップ逆引き）

export interface X0213Candidate {
  /** 表示・保存に使う字（同符号位置の IVS 異体字は IVS 字形、その他は基底 JIS 字）。 */
  char: string;
  ucs: string | null;
  /** 同符号位置の IVS 異体字のときの IVS（例 85E4_E0103）。基底字・別符号位置は null。 */
  ivs?: string | null;
  x0213: string | null;
  level: JisLevel | null;
  via: X0213Via;
  /** この候補が代表字か（最有力の 1 字）。それ以外は異体字。 */
  isRepresentative: boolean;
  mjId?: string;
  readings?: string | null;
  totalStrokes?: number | null;
}

export type CharMapping =
  // ① JIS X 0213 に定義あり（そのまま採用可）
  | { kind: 'in_x0213'; raw: string; mjId: string; ucs: string; x0213: string; level: JisLevel | null }
  // ②③ 0213 に無い。代表字・異体字の 0213 候補を提示（最終選択は事務）
  | { kind: 'needs_choice'; raw: string; source: { mjId: string; ucs: string }; candidates: X0213Candidate[] }
  // ④ MJ に無い → 非漢字
  | { kind: 'non_kanji'; raw: string };

/** 同一符号位置に複数図形がヒットしたとき、0213 にあるものを優先して 1 つ選ぶ。 */
function pickBest(rows: MjiCharacterRow[]): MjiCharacterRow | null {
  return rows.find((r) => r.x0213 != null) ?? rows[0] ?? null;
}

/**
 * 0213 に無い文字について、0213 にある候補を集める（重複は面区点で畳む）。
 *  (a) 同一符号位置の異体字（mji.xlsx）
 *  (b) 自身の縮退候補（＝代表字。MJ縮退マップ）
 *  (c) 代表字の異体字: 各代表字を中心に、同符号位置 / 逆引き（代表字に縮退する字）/
 *      前方縮退（代表字がさらに縮退する字）を 0213 で辿る（縮退グラフを 1 ホップ）。
 */
async function collectCandidates(row: MjiCharacterRow): Promise<X0213Candidate[]> {
  const out: X0213Candidate[] = [];
  const seen = new Set<string>(); // 字形（保存値）で重複排除
  const repUcs = new Set<string>(); // 代表字の UCS 集合（中心に異体字を辿る）

  // 同符号位置は IVS 字形ごとに別候補にする（面区点が同じでも字形が異なるため畳まない）。
  const pushRow = (v: MjiCharacterRow, via: X0213Via) => {
    const char = v.implementedUcs
      ? ucsToChar(v.implementedUcs)
      : v.ivs
        ? ivsToChar(v.ivs)
        : ucsToChar(v.correspondingUcs);
    if (v.mjId === row.mjId || v.x0213 == null || !char || seen.has(char)) return;
    seen.add(char);
    out.push({
      char,
      ucs: v.implementedUcs ?? v.correspondingUcs,
      ivs: v.implementedUcs ? null : v.ivs,
      x0213: v.x0213,
      level: jisLevel(v.x0213),
      via,
      isRepresentative: false,
      mjId: v.mjId,
      readings: v.readings,
      totalStrokes: v.totalStrokes,
    });
  };
  const pushTarget = (ucs: string | null, x0213: string | null, via: X0213Via) => {
    const char = ucsToChar(ucs);
    if (!x0213 || !char || seen.has(char)) return;
    seen.add(char);
    out.push({ char, ucs, x0213, level: jisLevel(x0213), via, isRepresentative: false });
  };

  // (a) 同一符号位置の異体字。同符号位置の基底字は代表字でもある
  for (const v of await findX0213VariantsByCorrespondingUcs(row.correspondingUcs)) {
    pushRow(v, 'same_codepoint');
  }
  repUcs.add(row.correspondingUcs);

  // (b) 自身の縮退候補（＝代表字）
  for (const c of await findShrinkCandidatesByMjId(row.mjId)) {
    if (c.targetUcs) repUcs.add(c.targetUcs);
    pushTarget(c.targetUcs, c.targetX0213, c.criterion);
  }

  // (c) 各代表字を中心に異体字を 0213 で辿る
  for (const ucs of repUcs) {
    // 同符号位置
    for (const v of await findX0213VariantsByCorrespondingUcs(ucs)) pushRow(v, 'rep_variant');
    // 逆引き（その代表字に縮退してくる字）
    for (const v of await findX0213VariantsByShrinkTarget(ucs)) pushRow(v, 'rep_variant');
    // 前方縮退（その代表字自身がさらに縮退する先）
    for (const repRow of await findMjiByImplementedUcs(ucs)) {
      if (repRow.x0213 == null) continue;
      for (const c of await findShrinkCandidatesByMjId(repRow.mjId)) {
        pushTarget(c.targetUcs, c.targetX0213, 'rep_variant');
      }
    }
  }

  // 代表字（最有力の 1 字）を決めて印を付ける:
  //   入力の同符号位置の基底字が 0213 にあればそれ、無ければ先頭候補。それ以外は異体字。
  const baseChar = ucsToChar(row.correspondingUcs);
  const repChar = out.some((c) => c.char === baseChar) ? baseChar : (out[0]?.char ?? '');
  for (const c of out) c.isRepresentative = c.char === repChar;

  // 代表字を第一候補にする（UI の既定確定文字＝先頭候補になる）。
  // sort は安定なので、残りの異体字は元の収集順を保つ。
  out.sort((a, b) => Number(b.isRepresentative) - Number(a.isRepresentative));

  return out;
}

/** 1 書記素を JIS X 0213 へ写像する。 */
async function mapGrapheme(g: Grapheme): Promise<CharMapping> {
  let row: MjiCharacterRow | null = null;

  // IVS 付きは F 列で照合（最優先）
  if (g.vs !== undefined) {
    row = await findMjiByIvs(ivsKey(g.base, g.vs));
  }
  // 見つからなければ裸の符号位置で照合
  if (!row) {
    row = pickBest(await findMjiByImplementedUcs(ucsKey(g.base)));
  }
  // MJ に無い → 非漢字
  if (!row) return { kind: 'non_kanji', raw: g.raw };

  // ① 0213 にある
  if (row.x0213 != null) {
    return {
      kind: 'in_x0213',
      raw: g.raw,
      mjId: row.mjId,
      ucs: row.implementedUcs ?? row.correspondingUcs,
      x0213: row.x0213,
      level: row.jisLevel as JisLevel | null,
    };
  }

  // ②③④ 0213 に無い → 候補提示
  return {
    kind: 'needs_choice',
    raw: g.raw,
    source: { mjId: row.mjId, ucs: row.correspondingUcs },
    candidates: await collectCandidates(row),
  };
}

export interface SurnameMapping {
  input: string;
  chars: CharMapping[];
  /** 全字が 0213 にあり、そのまま preferred として使えるか。 */
  allInX0213: boolean;
  /** 非漢字（MJ 未収録）を含むか。 */
  hasNonKanji: boolean;
  /** 事務の手動選択が必要な字数。 */
  needsChoiceCount: number;
}

/** 苗字（IVS 付き MJ文字列）を字ごとに JIS X 0213 へ写像する。 */
export async function mapSurname(input: string): Promise<SurnameMapping> {
  const chars = await Promise.all(segment(input).map(mapGrapheme));
  return {
    input,
    chars,
    allInX0213: chars.length > 0 && chars.every((c) => c.kind === 'in_x0213'),
    hasNonKanji: chars.some((c) => c.kind === 'non_kanji'),
    needsChoiceCount: chars.filter((c) => c.kind === 'needs_choice').length,
  };
}
