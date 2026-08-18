import { z } from 'zod';

/**
 * 表示名編集の JIS X 0213 対応付け候補の生成元。'local'（既定・DB 内蔵の MJ 縮退マップ）
 * または 'api'（maji.shumi.dev の MJ→JIS 変換 Web API）。
 */
export const mjMappingSourceInputSchema = z.enum(['local', 'api']);

export type MjMappingSourceInput = z.infer<typeof mjMappingSourceInputSchema>;
