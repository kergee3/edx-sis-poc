import { logger } from '@/lib/logging';

const MJ2JIS_API_BASE = 'https://maji.shumi.dev/api/mj2jis';
const TIMEOUT_MS = 5000;

/**
 * maji.shumi.dev の MJ→JIS 変換 Web API のレスポンス 1 件分。
 * フィールドの意味は https://maji.shumi.dev/mj2jis-api を参照。
 * mappingMethod / representativeUcsReason は将来値が増える可能性があるため string に広げる。
 */
export interface Mj2JisApiResult {
  input: string;
  mjCode: string | null;
  charResolution: 'REPRESENTATIVE' | 'EXACT_VARIANT' | null;
  mappingLevel: 1 | 2 | 3 | 4 | null;
  mappingMethod: string | null;
  mappingBasis: string | null;
  jisX0213: string | null;
  mjUcs: string | null;
  representativeUcs: string | null;
  representativeUcsApplied: boolean;
  representativeUcsReason: string | null;
  error: string | null;
}

interface Mj2JisApiResponse {
  data?: Mj2JisApiResult[];
  error?: string;
}

/**
 * `char` パラメータで文字列（複数文字可、IVS 付きクラスタ単位で解決）を渡し、
 * 各クラスタごとの JIS X 0213 対応付け結果を入力順で受け取る薄いラッパ。
 * 個別文字のエラー（未対応字等）は各要素の `error` に入り、HTTP は 200 のまま返る
 * （API 仕様どおり）。リクエスト全体の不備（400 等）や通信断は例外を投げる。
 */
export async function fetchMj2Jis(chars: string): Promise<Mj2JisApiResult[]> {
  const url = `${MJ2JIS_API_BASE}?char=${encodeURIComponent(chars)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  const json = (await res.json().catch(() => ({}))) as Mj2JisApiResponse;

  if (!res.ok || !Array.isArray(json.data)) {
    throw new Error(`mj2jis API HTTP ${res.status}${json.error ? `: ${json.error}` : ''}`);
  }

  logger.info('mj2jis.fetch', { chars, count: json.data.length });

  return json.data;
}
