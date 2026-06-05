# 児童生徒スキーマ設計（あるべき持ち方とステージ別データ充足）

[koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md) の「§7 本プロジェクトへの示唆」を具体化した、児童生徒情報の**あるべきスキーマ設計**。あわせて同書「§0 全体像」の流れ（学齢簿→校務支援→学習eポータル→学習ツール/LRS）の中で、**各項目がどの段階で埋められるべきか**を示す。

> 調査日: 2026-06-03 ／ 典拠: [gakureibo-acceptance-data-items.md](gakureibo-acceptance-data-items.md)、[koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md)、OneRoster v1.2 Japan Profile、相互運用標準モデル Ver.6.00。
> 本書は**設計ドキュメント**。実際の `src/server/db/turso/schema/` への追加・マイグレーション生成は別タスク（本書では行わない）。Drizzle 例は本プロジェクト規約（[auth.ts](../../src/server/db/turso/schema/auth.ts) 等）に合わせた**設計例**。
>
> 用語（英語表記）: 学習eポータル = Learning e-Portal ／ 校務支援システム = Student Information System (SIS。政府標準では School affairs support system / SSS) ／ 学習ツール = Learning tool

## 1. 設計方針

1. **マスタ層に集約・連携層は最小限**: 校務支援システム＝児童生徒情報の source of truth として全属性を保持。学習eポータル等の下流へは OneRoster で最小限のみ渡す（§5）。
2. **氏名3系統の分離**: 正式氏名（漢字・MJ特有文字可）／表示名 preferredName（JIS文字）／カナ（全角）。用途で列を分ける。
3. **利用者識別子 UUID v4** を最初から保持（`user_master_identifier`）。転校・進学でも不変に引き継ぐ前提。
4. **コード類を連携キーとして保持**: 文科省 学校コード／教育委員会コード。
5. **学籍を本人属性から分離**: 在籍（学校・学年・学級・出席番号・異動）は別テーブル。
6. **個人情報の層分離**: 住所・生年月日・保護者・成績などセンシティブ項目はマスタに閉じ、連携層に出さない。

> ⚠️ **重要な区別**: ここで設計する `students` は**業務ドメインの児童生徒データ**であり、Auth.js の `user`（Google/LINE でログインする操作者＝教職員・事務担当）とは**別物**。`students` は auth `user` を参照しない独立エンティティとする（混同しない）。

> **文字集合の用語**: 本書の「JIS文字／MJ文字／MJ特有文字」は [koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md) §5.0 の定義に従う（**MJ文字 = JIS文字 ＋ MJ特有文字**。JIS文字=JIS X 0213、MJ文字=文字情報基盤、MJ特有文字=JIS標準でない MJ 文字）。

## 2. ER 概要（児童生徒コア中心）

```
                ┌───────────────────────────┐
                │ students  (児童生徒マスタ)   │  ← 本人属性・氏名3系統・UUID・住所・コード
                └───────────────────────────┘
                   ▲                       ▲
        1 : N      │                       │  1 : N
   ┌───────────────┴───────┐     ┌─────────┴──────────────────┐
   │ student_enrollments    │     │ student_guardians          │
   │ (在籍：学校/学年/学級/    │     │ (保護者：氏名/続柄, 最小限)   │
   │  出席番号/異動年月日)     │     └────────────────────────────┘
   └────────────────────────┘
```

- 学校・学級は**フルなマスタ（orgs/classes）を作らず、文科省コード＋名称で保持**（範囲を児童生徒コアに限定）。OneRoster 連携時に `orgs.csv`/`classes.csv` へ写像する。
- `student_guardians` は OneRoster の `guardian` ロール（parent/relative は guardian に統合）に対応する最小構成。

## 3. マスタスキーマ（論理モデル）

### 3.1 `students`（児童生徒マスタ）

| 列 (DB / TS) | 型 | NULL | 説明 | OneRoster 対応 | 充足ステージ |
| --- | --- | --- | --- | --- | --- |
| `id` / `id` | text UUID(PK) | NOT NULL | 内部主キー（`crypto.randomUUID()`） | sourcedId に流用可 | B |
| `user_master_identifier` / `userMasterIdentifier` | text(UUID v4) | NOT NULL(uniq) | 連携用 利用者識別子。原則校務支援が生成 | `users.userMasterIdentifier` | B（D で突合/補完） |
| `username` / `username` | text | NULL | 主たる IdP のログインID/クラウドID | `users.username` | D |
| `official_family_name` / `officialFamilyName` | text | NOT NULL | 正式氏名 姓（漢字, **MJ特有文字可**） | （連携に出さない） | A |
| `official_given_name` / `officialGivenName` | text | NOT NULL | 正式氏名 名（漢字, MJ特有文字可） | （連携に出さない） | A |
| `preferred_family_name` / `preferredFamilyName` | text | NOT NULL | 表示名 姓（**JIS文字**, 通称名可） | `users.preferredFamilyName` | B |
| `preferred_given_name` / `preferredGivenName` | text | NOT NULL | 表示名 名（JIS文字） | `users.preferredGivenName` | B |
| `preferred_middle_name` / `preferredMiddleName` | text | NULL | 表示名 ミドル | `users.preferredMiddleName` | B |
| `kana_family_name` / `kanaFamilyName` | text | NOT NULL | カナ 姓（**全角カタカナ**） | `metadata.jp.kanaFamilyName` | A/B |
| `kana_given_name` / `kanaGivenName` | text | NOT NULL | カナ 名（全角） | `metadata.jp.kanaGivenName` | A/B |
| `kana_middle_name` / `kanaMiddleName` | text | NULL | カナ ミドル（全角） | `metadata.jp.kanaMiddleName` | B |
| `birth_date` / `birthDate` | integer ts_ms | NOT NULL | 生年月日（センシティブ） | （連携に出さない） | A |
| `sex` / `sex` | text | NULL | 性別（区分文字列） | （連携に出さない） | A |
| `nationality` / `nationality` | text | NULL | 国籍 | （連携に出さない） | A |
| `foreign_name_alphabet` / `foreignNameAlphabet` | text | NULL | 外国人氏名（英字） | （連携に出さない） | A |
| `foreign_name_kanji` / `foreignNameKanji` | text | NULL | 外国人氏名（漢字, MJ特有文字可） | （連携に出さない） | A |
| `common_name` / `commonName` | text | NULL | 通称名 | （表示名に反映） | A |
| `postal_code` / `postalCode` | text | NULL | 郵便番号（センシティブ） | （連携に出さない） | A |
| `current_address` / `currentAddress` | text | NULL | 現住所（センシティブ） | （連携に出さない） | A |
| `school_code` / `schoolCode` | text | NULL | 文科省 学校コード（在籍校） | `orgs.identifier` | B |
| `board_of_education_code` / `boardOfEducationCode` | text | NULL | 教育委員会コード（設置者） | ZIP命名/orgs | A/B |
| `created_at` / `createdAt` | integer ts_ms | NOT NULL | 作成日時 | — | B |
| `updated_at` / `updatedAt` | integer ts_ms | NOT NULL | 更新日時 | — | B〜 |

> 氏名カナは学齢簿でも管理必須（振り仮名法制化）であり A で取得しうるが、表示名(preferred)とカナの整形・確定は校務支援登録時(B)に行う想定のため「A/B」。

### 3.2 `student_enrollments`（在籍・学籍）

| 列 (DB / TS) | 型 | NULL | 説明 | OneRoster 対応 | 充足ステージ |
| --- | --- | --- | --- | --- | --- |
| `id` / `id` | text UUID(PK) | NOT NULL | 主キー | — | B |
| `student_id` / `studentId` | text(FK→students.id, cascade) | NOT NULL | 児童生徒 | enrollments.userSourcedId | B |
| `school_code` / `schoolCode` | text | NOT NULL | 在籍校（学校コード） | orgs | B |
| `grade` / `grade` | text | NOT NULL | 学年（義務教育学校は7〜9表記対応） | `users.grade` | B |
| `class_code` / `classCode` | text | NULL | 学級コード（例: 0101） | `classes.classCode` | B |
| `class_name` / `className` | text | NULL | 学級名（例: 1年1組） | classes 派生 | B |
| `attendance_number` / `attendanceNumber` | integer | NULL | 出席番号 | （任意） | B（C で更新） |
| `enrollment_status` / `enrollmentStatus` | text | NOT NULL | 在籍状態（在籍/転出/卒業 等） | — | B（C で更新） |
| `admission_date` / `admissionDate` | integer ts_ms | NULL | 入学年月日 | — | A |
| `transfer_in_date` / `transferInDate` | integer ts_ms | NULL | 転入学年月日 | — | A |
| `transfer_out_date` / `transferOutDate` | integer ts_ms | NULL | 転学年月日 | — | C |
| `graduation_date` / `graduationDate` | integer ts_ms | NULL | 卒業年月日 | — | C |
| `created_at` / `updated_at` | integer ts_ms | NOT NULL | 監査 | — | B〜 |

### 3.3 `student_guardians`（保護者・最小限）

| 列 (DB / TS) | 型 | NULL | 説明 | OneRoster 対応 | 充足ステージ |
| --- | --- | --- | --- | --- | --- |
| `id` | text UUID(PK) | NOT NULL | 主キー | — | A/B |
| `student_id` | text(FK→students.id, cascade) | NOT NULL | 児童生徒 | users(guardian)→agents | A/B |
| `family_name` / `given_name` | text | NOT NULL | 保護者氏名（漢字） | （連携は最小限） | A |
| `kana_family_name` / `kana_given_name` | text | NULL | カナ | metadata.jp.kana* | A |
| `relationship` | text | NOT NULL | 続柄（例: 父/母） | — | A |
| `is_custodian` / `isCustodian` | integer boolean | NOT NULL default false | 監護者/共同親権フラグ（民法改正対応） | — | A |

> 保護者を学習eポータルへ連携する場合は guardian ロール（parent/relative は使わず guardian に統合）。本プロジェクトの当面の用途次第では guardian 連携を行わない選択もある。

## 4. Drizzle 実装例（本プロジェクト規約準拠）

```ts
// src/server/db/turso/schema/students.ts （設計例。実追加は別タスク）
import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';

export const students = sqliteTable(
  'students',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    // 連携用 利用者識別子（UUID v4）
    userMasterIdentifier: text('user_master_identifier')
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    username: text('username'),

    // 氏名: 正式（漢字, MJ特有文字可）
    officialFamilyName: text('official_family_name').notNull(),
    officialGivenName: text('official_given_name').notNull(),
    // 氏名: 表示名（JIS文字）
    preferredFamilyName: text('preferred_family_name').notNull(),
    preferredGivenName: text('preferred_given_name').notNull(),
    preferredMiddleName: text('preferred_middle_name'),
    // 氏名: カナ（全角）
    kanaFamilyName: text('kana_family_name').notNull(),
    kanaGivenName: text('kana_given_name').notNull(),
    kanaMiddleName: text('kana_middle_name'),

    birthDate: integer('birth_date', { mode: 'timestamp_ms' }).notNull(),
    sex: text('sex'),
    nationality: text('nationality'),
    foreignNameAlphabet: text('foreign_name_alphabet'),
    foreignNameKanji: text('foreign_name_kanji'),
    commonName: text('common_name'),

    // センシティブ（マスタのみ・連携に出さない）
    postalCode: text('postal_code'),
    currentAddress: text('current_address'),

    // 連携キー（文科省コード）
    schoolCode: text('school_code'),
    boardOfEducationCode: text('board_of_education_code'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    unique('students_user_master_identifier_uq').on(t.userMasterIdentifier),
    index('students_school_code_idx').on(t.schoolCode),
  ],
);

export const studentEnrollments = sqliteTable(
  'student_enrollments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    schoolCode: text('school_code').notNull(),
    grade: text('grade').notNull(),
    classCode: text('class_code'),
    className: text('class_name'),
    attendanceNumber: integer('attendance_number'),
    enrollmentStatus: text('enrollment_status').notNull(),
    admissionDate: integer('admission_date', { mode: 'timestamp_ms' }),
    transferInDate: integer('transfer_in_date', { mode: 'timestamp_ms' }),
    transferOutDate: integer('transfer_out_date', { mode: 'timestamp_ms' }),
    graduationDate: integer('graduation_date', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('student_enrollments_student_idx').on(t.studentId),
    index('student_enrollments_school_grade_idx').on(t.schoolCode, t.grade),
  ],
);

export const studentGuardians = sqliteTable(
  'student_guardians',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    familyName: text('family_name').notNull(),
    givenName: text('given_name').notNull(),
    kanaFamilyName: text('kana_family_name'),
    kanaGivenName: text('kana_given_name'),
    relationship: text('relationship').notNull(),
    isCustodian: integer('is_custodian', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (t) => [index('student_guardians_student_idx').on(t.studentId)],
);

export type StudentRow = typeof students.$inferSelect;
export type StudentInsert = typeof students.$inferInsert;
export type StudentEnrollmentRow = typeof studentEnrollments.$inferSelect;
export type StudentGuardianRow = typeof studentGuardians.$inferSelect;
```

> 実装する場合の手順（CLAUDE.md 準拠）: 上記を `schema/students.ts` に置き → `schema/index.ts` で re-export → `npm run db:generate:turso` → 確認後 `npm run db:migrate:turso`。ViewModel は `features/<domain>/services/format.ts` の `toView()` を用意し、Drizzle 行を直接 UI に渡さない。

## 5. 学習eポータル連携サブセット（OneRoster 出力ビュー）

校務支援マスタ → 学習eポータルへは OneRoster `users.csv` / `enrollments.csv` 等で**最小限のみ**渡す。マスタ列との写像と、**出さない**項目を明示する。

| OneRoster フィールド | 要否 | マスタ列（写像元） | 備考 |
| --- | --- | --- | --- |
| `enabledUser` | REQUIRED | （固定） | `True` 固定 |
| `username` | REQUIRED | `username`（無ければ識別ID） | — |
| `userMasterIdentifier` | REQUIRED | `user_master_identifier` | UUID v4 |
| `role`（roles/enrollments） | REQUIRED | （固定） | `student` |
| `grade` | REQUIRED(student) | `student_enrollments.grade` | — |
| `preferredFamilyName` / `preferredGivenName` | REQUIRED | `preferred_family_name` / `preferred_given_name` | **JIS文字**（MJ特有文字を含まない） |
| `preferredMiddleName` | OPTIONAL | `preferred_middle_name` | — |
| `metadata.jp.kanaFamilyName` / `kanaGivenName` | REQUIRED | `kana_family_name` / `kana_given_name` | 全角カナ |
| enrollments（学級紐付け） | REQUIRED | `student_enrollments`（homeroom） | `primary=False` |
| orgs.identifier | — | `school_code` | 学校コード |

**連携に出さない（マスタに留める）**: `official_*`（正式氏名＝MJ特有文字を含む）／`birth_date`／`sex`／`nationality`／`foreign_*`／`postal_code`／`current_address`／保護者の詳細／出欠・成績。学習ツール・LRS へはさらに UUID 中心の最小限のみ。

## 6. ステージ別データ充足（§0 の流れに対応）

各段で「どの項目が埋まるか」。ステージ記号:
- **A. 学齢簿編製/就学事務（教育委員会）** — 法定の本人・保護者・就学情報の源泉
- **B. 校務支援システム 登録時（受入）** — マスタ生成、表示名/カナ確定、UUID 発番、在籍登録
- **C. 校務支援システム 運用中** — 学級異動・出席番号・転学/卒業・出欠/成績（出欠成績は本設計の範囲外）
- **D. 学習eポータル連携時** — 既存 UUID の突合/補完、username 突合
- **E. LRS** — スタディ・ログを UUID で蓄積（`students` には書かない）

| ステージ | この段で埋まる主な項目 |
| --- | --- |
| **A** | `official_*`, `birth_date`, `sex`, `nationality`, `foreign_*`, `common_name`, `postal_code`, `current_address`, `board_of_education_code`, 保護者(`student_guardians.*`), `admission_date`/`transfer_in_date`, カナ氏名の原データ |
| **B** | `id`, `user_master_identifier`(UUID生成), `preferred_*`(表示名確定), `kana_*`(整形確定), `school_code`, `student_enrollments`(grade/class/attendance/status), 監査列 |
| **C** | `class_code`/`class_name`/`attendance_number` の更新, `transfer_out_date`, `graduation_date`, `enrollment_status` 更新（＋出欠/成績は別領域） |
| **D** | `username`, `user_master_identifier` の突合・補完（②③の既存UUIDがあれば優先採用） |
| **E** | （students 無変更）スタディ・ログを `user_master_identifier`=UUID で LRS に紐付け |

> 原則: 値の**源泉は A（学齢簿）**、**マスタとしての確定・連携用属性の付与は B（校務支援）**、**運用更新は C**、**連携時の識別子整合は D**。E は読み取り側で書き込まない。

## 7. 設計上の注意

- **個人情報の最小化（層分離）**: 住所・生年月日・保護者・成績はマスタに閉じ、連携層（eポータル/ツール/LRS）へ出さない。データ保護の主体は学校設置者（個人情報保護法66条）。
- **文字集合の棲み分け**: 正式氏名（`official_*`, `foreign_name_kanji`）は漢字＝MJ特有文字を許容し、帳票印字・本人特定で**外部配信の IPAmjexMincho Web フォントが表示を担う**。連携・画面表示は `preferred_*`（JIS文字）＋カナ。
- **UUID の生成責務と引継ぎ**: 原則 B（校務支援）で `user_master_identifier`(v4) を発番。D で既存 UUID（eポータル/他校務支援由来）があればそちらを優先。転校・進学・システム移管でも引き継ぎ、1人1UUIDを目指す（標準でも今後の課題）。
- **nullable 方針**: 取得できないことがある項目（住所/性別/国籍/外国人氏名/保護者カナ等）は nullable とし、UI は null セーフに（[AccountPanel](../../src/features/auth/components/AccountPanel.tsx) の null 安全の作法に倣う）。氏名（正式・表示・カナ）と生年月日は本人特定・必須のため NOT NULL。
- **`students` ≠ auth `user`**: 操作者（ログインする教職員）と児童生徒（業務対象）は別エンティティ。混同して auth `user` に児童生徒属性を足さない。

## 8. 出典

- 本プロジェクト調査メモ: [gakureibo-acceptance-data-items.md](gakureibo-acceptance-data-items.md) / [koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md)
- OneRoster v1.2 Japan Profile（1EdTech Japan）, 相互運用標準モデル Ver.6.00（ICT CONNECT 21）, 学校教育法施行規則第30条 ほか（[external-references.md](external-references.md) の索引参照）。
