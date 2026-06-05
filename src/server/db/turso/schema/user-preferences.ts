import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  // 学校プロフィール（ログインユーザ=校長ごとの校務情報）。
  // 値は service 層で既定値を補い、初回アクセス時に seed される（DB 上は nullable）。
  // ナビゲーション位置は localStorage 管理で、ここには持たない（保存場所を混同しないため）。
  schoolName: text('school_name'),
  principalName: text('principal_name'),
  schoolAddress: text('school_address'),

  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UserPreferencesRow = typeof userPreferences.$inferSelect;
export type UserPreferencesInsert = typeof userPreferences.$inferInsert;
