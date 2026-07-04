# MJ文字 → JIS X 0213 マッピング設計（氏名文字の正規化）

学齢簿から受け入れた**正式氏名（MJ文字・Unicode IVS 付き）**を、連携・表示で使う **JIS文字（JIS X 0213）** へ写像するための設計。[koumu-eportal-student-data-model.md §5.1](koumu-eportal-student-data-model.md) が「別途設計事項」とした *「学齢簿側の MJ特有文字を連携用の JIS文字へどう写像するか」* を具体化する。

> 用語は [koumu-eportal-student-data-model.md §5.0](koumu-eportal-student-data-model.md)（正本）に従う:
> **JIS文字**＝JIS X 0213 で定義された文字 ／ **MJ文字**＝文字情報基盤(MJ)で定義された文字 ／ **MJ特有文字**＝JIS文字でない MJ文字。集合論的に **MJ文字 = JIS文字 ＋ MJ特有文字**。
>
> 調査日: 2026-06-28 ／ 一次資料は [external-references.md](external-references.md) の索引参照（資料ファイルは repo に長期保持しない）。

> **【方針改定 2026-07-03】変換先は JIS X 0213 の「基底文字（VS なしの符号位置）」に限定する。**
> 同符号位置の **IVS 異体字は候補に出さず、保存もしない**。理由: (1) IVD はコレクション間の字形対応を定義しておらず、Moji_Joho→Adobe-Japan1 の付け替えに公式・機械可読な根拠が無い、(2) 受け側の校務・学習支援アプリの多くが IVS 非対応（照合・検索・印字で VS が落ちる/化ける）、(3) 両コレクションが重なる範囲でも約 3,771 符号位置で多対1の縮退が構造的に不可避。定量と根拠は [mj_to_jisx0213_conversion_report.md](mj_to_jisx0213_conversion_report.md)。
> 本書のうち「同符号位置の IVS 異体字を候補にする／IVS 字形を保存する」とある記述は、本改定で**基底文字のみを候補・保存対象とする**よう読み替える（該当箇所に個別注記）。実装では `collectCandidates`（[src/server/services/mji-mapping.ts](../../src/server/services/mji-mapping.ts)）が `ivs != null` の候補を除外する。

## 0. 目的とスコープ

- 入力: 学齢簿由来の苗字（漢字。MJ特有文字＝IVS 付き符号位置を含みうる）。
- 出力: [student-schema-design.md](student-schema-design.md) の氏名 3 系統のうち、`official_*`（MJ）から `preferred_*`（JIS文字）への**文字単位のマッピング根拠**。
- 本書が定めること:
  1. 指定文字が **JIS X 0213 に定義されているか**の判定。
  2. 定義されていれば、**面区点コードから JIS 第1〜4水準**を取得。
  3. 文字の**代表字**を取得。
  4. 代表字に対する**異体字（JIS X 0213 にある基底文字）の候補リスト**を取得（**IVS 異体字は含めない**。冒頭の方針改定を参照）。
  5. MJ にも無い文字は **非漢字**として扱う。
- 自動で一意に確定できない文字（0213 に無く、代表字・異体字にも 0213 該当が複数/無い）は、**最終判断を学校事務（人手）に委ねる**。本書は候補提示までを担う。
- スコープ外: 実装（Drizzle スキーマの確定、インポートスクリプト、lookup サービス、UI）は後続作業。本書はそのインプット。

## 1. 入力と前提

- 入力文字列は **Unicode（UTF-8）**。1 つの「字」は次のいずれか:
  - 裸の符号位置（例: 高 `U+9AD8`）。
  - 基底符号位置 ＋ **異体字セレクタ（VS, U+E0100〜U+E01EF）** からなる **IVS**（例: 齊󠄃 = `U+9F4A U+E0103`）。
- したがって入力は**書記素クラスタ単位**で分割し、各クラスタを「基底符号位置 ＋ 任意の VS」に正規化してから照合する。
- 本書では IVS を mji.xlsx の F 列に合わせ `BASE_VS`（アンダースコア区切り・大文字16進、例 `9F4A_E0103`）で表記する。

## 2. データソース

| 名称 | 版 | 形式 | ライセンス | 役割 |
| --- | --- | --- | --- | --- |
| MJ文字情報一覧表 | Ver.006.02（2024-01） | xlsx | CC BY-SA 2.1 JP | 文字メタデータ（UCS / IVS / X0213 面区点 / 水準導出元 / 同一符号位置の異体字） |
| MJ縮退マップ | Ver.1.2.0（2018-01-26） | JSON / XML（xlsx 無し） | CC BY-SA 2.1 JP | 約6万 MJ文字 → 約1万 JIS X 0213 文字の縮退対応（**別符号位置の異体字**） |

- いずれも一般社団法人 文字情報技術促進協議会（IPA 著作物）。URL・取得日は [external-references.md](external-references.md) を参照。利用時は **IPA の著作物である旨を明記**する（CC BY-SA）。
- 一次資料ファイルは原則 repo に長期保持しない（[external-references.md](external-references.md) の運用ルール）。現状 `docs/ref-data/mji.00602.xlsx` に置かれているものは、Turso への**インポート用の一時入力**として扱う。MJ縮退マップ JSON も同様にインポート時のみ取得する。

### 2.1 mji.xlsx の実査結果（Ver.006.02）

直接パースして確認した事実（設計の根拠）:

- 全 **58,862 行**（MJ文字図形）/ 36 列。うち **X0213 を持つ行 = 13,707**、IVS を持つ行 = 11,382、実装UCS を持つ行 = 52,607。
- 本設計で使う列:

  | 列 | 名称 | 例 | 用途 |
  | --- | --- | --- | --- |
  | C | MJ文字図形名 | `MJ030060` | 主キー |
  | D | 対応するUCS | `U+9F4A` | **同一符号位置の異体字グループ鍵**・代表字算出 |
  | E | 実装したUCS | `U+9F4A`（IVSのみの図形では空） | 裸符号位置入力の照合 |
  | F | 実装したMoji_JohoコレクションIVS | `9F4A_E0103` | IVS 入力の照合 |
  | G | 実装したSVS | — | 参考 |
  | N | X0213 | `1-25-66` / `2-01-13`（空＝0213外） | 0213 定義判定・水準導出 |
  | O | X0213 包摂連番 | — | 参考 |
  | P | X0213 包摂区分 | `0` | 参考 |
  | Q | X0212 | — | 参考 |
  | AB | 総画数 | `7` | 表示補助 |
  | AC | 読み | `リュウ・…` | 表示補助・候補絞り込み |

- **包摂の実例**: 高(`U+9AD8`) と 髙(`U+9AD9`) は別符号位置だが、ともに X0213=`1-25-66`（包摂により同一位置）。→ **髙も 0213 で表現可能**。
- **同一符号位置の IVS 異体字は D 列でグルーピングできる**: 齊 `9F4A_E0102` は X0213=`1-83-78`、その兄弟字形 齊󠄃 `9F4A_E0103` は X0213 空。→「この字形は 0213 に無いが、**同符号位置の別字形は 0213 にある**」ケースを mji.xlsx 単体でカバーできる。
- **別符号位置どうしの異体字は mji.xlsx では辿れない**: 斉(`U+6589`,1-32-38) / 齊(`U+9F4A`,1-83-78) / 齋(`U+9F4B`,1-67-23) / 斎(`U+658E`,1-26-56) は D 列が全て異なる。→ これを辿るのが MJ縮退マップ（§2.2）の役割。

### 2.2 MJ縮退マップの構造（Ver.1.2.0, JSON）

`content[]` の各レコードは `MJ文字図形名`（必須）と、**5 種の縮退候補配列**（信頼度の高い順）を持つ。各候補は `{"JIS X 0213": 面区点, "UCS": 符号位置}` の組。

| 区分（本設計の `criterion`） | 原典のキー | priority | 性格 |
| --- | --- | --- | --- |
| `jis_ucs` | JIS包摂規準・UCS統合規則 | 1 | 規格上の縮退（最も安全） |
| `koseki` | 法務省戸籍法関連通達・通知 | 2 | 戸籍実務（種別・付記・ホップ数つき） |
| `kokuji582` | 法務省告示582号別表第四 | 3 | 漢字表記告示（表・順位つき, 最大2） |
| `dict` | 辞書類等による関連字 | 4 | 辞書ベース |
| `reading_shape` | 読み・字形による類推 | 5 | 読み・字形ベース（最も緩い） |

- **縮退先候補は複数のことも、無いこともある**（原典明記）。複数時は「使用状況を勘案して実際の縮退先を判断」、無い場合は「熟語化・読み仮名化」が必要 → 本設計では**人手の最終選択に回す**。

## 3. データ構造（Turso・読み取り専用の参照データ）

ユーザー横断で共有する**不変の参照データ**なので、生徒名簿と違い **per-user スコープ（`ownerUserId`）も timestamps も持たない**。`src/server/db/turso/schema/mji.ts` 想定。DB 列は snake_case、TS は camelCase（Drizzle 自動写像）。型は `$inferSelect/$inferInsert` を export。

### 3.1 `mji_characters`（mji.xlsx, 約58,862行）

```ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const mjiCharacters = sqliteTable(
  'mji_characters',
  {
    mjId: text('mj_id').primaryKey(),                       // C: MJ030060
    correspondingUcs: text('corresponding_ucs').notNull(),  // D: U+9F4A（異体字グループ鍵）
    implementedUcs: text('implemented_ucs'),                // E: 裸符号位置（IVSのみは null）
    ivs: text('ivs'),                                       // F: 9F4A_E0103
    svs: text('svs'),                                       // G
    x0213: text('x0213'),                                   // N: 1-25-66（null=0213外）
    x0213UnificationSerial: text('x0213_unification_serial'), // O
    x0213UnificationClass: text('x0213_unification_class'),   // P
    x0212: text('x0212'),                                   // Q
    jisLevel: integer('jis_level'),                         // N列から導出: 1〜4 / null
    totalStrokes: integer('total_strokes'),                 // AB
    readings: text('readings'),                             // AC
  },
  (t) => [
    index('mji_characters_corresponding_ucs_idx').on(t.correspondingUcs),
    index('mji_characters_implemented_ucs_idx').on(t.implementedUcs),
    index('mji_characters_ivs_idx').on(t.ivs),
    index('mji_characters_x0213_idx').on(t.x0213),
  ],
);
```

- `jisLevel` は §4 の規則で**インポート時に N 列から導出**して持たせる（クエリ時計算を避ける）。0213 外・非漢字は null。

### 3.2 `mji_shrink_candidates`（MJ縮退マップを 1 候補＝1 行に展開）

```ts
export const mjiShrinkCandidates = sqliteTable(
  'mji_shrink_candidates',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    mjId: text('mj_id').notNull(),                  // 縮退元 MJ文字図形名（→ mji_characters.mj_id）
    criterion: text('criterion').notNull(),         // 'jis_ucs'|'koseki'|'kokuji582'|'dict'|'reading_shape'
    priority: integer('priority').notNull(),        // 1（jis_ucs）〜 5（reading_shape）
    targetX0213: text('target_x0213'),              // 候補の面区点
    targetUcs: text('target_ucs'),                  // 候補の符号位置（逆引き=異体字列挙用）
    meta: text('meta', { mode: 'json' }),           // 戸籍の種別/付記/ホップ数, 告示582の表/順位 等
  },
  (t) => [
    index('mji_shrink_candidates_mj_id_idx').on(t.mjId),
    index('mji_shrink_candidates_target_ucs_idx').on(t.targetUcs),
  ],
);
```

- `mjId` は論理的には `mji_characters.mj_id` への参照だが、版差（縮退マップ Ver.1.2.0 と mji Ver.006.02）で一方にしか無い `mj_id` がありうるため、**外部キー制約は張らずインデックスのみ**にする（§7 参照）。
- `target_ucs` の逆引きインデックスで「ある代表字に縮退してくる全 MJ文字」＝**別符号位置の異体字集合**を引ける。

## 4. 面区点 → 水準の導出規則（JIS X 0213）

N 列（面区点 `面-区-点`、例 `1-47-52`）から第1〜4水準を導出する。

| 面 | 区 | 点 | 水準 |
| --- | --- | --- | --- |
| 1 | 1〜13 | — | 非漢字（記号・かな・ラテン等）→ 水準なし |
| 1 | 14〜15 | — | 第3水準 |
| 1 | 16〜46 | — | 第1水準 |
| 1 | 47 | 1〜51 / 52〜94 | 第1水準 / 第3水準 |
| 1 | 48〜83 | — | 第2水準 |
| 1 | 84 | 1〜6 / 7〜94 | 第2水準 / 第3水準 |
| 1 | 85〜94 | — | 第3水準 |
| 2 | 1〜94 | — | 第4水準 |

導出関数の仕様（擬似コード）:

```ts
// 戻り値: 1|2|3|4（漢字水準）/ null（非漢字 or 0213外）
function jisLevel(menKuTen: string | null): 1 | 2 | 3 | 4 | null {
  if (!menKuTen) return null;
  const [men, ku, ten] = menKuTen.split('-').map(Number);
  if (men === 2) return 4;
  if (men !== 1) return null;
  if (ku >= 1 && ku <= 13) return null;       // 非漢字
  if (ku === 14 || ku === 15) return 3;
  if (ku >= 16 && ku <= 46) return 1;
  if (ku === 47) return ten <= 51 ? 1 : 3;
  if (ku >= 48 && ku <= 83) return 2;
  if (ku === 84) return ten <= 6 ? 2 : 3;
  if (ku >= 85 && ku <= 94) return 3;
  return null;
}
```

> 出典: JIS X 0213。**境界（面1の区1〜15における漢字/非漢字、区47・区84の点境界）は実装時に標準で再確認する**こと。mji データで「面1 区1〜13 に該当する行が漢字でないこと」「面2 が全て第4水準であること」をインポート時に件数で突き合わせて検証できる（§検証）。々(`1-01-25`)・〆 等の記号類は本規則で正しく「非漢字（水準なし）」に落ちる。

## 5. 処理パイプライン（service 層）

レイヤ責務は [architecture-guidelines.md](architecture-guidelines.md) に準拠（UI → `features/*` → `server/services` → `server/repositories`）。文字照合・縮退ロジックは `server/services`（例 `server/services/mji-mapping.ts`）に置き、Drizzle クエリは `server/repositories/mji.ts` に閉じる。UI（事務の手動選択）は `features/students`（生徒詳細・転入の表示名編集）に置く。

苗字 1 文字ごとに次を実行する:

1. **書記素分割・正規化**: 入力を書記素クラスタに分割し、各クラスタを「基底符号位置 ＋ 任意 VS」に分解。VS があれば IVS キー `BASE_VS`（大文字16進）を生成。
2. **MJ 照合**: IVS キー → `mji_characters.ivs`、無ければ裸符号位置 → `mji_characters.implemented_ucs` で 1 行を特定。
   - **該当行なし → 非漢字**（要件⑤）。マッピングせずに事務へ通知（そのまま保持／別途入力）。
3. **0213 定義判定**（要件①）: 特定行の `x0213` が非 null か。
   - **入力が IVS 付き（異体字セレクタあり）の場合は、図形自体が 0213 でも「そのまま採用」しない**。方針改定（2026-07-03）で IVS 字形は保存対象外のため、同符号位置の**基底字**を候補提示して「要選択」（`needs_choice`）に回す。`CharMapping` に `sourceInX0213`（元図形の面区点・水準）を付与し、UI が『MJ特有文字』ではなく『JIS異体字（第N水準）』と示せるようにする。候補が 1 つ（基底字のみ）でも提示し、事務が手入力で上書きもできる。
4. **水準取得**（要件②）: `jis_level` を返す（null は非漢字／0213外）。
5. **代表字の決定**（要件③）:
   - 0213 にある**かつ入力が基底字（VS なし）** → **その文字自身**（包摂上の代表）を採用。
   - 0213 にあるが**入力が IVS 付き** → 同符号位置の基底字を代表字として候補提示（上記 3 の要選択。IVS 字形は採らない）。
   - 0213 に無い → `mji_shrink_candidates` を `priority` 昇順で見て、最上位候補の `target_ucs` / `target_x0213` を代表字とする。
6. **異体字候補リスト（0213 にあるもの）の収集**（要件④）: 代表字だけでなく、**代表字の異体字で 0213 にある漢字**も候補にする。
   - **(a) 同一符号位置**: `mji_characters WHERE corresponding_ucs = <当該D> AND x0213 IS NOT NULL` のうち、**実装UCSを持つ基底 JIS 字のみ**を候補にする（例: 藤 1-38-03 → 藤）。同符号位置の **IVS 異体字（藤󠄃・藤󠄄・藤󠄅 等）は候補にしない**（冒頭の方針改定。[mj_to_jisx0213_conversion_report.md](mj_to_jisx0213_conversion_report.md)。実装は `collectCandidates` が `ivs != null` を除外）。重複排除は面区点ではなく**字形（保存値）**で行う。
   - **(b) 自身の縮退候補（＝代表字）**: 当該 `mj_id` の `mji_shrink_candidates`（`priority` 昇順）。
   - **(c) 代表字の異体字（`via='rep_variant'`）**: 代表字（(a)の基底 UCS と (b)の `target_ucs`）を中心に縮退グラフを 1 ホップ辿る — 同符号位置 / 逆引き（その代表字に縮退してくる字）/ 前方縮退（その代表字自身がさらに縮退する先）のうち 0213 にあるもの。
   - 例: 斉󠄃 → 斉(代表字)＋齊・亝、齋󠄄 → 齋(代表字)＋斎。**重複（同一 0213 面区点）を畳んで** (a)→(b)→(c) の順に並べ、事務に提示。
7. **確定**: 0213 候補が 1 つに定まれば自動採用してよいが、複数／曖昧な場合は**事務が選択**（最終判断は人手）。IVS 付き入力（上記 3）は候補が基底字 1 つでも要選択扱いで提示し、既定は先頭候補（基底字）、手入力での上書きも可とする。

戻り値（ViewModel, `features/*/services/format.ts` の `toView()` 相当）のイメージ:

```ts
type CharMappingResult =
  | { kind: 'in_x0213'; mjId: string; x0213: string; level: 1|2|3|4|null }   // ①② 入力が基底字（VS なし）で 0213
  // ③④ 0213 外、または IVS 付き入力（基底字へ寄せる要選択）。sourceInX0213 は
  //     「元図形自体は 0213 だが IVS 付き」の注記（UI が『JIS異体字（第N水準）』表示に使う）。
  | { kind: 'needs_choice'; source: { mjId: string }; candidates: X0213Candidate[]; sourceInX0213?: { x0213: string; level: 1|2|3|4|null } }
  | { kind: 'non_kanji'; raw: string };                                       // ⑤

type X0213Candidate = {
  mjId: string; ucs: string; x0213: string; level: 1|2|3|4|null;
  via: 'same_codepoint' | 'jis_ucs' | 'koseki' | 'kokuji582' | 'dict' | 'reading_shape';
  readings?: string; totalStrokes?: number;
};
```

## 6. 要件 ↔ 実装の対応

| # | 要件 | 実現方法 |
| --- | --- | --- |
| ① | 文字が JIS X 0213 に定義されているか | `mji_characters` を ivs/implemented_ucs で照合し `x0213` の有無を見る（§5-2,3） |
| ② | 面区点から第1〜4水準を取得 | `jis_level`（§4 の規則でインポート時導出）（§5-4） |
| ③ | 代表字を取得 | 0213 にあれば自身、無ければ `mji_shrink_candidates` の最上位 `priority`（§5-5） |
| ④ | 代表字の異体字（文字コード）リスト | 同符号位置＋代表字の縮退グラフ 1 ホップ（同符号位置/逆引き/前方縮退）の 0213 文字（§5-6, `via='rep_variant'`） |
| ⑤ | MJ に無い文字は非漢字 | `mji_characters` に該当行なし → `non_kanji`（§5-2） |

## 7. エッジケース・既知の限界

- **縮退候補が複数 / 無し**: 縮退マップ仕様どおり起こりうる。複数は `priority` 順に提示し人手選択。無し（かつ 0213 外）は事務が代替文字を入力（原典は熟語化・読み仮名化を示唆）。
- **E 列が空（IVS のみの図形）**: 裸符号位置では引けないので IVS キー照合を先に行う（§5-2 の順序が重要）。
- **`implemented_ucs`（E 列）の重複可能性**: 同一の裸符号位置を持つ図形が複数ありうる。照合は基本 IVS 優先で一意化し、裸符号位置のみで複数ヒットした場合は代表（包摂・水準で最優先）を選ぶか事務へ提示する。
- **包摂（高/髙）**: 別符号位置でも同一面区点になりうる。0213 該当として扱い、表示上の差はフォント（IPAmjexMincho）で吸収する点に留意。
- **IVS 異体字は候補にも保存対象にもしない（方針改定）**: 変換先は JIS X 0213 の**基底文字（VS なし）に限定**する。同符号位置の IVS 異体字（例 藤󠄃=85E4_E0103）は候補から除外し、表示名(姓)には**基底字（藤）**を保存する。理由・定量は [mj_to_jisx0213_conversion_report.md](mj_to_jisx0213_conversion_report.md)（受け側アプリの IVS 非対応、コレクション間対応の不在、多対1縮退の不可避）。原字形の可逆性は「原 MJ 文字図形名を別フィールドに保持」で担保する方針（同報告 §6.5、将来対応）。
  - **入力図形自体が 0213 でも IVS 付きなら要選択に回す**: 例 芦(`82A6_E0109`, 図形は第1水準)。`x0213` が非 null でも VS 付き入力はそのまま採用せず、同符号位置の**基底字 芦(`U+82A6`)** を候補提示（多くは 1 候補）して事務が確定・手入力できるようにする（`needs_choice` ＋ `sourceInX0213`）。旧実装は `in_x0213` に落として IVS 字形を既定確定値にしていたため、方針改定に反していた不整合の修正（§5-3）。
- **非漢字**: 々・〆・記号類は面1区1〜13に入り `jis_level=null`。苗字では稀だが `non_kanji` 経路で扱う。
- **版差**: mji Ver.006.02 と 縮退マップ Ver.1.2.0 は基準とした一覧表の版が異なりうる。`mji_shrink_candidates.mj_id` に外部キーを張らずインデックスのみとし、突き合わせ不能な `mj_id` はインポート時にログ集計する。
- **入力正規化の揺れ**: 同一字に対し NFC/SVS/IVS が混在しうる。照合前に書記素単位で正規化方針を固定する（VS は保持、結合は行わない）。

## 8. 実装状況

データ基盤・写像ロジック・UI（生徒詳細／転入の表示名編集）とも実装済み（本設計に追随）。

- [x] **スキーマ**: [src/server/db/turso/schema/mji.ts](../../src/server/db/turso/schema/mji.ts)（§3）。マイグレーション [0003_lovely_bushwacker.sql](../../src/server/db/turso/migrations/0003_lovely_bushwacker.sql)（`db:generate:turso` で生成、`db:migrate:turso` で適用済み）。
- [x] **インポートスクリプト**: [scripts/import-mji.mjs](../../scripts/import-mji.mjs)（`npm run db:import:mji`）。5.9万行は SQL マイグレーションに含めず専用スクリプトで投入（冪等）。
  - mji.xlsx: 依存済みの `exceljs`（`^4.4.0`）の **ストリームリーダ**で読み、`jis_level` を §4 で導出。
  - 縮退マップ: `MJShrinkMap.1.2.0.json` を `JSON.parse` し、5 区分の候補配列を 1 候補＝1 行に展開。
  - 一次データは `docs/ref-data/`（repo 非追跡。`.gitignore` 済み）に置き、インポート時のみ読む。
- [x] **repository / service**: [src/server/repositories/mji.ts](../../src/server/repositories/mji.ts)（Drizzle クエリ）＋ [src/server/services/mji-mapping.ts](../../src/server/services/mji-mapping.ts)（§5 のパイプライン・`jisLevel()`・`mapSurname()`・ViewModel）。
- [x] **UI**: 生徒詳細・転入の表示名（姓）編集 [src/features/students/components/FamilyMappingFields.tsx](../../src/features/students/components/FamilyMappingFields.tsx)（[StudentDisplayNameEditor](../../src/features/students/components/StudentDisplayNameEditor.tsx) / [TransferDisplayNameEditor](../../src/features/students/components/TransferDisplayNameEditor.tsx) から利用）。氏（姓）の各字を 0213 判定・候補提示し、事務が選択 → [src/features/students/actions.ts](../../src/features/students/actions.ts) の `applyMappedFamilyAction` で students の表示名(姓)に保存（正式氏名一致で update）。編集用レコードは [src/server/services/gakureibo-import.ts](../../src/server/services/gakureibo-import.ts) の `buildMappingRecordFromRoster` で組み立てる。<br>（当初は学齢簿を 1 件ずつ確認する `interop` データ連携画面として試作したが、生徒詳細・転入へ統合しページは廃止した。）

> 実データ確認（マスタ名簿の苗字）: 𠮷(1-21-40)・𡈽(1-15-34)・邉(1-78-21)・﨑(1-47-82) は 0213 に**そのまま**存在。IVS を含む入力 斉󠄃 / 齋󠄄 / 藤󠄆 は「要選択」となり、**基底字 斉 / 齋 / 藤 を候補に提示**（同符号位置の IVS 異体字は候補から除外。方針改定）。**図形自体が 0213 の IVS 入力（芦=`82A6_E0109`, 第1水準）も同様に基底字 芦 へ寄せる要選択**とし、旧来の `in_x0213`（IVS 字形を既定確定）ではなくする（§5-3）。氏に紛れたカナ（タ/モ/リ）は「非漢字」として正しく分岐する。

> **方針改定の反映（2026-07-03）**: 候補収集 `collectCandidates` は `ivs != null` の IVS 異体字を除外し、基底文字（代表字・別符号位置の基底字）のみを候補にするよう更新済み（冒頭バナー／[mj_to_jisx0213_conversion_report.md](mj_to_jisx0213_conversion_report.md) 参照）。

### 投入実績（`npm run db:import:mji` 検証ログ）

- `mji_characters` = **58,862** 行（うち `x0213` 非 null = **13,707**）。
- `mji_shrink_candidates` = **62,682** 行（5 区分の縮退候補を展開）。
- 面2 の行で `jis_level <> 4` = **0**（水準導出が面区点と整合）。

> 版整合の注意: mji.xlsx は Ver.006.02、MJ縮退マップは Ver.1.2.0（MJ一覧表 Ver.005.02 ベース）。`mji_shrink_candidates.mj_id` に外部キーを張らないのはこの版差のため（§7）。

## 検証（実装時の確認手順）

- 件数照合: インポート後 `SELECT COUNT(*) FROM mji_characters`（≈58,862）、`WHERE x0213 IS NOT NULL`（≈13,707）。
- 水準導出: 面2 の行が全て `jis_level=4`、面1区1〜13 の行が漢字でない（`jis_level IS NULL`）ことを集計で確認。
- 往復テスト（代表的苗字）:
  - 高(`U+9AD8`)・髙(`U+9AD9`) → ともに 0213（`1-25-66`）として解決（①②, 包摂）。
  - 齊󠄃(`9F4A_E0103`, 0213外) → 同一符号位置の**基底字 齊(`U+9F4A`,`1-83-78`)** を候補に提示（③④, 同符号位置。IVS 異体字は除外）。
  - 芦󠄉(`82A6_E0109`, **図形自体は 0213**=第1水準) → `in_x0213` にせず、**基底字 芦(`U+82A6`)** を候補に提示する要選択にする（VS 付き入力は基底字へ寄せる。§5-3・§7）。
  - 斉/齊/齋/斎（別符号位置）→ 縮退マップ経由で相互の 0213 候補を提示（③④, 別符号位置）。
  - MJ に無い文字 → `non_kanji`（⑤）。
