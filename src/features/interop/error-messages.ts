import type { ApplyMappedFamilyError } from './actions';

/** applyMappedFamilyAction の失敗理由を UI 表示用の日本語メッセージへ整形する。 */
export function applyMappedFamilyErrorMessage(error: ApplyMappedFamilyError): string {
  switch (error) {
    case 'not_found':
      return '一致する生徒が見つかりませんでした（正式氏名の不一致）。';
    case 'invalid_input':
      return '入力が不正です。';
    case 'unauthorized':
      return 'サインインが必要です。';
    default:
      return '保存に失敗しました。';
  }
}
