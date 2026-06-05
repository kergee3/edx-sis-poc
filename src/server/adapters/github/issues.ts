import { logger } from '@/lib/logging';

const GITHUB_API_BASE = 'https://api.github.com';
const TIMEOUT_MS = 5000;

export interface CreateIssueInput {
  /** "owner/name" 形式 */
  repo: string;
  token: string;
  title: string;
  body: string;
  labels?: string[];
}

export interface CreateIssueResult {
  number: number;
  url: string;
}

interface GithubIssueResponse {
  number?: number;
  html_url?: string;
  message?: string;
}

/**
 * GitHub REST `POST /repos/{owner}/{repo}/issues` の薄いラッパ。
 * 認証は Personal Access Token (fine-grained 推奨、"Issues: read/write")。
 * ラベルは事前に GitHub 上で作成しておく必要がある (API は未存在ラベルを自動作成しない)。
 */
export async function createGithubIssue(input: CreateIssueInput): Promise<CreateIssueResult> {
  const url = `${GITHUB_API_BASE}/repos/${input.repo}/issues`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels ?? [],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const json = (await res.json().catch(() => ({}))) as GithubIssueResponse;

  if (!res.ok || typeof json.number !== 'number' || typeof json.html_url !== 'string') {
    throw new Error(`GitHub HTTP ${res.status}${json.message ? `: ${json.message}` : ''}`);
  }

  logger.info('github.issue.created', {
    repo: input.repo,
    issueNumber: json.number,
  });

  return { number: json.number, url: json.html_url };
}
