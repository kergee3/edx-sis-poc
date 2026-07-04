import type {
  GenerateTransferError,
  CommitTransferError,
  TransferOutError,
  ApplyMappedFamilyError,
} from './actions';

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

/** transferOutStudentAction の失敗理由を UI 表示用の日本語メッセージへ整形する。 */
export function transferOutErrorMessage(error: TransferOutError): string {
  switch (error) {
    case 'invalid_input':
      return '入力が不正です。';
    case 'unauthorized':
      return 'サインインが必要です。';
    case 'not_found':
      return '対象の生徒が見つかりませんでした。すでに転出済みか、在籍情報がない可能性があります。';
    default:
      return '転出処理に失敗しました。';
  }
}

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
