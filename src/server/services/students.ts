import { logger } from '@/lib/logging';
import {
  countByOwner,
  findRosterByOwner,
  findStudentByIdForOwner,
  insertStudentsWithEnrollments,
  type RosterEntry,
} from '@/server/repositories/students';
import { buildSeedRoster } from './students-seed';

/**
 * そのユーザ（校長）の名簿が空なら、PoC 用の初期 12 名を投入する。冪等。
 * 失敗してもページ表示は続行できるよう、ここで握りつぶしてログのみ残す。
 */
export async function ensureSeededForUser(userId: string): Promise<void> {
  try {
    const existing = await countByOwner(userId);
    if (existing > 0) return;
    const { studentRows, enrollmentRows } = buildSeedRoster(userId);
    await insertStudentsWithEnrollments(studentRows, enrollmentRows);
  } catch (error) {
    logger.error('Failed to seed students', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 名簿（生徒＋在籍）を取得する。初回は seed してから返す。
 *
 * NOTE: unstable_cache は戻り値を JSON シリアライズするため Date 列（birthDate 等）が
 * 文字列化されてしまう。参照実装の login-history 同様、一覧取得はキャッシュせず都度取得する。
 * キャッシュを導入する場合は、シリアライズ安全な形（epoch ms 等）に整形してから包むこと。
 * その際は src/server/cache/tags.ts の studentsTag(userId) を使い、更新系 Action で updateTag する。
 */
export async function listRosterForUser(userId: string): Promise<RosterEntry[]> {
  await ensureSeededForUser(userId);
  return findRosterByOwner(userId);
}

/**
 * 1 名の詳細（生徒＋在籍）を取得する。認可は repository のクエリ条件に内包。
 * 該当オーナーの生徒でなければ null。詳細取得は seed 不要なのでここでは seed しない。
 */
export async function getStudentForUser(
  userId: string,
  studentId: string,
): Promise<RosterEntry | null> {
  return findStudentByIdForOwner(userId, studentId);
}
