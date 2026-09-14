/**
 * 氏名表示用のフォントスタック。
 *
 * 正式氏名は MJ特有文字（戸籍漢字等）や GJ文字を含みうるため、
 * 行政事務標準文字（MJ+GJ）をカバーする GyoseiHyojunMincho Web フォントで表示する。
 * フォント本体は CDN の CSS (layout.tsx で読み込み) が `@font-face` で定義する。
 * アプリ全体のフォントには適用せず、正式氏名の表示に限定して当てる。
 */
export const FONT_MJ = '"GyoseiHyojunMincho", serif';

/**
 * 表示名（preferred・JIS文字）用のフォントスタック。
 *
 * 正式氏名（MJ特有文字を含みうる）は FONT_MJ で表示するのに対し、
 * JIS 文字で構成される表示名・フリガナ等は Noto の Web フォントで表示する。
 * ゴシック（Sans）／明朝（Serif）はユーザ設定で切り替えられる（既定は Sans）。
 * フォント本体は Google Fonts の CSS (layout.tsx で読み込み) が `@font-face` で定義する。
 */
export const FONT_NOTO_SANS_JP = '"Noto Sans JP", sans-serif';
export const FONT_NOTO_SERIF_JP = '"Noto Serif JP", serif';

/** 表示名フォントの選択キー（設定 UI / localStorage で扱う値）。 */
export type DisplayFont = 'sans' | 'serif';

/** 表示名フォントの既定値（ゴシック）。 */
export const DEFAULT_DISPLAY_FONT: DisplayFont = 'sans';

/** 選択キーを実際の font-family スタックへ解決する。 */
export function displayFontFamily(font: DisplayFont): string {
  return font === 'serif' ? FONT_NOTO_SERIF_JP : FONT_NOTO_SANS_JP;
}

/** GyoseiHyojunMincho Web フォントの CSS（2560 サブセット定義）の配信元。 */
export const GYOSEI_FONT_CSS_URL =
  process.env.GYOSEI_FONT_CSS_URL ?? 'https://gyoseihyojun.shumi.dev/GyoseiHyojunMincho.css';

/**
 * woff2 本体の配信元（preconnect 用）。
 *
 * GyoseiHyojunMincho の CSS は MJ 部分（IPAmjexMincho 由来 2048 スライス）と
 * GJ 部分（GJ2608puaMinchoAddon 由来 512 スライス）を**別オリジンの絶対 URL**で参照する。
 * CSS と同一オリジンではないため、CSS 自身のオリジンとは別に preconnect する。
 */
const FONT_WOFF2_ORIGINS = [
  'https://ipamjexmincho.shumi.dev', // MJ 部分
  'https://gj2608pua.shumi.dev', // GJ 部分（暫定私用コード）
] as const;

/** preconnect 対象のオリジン一覧（CSS 自身 + woff2 本体。重複は除去）。 */
export const GYOSEI_FONT_ORIGINS: readonly string[] = [
  ...new Set([new URL(GYOSEI_FONT_CSS_URL).origin, ...FONT_WOFF2_ORIGINS]),
];
