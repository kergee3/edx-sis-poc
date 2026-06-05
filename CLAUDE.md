# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**jtp-mj-font** は「文字情報基盤(MJ)の漢字を Web フォントとして使う」実証から出発し、その応用として**校務支援システムの PoC** を作るプロジェクト。本体は `src/` の Web アプリ。

- **`src/`（Web アプリ）= SIS-PoC（Student Information System - Proof of Concept）** — IPAmjexMincho Web フォントを活かした**校務支援システムの実証実験**。Next.js 16 App Router + MUI v7。**現状は基盤のみ実装済みで、業務機能はこれから**。
  - 想定シナリオ: 小さな離島の小さな中学校。ログインした校長先生がワンオペで全校生徒の先生＋事務を兼ねて校務を行う（生徒定員 25 名・各学年 4 名で初期 12 名在籍）。氏名の MJ特有文字（戸籍漢字等）を IPAmjexMincho で正しく表示するのが眼目。
  - 実装済みの基盤: 認証（Google / LINE, Auth.js v5）、ログイン履歴（サーバ＋クライアント）、右上ユーザーメニュー（ログアウト / About / ログイン履歴）、Turso(SQLite) への一本化、MUI Theme。
  - 機能（`home`＝位置づけ説明 / `students`＝生徒一覧 / `interop`＝データ連携）は**プレースホルダ表示のみのスキャフォールド**で、業務ロジックは未着手。`students` は名簿の転入/転出/編集・在学/成績証明書発行、`interop` は学齢簿インポート・OneRoster 入出力を担う予定。業務ドメインの設計は [docs/design/](docs/design/) を参照。

氏名表示に使う **IPAmjexMincho Web フォント**（IPAmj明朝 + IPAex明朝 を合成した 256 サブセット WOFF2）は、**外部に配信されているもの（https://ipamjexmincho.shumy.app）を利用する**。フォントの合成・配信ツール自体は本リポジトリには含まない。アプリ側の利用箇所は [src/theme/fonts.ts](src/theme/fonts.ts) / [src/app/layout.tsx](src/app/layout.tsx)。

Node 22 LTS、npm。

> **重要**: この repo は別アプリ（"life-todo": todo/routines/packing）からの fork が出発点で、**旧アプリの名残が一部残っている**（後述「既知の名残・要整理」）。`todo` / `routines` / `packing` / `data-transfer` / `memo` といった機能は**現存しない**。ドキュメントやコメントにこれらが出てきたら旧記述として扱うこと。

## 重要な変更の前に必読

`docs/` 配下の設計文書がレイヤ責務・規約の基準。ただし**一部の例が旧アプリ（todo 等）のまま**なので、具体例より「考え方」を参照する。

- [docs/dev-guideline.md](docs/dev-guideline.md) — 技術スタック、「正本」の考え方、未決事項
- [docs/architecture-guidelines.md](docs/architecture-guidelines.md) — レイヤ責務、Server Action と Route Handler の使い分け、認証・認可
- [docs/directory-structure.md](docs/directory-structure.md) — `src/` 配下の配置方針
- [docs/coding-guidelines.md](docs/coding-guidelines.md) — TypeScript / React / MUI のルール、セキュリティ、a11y

設計の軸: **データは Turso(SQLite, 東京 NRT) に一本化**（認証・履歴・設定すべて）、**デザインは MUI Theme**。

環境構築（Turso / Google OAuth / LINE Login / `.env.local`）の手順は [docs/environment-setup.md](docs/environment-setup.md) を参照。

政府機関などが公開する**外部仕様書 PDF** は [docs/references/](docs/references/) に置き、出典・取得日・再配布条件を [docs/references/README.md](docs/references/README.md) の索引で管理する。それらを踏まえて本プロジェクトが作成する**設計・調査ドキュメント**は [docs/design/](docs/design/)（外部資料とは分離）。

## コマンド

```bash
npm run dev                  # 開発サーバ起動 (http://localhost:3000)
npm run build                # 本番ビルド
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit
npm run db:generate:turso    # Turso のマイグレーション生成
npm run db:migrate:turso     # Turso に未適用マイグレーションを適用
npm run db:studio:turso      # Drizzle Studio で Turso を参照
npm run icons                # public/icon.svg から PWA アイコン再生成
```

`SKIP_ENV_VALIDATION=1 npm run build` で Zod による env 検証を迂回できる（シークレット未設定の CI ビルド等）。

## アーキテクチャのレイヤ（src）

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

現在の `src/features/`: `auth`（実装済）/ `login-history`（実装済）/ `home` `students` `interop`（いずれも `components/*Placeholder.tsx` のみのスキャフォールド）。

### 認証プロバイダ（Google / LINE）

- Auth.js v5 + DrizzleAdapter で **Google と LINE** の 2 プロバイダを `providers` 配列にぶら下げている ([src/server/auth/config.ts](src/server/auth/config.ts))。同種の OAuth プロバイダを追加するときは、(1) この配列、(2) [src/lib/env/index.ts](src/lib/env/index.ts) の env スキーマ、(3) [src/features/auth/actions.ts](src/features/auth/actions.ts) の Server Action、(4) [src/features/auth/components/SignInButton.tsx](src/features/auth/components/SignInButton.tsx) と関連メニューのボタン、の 4 箇所を揃えて足す
- **アカウントは provider ごとに別ユーザ扱い**（`allowDangerousEmailAccountLinking` は使わない）。`account` テーブルが `(provider, providerAccountId)` の複合主キーなので、同じ人が Google と LINE でログインすると別 `user` 行が作られる。これは仕様
- LINE は **Email permission を申請しないと email を返さない**。`users.email` は nullable なので UI も null セーフに書く（[AccountPanel](src/features/auth/components/AccountPanel.tsx) 参照）

### ログイン履歴のフロー（後続機能のリファレンス実装）

- [src/server/auth/config.ts](src/server/auth/config.ts) の `events.signIn` が `recordLogin(userId, account?.provider ?? null)` を呼び、**サーバ側で取れる情報** (provider / IP / UA / Referer / Geo) を `headers()` 経由で記録する（[src/server/services/login-history.ts](src/server/services/login-history.ts)）
- [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) にマウントされた [ClientEnricher](src/features/login-history/components/ClientEnricher.tsx) が **クライアント側でしか取れない情報** (OS / ブラウザ / 解像度 / UA Data) を収集し、`enrichLatestLoginAction` で同じ行を UPDATE する。冪等性は repository 側の `os IS NULL` フィルタで担保する

### ユーザ設定（user_preferences）とキャッシュ戦略

- サーバ側に永続化する設定は `user_preferences` テーブル（[src/server/db/turso/schema/user-preferences.ts](src/server/db/turso/schema/user-preferences.ts)）に列を足し、`server/services/user-preferences.ts` / `server/repositories/user-preferences.ts` を経由する
- 取得系の service は `unstable_cache(fn, key, { tags: [preferencesTag(userId)], revalidate })` で包む。タグは [src/server/cache/tags.ts](src/server/cache/tags.ts) の `preferencesTag(userId)` を必ず経由する（直接文字列を書かない）。新しい一覧 service を足すときも同じパターンで、ドメインごとのタグ関数を `tags.ts` に追加する
- 更新系 Server Action は処理成功後に `updateTag(preferencesTag(userId))` を呼ぶ

## 規約

- **ファイル命名**: React コンポーネントは `PascalCase.tsx`、それ以外は `kebab-case.ts`
- **インポートエイリアス**: `@/*` → `./src/*` ([tsconfig.json](tsconfig.json))。`noUncheckedIndexedAccess` が有効なので、配列・オブジェクトの index アクセスは必ずガードする
- **境界でのバリデーション**: Server Action の入力と [src/lib/env/index.ts](src/lib/env/index.ts) の env ロードに Zod を使う。空文字の env 値は preprocess で `undefined` 扱いに
- **スタイリング**: 色・余白・タイポグラフィの正本は [src/theme/](src/theme/) の MUI Theme。Tailwind は未導入、勝手に入れない
- **ViewModel**: Drizzle の行をそのまま UI に渡さない。`features/*/services/format.ts` に `toView()` を置く（例: [src/features/login-history/services/format.ts](src/features/login-history/services/format.ts)）

## ナビゲーションの追加

- 左メニュー/ボトムナビに項目を追加するときは [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) の `navigationItems` 配列にエントリを足す。ログイン必須なら `requiresAuth: true`。配列はハードコードで、他に登録場所はない
- 現在のエントリ: ホーム(`/home`, 公開) / 生徒一覧(`/students`) / データ連携(`/interop`)。後ろ 2 つは `requiresAuth: true`

## IPAmjexMincho Web フォント（外部配信を利用）

氏名表示に使う IPAmjexMincho Web フォントは **外部に配信されているもの（https://ipamjexmincho.shumy.app）を参照する**。フォントの合成・配信ツールは本リポジトリには含まない。

- 配信元 URL は [src/theme/fonts.ts](src/theme/fonts.ts) の `IPAMJEX_FONT_CSS_URL` / `IPAMJEX_FONT_ORIGIN` で定義（環境変数 `IPAMJEX_FONT_CSS_URL` で上書き可）。[src/app/layout.tsx](src/app/layout.tsx) が `<link rel="preconnect">` と CSS の `<link>` を出力する
- 適用は正式氏名（MJ特有文字を含みうる）の表示に限定（`FONT_MJ`）。アプリ全体のフォントには当てない
- ライセンスは IPAフォントライセンス v1.0（派生名 IPAmjexMincho）

## 自明でない実装上の注意点（src）

- **DB は Turso 1 系統**: 認証 (`user` / `account` / `session` / `verificationToken`)・ログイン履歴 (`login_history`)・ユーザ設定 (`user_preferences`) の全テーブルが Turso (SQLite) に同居する。クライアントは [src/server/db/turso/client.ts](src/server/db/turso/client.ts) の `getTursoDb()` 1 つのみ。lazy キャッシュなので、トップレベル定数として import し直さないこと
- **Auth.js v5 の lazy config**: [src/server/auth/config.ts](src/server/auth/config.ts) は `NextAuth(() => config)` の関数形式。env / DB の評価をリクエスト時まで遅延させることで、シークレットが無くても `next build` を通せる（`SKIP_ENV_VALIDATION=1` との併用）。eager に戻すとビルドが壊れる
- **signOut は `revalidatePath('/', 'layout')` を挟む**: [src/features/auth/actions.ts](src/features/auth/actions.ts) の `signOutAction`。`signOut({ redirectTo })` だけだと、現在地が `/home` のときソフトナビゲーションになり RootLayout がキャッシュ再利用され、認証状態が古いまま残る
- **ユーザ削除は `deleteUserAndAllData()` を経由**: [src/server/services/user-deletion.ts](src/server/services/user-deletion.ts)。全テーブルが同一 DB なので単一トランザクションで原子的に消す
- **drizzle-kit は Turso のみ**: [drizzle.turso.config.ts](drizzle.turso.config.ts) を `--config` で明示する `db:*:turso` スクリプトを使う。config は `process.loadEnvFile('.env.local')`（Node 22 組み込み）を呼ぶ。dotenv に置き換えない
- **MUI Button + Next の `Link`**: Server Component で `component={Link}` を渡すと "Functions cannot be passed..." エラー。代わりに `<Link>` で `<Button component="span">` を包む
- **npm install には `--legacy-peer-deps`**: `next-auth@5.0.0-beta.*` の peer deps が `next@^14||^15` 宣言だが Next 16 でも動く。[.npmrc](.npmrc) で設定済み
- **空文字 env**: 任意項目の Zod スキーマは `z.preprocess(emptyToUndefined, ...)` で包んでいるので、`.env.local` に `FOO=` でも未設定扱い

## 既知の名残・要整理（旧 life-todo 由来）

src を本格実装する際にあわせて整理するとよい既存の不整合（**新規にこれらへ依存しない**）:

- [tsconfig.json](tsconfig.json) の `include` に**存在しない** `drizzle.neon.config.ts` への参照
- `exceljs` / `@vercel/blob` 等、旧 data-transfer 用の依存が残るが**現状未使用**（README / 旧 CLAUDE が触れていた `data-transfer` / `app/api/export` は**未実装**）
- [src/app/about/page.tsx](src/app/about/page.tsx) の説明文が旧アプリ（やること/いつもの/もちもの）のまま

> 解消済み: `user_preferences` の `routines*` / `packing*` 未使用カラムと、旧マイグレーションの `todos` / `packing_*` 等の死蔵テーブル定義は、Turso を `edx-poc` へ切り替える際にクリーンな単一ベースライン（[migrations/0000_conscious_turbo.sql](src/server/db/turso/migrations/0000_conscious_turbo.sql)）へ作り直して除去済み。`user_preferences` は `user_id` + timestamps のみのスカフォールド。

## スコープの健全性

- `home` / `students` / `interop` は**プレースホルダ**。着手するときは [src/features/login-history/](src/features/login-history/) を参照実装として、`actions.ts` / `schema/` / `services/`（`format.ts` の `toView()`）/ `components/` を同じ構造で起こす
- 将来の機能を先回りしてスキャフォールドしない。今やる 1 機能に集中する
- 依存追加は事前に確認する。テスト導入時に `vitest` 一式 + `@playwright/test`、フォーム本格化時に `react-hook-form` + `@hookform/resolvers` を初回利用時にまとめて install する前提（docs で未決）
