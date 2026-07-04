import {
  buildOneRosterZip,
  type OneRosterTeacher,
} from '@/features/students/services/oneroster-export';
import { logger } from '@/lib/logging';
import { requireUser } from '@/server/auth/session';
import { listRosterForUser } from '@/server/services/students';

// fflate / crypto.randomUUID は Node ランタイム前提。
export const runtime = 'nodejs';

/**
 * ログインユーザ（校長）の生徒名簿を OneRoster v1.2 Japan Profile の ZIP でダウンロードする。
 * バイナリ応答のため Server Action ではなく Route Handler で受ける（読取専用）。
 * ログイン中の校長を teacher 1 件として含める。
 */
export async function GET(): Promise<Response> {
  let teacher: OneRosterTeacher;
  try {
    const user = await requireUser();
    teacher = { id: user.id, name: user.name, email: user.email };
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const entries = await listRosterForUser(teacher.id);
    const { zip, fileName } = buildOneRosterZip(entries, teacher, new Date());

    // fflate の Uint8Array を Response body（BufferSource）に渡す。基となる
    // ArrayBuffer を切り出して SharedArrayBuffer 型の可能性を排除する。
    const body = new Uint8Array(zip);

    return new Response(body, {
      headers: {
        'Content-Type': 'application/zip',
        // 日本語を含みうるファイル名は RFC 5987 の filename* で渡し、ascii フォールバックも併記。
        'Content-Disposition': `attachment; filename="oneroster.zip"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('students.oneroster_export_failed', {
      userId: teacher.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response('Failed to export OneRoster roster', { status: 500 });
  }
}
