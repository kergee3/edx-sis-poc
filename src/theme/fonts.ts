/**
 * 氏名表示用のフォントスタック。
 *
 * 正式氏名は MJ特有文字（戸籍漢字等）を含みうるため、IPAmjexMincho Web フォントで表示する。
 * フォント本体は CDN の CSS (layout.tsx で読み込み) が `@font-face` で定義する。
 * アプリ全体のフォントには適用せず、正式氏名の表示に限定して当てる。
 */
export const FONT_MJ = '"IPAmjexMincho", serif';

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

/** IPAmjexMincho Web フォントの CSS（256 サブセット定義）の配信元。 */
export const IPAMJEX_FONT_CSS_URL =
  process.env.IPAMJEX_FONT_CSS_URL ?? 'https://ipamjexmincho.shumy.app/IPAmjexMincho.css';

/** フォント CDN のオリジン（preconnect 用）。 */
export const IPAMJEX_FONT_ORIGIN = 'https://ipamjexmincho.shumy.app';
