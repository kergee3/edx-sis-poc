'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import { updateSchoolProfileForUser } from '@/server/services/user-preferences';
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
