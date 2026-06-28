'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import { ensureSeededForUser } from '@/server/services/students';
import { updatePreferredFamilyByOfficialName } from '@/server/repositories/students';
import { applyMappedFamilyInputSchema, type ApplyMappedFamilyInput } from './schema';

export type ApplyMappedFamilyError = 'unauthorized' | 'invalid_input' | 'not_found' | 'unknown';

export type ApplyMappedFamilyResult = { ok: true } | { ok: false; error: ApplyMappedFamilyError };

/**
 * 学齢簿マッピングで確定した表示名（姓）を、対応する生徒（正式氏名で一致）に保存する。
 * 1 件ずつ確認しながら保存する想定。薄い受け口に留め、実処理は repository/service へ委譲。
 */
export async function applyMappedFamilyAction(
  input: ApplyMappedFamilyInput,
): Promise<ApplyMappedFamilyResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = applyMappedFamilyInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };

  try {
    await ensureSeededForUser(session.user.id);
    const updated = await updatePreferredFamilyByOfficialName(
      session.user.id,
      parsed.data.officialFamily,
      parsed.data.officialGiven,
      parsed.data.preferredFamily,
    );
    if (updated === 0) return { ok: false, error: 'not_found' };

    // 生徒一覧の表示名が変わるのでキャッシュを無効化
    revalidatePath('/students');
    return { ok: true };
  } catch (err) {
    logger.error('gakureibo.apply_mapped_family.failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }
}
