/** 生徒一覧の表示用 ViewModel（Drizzle 行をそのまま UI に渡さない）。 */
export interface StudentView {
  id: string;
  /** 出席番号（未設定は '-'） */
  attendanceLabel: string;
  /** 学年・組（例: '1年1組'） */
  gradeClassLabel: string;
  /** 生年月日のエポックミリ秒（並べ替え用） */
  birthDateMs: number;
  /** 表示名の苗字（preferred 苗字。JIS文字・通常フォント） */
  preferredFamilyName: string;
  /** 表示名の名前（preferred 名。JIS文字・通常フォント） */
  preferredGivenName: string;
  /** 正式苗字（official_family_name。MJ特有文字を含みうる。拡大表示の対象） */
  officialFamilyName: string;
  /** 正式苗字が preferred 苗字と同一か（true なら '←' 表示） */
  isOfficialSameAsPreferred: boolean;
  /** フリガナ 姓（全角カタカナ。漢字の姓にルビとして対応） */
  kanaFamilyName: string;
  /** フリガナ 名（全角カタカナ。漢字の名にルビとして対応） */
  kanaGivenName: string;
  /** 性別 */
  sexLabel: string;
  /** 生年月日（ja-JP 整形済み） */
  birthDateLabel: string;
}

/**
 * 生徒詳細ページの表示用 ViewModel（students ＋ student_enrollments の表示可能列を網羅）。
 * 未設定の列は '-' に整形済み（UI 側で null 判定しない）。
 */
export interface StudentDetailView {
  id: string;

  // 氏名 3 系統
  /** 正式氏名 姓（MJ特有文字可。IPAmjexMincho で表示） */
  officialFamilyName: string;
  /** 正式氏名 名（MJ特有文字可。IPAmjexMincho で表示） */
  officialGivenName: string;
  /** 表示名 姓（JIS文字） */
  preferredFamilyName: string;
  /** 表示名 名（JIS文字） */
  preferredGivenName: string;
  /** 表示名 ミドルネーム（未設定は '-'） */
  preferredMiddleName: string;
  /** フリガナ 姓（全角カタカナ） */
  kanaFamilyName: string;
  /** フリガナ 名（全角カタカナ） */
  kanaGivenName: string;
  /** フリガナ ミドルネーム（未設定は '-'） */
  kanaMiddleName: string;

  // 基本情報
  /** 生年月日（ja-JP 整形済み） */
  birthDateLabel: string;
  /** 性別（未設定は '(不明)'） */
  sexLabel: string;
  /** 国籍（未設定は '-'） */
  nationalityLabel: string;

  // 在籍
  /** 学年・組（例: '1年1組'、未在籍は '(未在籍)'） */
  gradeClassLabel: string;
  /** 出席番号（未設定は '-'） */
  attendanceLabel: string;
  /** 在籍状態（未在籍は '-'） */
  enrollmentStatusLabel: string;
  /** 学校コード（未設定は '-'） */
  schoolCodeLabel: string;
  /** 入学日（ja-JP 整形済み、未設定は '-'） */
  admissionDateLabel: string;
  /** 転入日（ja-JP 整形済み、未設定は '-'） */
  transferInDateLabel: string;
  /** 転出日（ja-JP 整形済み、未設定は '-'） */
  transferOutDateLabel: string;
  /** 卒業日（ja-JP 整形済み、未設定は '-'） */
  graduationDateLabel: string;
}

/**
 * 在籍証明書の表示用 ViewModel。生徒（在籍）情報に学校プロフィールと発行日を合成する。
 * 日付は和暦（例: '令和7年6月5日'）に整形済み。
 */
export interface CertificateView {
  /** 証明書番号（例: '第 0042 号'。生徒 id から決定的に導出） */
  certificateNumber: string;
  /** 正式氏名 姓（MJ特有文字可。IPAmjexMincho で表示） */
  officialFamilyName: string;
  /** 正式氏名 名（MJ特有文字可。IPAmjexMincho で表示） */
  officialGivenName: string;
  /** 生年月日（和暦整形済み） */
  birthDateWareki: string;
  /** 性別（未設定は '(不明)'） */
  sexLabel: string;
  /** 学年・組（例: '1年1組'、未在籍は '(未在籍)'） */
  gradeClassLabel: string;
  /** 学校名 */
  schoolName: string;
  /** 学校住所 */
  schoolAddress: string;
  /** 校長氏名 */
  principalName: string;
  /** 発行日（本日・和暦整形済み） */
  issueDateWareki: string;
}
