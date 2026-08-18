import { eq } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  userPreferences,
  type UserPreferencesRow,
} from '@/server/db/turso/schema/user-preferences';

/** 学校プロフィール 3 項目（DB 列に対応する素の値）。 */
export interface SchoolProfileColumns {
  schoolName: string;
  principalName: string;
  schoolAddress: string;
}

export async function findPreferencesByUserId(
  userId: string,
): Promise<UserPreferencesRow | null> {
  const rows = await getTursoDb()
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * 学校プロフィールを upsert する。行が無ければ作成、あれば 3 列 + updatedAt を更新。
 * userId は user_preferences の主キーなので onConflict の対象に使える。
 */
export async function upsertSchoolProfile(
  userId: string,
  profile: SchoolProfileColumns,
): Promise<void> {
  const now = new Date();
  await getTursoDb()
    .insert(userPreferences)
    .values({ userId, ...profile, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        schoolName: profile.schoolName,
        principalName: profile.principalName,
        schoolAddress: profile.schoolAddress,
        updatedAt: now,
      },
    });
}

/**
 * 行が無いユーザにだけ既定値で 1 行作成する（初回 seed）。既存行は触らない。
 * `DO NOTHING` で冪等。書き込んだかどうかは呼び出し側で気にしない。
 */
export async function seedPreferencesIfAbsent(
  userId: string,
  profile: SchoolProfileColumns,
): Promise<void> {
  const now = new Date();
  await getTursoDb()
    .insert(userPreferences)
    .values({ userId, ...profile, createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: userPreferences.userId });
}

/**
 * 表示名編集の JIS X 0213 対応付け候補の生成元 (mjMappingSource) を upsert する。
 * 行が無ければこの列だけを持つ行を作成する（他列は null のまま。service 層が既定値で補う）。
 */
export async function upsertMjMappingSource(userId: string, source: string): Promise<void> {
  const now = new Date();
  await getTursoDb()
    .insert(userPreferences)
    .values({ userId, mjMappingSource: source, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { mjMappingSource: source, updatedAt: now },
    });
}
