'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import {
  generateTransferStudentDraft,
  commitTransferStudent,
  type TransferStudentDraft,
} from '@/server/services/transfer-student';
import { transferOutStudent } from '@/server/services/students';
import { mapSurname, type SurnameMapping } from '@/server/services/mji-mapping';
import { transferStudentDraftSchema, transferOutStudentSchema } from './schema';

/**
 * 転入生の下書き生成 / 登録の Server Action（薄い受け口）。実処理は
 * server/services/transfer-student.ts へ委譲する。生成は乱数で毎回異なる下書きを返し、
 * UI（TransferStudentButton）が確認・再抽選のうえ登録（commit）する。
 */

export type GenerateTransferError = 'unauthorized' | 'unknown';
export type GenerateTransferResult =
  | { ok: true; draft: TransferStudentDraft; familyMapping: SurnameMapping }
  | { ok: false; error: GenerateTransferError };

export async function generateTransferStudentAction(): Promise<GenerateTransferResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    const draft = await generateTransferStudentDraft(session.user.id);
    // 転入時に表示名（姓）を編集できるよう、正式苗字（MJ）→ JIS X 0213 の写像も併せて返す。
    // 写像は officialFamily のみに依存するので draft には含めず、兄弟フィールドで返す
    // （commit の入力スキーマ transferStudentDraftSchema を汚さないため）。
    const familyMapping = await mapSurname(draft.officialFamily);
    return { ok: true, draft, familyMapping };
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

export type TransferOutError = 'unauthorized' | 'invalid_input' | 'not_found' | 'unknown';
export type TransferOutResult = { ok: true } | { ok: false; error: TransferOutError };

/**
 * 転出の Server Action（薄い受け口）。実処理は server/services/students.ts の
 * transferOutStudent（在籍を transferred_out にし転出日を記録する論理処理）へ委譲する。
 * studentId はクライアント値だが、認可はサービス／repository 側で auth() の userId と
 * 突き合わせる（他人の生徒は転出できない）。
 */
export async function transferOutStudentAction(studentId: string): Promise<TransferOutResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = transferOutStudentSchema.safeParse({ studentId });
  if (!parsed.success) return { ok: false, error: 'invalid_input' };

  try {
    const removed = await transferOutStudent(session.user.id, parsed.data.studentId);
    if (removed === 0) return { ok: false, error: 'not_found' };
    // 生徒一覧（RSC）の名簿が減るのでキャッシュを無効化
    revalidatePath('/students');
    return { ok: true };
  } catch (err) {
    logger.error('transfer.out.failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'unknown' };
  }
}
