import { z } from 'zod';

/**
 * 学齢簿マッピングの確定（氏のみ）を students に保存する Server Action の入力。
 * 境界バリデーション（docs/coding-guidelines.md）。userId はクライアントを信用せず
 * Server Action 側で auth() から取得するのでここには含めない。
 */
export const applyMappedFamilyInputSchema = z.object({
  officialFamily: z.string().min(1).max(50),
  officialGiven: z.string().min(1).max(50),
  preferredFamily: z.string().min(1).max(50),
});

export type ApplyMappedFamilyInput = z.infer<typeof applyMappedFamilyInputSchema>;
