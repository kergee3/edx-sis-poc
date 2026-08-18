# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**edx-sis-poc** は「文字情報基盤(MJ)の漢字を Web フォントとして使う」実証から出発し、その応用として**校務支援システムの PoC** を作るプロジェクト。本体は `src/` の Web アプリ。

- **`src/`（Web アプリ）= SIS-PoC（Student Information System - Proof of Concept）** — IPAmjexMincho Web フォントを活かした**校務支援システムの実証実験**。Next.js 16 App Router + MUI v7。**認証・基盤に加え、ホームと生徒一覧（名簿・転入転出・編集・在学証明書・表示名マッピング・OneRoster 出力）まで、計画していた PoC の機能は一通り実装済み**。
  - 想定シナリオ: 小さな離島の小さな中学校。ログインした校長先生がワンオペで全校生徒の先生＋事務を兼ねて校務を行う（生徒定員 25 名・各学年 4 名で初期 12 名在籍）。氏名の MJ特有文字（戸籍漢字等）を IPAmjexMincho で正しく表示するのが眼目。
  - 基盤: 認証（Google / LINE, Auth.js v5）、ログイン履歴（サーバ＋クライアント）、右上ユーザーメニュー（ログアウト / About / ログイン履歴）、Turso(SQLite) への一本化、MUI Theme。
  - 機能: `home`＝ログイン中の校長氏名・学校名・在籍数を差し込む案内表示 / `students`＝生徒一覧（名簿の転入/転出/編集・在学証明書発行・表示名（姓）の JIS X 0213 マッピング・OneRoster 出力）。データ連携（学齢簿マッピング・OneRoster 出力）は当初 `interop` ページで試作したが `students` へ統合済み。業務ドメインの設計は [docs/design/](docs/design/) を参照。

氏名表示に使う **IPAmjexMincho Web フォント**（IPAmj明朝 + IPAex明朝 を合成した 256 サブセット WOFF2）は、**外部に配信されているもの（[ipamjexmincho.shumi.dev](https://ipamjexmincho.shumi.dev)）を利用する**。フォントの合成・配信ツール自体は本リポジトリには含まない。アプリ側の利用箇所は [src/theme/fonts.ts](src/theme/fonts.ts) / [src/app/layout.tsx](src/app/layout.tsx)。

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

政府機関などが公開する**外部仕様書 PDF / xlsx 等**はリポジトリに複製せず、[docs/design/external-references.md](docs/design/external-references.md) の索引に外部リンク、出典、取得日、利用条件を記録する。それらを踏まえて本プロジェクトが作成する**設計・調査ドキュメント**も同じ [docs/design/](docs/design/) に置く。

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

現在の `src/features/`: `auth` / `login-history` / `bug-report` / `home`（ログイン中の校長氏名・学校名・在籍数を差し込む案内表示）/ `students`（名簿・転入転出・編集・在学証明書発行・表示名マッピング・OneRoster 出力）/ `settings`（学校情報・名簿の初期化・表示名編集の JIS X 0213 対応付け候補の生成元・表示名のフォント・Navigation Bar の位置）。

### 認証プロバイダ（Google / LINE）

- Auth.js v5 + DrizzleAdapter で **Google と LINE** の 2 プロバイダを `providers` 配列にぶら下げている ([src/server/auth/config.ts](src/server/auth/config.ts))。同種の OAuth プロバイダを追加するときは、(1) この配列、(2) [src/lib/env/index.ts](src/lib/env/index.ts) の env スキーマ、(3) [src/features/auth/actions.ts](src/features/auth/actions.ts) の Server Action、(4) [src/features/auth/components/SignInButton.tsx](src/features/auth/components/SignInButton.tsx) と関連メニューのボタン、の 4 箇所を揃えて足す
- **アカウントは provider ごとに別ユーザ扱い**（`allowDangerousEmailAccountLinking` は使わない）。`account` テーブルが `(provider, providerAccountId)` の複合主キーなので、同じ人が Google と LINE でログインすると別 `user` 行が作られる。これは仕様
- LINE は **Email permission を申請しないと email を返さない**。`users.email` は nullable なので UI も null セーフに書く（[AccountPanel](src/features/auth/components/AccountPanel.tsx) 参照）
- **ゲストログイン**は OAuth 系と同じ4箇所パターンではなく、Credentials プロバイダ（`id: 'guest'`）1本で完結する。`authorize()` が [src/server/repositories/users.ts](src/server/repositories/users.ts) の `insertGuestUser()` を直接呼んで `users` 行を払い出す（Credentials は OAuth と違いアダプタの `createUser` を自動実行しないため）。`users.isGuest` フラグで判別できるが、**現時点では削除・掃除処理は無い**（将来のクリーンアップ用に列だけ用意）。アカウント連携（ゲスト→Google/LINEへのデータ引き継ぎ）も未実装

### ログイン履歴のフロー（後続機能のリファレンス実装）

- [src/server/auth/config.ts](src/server/auth/config.ts) の `events.signIn` が `recordLogin(userId, account?.provider ?? null)` を呼び、**サーバ側で取れる情報** (provider / IP / UA / Referer / Geo) を `headers()` 経由で記録する（[src/server/services/login-history.ts](src/server/services/login-history.ts)）
- [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) にマウントされた [ClientEnricher](src/features/login-history/components/ClientEnricher.tsx) が **クライアント側でしか取れない情報** (OS / ブラウザ / 解像度 / UA Data) を収集し、`enrichLatestLoginAction` で同じ行を UPDATE する。冪等性は repository 側の `os IS NULL` フィルタで担保する

### バグ報告（スクショ + GitHub Issue 自動起票）

- ヘッダ右上の 🐞 ボタン（[BugReportButton](src/components/layout/BugReportButton.tsx)）が `modern-screenshot` の `domToCanvas` で `document.body` をキャプチャ → JPEG 縮小（≤1600px, q0.85）→ [BugReportDialog](src/components/layout/BugReportDialog.tsx) を開く。ボタンは 3 レイアウト（[TopTabs](src/components/layout/TopTabs.tsx) / [Sidebar](src/components/layout/Sidebar.tsx) / [BottomNavBar](src/components/layout/BottomNavBar.tsx)）の UserMenu 左に設置、ログイン時のみ表示
- 送信時、スクショは **Vercel Blob** にクライアント直アップロード（[app/api/bug-report/upload/route.ts](src/app/api/bug-report/upload/route.ts) が `requireUser` 必須・`bug-reports/` 限定・JPEG/PNG・2MB でトークン発行）→ 公開 URL を `submitBugReportAction`（[src/features/bug-report/actions.ts](src/features/bug-report/actions.ts)）へ。`userId` はクライアントを信用せず Server Action 側で `auth()` から取る
  - **Blob ストアは `--access public` で作ること**（GitHub Issue に画像を埋め込む = 匿名で取得できる公開 URL が必須。private ストアだと PUT が 400「Cannot use public access on a private store」。access は作成時固定で変更不可・ダッシュボードの既定は private になりがち。`vercel blob create-store <name> --access public` が確実）
  - **`BLOB_READ_WRITE_TOKEN` を Vercel ダッシュボードの「Copy Snippet」でコピーするときは先に「Show secret」を押す**（押さないとトークンが `***...`（マスク）のままコピーされ、`.env.local` に伏字が入る。トークン発行はローカル処理なので 200 を返し、実 PUT で初めて失敗するため気付きにくい）
  - スクショ送信は best-effort で、[BugReportDialog](src/components/layout/BugReportDialog.tsx) で `AbortController` により 15 秒で打ち切りテキストのみ起票にフォールバックする。`@vercel/blob` は失敗時に既定 10 回リトライ（≈17分）するため。`AbortSignal.timeout()` は `TimeoutError` を投げ SDK にリトライ継続されるので不可、`controller.abort()`（`AbortError`）でないと止まらない
- 実処理は [src/server/services/bug-report.ts](src/server/services/bug-report.ts) → [src/server/adapters/github/issues.ts](src/server/adapters/github/issues.ts)（GitHub REST `POST /issues` の薄いラッパ）。`env.GITHUB_TOKEN` / `env.GITHUB_REPO`（`"owner/name"`）が必要で、未設定なら service が throw → action が `github_failed` を返す（アプリは落ちない）。ラベル `bug` / `enhancement` / `user-report` は**リポジトリに事前作成が必要**（GitHub API は未存在ラベルを自動作成しない）

### 表示名編集の JIS X 0213 対応付け候補（ローカル / Web API 切り替え）

- 生徒詳細・転入の表示名編集（[FamilyMappingFields](src/features/students/components/FamilyMappingFields.tsx)）が使う対応付け候補は、[src/server/services/mji-mapping.ts](src/server/services/mji-mapping.ts) の `mapSurnameWithSource(input, source)` が生成元を切り替える。`mapSurname()`（ローカルの MJ 縮退マップ、DB 照合で複数候補）と `mapSurnameViaApi()`（[maji.shumi.dev の MJ→JIS 変換 Web API](https://maji.shumi.dev/mj2jis-api) を [src/server/adapters/mj2jis/client.ts](src/server/adapters/mj2jis/client.ts) 経由で叩き、1 字につき候補 0〜1 件に一意解決）の 2 系統
- 生成元は `user_preferences.mj_mapping_source`（`'local' | 'api'`、既定 `'api'`）で、設定ページの [MjMappingSourceSetting](src/features/settings/components/MjMappingSourceSetting.tsx) から切り替える。取得は `getMjMappingSourceForUser()`（[user-preferences.ts](src/server/services/user-preferences.ts)）
- API 呼び出しが失敗（タイムアウト 5 秒・通信断等）した場合は `mapSurnameWithSource` が例外を握りつぶしローカルへ自動フォールバックする（表示名編集自体を止めないための best-effort 方針。[バグ報告](#バグ報告-スクショ--github-issue-自動起票) の best-effort パターンと同じ考え方）

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
- 現在のエントリ: ホーム(`/home`, 公開) / 生徒一覧(`/students`, `requiresAuth: true`) / 設定(`/settings`, `requiresAuth: true`)

## IPAmjexMincho Web フォント（外部配信を利用）

氏名表示に使う IPAmjexMincho Web フォントは **外部に配信されているもの（[ipamjexmincho.shumi.dev](https://ipamjexmincho.shumi.dev)）を参照する**。フォントの合成・配信ツールは本リポジトリには含まない。

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

旧アプリ由来の不整合は順次解消済み。**新規にこれらへ依存しない**。

> 解消済み（旧 data-transfer / life-todo 由来）:
> - [tsconfig.json](tsconfig.json) `include` の**存在しない** `drizzle.neon.config.ts` 参照を削除。
> - 未使用の旧 data-transfer 依存 `exceljs`（と死蔵ファイル `src/lib/blob/index.ts`）を除去。`data-transfer` / `app/api/export` は元々**未実装**。（注: `@vercel/blob` は一旦除去したが、バグ報告のスクショ保存用途で**再導入済み**。上記「バグ報告」節を参照）
> - [src/app/about/page.tsx](src/app/about/page.tsx) の説明文は SIS-PoC の内容へ更新済み。
> - `user_preferences` の `routines*` / `packing*` 未使用カラムと、旧マイグレーションの `todos` / `packing_*` 等の死蔵テーブル定義は、Turso を `edx-poc` へ切り替える際にクリーンな単一ベースライン（[migrations/0000_conscious_turbo.sql](src/server/db/turso/migrations/0000_conscious_turbo.sql)）へ作り直して除去済み。`user_preferences` は `user_id` + timestamps のみのスカフォールド。

## スコープの健全性

- 計画していた PoC の機能は一通り実装済み。新しい業務機能を追加するときは [src/features/students/](src/features/students/) や [src/features/login-history/](src/features/login-history/) を参照実装として、`actions.ts` / `schema` / `services/`（`format.ts` の `toView()`）/ `components/` を同じ構造で起こす
- 将来の機能を先回りしてスキャフォールドしない。今やる 1 機能に集中する
- 依存追加は事前に確認する。テスト導入時に `vitest` 一式 + `@playwright/test`、フォーム本格化時に `react-hook-form` + `@hookform/resolvers` を初回利用時にまとめて install する前提（docs で未決）
