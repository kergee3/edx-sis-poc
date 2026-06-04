/**
 * 氏名表示用のフォントスタック。
 *
 * 正式氏名は MJ特有文字（戸籍漢字等）を含みうるため、IPAmjexMincho Web フォントで表示する。
 * フォント本体は CDN の CSS (layout.tsx で読み込み) が `@font-face` で定義する。
 * アプリ全体のフォントには適用せず、正式氏名の表示に限定して当てる。
 */
export const FONT_MJ = '"IPAmjexMincho", serif';

/** IPAmjexMincho Web フォントの CSS（256 サブセット定義）の配信元。 */
export const IPAMJEX_FONT_CSS_URL =
  process.env.IPAMJEX_FONT_CSS_URL ?? 'https://ipamjexmincho.shumy.app/IPAmjexMincho.css';

/** フォント CDN のオリジン（preconnect 用）。 */
export const IPAMJEX_FONT_ORIGIN = 'https://ipamjexmincho.shumy.app';
