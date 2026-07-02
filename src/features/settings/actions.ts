'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import { updateSchoolProfileForUser } from '@/server/services/user-preferences';
import { resetRosterToMaster } from '@/server/services/students';
import { listRosterSheetNames } from '@/server/services/roster-master';
import { schoolProfileInputSchema, type SchoolProfileInput } from './schema/school-profile';

export type SaveSchoolProfileError = 'unauthorized' | 'invalid_input' | 'unknown';

export type SaveSchoolProfileResult =
  | { ok: true; values: SchoolProfileInput }
  | { ok: false; error: SaveSchoolProfileError; fieldErrors?: Partial<Record<keyof SchoolProfileInput, string>> };

export async function saveSchoolProfileAction(
  input: SchoolProfileInput,
): Promise<SaveSchoolProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'unauthorized' };
  }

  const parsed = schoolProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SchoolProfileInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key as keyof SchoolProfileInput] = issue.message;
      }
    }
    return { ok: false, error: 'invalid_input', fieldErrors };
  }

  try {
    await updateSchoolProfileForUser(session.user.id, parsed.data);
  } catch (err) {
    logger.error('settings.save_school_profile.failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }

  // ページは都度フェッチ（unstable_cache 不使用）だが、次回表示で確実に保存値を出すため revalidate。
  revalidatePath('/settings');
  return { ok: true, values: parsed.data };
}

export type ResetRosterError = 'unauthorized' | 'invalid_input' | 'unknown';

export type ResetRosterResult =
  | { ok: true }
  | { ok: false; error: ResetRosterError };

/**
 * 名簿を初期名簿 xlsx の内容で初期化し直す（既存名簿は破棄）。
 * 設定ページの「名簿の初期化」ボタンから呼ぶ。sheetName でシートを選べる
 * （未指定なら先頭シート）。クライアントは信用せず、実在するシート名かをここで検証する。
 */
export async function resetRosterToDefaultAction(sheetName?: string): Promise<ResetRosterResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'unauthorized' };
  }

  try {
    if (sheetName !== undefined) {
      const available = await listRosterSheetNames();
      if (!available.includes(sheetName)) {
        return { ok: false, error: 'invalid_input' };
      }
    }
    await resetRosterToMaster(session.user.id, sheetName);
  } catch (err) {
    logger.error('settings.reset_roster.failed', {
      userId: session.user.id,
      sheetName: sheetName ?? null,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }

  // 名簿一覧（都度フェッチ）に確実に反映させる。
  revalidatePath('/students');
  return { ok: true };
}
