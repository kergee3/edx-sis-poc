import { logger } from '@/lib/logging';
import {
  countByOwner,
  findRosterByOwner,
  findStudentByIdForOwner,
  insertStudentsWithEnrollments,
  markStudentTransferredOut,
  replaceRosterForOwner,
  type RosterEntry,
} from '@/server/repositories/students';
import { ENROLLMENT_STATUS } from '@/server/db/turso/schema/students';
import { buildSeedRoster } from './students-seed';
import { buildRosterFromMaster } from './roster-master';

/**
 * そのユーザ（校長）の名簿が空なら、PoC 用の初期名簿を投入する。冪等。
 *
 * 正本は public/poc-data/initial-student-roster.xlsx の v2 シート（[roster-master.ts](./roster-master.ts)）。
 * xlsx の読み込みに失敗したときは、新規ユーザでも名簿が空にならないよう
 * 旧ハードコード（[students-seed.ts](./students-seed.ts)）へフォールバックする。
 * 失敗してもページ表示は続行できるよう、ここで握りつぶしてログのみ残す。
 */
export async function ensureSeededForUser(userId: string): Promise<void> {
  try {
    const existing = await countByOwner(userId);
    if (existing > 0) return;

    let rows: Awaited<ReturnType<typeof buildRosterFromMaster>>;
    try {
      rows = await buildRosterFromMaster(userId);
    } catch (masterError) {
      logger.error('Failed to read master roster xlsx; falling back to hardcoded seed', {
        userId,
        error: masterError instanceof Error ? masterError.message : String(masterError),
      });
      rows = buildSeedRoster(userId);
    }

    await insertStudentsWithEnrollments(rows.studentRows, rows.enrollmentRows);
  } catch (error) {
    logger.error('Failed to seed students', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 名簿を初期名簿 xlsx の内容で初期化し直す（既存名簿は破棄）。
 * 設定ページの「名簿の初期化」から呼ぶ。sheetName でシートを選べる（未指定なら先頭シート）。
 * xlsx 読み込みに失敗したら例外を投げ、呼び出し側（Server Action）がエラーを利用者に返せる
 * ようにする（ここではフォールバックしない）。
 */
export async function resetRosterToMaster(userId: string, sheetName?: string): Promise<void> {
  const { studentRows, enrollmentRows } = await buildRosterFromMaster(userId, { sheetName });
  await replaceRosterForOwner(userId, studentRows, enrollmentRows);
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
  const roster = await findRosterByOwner(userId);
  // 転出者は名簿一覧・詳細ナビから除外する（記録は DB に残るが在籍名簿には出さない）。
  return roster.filter(
    (e) => e.enrollment?.enrollmentStatus !== ENROLLMENT_STATUS.transferredOut,
  );
}

/**
 * 転出（論理処理）。生徒 1 名の在籍を transferred_out にし、転出日を記録する。行は消さず、
 * 記録として残す。認可は repository のクエリ条件（ownerUserId）に内包し、自分の生徒でなければ
 * 0 行になる。転出者は listRosterForUser で名簿一覧から除外され、出席番号は欠番になる。
 * 更新できた行数を返す（0 なら該当なし＝未在籍/他人の生徒）。
 */
export async function transferOutStudent(userId: string, studentId: string): Promise<number> {
  return markStudentTransferredOut(userId, studentId, new Date());
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
