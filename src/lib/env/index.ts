import { z } from 'zod';

// 空文字の環境変数は「未設定」として扱う（.env.local に空のまま残された項目を通すため）
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_LINE_ID: z.string().min(1),
  AUTH_LINE_SECRET: z.string().min(1),
  AUTH_URL: optionalUrl,
  NEXTAUTH_URL: optionalUrl,

  BLOB_READ_WRITE_TOKEN: optionalString,

  // バグ報告 (GitHub Issue 自動起票)。未設定でも build/dev は通り、起票時に github_failed を返す
  GITHUB_TOKEN: optionalString,
  GITHUB_REPO: optionalString, // "owner/name" 形式
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // SKIP_ENV_VALIDATION=1 を設定するとビルド時の検証を迂回する（本番実行時は必ず外す）
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const detail = Object.entries(flat)
      .map(([key, msgs]) => `  - ${key}: ${msgs?.join(', ') ?? 'invalid'}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${detail}`);
  }
  return parsed.data;
}

export const env = loadEnv();
