import type { RosterEntry } from '@/server/repositories/students';
import type { SchoolProfile } from '@/server/services/user-preferences';
import type { CertificateView, StudentDetailView, StudentView } from '../types';
import { buildStudentKey } from './student-key';

const birthDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
});

/** 和暦（例: '令和7年6月5日'）。証明書の発行日・生年月日に使う。 */
const warekiFormatter = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
  timeZone: 'Asia/Tokyo',
  era: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * 和暦に整形する。日本の公的書類に合わせ、元年（Intl は '1年' を返す）を '元年' に補正する。
 * formatToParts で year パートだけを判定するため '11年' 等を誤置換しない。
 */
function formatWareki(date: Date): string {
  return warekiFormatter
    .formatToParts(date)
    .map((part) => (part.type === 'year' && part.value === '1' ? '元' : part.value))
    .join('');
}

/** 生徒 id から決定的に 4 桁の証明書通番を導く（PoC: 発行履歴を持たないため id 由来で固定）。 */
function certificateNumber(studentId: string): string {
  let sum = 0;
  for (let i = 0; i < studentId.length; i += 1) {
    sum = (sum + studentId.charCodeAt(i)) % 10000;
  }
  return `第 ${String(sum).padStart(4, '0')} 号`;
}

const EMPTY = '-';

/** RosterEntry（生徒＋在籍）を一覧表示用 ViewModel に変換する。 */
export function toView(entry: RosterEntry): StudentView {
  const { student, enrollment } = entry;

  const gradeClassLabel =
    enrollment?.className ?? (enrollment?.grade ? `${enrollment.grade}年` : '(未在籍)');

  const attendanceLabel =
    enrollment?.attendanceNumber != null ? String(enrollment.attendanceNumber) : EMPTY;

  return {
    id: student.id,
    key: buildStudentKey(enrollment),
    attendanceLabel,
    gradeClassLabel,
    birthDateMs: student.birthDate.getTime(),
    preferredFamilyName: student.preferredFamilyName,
    preferredGivenName: student.preferredGivenName,
    officialFamilyName: student.officialFamilyName,
    isOfficialSameAsPreferred: student.officialFamilyName === student.preferredFamilyName,
    kanaFamilyName: student.kanaFamilyName,
    kanaGivenName: student.kanaGivenName,
    sexLabel: student.sex ?? '(不明)',
    birthDateLabel: birthDateFormatter.format(student.birthDate),
  };
}

/** null / 空文字を '-' に、値があれば文字列化して返す。 */
function textOr(value: string | null | undefined): string {
  return value != null && value !== '' ? value : EMPTY;
}

/** Date を ja-JP 整形、未設定は '-'。 */
function dateOr(value: Date | null | undefined): string {
  return value != null ? birthDateFormatter.format(value) : EMPTY;
}

/** RosterEntry（生徒＋在籍）を詳細ページ用 ViewModel に変換する。 */
export function toDetailView(entry: RosterEntry): StudentDetailView {
  const { student, enrollment } = entry;

  const gradeClassLabel =
    enrollment?.className ?? (enrollment?.grade ? `${enrollment.grade}年` : '(未在籍)');

  const attendanceLabel =
    enrollment?.attendanceNumber != null ? String(enrollment.attendanceNumber) : EMPTY;

  return {
    id: student.id,

    officialFamilyName: student.officialFamilyName,
    officialGivenName: student.officialGivenName,
    preferredFamilyName: student.preferredFamilyName,
    preferredGivenName: student.preferredGivenName,
    preferredMiddleName: textOr(student.preferredMiddleName),
    kanaFamilyName: student.kanaFamilyName,
    kanaGivenName: student.kanaGivenName,
    kanaMiddleName: textOr(student.kanaMiddleName),

    birthDateLabel: birthDateFormatter.format(student.birthDate),
    sexLabel: student.sex ?? '(不明)',
    nationalityLabel: textOr(student.nationality),

    gradeClassLabel,
    attendanceLabel,
    enrollmentStatusLabel: textOr(enrollment?.enrollmentStatus),
    schoolCodeLabel: textOr(enrollment?.schoolCode),
    admissionDateLabel: dateOr(enrollment?.admissionDate),
    transferInDateLabel: dateOr(enrollment?.transferInDate),
    transferOutDateLabel: dateOr(enrollment?.transferOutDate),
    graduationDateLabel: dateOr(enrollment?.graduationDate),
  };
}

/**
 * 在学証明書用 ViewModel を組み立てる。生徒（在籍）に学校プロフィールと発行日を合成。
 * 発行日は呼び出し側で `new Date()`（本日）を渡す。日付は和暦に整形する。
 */
export function toCertificateView(
  entry: RosterEntry,
  school: SchoolProfile,
  issuedAt: Date,
): CertificateView {
  const { student, enrollment } = entry;

  const gradeClassLabel =
    enrollment?.className ?? (enrollment?.grade ? `${enrollment.grade}年` : '(未在籍)');

  return {
    certificateNumber: certificateNumber(student.id),
    officialFamilyName: student.officialFamilyName,
    officialGivenName: student.officialGivenName,
    birthDateWareki: formatWareki(student.birthDate),
    sexLabel: student.sex ?? '(不明)',
    gradeClassLabel,
    schoolName: school.schoolName,
    schoolAddress: school.schoolAddress,
    principalName: school.principalName,
    issueDateWareki: formatWareki(issuedAt),
  };
}
