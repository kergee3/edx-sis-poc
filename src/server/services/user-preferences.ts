import { logger } from '@/lib/logging';
import {
  findPreferencesByUserId,
  seedPreferencesIfAbsent,
  upsertSchoolProfile,
  upsertMjMappingSource,
  type SchoolProfileColumns,
} from '@/server/repositories/user-preferences';

/** 学校プロフィールの既定値（PoC: 南海県の離島の中学校）。校長氏名はログインユーザ名で補う。 */
export const DEFAULT_SCHOOL_NAME = '南海県立小島第一中学校';
export const DEFAULT_SCHOOL_ADDRESS = '南海県小島町3-1';

/** 学校プロフィール（UI / Action でやり取りする確定値。すべて非 null）。 */
export interface SchoolProfile {
  schoolName: string;
  principalName: string;
  schoolAddress: string;
}

/**
 * 既定値を組み立てる。校長氏名はログインユーザ名（取れなければ空）。
 */
function buildDefaults(loginName: string | null): SchoolProfileColumns {
  return {
    schoolName: DEFAULT_SCHOOL_NAME,
    principalName: loginName ?? '',
    schoolAddress: DEFAULT_SCHOOL_ADDRESS,
  };
}

/**
 * そのユーザ（校長）の学校プロフィールを取得する。
 *
 * 初回（行が無い）アクセス時は既定値で 1 行 seed してから返す（生徒名簿の
 * ensureSeededForUser と同じ方針）。seed に失敗しても表示は続行できるよう、
 * ここで握りつぶしてログのみ残し、既定値を返す。
 *
 * NOTE: 読み取り時に書き込み副作用（seed）があるため unstable_cache では包まない
 * （login-history / students の参照実装と同じ判断）。設定ページは都度フェッチで十分。
 */
export async function getSchoolProfileForUser(
  userId: string,
  loginName: string | null,
): Promise<SchoolProfile> {
  const defaults = buildDefaults(loginName);

  let existing = await findPreferencesByUserId(userId);

  if (!existing) {
    try {
      await seedPreferencesIfAbsent(userId, defaults);
      existing = await findPreferencesByUserId(userId);
    } catch (error) {
      logger.error('Failed to seed school profile', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!existing) {
    // seed にも再取得にも失敗（DB 障害等）。既定値を返して画面は出す。
    return {
      schoolName: defaults.schoolName,
      principalName: defaults.principalName,
      schoolAddress: defaults.schoolAddress,
    };
  }

  // 列が null のケース（古い行）は既定値で補う。校長氏名はログイン名にフォールバック。
  return {
    schoolName: existing.schoolName ?? defaults.schoolName,
    principalName: existing.principalName ?? defaults.principalName,
    schoolAddress: existing.schoolAddress ?? defaults.schoolAddress,
  };
}

/**
 * 学校プロフィールを保存する（行が無ければ作成、あれば更新）。
 */
export async function updateSchoolProfileForUser(
  userId: string,
  profile: SchoolProfile,
): Promise<void> {
  await upsertSchoolProfile(userId, profile);
}

/** 表示名編集の JIS X 0213 対応付け候補の生成元。既定は maji.shumi.dev の Web API。 */
export type MjMappingSource = 'local' | 'api';
export const DEFAULT_MJ_MAPPING_SOURCE: MjMappingSource = 'api';

/**
 * そのユーザ（校長）の対応付け候補の生成元設定を取得する。未設定・不正値は既定値（'api'）。
 * DB 列の値を 'local' / 'api' どちらでも明示的に尊重し、それ以外（null 等）だけ既定値にする。
 */
export async function getMjMappingSourceForUser(userId: string): Promise<MjMappingSource> {
  const existing = await findPreferencesByUserId(userId);
  const value = existing?.mjMappingSource;
  return value === 'local' || value === 'api' ? value : DEFAULT_MJ_MAPPING_SOURCE;
}

/** 対応付け候補の生成元設定を保存する。 */
export async function updateMjMappingSourceForUser(
  userId: string,
  source: MjMappingSource,
): Promise<void> {
  await upsertMjMappingSource(userId, source);
}
