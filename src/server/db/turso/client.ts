import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { env } from '@/lib/env';
import * as schema from './schema';

export type TursoDatabase = LibSQLDatabase<typeof schema>;
export type TursoDbOrTx =
  | TursoDatabase
  | Parameters<Parameters<TursoDatabase['transaction']>[0]>[0];

let cached: TursoDatabase | null = null;

export function getTursoDb(): TursoDatabase {
  if (!cached) {
    if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN is not set');
    }
    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    cached = drizzle(client, { schema });
  }
  return cached;
}
