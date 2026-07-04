import { z } from 'zod';

/**
 * 転入生の下書きを名簿へ登録する Server Action の入力（境界バリデーション。
 * docs/coding-guidelines.md）。userId はクライアントを信用せず Server Action 側で
 * auth() から取得するのでここには含めない。値は generateTransferStudentAction が返した
 * 下書きをそのまま確認・確定するもので、形状（TransferStudentDraft）と一致させる。
 */
export const transferStudentDraftSchema = z.object({
  officialFamily: z.string().min(1).max(50),
  officialGiven: z.string().min(1).max(50),
  preferredFamily: z.string().min(1).max(50),
  preferredGiven: z.string().min(1).max(50),
  kanaFamily: z.string().min(1).max(50),
  kanaGiven: z.string().min(1).max(50),
  sex: z.enum(['男', '女']),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  birthDateMs: z.number().int().finite(),
});

export type TransferStudentDraftInput = z.infer<typeof transferStudentDraftSchema>;
