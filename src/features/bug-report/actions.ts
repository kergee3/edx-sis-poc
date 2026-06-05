'use server';

import { auth } from '@/server/auth/config';
import { logger } from '@/lib/logging';
import { submitBugReport } from '@/server/services/bug-report';
import { submitBugReportInputSchema, type SubmitBugReportInput } from './schema';

export type SubmitBugReportError = 'unauthorized' | 'invalid_input' | 'github_failed' | 'unknown';

export type SubmitBugReportResult =
  | { ok: true; issueUrl: string; issueNumber: number }
  | { ok: false; error: SubmitBugReportError };

export async function submitBugReportAction(
  input: SubmitBugReportInput,
): Promise<SubmitBugReportResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'unauthorized' };
  }

  const parsed = submitBugReportInputSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn('bug_report.invalid_input', {
      userId: session.user.id,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.code,
        message: i.message,
      })),
    });
    return { ok: false, error: 'invalid_input' };
  }

  try {
    const result = await submitBugReport({
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
      kind: parsed.data.kind,
      body: parsed.data.body,
      screenshotUrl: parsed.data.screenshotBlobUrl,
      context: {
        url: parsed.data.contextUrl,
        userAgent: parsed.data.userAgent,
        viewport: parsed.data.viewport,
      },
    });
    return { ok: true, issueUrl: result.issueUrl, issueNumber: result.issueNumber };
  } catch (err) {
    logger.error('bug_report.failed', {
      userId: session.user.id,
      kind: parsed.data.kind,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'github_failed' };
  }
}
