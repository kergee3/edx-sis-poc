# 開発ガイドライン

個人開発で採用する技術選定、設計方針、実装ルールをまとめた開発ガイドラインです。

MUI 主体の UI 設計、Next.js App Router を中心としたアプリケーション構成、リレーショナル DB を正本とするデータ設計を前提に、開発時の判断基準をドキュメントとして蓄積します。

## 正本の考え方

このリポジトリでは、同じ情報が複数箇所に存在したときに **矛盾時に正しいと見なす唯一の場所** を「正本」と呼びます。本プロジェクトの正本は次の 2 つです。

- **データの正本: RDB**（認証・履歴・ユーザ設定・業務テーブルをすべて Turso (SQLite, 東京 NRT) の単一 DB に集約。詳細は [設計方針](architecture-guidelines.md#データ責務) を参照）
- **デザインの正本: MUI Theme**

各ドキュメントの設計判断はこの 2 つの正本を軸に組み立てられています。

## 基本的な技術スタック

- Runtime: Node.js 22 LTS
- Package Manager: npm
- Language: TypeScript / Python (ETL)
- Frontend: React / Next.js (App Router)
- Backend: Next.js (Route Handlers / Server Actions)
- Styling: MUI Theme（正本。Tailwind は未導入。補助スタイリングが必要になった場合に改めて導入可否を判断する）
- Component Library: Material UI
- DB Access: Drizzle ORM（`drizzle-orm/libsql`）
- RDB: Turso / SQLite (東京 NRT) 1 系統（認証・履歴・ユーザ設定・業務テーブル todos / routines / packing をすべて集約）
- Blob: Vercel Blob
- Auth: Auth.js (Google OAuth / JWT セッション)
- Validation: Zod（入出力境界と env 検証で使用）
- Form: React Hook Form（クライアント側のフォーム状態・バリデーション統合。Zod スキーマと `@hookform/resolvers/zod` で連携。既存フォームには未適用のものが残っており、新規フォームから段階的に切り替える前提）
- Spreadsheet: exceljs（xlsx の読み書き。`features/data-transfer/services/workbook-build.ts` / `workbook-parse.ts` で使用）
- Date Utility: date-fns（カレンダー演算ヘルパーは [src/lib/date.ts](../src/lib/date.ts) に集約。TZ 非依存な演算には `@date-fns/utc` の `UTCDate` を併用。表示は `Intl.DateTimeFormat` を継続。MUI X DatePicker 導入時は `AdapterDateFns` を採用予定）
- State Management: React Context を標準とし、Context で扱いきれない規模・性能要件が出た時点で Zustand に切り替える（インストールは escalate するタイミング）
- Unit Test: Vitest（ソースとコロケーションした `*.test.ts` を対象。業務ロジックとデータ変換を優先）
- E2E Test: Playwright（トップレベル `tests/` に配置。主要フローのみ）
- Linter: ESLint (`eslint-config-next`)
- Formatter: Prettier + `prettier-plugin-tailwindcss`（後者は Tailwind 導入時に自動的に効く。Tailwind が未導入の現時点では実害なく no-op）
- ETL: Python and libraries
- Hosting: Vercel

## 未決事項

以下は現時点では未確定です。採用時に各ドキュメントへ反映します。

- Tailwind 導入可否（補助スタイリングが必要になった時点で判断。導入時は `prettier-plugin-tailwindcss` のクラス整列が自動的に有効化される）
