import { and, desc, eq, isNull, notInArray } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  loginHistory,
  type LoginHistoryInsert,
  type LoginHistoryRow,
} from '@/server/db/turso/schema/login-history';
import type { ClientEnrichment } from '@/features/login-history/schema/enrichment';

export async function insertLoginHistory(input: LoginHistoryInsert): Promise<void> {
  await getTursoDb().insert(loginHistory).values(input);
}

export async function findRecentByUserId(
  userId: string,
  limit: number,
): Promise<LoginHistoryRow[]> {
  return getTursoDb()
    .select()
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId))
    .orderBy(desc(loginHistory.loggedInAt))
    .limit(limit);
}

/**
 * そのユーザの最新レコードで、まだクライアント情報が埋まっていない (os IS NULL) もの
 * 1 件だけを対象に enrichment を適用する。冪等。
 * 更新件数を返す (0 なら対象が無かった)。
 */
export async function updateLatestEnrichment(
  userId: string,
  data: ClientEnrichment,
): Promise<number> {
  const db = getTursoDb();

  const target = await db
    .select({ id: loginHistory.id })
    .from(loginHistory)
    .where(and(eq(loginHistory.userId, userId), isNull(loginHistory.os)))
    .orderBy(desc(loginHistory.loggedInAt))
    .limit(1);

  const row = target[0];
  if (!row) return 0;

  const result = await db
    .update(loginHistory)
    .set({
      os: data.os,
      browser: data.browser,
      architecture: data.architecture,
      physicalWidth: data.physicalWidth,
      physicalHeight: data.physicalHeight,
      logicalWidth: data.logicalWidth,
      logicalHeight: data.logicalHeight,
      hardwareConcurrency: data.hardwareConcurrency,
      deviceMemoryGb: data.deviceMemoryGb,
      maxTouchPoints: data.maxTouchPoints,
      userAgent: data.userAgent,
      uaPlatform: data.uaPlatform,
      uaMobile: data.uaMobile,
      uaBrands: data.uaBrands,
    })
    .where(eq(loginHistory.id, row.id));

  // libsql driver は rowsAffected を返す。対象を limit(1) で事前に特定しているため、取れなければ 1 を返す
  return (result as unknown as { rowsAffected?: number }).rowsAffected ?? 1;
}

/**
 * そのユーザの最新 `keep` 件を残して、それより古い行を削除する。
 * 返り値は削除件数 (取れないことがあるため 0 にフォールバック)。
 */
export async function pruneOldLogins(userId: string, keep: number): Promise<number> {
  const db = getTursoDb();

  const keepIds = db
    .select({ id: loginHistory.id })
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId))
    .orderBy(desc(loginHistory.loggedInAt))
    .limit(keep);

  const result = await db
    .delete(loginHistory)
    .where(and(eq(loginHistory.userId, userId), notInArray(loginHistory.id, keepIds)));

  return (result as unknown as { rowsAffected?: number }).rowsAffected ?? 0;
}
