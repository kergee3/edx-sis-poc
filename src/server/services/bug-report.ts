import { env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { createGithubIssue } from '@/server/adapters/github/issues';

export type BugReportKind = 'bug' | 'enhancement';

export interface BugReportContext {
  url: string;
  userAgent: string;
  viewport: { w: number; h: number };
}

export interface BugReportUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface SubmitBugReportInput {
  user: BugReportUser;
  kind: BugReportKind;
  body: string;
  /** Vercel Blob にアップロード済みの公開 URL。失敗・未取得時は null。 */
  screenshotUrl: string | null;
  context: BugReportContext;
}

export interface SubmitBugReportResult {
  issueUrl: string;
  issueNumber: number;
}

const TITLE_PREFIX: Record<BugReportKind, string> = {
  bug: '[Bug]',
  enhancement: '[Suggestion]',
};

const KIND_LABEL: Record<BugReportKind, string> = {
  bug: 'バグ',
  enhancement: '提案',
};

const KIND_GITHUB_LABEL: Record<BugReportKind, string> = {
  bug: 'bug',
  enhancement: 'enhancement',
};

const TITLE_BODY_MAX = 40;

export function buildIssueTitle(kind: BugReportKind, body: string): string {
  const firstLine =
    body
      .split('\n')
      .find((l) => l.trim().length > 0)
      ?.trim() ?? '';
  const trimmed =
    firstLine.length === 0
      ? '(no title)'
      : firstLine.length > TITLE_BODY_MAX
        ? `${firstLine.slice(0, TITLE_BODY_MAX)}…`
        : firstLine;
  return `${TITLE_PREFIX[kind]} ${trimmed}`;
}

export function buildIssueBody(input: SubmitBugReportInput): string {
  const { user, kind, body, screenshotUrl, context } = input;
  const lines: string[] = [];

  lines.push('## 種別');
  lines.push(KIND_LABEL[kind]);
  lines.push('');

  lines.push('## 報告者');
  lines.push(`- userId: \`${user.id}\``);
  if (user.email) lines.push(`- email: ${user.email}`);
  if (user.name) lines.push(`- name: ${user.name}`);
  lines.push('');

  lines.push('## 環境');
  lines.push(`- URL: ${context.url}`);
  lines.push(`- viewport: ${context.viewport.w} x ${context.viewport.h}`);
  lines.push(`- user-agent: \`${context.userAgent}\``);
  lines.push(`- timestamp: ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## 本文');
  lines.push(body.trim().length === 0 ? '(本文なし)' : body);
  lines.push('');

  if (screenshotUrl) {
    lines.push('## 画面キャプチャ');
    lines.push(`![screenshot](${screenshotUrl})`);
    lines.push('');
  }

  return lines.join('\n');
}

export async function submitBugReport(input: SubmitBugReportInput): Promise<SubmitBugReportResult> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN / GITHUB_REPO not configured');
  }
  const title = buildIssueTitle(input.kind, input.body);
  const body = buildIssueBody(input);
  const labels = [KIND_GITHUB_LABEL[input.kind], 'user-report'];

  const issue = await createGithubIssue({
    repo: env.GITHUB_REPO,
    token: env.GITHUB_TOKEN,
    title,
    body,
    labels,
  });

  logger.info('bug_report.submitted', {
    userId: input.user.id,
    kind: input.kind,
    issueNumber: issue.number,
    hasScreenshot: input.screenshotUrl !== null,
  });

  return { issueUrl: issue.url, issueNumber: issue.number };
}
