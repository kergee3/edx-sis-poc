/** 生徒一覧の表示用 ViewModel（Drizzle 行をそのまま UI に渡さない）。 */
export interface StudentView {
  id: string;
  /** 出席番号（未設定は '-'） */
  attendanceLabel: string;
  /** 学年・組（例: '1年1組'） */
  gradeClassLabel: string;
  /** 表示名の苗字（preferred 苗字。JIS文字・通常フォント） */
  preferredFamilyName: string;
  /** 表示名の名前（preferred 名。JIS文字・通常フォント） */
  preferredGivenName: string;
  /** 正式苗字（official_family_name。MJ特有文字を含みうる。拡大表示の対象） */
  officialFamilyName: string;
  /** 正式苗字が preferred 苗字と同一か（true なら '←' 表示） */
  isOfficialSameAsPreferred: boolean;
  /** フリガナ（全角カタカナ） */
  kanaName: string;
  /** 性別 */
  sexLabel: string;
  /** 生年月日（ja-JP 整形済み） */
  birthDateLabel: string;
}
