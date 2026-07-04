'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import {
  generateTransferStudentDraft,
  commitTransferStudent,
  type TransferStudentDraft,
} from '@/server/services/transfer-student';
import { transferStudentDraftSchema } from './schema';

/**
 * 転入生の下書き生成 / 登録の Server Action（薄い受け口）。実処理は
 * server/services/transfer-student.ts へ委譲する。生成は乱数で毎回異なる下書きを返し、
 * UI（TransferStudentButton）が確認・再抽選のうえ登録（commit）する。
 */

export type GenerateTransferError = 'unauthorized' | 'unknown';
export type GenerateTransferResult =
  | { ok: true; draft: TransferStudentDraft }
  | { ok: false; error: GenerateTransferError };

export async function generateTransferStudentAction(): Promise<GenerateTransferResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    const draft = await generateTransferStudentDraft(session.user.id);
    return { ok: true, draft };
  } catch (err) {
    logger.error('transfer.generate.failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }
}

export type CommitTransferError = 'unauthorized' | 'invalid_input' | 'unknown';
export type CommitTransferResult = { ok: true } | { ok: false; error: CommitTransferError };

export async function commitTransferStudentAction(
  input: TransferStudentDraft,
): Promise<CommitTransferResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = transferStudentDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };

  try {
    await commitTransferStudent(session.user.id, parsed.data);
    // 生徒一覧（RSC）の名簿が増えるのでキャッシュを無効化
    revalidatePath('/students');
    return { ok: true };
  } catch (err) {
    logger.error('transfer.commit.failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }
}
