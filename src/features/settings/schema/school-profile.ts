import { z } from 'zod';

/**
 * 学校プロフィール入力。3 項目とも必須（前後空白は trim 後に min(1) 判定）。
 * 境界（Server Action）で検証する。
 */
export const schoolProfileInputSchema = z.object({
  schoolName: z.string().trim().min(1, '学校名を入力してください').max(100),
  principalName: z.string().trim().min(1, '校長氏名を入力してください').max(100),
  schoolAddress: z.string().trim().min(1, '学校住所を入力してください').max(200),
});

export type SchoolProfileInput = z.infer<typeof schoolProfileInputSchema>;
