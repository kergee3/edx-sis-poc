# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

todo は Next.js App Router + MUI のアプリケーションで、[README.md](README.md) に列挙された 3 つの主要機能（「やること」= `features/todo` / 「いつもの」= `features/routines` / 「もちもの」= `features/packing`）は実装済み。基盤機能としてログイン履歴記録（`features/login-history`）と、3 機能のデータを xlsx でやり取りするデータ移行機能（`features/data-transfer`）が常時動作する。Node 22 LTS、npm。

## 重要な変更の前に必読

`docs/` 配下の 4 文書がこのリポジトリの設計の正本。アーキテクチャに関わる変更を提案する前に目を通すこと。

- [docs/dev-guideline.md](docs/dev-guideline.md) — 技術スタック、「正本」の考え方、未決事項
- [docs/architecture-guidelines.md](docs/architecture-guidelines.md) — レイヤ責務、Server Action と Route Handler の使い分け、認証・認可
- [docs/directory-structure.md](docs/directory-structure.md) — `src/` 配下の配置方針
- [docs/coding-guidelines.md](docs/coding-guidelines.md) — TypeScript / React / MUI のルール、セキュリティ、a11y

設計の軸となる 2 つの正本: **データは RDB**（全テーブルを Turso (SQLite, 東京 NRT) に一本化。認証・履歴・設定・業務データすべて）、**デザインは MUI Theme**。

画面単位の UI 仕様（PDF / PPTX）は [docs/ui-design/](docs/ui-design/) にある。機能実装着手時、該当画面の仕様があればここを最初に確認すること（PDF は `Read` ツールで直接読める）。

環境構築（Turso / Google OAuth / LINE Login / `.env.local`）の実践手順は [docs/environment-setup.md](docs/environment-setup.md) を参照。

## コマンド

```bash
npm run dev                  # 開発サーバ起動 (http://localhost:3000)
npm run build                # 本番ビルド
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit
npm run db:generate:turso    # Turso (全テーブル: 認証/履歴/設定/業務) のマイグレーション生成
npm run db:migrate:turso     # Turso に未適用マイグレーションを適用
npm run db:studio:turso      # Drizzle Studio で Turso を参照
npm run icons                # public/icon.svg から PWA アイコン再生成
```

`SKIP_ENV_VALIDATION=1 npm run build` で Zod による env 検証を迂回できる（本物のシークレットが未設定の CI ビルドなどでのみ使用）。

テストランナは Vitest（ユニット）+ Playwright（E2E）を採用済み（[docs/dev-guideline.md](docs/dev-guideline.md) 参照）。最初にテストを書く段階で必要なパッケージと npm スクリプトをまとめて整備する。

## アーキテクチャのレイヤ

[docs/architecture-guidelines.md](docs/architecture-guidelines.md) に基づく厳格な責務分離:

```
app (ルーティング、薄い受け口)
  ↓
features/<domain> (UI、actions.ts、schema/、services/、types/)
  ↓
server/services (業務ロジック、複数 repository の横断処理)
  ↓
server/repositories (Drizzle クエリのみ。DB アクセスはここに閉じる)
  ↓
server/db (schema、migrations、client)
```

- **Server Action** (`features/*/actions.ts`) は薄い受け口に保ち、実処理は `server/services` へ委譲する
- **Route Handler** (`app/api/**/route.ts`) は Webhook / 外部公開 API 用途のみ。内部更新は Server Action で
- **middleware** (`middleware.ts`) はログイン要否の判定のみ。リソース単位の認可は service / Server Action 側で
- UI 層から Drizzle や SaaS の SDK を直接呼ばない

### 認証プロバイダ（Google / LINE）

- Auth.js v5 + DrizzleAdapter で **Google と LINE** の 2 プロバイダを `providers` 配列にぶら下げている ([src/server/auth/config.ts](src/server/auth/config.ts))。同種の OAuth プロバイダを追加するときは、(1) この配列、(2) [src/lib/env/index.ts](src/lib/env/index.ts) の env スキーマ、(3) [src/features/auth/actions.ts](src/features/auth/actions.ts) の Server Action、(4) [src/features/auth/components/SignInButton.tsx](src/features/auth/components/SignInButton.tsx) と [src/components/layout/UserMenu.tsx](src/components/layout/UserMenu.tsx) のボタン、の 4 箇所を揃えて足す
- **アカウントは provider ごとに別ユーザ扱い**（`allowDangerousEmailAccountLinking` は使わない）。`account` テーブルが `(provider, providerAccountId)` の複合主キーなので、同じ人が Google と LINE でログインすると別 `user` 行が作られる。これは仕様
- LINE は **Email permission を申請しないと email を返さない**。`users.email` は nullable + unique で（SQLite の UNIQUE は複数 NULL を重複扱いしないので問題なし）、UI も null セーフに書く必要がある（[AccountPanel](src/features/auth/components/AccountPanel.tsx) 参照）

### ログイン履歴のフロー（後続機能のリファレンス実装）

- [src/server/auth/config.ts](src/server/auth/config.ts) の `events.signIn` が `recordLogin(userId, account?.provider ?? null)` を呼び、**サーバ側で取れる情報** (provider / IP / UA / Referer / Geo) を `headers()` 経由で記録する
- [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) にマウントされた [src/features/login-history/components/ClientEnricher.tsx](src/features/login-history/components/ClientEnricher.tsx) が **クライアント側でしか取れない情報** (OS / ブラウザ / 解像度 / UA Data) を収集し、`enrichLatestLoginAction` で同じ行を UPDATE する。冪等性は repository 側の `os IS NULL` フィルタで担保する（同じタブで再サインインしても取りこぼさないよう、クライアント側のフラグはあえて持たない）

### データ移行（エクスポート / インポート）

- 3 機能（todo / routines / packing）を 1 つの xlsx にまとめて読み書きする横断機能。実体は [src/features/data-transfer/](src/features/data-transfer/) に閉じている。UI 入口は [src/components/layout/UserMenu.tsx](src/components/layout/UserMenu.tsx) の `ExportMenuItem` / `ImportMenuItem`
- **エクスポート**: [src/app/api/export/route.ts](src/app/api/export/route.ts) の Route Handler が xlsx ストリームを直接返す。ファイルストリームを返す処理は Server Action に向かないため、これは Route Handler を使う側の正当な例
- **インポート**: 2 段階構成。[src/features/data-transfer/actions.ts](src/features/data-transfer/actions.ts) の `importPreviewAction`（preview）→ `importCommitAction`（commit）。preview で重複・無効行を確認させた後に commit する。実処理は両 stage とも [import-orchestrator.ts](src/features/data-transfer/services/import-orchestrator.ts) で共通化
- **Server Action のサイズ制限**: ファイルを Server Action で受けるため [next.config.ts](next.config.ts) で `experimental.serverActions.bodySizeLimit: '4mb'` を設定済。actions 側でも `MAX_BYTES = 4MB` の二重ガードを置いている
- **キャッシュ無効化**: commit 完了後に `updateTag(todosTag(userId))` などを呼んで、配下機能の `unstable_cache` を一括無効化する（次節）

### キャッシュ戦略（`unstable_cache` + tag-based invalidation）

- 一覧取得系の service（[src/server/services/todo.ts](src/server/services/todo.ts) の `listTodosForUser` など）は `unstable_cache(fn, key, { tags, revalidate })` で包み、ユーザ単位のタグを付ける
- タグは [src/server/cache/tags.ts](src/server/cache/tags.ts) の `todosTag(userId)` / `routinesTag(userId)` / `packingTag(userId)` / `preferencesTag(userId)` を経由して必ず生成する（直接文字列を書かない）。ユーザ ID をキーに含めることで他ユーザのキャッシュを巻き込まない
- 更新系 Server Action は処理成功後に `updateTag(<tag>(userId))` を呼ぶ。data-transfer の commit は対応する 3 つのタグを必要に応じて立てる
- ページ側で `revalidatePath` に頼らず、service が握っているタグでキャッシュを無効化する設計。新しい一覧 service を足すときも同じパターンで揃える

## 規約

- **ファイル命名**: React コンポーネントは `PascalCase.tsx`、それ以外は `kebab-case.ts`（基盤構築時に確定）
- **インポートエイリアス**: `@/*` → `./src/*` ([tsconfig.json](tsconfig.json))。`noUncheckedIndexedAccess` が有効なので、配列・オブジェクトの index アクセスは必ずガードする
- **境界でのバリデーション**: Server Action の入力と [src/lib/env/index.ts](src/lib/env/index.ts) の env ロードに Zod を使う。空文字の env 値は preprocess で `undefined` 扱いに
- **スタイリング**: 色・余白・タイポグラフィの正本は [src/theme/](src/theme/) の MUI Theme。Tailwind は未導入、勝手に入れない。Theme に入れるべき値を `sx` で散らさない
- **ViewModel**: Drizzle の行をそのまま UI に渡さない。`features/*/services/format.ts` に `toView()` を置く（例: [src/features/todo/services/format.ts](src/features/todo/services/format.ts) — 表示用ラベル・日付整形・`isOverdue` のような派生フィールドをここで確定させる）

## ユーザ設定とナビゲーションの追加

- **ユーザ設定の置き場所** — 設定の性質で二分する:
  - **クライアント表示のみで完結する設定**（例: 一覧レイアウト、期限初期値など見た目やデフォルト値）は [src/contexts/settings-context.tsx](src/contexts/settings-context.tsx) に state + localStorage で集約する。対応する UI は `src/app/<feature>/settings/page.tsx`（例: [src/app/todo/settings/page.tsx](src/app/todo/settings/page.tsx)）
  - **サーバ側の挙動や永続化に影響する設定**（例: リテンション日数、サーバでの取得範囲）は `user_preferences` テーブルに列を足し、`features/<domain>/preferences/` に schema / actions / components を配置する（参考実装: [src/features/routines/preferences/](src/features/routines/preferences/)、スキーマは [src/server/db/turso/schema/user-preferences.ts](src/server/db/turso/schema/user-preferences.ts)）
- **ナビゲーション追加** — 左メニュー/ボトムナビに項目を追加するときは [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) の `navigationItems` 配列にエントリを足す。ログイン必須なら `requiresAuth: true`。配列はハードコードで、他に登録場所はない

## 自明でない実装上の注意点

- **Auth.js v5 の lazy config**: [src/server/auth/config.ts](src/server/auth/config.ts) は `NextAuth(() => config)` の関数形式で渡している。env / DB の評価をリクエスト時まで遅延させることで、本物のシークレットが無くても `next build` を通せる（`SKIP_ENV_VALIDATION=1` との併用）。eager に戻すとビルドが壊れる
- **signOut は `revalidatePath('/', 'layout')` を挟む**: [src/features/auth/actions.ts](src/features/auth/actions.ts) の `signOutAction` は `signOut({ redirect: false })` → `revalidatePath('/', 'layout')` → `redirect('/home')` の順。`signOut({ redirectTo: '/home' })` だけだと、現在地が `/home` のときソフトナビゲーションになり RootLayout がキャッシュから再利用され、`UserMenu` の `user` prop が古い認証状態のまま残る（ホームはゲスト表示・右下は旧ユーザという矛盾が出る）。signIn 側は OAuth コールバックが必ず HTTP リダイレクトになるので不要
- **DB は Turso 1 系統**: 認証 (`user` / `account` / `session` / `verificationToken`)・ログイン履歴 (`login_history`)・ユーザ設定 (`user_preferences`)・業務テーブル（`todos` / `routines` / `routine_completions` / `packing_sets` / `packing_items`）の全テーブルが Turso (SQLite, 東京 NRT) に同居する。クライアントは [src/server/db/turso/client.ts](src/server/db/turso/client.ts) の `getTursoDb()` 1 つのみ。lazy キャッシュなので、トップレベル定数として import し直さないこと（以前は Neon + Turso の 2 系統だったが Turso へ一本化済み）
- **業務テーブルの `user_id` は論理参照**: `todos` など業務 5 テーブルの `user_id` には `users.id` への FK を張っていない（auth 系 4 テーブルは FK + cascade あり）。ユーザ削除は [src/server/services/user-deletion.ts](src/server/services/user-deletion.ts) の `deleteUserAndAllData()` を必ず経由する。全テーブルが同一 DB なので、業務 5 テーブルの明示削除 + `users` 削除（cascade で auth 4 テーブルも消える）を**単一トランザクション**で原子的に行う
- **drizzle-kit の設定は Turso のみ**: [drizzle.turso.config.ts](drizzle.turso.config.ts) を `--config` で明示する形を `db:*:turso` の npm scripts で固定済。素の `drizzle-kit` 直叩きは config 探索に失敗するので使わない。config は `process.loadEnvFile('.env.local')`（Node 22 組み込み）を呼ぶ。dotenv に置き換えないこと
- **MUI Button + Next の `Link`**: Server Component で `component={Link}` を渡すと "Functions cannot be passed..." エラーになる。代わりに `<Link>` で `<Button component="span">` を包む。RSC ツリー内で関数プロパティを Client Component に渡すパターンは一般に避ける
- **npm install には `--legacy-peer-deps`**: `next-auth@5.0.0-beta.*`（現: `5.0.0-beta.31`）の peer deps が `next@^14||^15` と宣言されているが、Next 16 でも動く。[.npmrc](.npmrc) で事前設定済み
- **空文字 env**: 任意項目の Zod スキーマは `z.preprocess(emptyToUndefined, ...)` で包んでいるので、`.env.local` に `FOO=` と書かれていても未設定扱いになる
- **`/memo` はプレースホルダ**: [src/app/memo/page.tsx](src/app/memo/page.tsx) は将来機能の置き場としてルートだけ用意されているが、`features/memo` は未作成で「準備中」表示のみ。`navigationItems` にも入っていない。メモ機能着手時は [src/features/todo/](src/features/todo/) を参考に同じ構造で起こす

## スコープの健全性

- 3 つの主要機能は実装済。新機能（例: メモ帳）を足す場合も、既存機能だけに集中して将来の機能を先回りしてスキャフォールドしない
- 依存追加は事前に確認する。docs で「未決」とされているライブラリが残っている（Tailwind 等）。採用済みだが未インストールのものは初回利用時にまとめて install する: フォームを React Hook Form ベースで書く場合に `react-hook-form` + `@hookform/resolvers`（既存フォームは `useState` + `useTransition` で書かれており、新規フォーム導入時に切り替える前提）、テスト導入時に `vitest` 一式 + `@playwright/test`、フォーマッタ整備時に `prettier` + `prettier-plugin-tailwindcss` + `eslint-config-prettier`、状態管理が Context で扱いきれなくなった escalate 時に `zustand`
