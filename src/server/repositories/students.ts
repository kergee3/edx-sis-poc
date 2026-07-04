import { and, asc, count, eq } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  students,
  studentEnrollments,
  ENROLLMENT_STATUS,
  type StudentRow,
  type StudentInsert,
  type StudentEnrollmentRow,
  type StudentEnrollmentInsert,
} from '@/server/db/turso/schema/students';

export interface RosterEntry {
  student: StudentRow;
  enrollment: StudentEnrollmentRow | null;
}

/** そのオーナー (校長) の生徒数を返す。 */
export async function countByOwner(userId: string): Promise<number> {
  const rows = await getTursoDb()
    .select({ value: count() })
    .from(students)
    .where(eq(students.ownerUserId, userId));
  return rows[0]?.value ?? 0;
}

/**
 * そのオーナーの生徒を在籍情報つきで返す。学年 → 出席番号の昇順。
 */
export async function findRosterByOwner(userId: string): Promise<RosterEntry[]> {
  const rows = await getTursoDb()
    .select({ student: students, enrollment: studentEnrollments })
    .from(students)
    .leftJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .where(eq(students.ownerUserId, userId))
    .orderBy(asc(studentEnrollments.grade), asc(studentEnrollments.attendanceNumber));

  return rows.map((r) => ({ student: r.student, enrollment: r.enrollment }));
}

/**
 * 1 名を在籍情報つきで返す。認可をクエリ条件に内包し、
 * そのオーナー (校長) 自身の生徒でなければ null（他人の生徒は取得不可）。
 */
export async function findStudentByIdForOwner(
  userId: string,
  studentId: string,
): Promise<RosterEntry | null> {
  const rows = await getTursoDb()
    .select({ student: students, enrollment: studentEnrollments })
    .from(students)
    .leftJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
    .where(and(eq(students.id, studentId), eq(students.ownerUserId, userId)))
    .limit(1);

  const row = rows[0];
  return row ? { student: row.student, enrollment: row.enrollment } : null;
}

/**
 * 生徒と在籍を一括投入する（シード用）。students を先に入れてから enrollments を入れる。
 */
export async function insertStudentsWithEnrollments(
  studentRows: StudentInsert[],
  enrollmentRows: StudentEnrollmentInsert[],
): Promise<void> {
  const db = getTursoDb();
  await db.transaction(async (tx) => {
    if (studentRows.length > 0) await tx.insert(students).values(studentRows);
    if (enrollmentRows.length > 0) await tx.insert(studentEnrollments).values(enrollmentRows);
  });
}

/**
 * 学齢簿マッピングの確定結果を反映する。正式氏名（姓・名）で一致する自分の生徒の
 * 表示名（preferred）の姓を更新する。更新できた行数を返す（0 なら未一致）。
 * 認可はクエリ条件（ownerUserId）に内包。
 */
export async function updatePreferredFamilyByOfficialName(
  userId: string,
  officialFamily: string,
  officialGiven: string,
  preferredFamily: string,
): Promise<number> {
  const result = await getTursoDb()
    .update(students)
    .set({ preferredFamilyName: preferredFamily, updatedAt: new Date() })
    .where(
      and(
        eq(students.ownerUserId, userId),
        eq(students.officialFamilyName, officialFamily),
        eq(students.officialGivenName, officialGiven),
      ),
    );
  return result.rowsAffected ?? 0;
}

/**
 * そのオーナー（校長）の生徒 1 名を「転出」にする（論理的な処理。行は消さない）。
 * 在籍の enrollment_status を transferred_out にし、転出日を記録する。認可のため
 * 「自分の生徒か」を確認してから在籍を更新する（他人の生徒は転出できない → 0 行）。
 * 出席番号は再採番しないので、その番号は欠番として残る。更新できた在籍の行数を返す。
 */
export async function markStudentTransferredOut(
  userId: string,
  studentId: string,
  transferOutDate: Date,
): Promise<number> {
  const db = getTursoDb();
  return db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.ownerUserId, userId)))
      .limit(1);
    if (owned.length === 0) return 0;

    const result = await tx
      .update(studentEnrollments)
      .set({
        enrollmentStatus: ENROLLMENT_STATUS.transferredOut,
        transferOutDate,
        updatedAt: new Date(),
      })
      .where(eq(studentEnrollments.studentId, studentId));
    return result.rowsAffected ?? 0;
  });
}

/**
 * そのオーナー（校長）の名簿を丸ごと置き換える（既存を破棄してから新規投入）。
 * 単一トランザクションで原子的に行う。在籍は students の onDelete: cascade で消える。
 */
export async function replaceRosterForOwner(
  userId: string,
  studentRows: StudentInsert[],
  enrollmentRows: StudentEnrollmentInsert[],
): Promise<void> {
  const db = getTursoDb();
  await db.transaction(async (tx) => {
    await tx.delete(students).where(eq(students.ownerUserId, userId));
    if (studentRows.length > 0) await tx.insert(students).values(studentRows);
    if (enrollmentRows.length > 0) await tx.insert(studentEnrollments).values(enrollmentRows);
  });
}
