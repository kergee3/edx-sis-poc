import type { RosterEntry } from '@/server/repositories/students';
import type { StudentView } from '../types';

const birthDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
});

const EMPTY = '-';
const FULLWIDTH_SPACE = '　';

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
    displayName: `${student.preferredFamilyName}${FULLWIDTH_SPACE}${student.preferredGivenName}`,
    officialFamilyLabel:
      student.officialFamilyName === student.preferredFamilyName
        ? '←'
        : student.officialFamilyName,
    kanaName: `${student.kanaFamilyName}${FULLWIDTH_SPACE}${student.kanaGivenName}`,
    sexLabel: student.sex ?? '(不明)',
    birthDateLabel: birthDateFormatter.format(student.birthDate),
  };
}
