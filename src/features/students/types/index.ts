/** 生徒一覧の表示用 ViewModel（Drizzle 行をそのまま UI に渡さない）。 */
export interface StudentView {
  id: string;
  /** 出席番号（未設定は '-'） */
  attendanceLabel: string;
  /** 学年・組（例: '1年1組'） */
  gradeClassLabel: string;
  /** 表示名（preferred 苗字＋preferred 名。JIS文字・通常フォント） */
  displayName: string;
  /** 正式苗字（official_family_name。preferred と同一なら '←'。IPAmjexMincho で表示） */
  officialFamilyLabel: string;
  /** フリガナ（全角カタカナ） */
  kanaName: string;
  /** 性別 */
  sexLabel: string;
  /** 生年月日（ja-JP 整形済み） */
  birthDateLabel: string;
}
