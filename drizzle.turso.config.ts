import { defineConfig } from 'drizzle-kit';

// drizzle-kit は .env.local を自動読込しないので明示的にロードする
try {
  process.loadEnvFile('.env.local');
} catch {
  // .env.local が無い場合は無視（CI 等は通常の環境変数を使う）
}

export default defineConfig({
  schema: './src/server/db/turso/schema',
  out: './src/server/db/turso/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? '',
    authToken: process.env.TURSO_AUTH_TOKEN ?? '',
  },
  strict: true,
  verbose: true,
});
