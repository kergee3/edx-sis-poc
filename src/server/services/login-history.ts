import { headers } from 'next/headers';
import { after } from 'next/server';
import { logger } from '@/lib/logging';
import {
  findRecentByUserId,
  insertLoginHistory,
  pruneOldLogins,
  updateLatestEnrichment,
} from '@/server/repositories/login-history';
import type { LoginHistoryRow } from '@/server/db/turso/schema/login-history';
import type { ClientEnrichment } from '@/features/login-history/schema/enrichment';

const RETENTION_LIMIT = 100;

export async function recordLogin(
  userId: string,
  provider: string | null,
): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null;
    const userAgent = h.get('user-agent') ?? null;
    const referer = h.get('referer') ?? null;
    const geoCountry = h.get('x-vercel-ip-country') ?? null;
    const geoCity = h.get('x-vercel-ip-city') ?? null;
    const geoRegion = h.get('x-vercel-ip-country-region') ?? null;
    const geoLatitude = h.get('x-vercel-ip-latitude') ?? null;
    const geoLongitude = h.get('x-vercel-ip-longitude') ?? null;

    await insertLoginHistory({
      userId,
      provider,
      ip,
      userAgent,
      referer,
      geoCountry,
      geoCity,
      geoRegion,
      geoLatitude,
      geoLongitude,
    });
  } catch (error) {
    logger.error('Failed to record login history', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  after(async () => {
    try {
      await pruneOldLogins(userId, RETENTION_LIMIT);
    } catch (error) {
      logger.error('Failed to prune old login history', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export async function enrichLatestLogin(
  userId: string,
  data: ClientEnrichment,
): Promise<void> {
  try {
    await updateLatestEnrichment(userId, data);
  } catch (error) {
    logger.error('Failed to enrich login history', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function listRecentLoginsForUser(
  userId: string,
): Promise<LoginHistoryRow[]> {
  return findRecentByUserId(userId, RETENTION_LIMIT);
}
