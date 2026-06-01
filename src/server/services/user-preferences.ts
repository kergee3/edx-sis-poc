import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logging';
import { preferencesTag } from '@/server/cache/tags';
import {
  getUserPreferences,
  upsertUserPreferences,
} from '@/server/repositories/user-preferences';

function describeError(error: unknown): {
  message: string;
  cause?: string;
} {
  if (!(error instanceof Error)) return { message: String(error) };
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) {
    return { message: error.message, cause: cause.message };
  }
  if (cause !== undefined) {
    return { message: error.message, cause: String(cause) };
  }
  return { message: error.message };
}

export interface RoutinesPreferencesView {
  expandTomorrow: boolean;
  expandDayAfterTomorrow: boolean;
  historyRetentionDays: number;
}

const DEFAULT_ROUTINES_PREFERENCES: RoutinesPreferencesView = {
  expandTomorrow: true,
  expandDayAfterTomorrow: true,
  historyRetentionDays: 7,
};

export async function getRoutinesPreferencesForUser(
  userId: string,
): Promise<RoutinesPreferencesView> {
  return unstable_cache(
    () => loadRoutinesPreferences(userId),
    ['getRoutinesPreferencesForUser', userId],
    { tags: [preferencesTag(userId)], revalidate: 3600 },
  )();
}

async function loadRoutinesPreferences(
  userId: string,
): Promise<RoutinesPreferencesView> {
  try {
    const row = await getUserPreferences(userId);
    if (!row) return DEFAULT_ROUTINES_PREFERENCES;
    return {
      expandTomorrow: row.routinesExpandTomorrow,
      expandDayAfterTomorrow: row.routinesExpandDayAfterTomorrow,
      historyRetentionDays: row.routinesHistoryRetentionDays,
    };
  } catch (error) {
    logger.error('Failed to load user_preferences, returning defaults', {
      userId,
      ...describeError(error),
    });
    return DEFAULT_ROUTINES_PREFERENCES;
  }
}

export async function updateRoutinesPreferencesForUser(
  userId: string,
  input: RoutinesPreferencesView,
): Promise<boolean> {
  try {
    await upsertUserPreferences({
      userId,
      patch: {
        routinesExpandTomorrow: input.expandTomorrow,
        routinesExpandDayAfterTomorrow: input.expandDayAfterTomorrow,
        routinesHistoryRetentionDays: input.historyRetentionDays,
      },
    });
    return true;
  } catch (error) {
    logger.error('Failed to update user_preferences', {
      userId,
      ...describeError(error),
    });
    return false;
  }
}

export interface PackingPreferencesView {
  expandFirstN: number;
  showResetButton: boolean;
}

const DEFAULT_PACKING_PREFERENCES: PackingPreferencesView = {
  expandFirstN: 3,
  showResetButton: false,
};

export async function getPackingPreferencesForUser(
  userId: string,
): Promise<PackingPreferencesView> {
  return unstable_cache(
    () => loadPackingPreferences(userId),
    ['getPackingPreferencesForUser', userId],
    { tags: [preferencesTag(userId)], revalidate: 3600 },
  )();
}

async function loadPackingPreferences(
  userId: string,
): Promise<PackingPreferencesView> {
  try {
    const row = await getUserPreferences(userId);
    if (!row) return DEFAULT_PACKING_PREFERENCES;
    return {
      expandFirstN: row.packingExpandFirstN,
      showResetButton: row.packingShowResetButton ?? false,
    };
  } catch (error) {
    logger.error('Failed to load user_preferences, returning defaults', {
      userId,
      ...describeError(error),
    });
    return DEFAULT_PACKING_PREFERENCES;
  }
}

export async function updatePackingPreferencesForUser(
  userId: string,
  input: PackingPreferencesView,
): Promise<boolean> {
  try {
    await upsertUserPreferences({
      userId,
      patch: {
        packingExpandFirstN: input.expandFirstN,
        packingShowResetButton: input.showResetButton,
      },
    });
    return true;
  } catch (error) {
    logger.error('Failed to update user_preferences', {
      userId,
      ...describeError(error),
    });
    return false;
  }
}
