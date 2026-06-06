import {
  buildRosterWorkbookBuffer,
  rosterFileName,
} from '@/features/students/services/roster-export';
import { logger } from '@/lib/logging';
import { requireUser } from '@/server/auth/session';
import { listRosterForUser } from '@/server/services/students';

// exceljs は Node ランタイム前提（Edge では動かない）。
export const runtime = 'nodejs';

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * ログインユーザ（校長）の生徒名簿を xlsx でダウンロードする。
 * バイナリ応答のため Server Action ではなく Route Handler で受ける（読取専用）。
 * 正式氏名の列に IPAmj明朝 を指定したブックを返す。
 */
export async function GET(): Promise<Response> {
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const entries = await listRosterForUser(userId);
    const buffer = await buildRosterWorkbookBuffer(entries);
    const fileName = rosterFileName(new Date());

    return new Response(buffer, {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        // 日本語ファイル名は RFC 5987 の filename* で渡し、ascii フォールバックも併記。
        'Content-Disposition': `attachment; filename="roster.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('students.export_failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('Failed to export roster', { status: 500 });
  }
}
