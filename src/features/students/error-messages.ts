import type { GenerateTransferError, CommitTransferError } from './actions';

/** generateTransferStudentAction の失敗理由を UI 表示用の日本語メッセージへ整形する。 */
export function generateTransferErrorMessage(error: GenerateTransferError): string {
  switch (error) {
    case 'unauthorized':
      return 'サインインが必要です。';
    default:
      return '転入生の生成に失敗しました。';
  }
}

/** commitTransferStudentAction の失敗理由を UI 表示用の日本語メッセージへ整形する。 */
export function commitTransferErrorMessage(error: CommitTransferError): string {
  switch (error) {
    case 'invalid_input':
      return '入力が不正です。';
    case 'unauthorized':
      return 'サインインが必要です。';
    default:
      return '転入処理に失敗しました。';
  }
}
