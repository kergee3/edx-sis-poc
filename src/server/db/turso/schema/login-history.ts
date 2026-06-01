import { desc } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export interface UserAgentBrand {
  brand: string;
  version: string;
}

export const loginHistory = sqliteTable(
  'login_history',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    loggedInAt: integer('logged_in_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),

    // サーバ側で取得する情報
    provider: text('provider'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    referer: text('referer'),
    geoCountry: text('geo_country'),
    geoCity: text('geo_city'),
    geoRegion: text('geo_region'),
    geoLatitude: text('geo_latitude'),
    geoLongitude: text('geo_longitude'),

    // クライアント側で取得する情報（enrichment Server Action で後から補完）
    os: text('os'),
    browser: text('browser'),
    architecture: text('architecture'),
    physicalWidth: integer('physical_width'),
    physicalHeight: integer('physical_height'),
    logicalWidth: integer('logical_width'),
    logicalHeight: integer('logical_height'),
    hardwareConcurrency: integer('hardware_concurrency'),
    deviceMemoryGb: real('device_memory_gb'),
    maxTouchPoints: integer('max_touch_points'),
    uaPlatform: text('ua_platform'),
    uaMobile: integer('ua_mobile', { mode: 'boolean' }),
    uaBrands: text('ua_brands', { mode: 'json' }).$type<UserAgentBrand[]>(),
  },
  (t) => [
    index('login_history_user_logged_at_idx').on(t.userId, desc(t.loggedInAt)),
  ],
);

export type LoginHistoryRow = typeof loginHistory.$inferSelect;
export type LoginHistoryInsert = typeof loginHistory.$inferInsert;
