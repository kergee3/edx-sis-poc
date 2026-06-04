import { asc, count, eq } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  students,
  studentEnrollments,
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
