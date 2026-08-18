import { getTursoDb } from '@/server/db/turso/client';
import { users } from '@/server/db/turso/schema/auth';

/**
 * ゲストログイン用に `users` 行を1つ払い出す。OAuth と違い email 等の外部IDが無いため、
 * Auth.js の Credentials プロバイダの `authorize()` から直接呼ぶ（アダプタ経由の
 * createUser は Credentials では自動実行されない）。
 */
export async function insertGuestUser(): Promise<{ id: string; name: string }> {
  const id = crypto.randomUUID();
  const name = 'ゲスト';
  await getTursoDb().insert(users).values({ id, name, isGuest: true });
  return { id, name };
}
