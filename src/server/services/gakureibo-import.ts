import { type RosterEntry } from '@/server/repositories/students';
import { mapSurnameWithSource, type SurnameMapping } from './mji-mapping';
import type { MjMappingSource } from './user-preferences';

/**
 * 学齢簿（PoC ではマスタ名簿 xlsx）由来の 1 レコードを、正式氏名(MJ)の「氏（姓）」を
 * JIS X 0213 へ写像する表示名編集用の形にしたもの。設計: docs/design/mji-jisx0213-mapping-design.md §5。
 *
 * - 名（given）はマッピング対象外（氏のみ）。表示名の名はファイルの表示名（無ければ正式名）を使う。
 * - familyMapping に mapSurname() の結果（字ごとの 0213 判定・水準・代表字・異体字候補・非漢字）を載せる。
 * - currentPreferredFamily に現在 students に保存済みの表示名(姓)を載せ、UI が反映状況を示せるようにする。
 */
export interface GakureiboRecord {
  index: number;
  grade: number;
  officialFamily: string;
  officialGiven: string;
  preferredGiven: string;
  kanaFamily: string;
  kanaGiven: string;
  sex: string;
  /** 正式氏名（姓）の MJ → JIS X 0213 写像結果。 */
  familyMapping: SurnameMapping;
  /** 現在 students に保存されている表示名（姓）。未保存なら null。 */
  currentPreferredFamily: string | null;
}

/**
 * 生徒 1 名（DB の students 行）から、表示名（姓）マッピング編集用のレコードを組み立てる。
 * 生徒詳細ページ・転入で表示名（姓）の編集 UI（FamilyMappingFields）を表示するために使う。
 * 正式氏名は DB の値をそのまま使うので、applyMappedFamilyAction が同一行に一致・更新する。
 */
export async function buildMappingRecordFromRoster(
  entry: RosterEntry,
  mjMappingSource: MjMappingSource,
): Promise<GakureiboRecord> {
  const { student, enrollment } = entry;
  return {
    index: 0,
    grade: Number(enrollment?.grade) || 0,
    officialFamily: student.officialFamilyName,
    officialGiven: student.officialGivenName,
    preferredGiven: student.preferredGivenName,
    kanaFamily: student.kanaFamilyName,
    kanaGiven: student.kanaGivenName,
    sex: student.sex ?? '',
    familyMapping: await mapSurnameWithSource(student.officialFamilyName, mjMappingSource),
    currentPreferredFamily: student.preferredFamilyName,
  };
}
