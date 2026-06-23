import type { StudentEnrollmentRow } from '@/server/db/turso/schema/students';

/**
 * 生徒詳細URLの自然キー（学年-組-出席番号、例 "1-1-5"）の生成・解析・照合。
 *
 * 内部 UUID を URL に出さず、人が読める短いセグメントで生徒を識別するためのモジュール。
 * 純粋関数のみ（DB に触れない）なので、サーバ（詳細ページ）とクライアント（一覧テーブル）の
 * 双方から import できる。owner スコープ内で (grade, classNo, attendanceNumber) は一意。
 */

/** classCode（例 '0101'）の末尾2桁から組番号を導く。null/不正は null。 */
function classNoFromCode(classCode: string | null): number | null {
  if (!classCode) return null;
  const n = Number.parseInt(classCode.slice(-2), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * 在籍から URL セグメント "学年-組-出席番号"（例 "1-1-5"）を作る。
 * 在籍が無い／classCode・attendanceNumber が欠ける場合は null（リンクを張れない）。grade は notNull。
 */
export function buildStudentKey(enrollment: StudentEnrollmentRow | null): string | null {
  if (!enrollment) return null;
  const grade = Number.parseInt(enrollment.grade, 10);
  const classNo = classNoFromCode(enrollment.classCode);
  const num = enrollment.attendanceNumber;
  if (!Number.isFinite(grade) || classNo == null || num == null) return null;
  return `${grade}-${classNo}-${num}`;
}

export interface ParsedStudentKey {
  grade: number;
  classNo: number;
  attendanceNumber: number;
}

/** URL セグメント "学年-組-出席番号" を解析する。形式不一致は null。 */
export function parseStudentKey(key: string): ParsedStudentKey | null {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(key);
  if (!m) return null;
  return {
    grade: Number(m[1]),
    classNo: Number(m[2]),
    attendanceNumber: Number(m[3]),
  };
}

/** 在籍が解析済みキーに一致するか（学年・組・出席番号の3点一致）。 */
export function enrollmentMatchesKey(
  enrollment: StudentEnrollmentRow | null,
  parsed: ParsedStudentKey,
): boolean {
  if (!enrollment) return false;
  return (
    Number.parseInt(enrollment.grade, 10) === parsed.grade &&
    classNoFromCode(enrollment.classCode) === parsed.classNo &&
    enrollment.attendanceNumber === parsed.attendanceNumber
  );
}
