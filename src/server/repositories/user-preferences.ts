import { eq } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  userPreferences,
  type UserPreferencesRow,
} from '@/server/db/turso/schema/user-preferences';

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferencesRow | null> {
  const rows = await getTursoDb()
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export interface UserPreferencesPatch {
  routinesExpandTomorrow?: boolean;
  routinesExpandDayAfterTomorrow?: boolean;
  routinesHistoryRetentionDays?: number;
  packingExpandFirstN?: number;
  packingShowResetButton?: boolean;
}

export async function upsertUserPreferences(input: {
  userId: string;
  patch: UserPreferencesPatch;
}): Promise<UserPreferencesRow> {
  // INSERT 時は未指定の列はテーブル既定値、UPDATE 時は patch に含まれる列だけ書き換える。
  // これにより routines / packing どちらの設定を更新してももう一方の値を上書きしない。
  const updateSet: Record<string, unknown> = { updatedAt: new Date() };
  if (input.patch.routinesExpandTomorrow !== undefined) {
    updateSet.routinesExpandTomorrow = input.patch.routinesExpandTomorrow;
  }
  if (input.patch.routinesExpandDayAfterTomorrow !== undefined) {
    updateSet.routinesExpandDayAfterTomorrow =
      input.patch.routinesExpandDayAfterTomorrow;
  }
  if (input.patch.routinesHistoryRetentionDays !== undefined) {
    updateSet.routinesHistoryRetentionDays =
      input.patch.routinesHistoryRetentionDays;
  }
  if (input.patch.packingExpandFirstN !== undefined) {
    updateSet.packingExpandFirstN = input.patch.packingExpandFirstN;
  }
  if (input.patch.packingShowResetButton !== undefined) {
    updateSet.packingShowResetButton = input.patch.packingShowResetButton;
  }

  const rows = await getTursoDb()
    .insert(userPreferences)
    .values({
      userId: input.userId,
      ...(input.patch.routinesExpandTomorrow !== undefined && {
        routinesExpandTomorrow: input.patch.routinesExpandTomorrow,
      }),
      ...(input.patch.routinesExpandDayAfterTomorrow !== undefined && {
        routinesExpandDayAfterTomorrow: input.patch.routinesExpandDayAfterTomorrow,
      }),
      ...(input.patch.routinesHistoryRetentionDays !== undefined && {
        routinesHistoryRetentionDays: input.patch.routinesHistoryRetentionDays,
      }),
      ...(input.patch.packingExpandFirstN !== undefined && {
        packingExpandFirstN: input.patch.packingExpandFirstN,
      }),
      ...(input.patch.packingShowResetButton !== undefined && {
        packingShowResetButton: input.patch.packingShowResetButton,
      }),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: updateSet,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('Failed to upsert user_preferences: no row returned');
  return row;
}
