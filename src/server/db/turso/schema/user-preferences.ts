import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  routinesExpandTomorrow: integer('routines_expand_tomorrow', {
    mode: 'boolean',
  })
    .notNull()
    .default(true),
  routinesExpandDayAfterTomorrow: integer('routines_expand_day_after_tomorrow', {
    mode: 'boolean',
  })
    .notNull()
    .default(true),
  routinesHistoryRetentionDays: integer('routines_history_retention_days')
    .notNull()
    .default(7),

  packingExpandFirstN: integer('packing_expand_first_n').notNull().default(3),
  packingShowResetButton: integer('packing_show_reset_button', {
    mode: 'boolean',
  })
    .notNull()
    .default(false),

  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UserPreferencesRow = typeof userPreferences.$inferSelect;
export type UserPreferencesInsert = typeof userPreferences.$inferInsert;
