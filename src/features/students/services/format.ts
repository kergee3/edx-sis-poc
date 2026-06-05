import type { RosterEntry } from '@/server/repositories/students';
import type { StudentDetailView, StudentView } from '../types';

const birthDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
});

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
