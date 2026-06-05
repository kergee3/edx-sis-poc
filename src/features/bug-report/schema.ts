import { z } from 'zod';

/** Vercel Blob 公開ドメイン: `https://{store}.public.blob.vercel-storage.com/...` */
const VERCEL_BLOB_URL_RE =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/bug-reports\//;

export const submitBugReportInputSchema = z.object({
  kind: z.enum(['bug', 'enhancement']),
  body: z.string().min(1).max(2000),
  /** Blob upload が成功した場合のみ URL。失敗 or キャプチャ未取得時は null。 */
  screenshotBlobUrl: z
    .string()
    .url()
    .regex(VERCEL_BLOB_URL_RE, 'must be a Vercel Blob bug-reports URL')
    .nullable(),
  contextUrl: z.string().url(),
  userAgent: z.string().min(1).max(500),
  viewport: z.object({
    w: z.number().int().min(1).max(10000),
    h: z.number().int().min(1).max(10000),
  }),
});

export type SubmitBugReportInput = z.infer<typeof submitBugReportInputSchema>;
