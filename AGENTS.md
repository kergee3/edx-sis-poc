# AGENTS.md

このファイルは、Codex などの AI コーディングエージェントがこのリポジトリで作業するときのガイドです。詳細な設計判断は `docs/` 配下を正本として扱い、このファイルは作業開始時の入口として使ってください。

## プロジェクト概要

`todo` は、生活に役立つ複数のリスト機能を管理する個人開発 Web アプリです。Next.js App Router と MUI を中心に構築されています。

主な機能は次の 3 つで、いずれも実装済みです。

- 「やること」管理: `/todo` / `src/features/todo`
- 「いつもの」管理: `/routines` / `src/features/routines`
- 「もちもの」管理: `/packing` / `src/features/packing`

基盤機能として、Google / LINE による認証、ログイン履歴の記録・補完、3 機能を横断する xlsx エクスポート / インポート（`src/features/data-transfer`）が常時動作します。

設計の正本は次の 2 つです。

- データの正本: RDB（Turso (SQLite, 東京 NRT) 1 系統に全テーブルを集約）
- デザインの正本: MUI Theme

アーキテクチャや設計に関わる変更では、必ず次の文書を確認してください。

- `docs/dev-guideline.md`
- `docs/architecture-guidelines.md`
- `docs/directory-structure.md`
- `docs/coding-guidelines.md`

環境構築の詳細は `docs/environment-setup.md` を参照してください。画面単位の UI 仕様は `docs/ui-design/` にあります。

## 技術スタック

- Runtime: Node.js 22 LTS
- Package Manager: npm
- Language: TypeScript
- Framework: Next.js App Router
- Frontend: React 19
- UI: MUI / MUI Theme
- Backend: Next.js Server Actions / Route Handlers
- Auth: Auth.js v5, Google OAuth, LINE Login
- DB: Turso (SQLite, 東京 NRT) 1 系統 — 認証・ログイン履歴・ユーザ設定・業務テーブル（todos / routines / packing）すべてを同居
- ORM: Drizzle ORM（`drizzle-orm/libsql`）
- Validation: Zod
- Date Utility: date-fns / `@date-fns/utc`
- Spreadsheet: exceljs（`src/features/data-transfer/services/` 内で xlsx の読み書きに使用）
- Blob: Vercel Blob
- Lint: ESLint
- Hosting: Vercel

Vitest と Playwright は方針として採用済みですが、現時点の `package.json` にはテスト用 npm script は未定義です。初回にテストを追加するときは、必要なパッケージと script をまとめて整備してください。

## セットアップ手順

1. Node.js 22 LTS を使用する。
2. 依存関係をインストールする。

   ```bash
   npm install
   ```

3. `.env.example` を参考に `.env.local` を作成する。
4. Turso、Google OAuth、LINE Login などの外部サービスを設定する。詳細は `docs/environment-setup.md` を参照する。
5. 必要に応じて DB マイグレーションを適用する（Turso の 1 系統）。

   ```bash
   npm run db:migrate:turso
   ```

6. 開発サーバを起動する。

   ```bash
   npm run dev
   ```

`.npmrc` で `legacy-peer-deps=true` が設定されています。`next-auth@5.0.0-beta.31` の peer dependencies が Next 16 を明示していないため、依存関係を扱うときはこの前提を維持してください。

## 開発・ビルド・テスト・Lint コマンド

```bash
npm run dev                  # 開発サーバ起動 http://localhost:3000
npm run build                # 本番ビルド
npm run start                # 本番サーバ起動
npm run lint                 # ESLint
npm run typecheck            # TypeScript 型チェック
npm run db:generate:turso    # Turso の Drizzle マイグレーション生成
npm run db:migrate:turso     # Turso に未適用マイグレーションを適用
npm run db:studio:turso      # Turso の Drizzle Studio 起動
npm run icons                # public/icon.svg から PWA アイコン再生成
```

本物のシークレットが未設定の CI ビルドなどでは、必要に応じて次の形で env 検証を迂回できます。

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

Windows PowerShell では次のように実行します。

```powershell
$env:SKIP_ENV_VALIDATION='1'; npm run build
```

## コーディング規約

- React コンポーネントは `PascalCase.tsx`、それ以外の TypeScript ファイルは `kebab-case.ts` を基本にする。
- import alias は `@/*` から `./src/*` を参照する。
- `noUncheckedIndexedAccess` が有効なので、配列・オブジェクトの index アクセスは必ずガードする。
- Server Action の入力、Route Handler の外部入力、env 読み込みなど境界では Zod で検証する。
- 空文字の env は `undefined` 扱いにする既存方針を維持する。
- 色・余白・タイポグラフィ・コンポーネントの既定値は `src/theme/` の MUI Theme を正本にする。
- Tailwind は未導入。勝手に追加しない。
- Drizzle の行をそのまま UI に渡さず、表示用 ViewModel は `features/*/services/format.ts` の `toView()` などで整形する。
- UI 層から Drizzle、DB クライアント、外部 SaaS SDK を直接呼ばない。
- Server Action は薄い受け口にし、実処理は `src/server/services/` に委譲する。
- DB クエリは `src/server/repositories/` に閉じる。
- Route Handler は Webhook、外部公開 API、ファイルストリーム返却に使い、内部更新は原則 Server Action を使う（例: xlsx エクスポートは Route Handler、xlsx インポートは Server Action）。
- 大きな入力（ファイル）を Server Action で受ける場合、`next.config.ts` の `experimental.serverActions.bodySizeLimit` を必要分まで引き上げ、Server Action 内でも独立してサイズチェックを行う（現在 `4mb` / インポートも同値で二重ガード）。
- `middleware.ts` はログイン要否の判定に留め、リソース単位の認可は service / Server Action 側で行う。
- 一覧取得は service で `unstable_cache(fn, key, { tags, revalidate })` で包み、タグは `src/server/cache/tags.ts` のヘルパ（`todosTag(userId)` など）経由で生成する。更新系 Server Action は処理成功後に `updateTag(<tag>(userId))` を呼んでキャッシュを失効させる（`revalidatePath` は最終手段）。

## ディレクトリ構成

```text
.
├── docs/                  # 開発・設計・環境構築ドキュメント
├── public/                # 静的アセット、PWA アイコン
├── scripts/               # 運用・生成スクリプト
├── tests/                 # E2E / 統合テスト用
├── src/
│   ├── app/               # App Router のルート、page/layout、Route Handler
│   ├── components/        # 機能横断の共通 UI
│   ├── contexts/          # クライアント側の共有 state
│   ├── features/          # 機能単位の UI、actions、schema、types、format（横断機能 data-transfer も features 配下に置く）
│   ├── hooks/             # 共通 React hooks
│   ├── lib/               # env、logging、blob、共通 utils
│   ├── server/            # DB、repositories、services、cache、auth などサーバ専用コード
│   ├── theme/             # MUI Theme
│   └── types/             # 横断的な型定義
├── drizzle.turso.config.ts # Drizzle 設定 (Turso)
├── middleware.ts          # 認証要否の middleware
├── next.config.ts         # Next.js 設定
└── package.json
```

アプリケーションの責務分離は次のレイヤを守ってください。

```text
app
  ↓
features/<domain>
  ↓
server/services
  ↓
server/repositories
  ↓
server/db
```

## 変更してはいけないファイルや注意点

- `.env.local` には実シークレットが入る可能性があります。値を表示・コミット・不要に編集しないでください。
- `src/server/auth/config.ts` の `NextAuth(() => config)` 形式を eager な設定に戻さないでください。env / DB の評価を遅延させ、シークレット未設定時の build を通すためです。
- `src/server/db/turso/client.ts` の lazy な `getTursoDb()` をトップレベルの `db` 定数 import 方式へ戻さないでください。
- DB は Turso 1 系統です。認証・ログイン履歴・ユーザ設定・業務テーブル（todos / routines / packing 系）をすべて同一の Turso DB に集約しています。Drizzle のスキーマも `server/db/turso/schema/` 配下（`auth.ts` / `login-history.ts` / `user-preferences.ts` / `todo.ts` / `routines.ts` / `packing.ts`）に集約されています。
- `drizzle.turso.config.ts` は Node 22 の `process.loadEnvFile('.env.local')` で `.env.local` を明示的に読んでいます。理由なく dotenv へ置き換えないでください。drizzle-kit は常に `--config` 指定で呼び出すよう npm scripts (`db:*:turso`) で固定済みです。
- 既存の Drizzle migration は履歴です。過去 migration を手編集せず、新しい schema 変更は `npm run db:generate:turso` で追加 migration を生成してください。
- 業務 5 テーブルの `user_id` は `users.id` への論理参照のみ（FK なし）、auth 系 4 テーブルは FK + onDelete cascade ありです。全テーブルが同一 DB に同居するため、ユーザ削除は単一トランザクションで原子的に処理できます。`src/server/services/user-deletion.ts` の `deleteUserAndAllData()` を経由してください。
- Auth.js の仕様として、Google と LINE は provider ごとに別ユーザ扱いです。`allowDangerousEmailAccountLinking` は使わないでください。
- LINE は email を返さない場合があります。`users.email` は nullable 前提で UI も null safe にしてください。
- `src/features/auth/actions.ts` の sign out フローは、`signOut({ redirect: false })`、`revalidatePath('/', 'layout')`、`redirect('/home')` の順序を維持してください。
- Server Component で MUI Button に `component={Link}` を直接渡すと RSC の関数 prop エラーになり得ます。`<Link>` で `<Button component="span">` を包む既存方針に従ってください。
- ナビゲーション項目は `src/app/ClientLayout.tsx` の `navigationItems` 配列に集約されています。追加時はここを更新してください。
- クライアント表示だけの設定は `src/contexts/settings-context.tsx` と各 `settings/page.tsx` に寄せ、サーバ挙動や永続化に関わる設定は `user_preferences` と `features/<domain>/preferences/` に置いてください。
- `src/app/memo/` は将来機能の置き場としてルートだけ用意された「準備中」プレースホルダで、`navigationItems` にも含まれていません。メモ機能着手時は `features/memo/` を起こしてから登録してください。
- 一覧取得 service の `unstable_cache` のタグ名は `src/server/cache/tags.ts` のヘルパで必ず生成し、文字列リテラルを直接書かないでください（ユーザ ID をキーに含めて他ユーザのキャッシュを巻き込まないため）。
- 現在の依頼範囲を尊重し、将来機能を先回りしてスキャフォールドしないでください。
- 新しい依存関係を追加する前に、既存実装・標準 API・導入済みライブラリで対応できないか確認してください。大きな依存追加は作業内容に明記してください。

## 作業完了前の確認事項

作業内容に応じて、完了前に次を確認してください。

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- DB schema を変えた場合は migration が生成され、内容が意図通りであること
- UI を変えた場合は主要 viewport で崩れや操作不能がないこと
- 認証・認可・ユーザ別データに関わる変更では、未ログイン時、別ユーザ、email null のケースを考慮していること
- Server Action / Route Handler の外部入力が Zod などで検証されていること
- DB アクセスが repository 層に閉じていること
- 一覧取得 service が `unstable_cache` + タグで包まれ、対応する更新系 Server Action で `updateTag` が呼ばれていること
- 表示用データが ViewModel に整形され、DB 行をそのまま UI に漏らしていないこと
- `.env.local` や生成物、不要なビルド成果物をコミット対象に含めていないこと
- 既存の設計ドキュメントと矛盾する変更をした場合は、関連 docs も更新していること
