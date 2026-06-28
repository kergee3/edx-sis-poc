import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * MJ文字 → JIS X 0213 マッピング用の参照データ。設計の土台は
 * docs/design/mji-jisx0213-mapping-design.md。
 *
 * - ユーザー横断で共有する **読み取り専用の参照データ**。生徒名簿と違い
 *   per-user スコープ（ownerUserId）も timestamps も持たない（不変参照）。
 * - 投入は SQL マイグレーションではなく専用スクリプト（scripts/import-mji.mjs）で行う。
 *   一次データは docs/ref-data/ の mji.00602.xlsx / MJShrinkMap.1.2.0.json（repo 非追跡）。
 */

/**
 * MJ文字情報一覧表（mji.00602.xlsx, 約58,862行）の必要列。
 * 列対応: C=mj_id / D=corresponding_ucs / E=implemented_ucs / F=ivs / G=svs /
 *         N=x0213 / O=x0213_unification_serial / P=x0213_unification_class /
 *         Q=x0212 / AB=total_strokes / AC=readings。
 */
export const mjiCharacters = sqliteTable(
  'mji_characters',
  {
    // C: MJ文字図形名（例 MJ030060）
    mjId: text('mj_id').primaryKey(),
    // D: 対応するUCS（例 U+9F4A）。同一符号位置の異体字グループ鍵・代表字算出に使う
    correspondingUcs: text('corresponding_ucs').notNull(),
    // E: 実装したUCS（裸の符号位置。IVS のみの図形では null）。裸符号位置入力の照合用
    implementedUcs: text('implemented_ucs'),
    // F: 実装したMoji_JohoコレクションIVS（例 9F4A_E0103）。IVS 入力の照合用
    ivs: text('ivs'),
    // G: 実装したSVS
    svs: text('svs'),
    // N: X0213 面区点（例 1-25-66）。null = JIS X 0213 に無い
    x0213: text('x0213'),
    // O / P / Q
    x0213UnificationSerial: text('x0213_unification_serial'),
    x0213UnificationClass: text('x0213_unification_class'),
    x0212: text('x0212'),
    // x0213（面区点）から導出した JIS 水準（1〜4）。非漢字 / 0213 外は null。
    // 導出規則は docs/design 設計書 §4 / src/server/services/mji-mapping.ts の jisLevel()
    jisLevel: integer('jis_level'),
    // AB: 総画数 / AC: 読み（表示補助）
    totalStrokes: integer('total_strokes'),
    readings: text('readings'),
  },
  (t) => [
    index('mji_characters_corresponding_ucs_idx').on(t.correspondingUcs),
    index('mji_characters_implemented_ucs_idx').on(t.implementedUcs),
    index('mji_characters_ivs_idx').on(t.ivs),
    index('mji_characters_x0213_idx').on(t.x0213),
  ],
);

/** 縮退候補の根拠区分（信頼度の高い順）。priority と対応する。 */
export type ShrinkCriterion = 'jis_ucs' | 'koseki' | 'kokuji582' | 'dict' | 'reading_shape';

/**
 * MJ縮退マップ（MJShrinkMap.1.2.0.json）を「1 候補 = 1 行」に展開したもの。
 * 別符号位置の異体字（斉/齊/齋/斎 等）を辿るために使う。
 *
 * - mj_id は論理的には mji_characters.mj_id への参照だが、縮退マップ(Ver.1.2.0,
 *   MJ一覧表 Ver.005.02 ベース)と mji.xlsx(Ver.006.02)の版差で一方にしか無い
 *   mj_id がありうるため、**外部キーは張らずインデックスのみ**にする（設計書 §7）。
 * - target_ucs の逆引きで「ある代表字に縮退してくる全 MJ文字」= 別符号位置の
 *   異体字集合を引ける。
 */
export const mjiShrinkCandidates = sqliteTable(
  'mji_shrink_candidates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // 縮退元の MJ文字図形名
    mjId: text('mj_id').notNull(),
    // 根拠区分: jis_ucs(JIS包摂規準・UCS統合規則) / koseki(法務省戸籍法関連通達・通知) /
    //           kokuji582(法務省告示582号別表第四) / dict(辞書類等による関連字) /
    //           reading_shape(読み・字形による類推)
    criterion: text('criterion').$type<ShrinkCriterion>().notNull(),
    // 信頼度順（1=jis_ucs 〜 5=reading_shape）
    priority: integer('priority').notNull(),
    // 縮退先候補
    targetX0213: text('target_x0213'),
    targetUcs: text('target_ucs'),
    // 区分固有のメタ（戸籍の種別/付記/ホップ数、告示582の表/順位 等）
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => [
    index('mji_shrink_candidates_mj_id_idx').on(t.mjId),
    index('mji_shrink_candidates_target_ucs_idx').on(t.targetUcs),
  ],
);

export type MjiCharacterRow = typeof mjiCharacters.$inferSelect;
export type MjiCharacterInsert = typeof mjiCharacters.$inferInsert;
export type MjiShrinkCandidateRow = typeof mjiShrinkCandidates.$inferSelect;
export type MjiShrinkCandidateInsert = typeof mjiShrinkCandidates.$inferInsert;
