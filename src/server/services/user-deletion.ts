import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging';
import { getTursoDb } from '@/server/db/turso/client';
import { users } from '@/server/db/turso/schema/auth';

/**
 * 退会・管理削除の入口。
 *
 * users への FK (account / session / login_history / user_preferences) は全て
 * onDelete: cascade なので、users 行を消せば関連行も自動的に削除される。
 *
 * UI 層は未実装。退会フローを作るときの呼び出し口として用意してある。
 */
export async function deleteUserAndAllData(userId: string): Promise<void> {
  const db = getTursoDb();
  try {
    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, userId));
    });
  } catch (error) {
    logger.error('ユーザデータの削除に失敗', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
