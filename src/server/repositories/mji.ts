import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { getTursoDb } from '@/server/db/turso/client';
import {
  mjiCharacters,
  mjiShrinkCandidates,
  type MjiCharacterRow,
  type MjiShrinkCandidateRow,
} from '@/server/db/turso/schema/mji';

/**
 * MJ文字 → JIS X 0213 マッピング参照データへのアクセス（Drizzle クエリのみ）。
 * 業務ロジックは server/services/mji-mapping.ts に置く。
 * 参照テーブルはユーザー横断の読み取り専用なので認可スコープは無い。
 */

/** IVS（例 9F4A_E0103）で 1 文字を引く。 */
export async function findMjiByIvs(ivs: string): Promise<MjiCharacterRow | null> {
  const rows = await getTursoDb()
    .select()
    .from(mjiCharacters)
    .where(eq(mjiCharacters.ivs, ivs))
    .limit(1);
  return rows[0] ?? null;
}

/** 裸の符号位置（例 U+9F4A）で引く。同一符号位置に複数図形がありうるので配列で返す。 */
export async function findMjiByImplementedUcs(ucs: string): Promise<MjiCharacterRow[]> {
  return getTursoDb()
    .select()
    .from(mjiCharacters)
    .where(eq(mjiCharacters.implementedUcs, ucs));
}

/**
 * 同一符号位置（対応するUCS が同じ）の異体字のうち、JIS X 0213 にあるものを返す。
 * 「この字形は 0213 に無いが、同符号位置の別字形は 0213 にある」ケースの候補源。
 */
export async function findX0213VariantsByCorrespondingUcs(
  ucs: string,
): Promise<MjiCharacterRow[]> {
  return getTursoDb()
    .select()
    .from(mjiCharacters)
    .where(and(eq(mjiCharacters.correspondingUcs, ucs), isNotNull(mjiCharacters.x0213)));
}

/**
 * 同一符号位置（correspondingUcs 一致）の IVS 異体字（ivs 付き図形）を全て返す。
 * findX0213VariantsByCorrespondingUcs と違い 0213 収録の有無は問わない（正式氏名は
 * MJ特有の字形をそのまま採るため）。転入生の正式苗字生成で、基底漢字の異体字グリフを
 * ランダムに選ぶために使う。
 */
export async function findIvsVariantsByCorrespondingUcs(
  ucs: string,
): Promise<MjiCharacterRow[]> {
  return getTursoDb()
    .select()
    .from(mjiCharacters)
    .where(and(eq(mjiCharacters.correspondingUcs, ucs), isNotNull(mjiCharacters.ivs)));
}

/** ある MJ文字の縮退候補（別符号位置の異体字含む）を priority 昇順で返す。 */
export async function findShrinkCandidatesByMjId(
  mjId: string,
): Promise<MjiShrinkCandidateRow[]> {
  return getTursoDb()
    .select()
    .from(mjiShrinkCandidates)
    .where(eq(mjiShrinkCandidates.mjId, mjId))
    .orderBy(asc(mjiShrinkCandidates.priority));
}

/**
 * ある代表字（UCS）に縮退してくる MJ文字のうち、JIS X 0213 にあるものを返す
 * ＝「代表字の異体字（0213 にある漢字）」。縮退マップを逆引きする。
 * 例: targetUcs=U+6589(斉) → 齊(1-83-78) など。同一文字の複数 criterion 重複は mjId で畳む。
 */
export async function findX0213VariantsByShrinkTarget(
  targetUcs: string,
): Promise<MjiCharacterRow[]> {
  const rows = await getTursoDb()
    .select({ char: mjiCharacters })
    .from(mjiShrinkCandidates)
    .innerJoin(mjiCharacters, eq(mjiCharacters.mjId, mjiShrinkCandidates.mjId))
    .where(and(eq(mjiShrinkCandidates.targetUcs, targetUcs), isNotNull(mjiCharacters.x0213)));

  const byId = new Map<string, MjiCharacterRow>();
  for (const r of rows) if (!byId.has(r.char.mjId)) byId.set(r.char.mjId, r.char);
  return [...byId.values()];
}
