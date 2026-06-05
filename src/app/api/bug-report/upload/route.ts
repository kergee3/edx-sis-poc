import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/session';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ALLOWED_PATH_PREFIX = 'bug-reports/';
const MAX_BYTES = 2_000_000; // 2MB

/**
 * @vercel/blob/client.upload() からの token 発行リクエストを受け取る。
 *  - ログイン必須 (requireUser)
 *  - pathname が `bug-reports/` で始まるもののみ許可
 *  - JPEG / PNG のみ、最大 2MB
 *  - access は呼び出し側 (upload()) で 'public' を指定
 */
export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await requireUser();
        if (!pathname.startsWith(ALLOWED_PATH_PREFIX)) {
          throw new Error(`pathname must start with "${ALLOWED_PATH_PREFIX}"`);
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let userId: string | undefined;
        if (tokenPayload) {
          try {
            const parsed = JSON.parse(tokenPayload) as { userId?: string };
            userId = parsed.userId;
          } catch {
            // ignore
          }
        }
        logger.info('bug_report.screenshot_uploaded', {
          userId,
          blobUrl: blob.url,
          pathname: blob.pathname,
        });
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('bug_report.upload_failed', { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
