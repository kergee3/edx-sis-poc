import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  // 現状は永続化する実設定が無いため userId + timestamps のみのスカフォールド。
  // 実設定を足すときは列をここに追加し、login-history を参照実装に
  // services/repositories/format(toView) を起こす。

  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UserPreferencesRow = typeof userPreferences.$inferSelect;
export type UserPreferencesInsert = typeof userPreferences.$inferInsert;
