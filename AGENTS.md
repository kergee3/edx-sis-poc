# AGENTS.md

このファイルは、Codex などの AI コーディングエージェントがこのリポジトリで作業するときの入口です。詳細な設計判断は `docs/` 配下を正本として扱い、このファイルは作業開始時の要点確認に使ってください。

## プロジェクト概要

`jtp-mj-font` は、「文字情報基盤 (MJ) の漢字を Web フォントとして使う」実証から出発し、その応用として校務支援システムの PoC を作るプロジェクトです。大きく 2 つの独立した部分があります。

- `src/`: SSS-PoC (School affairs Support System - Proof of Concept)。IPAmjexMincho Web フォントを活かした校務支援システムの実証実験です。Next.js 16 App Router、React 19、MUI v7 を使います。現状は基盤のみ実装済みで、業務機能はこれからです。
- `webfont/`: IPAmj明朝 + IPAex明朝 を 1 フォント `IPAmjexMincho` に合成し、256 サブセット WOFF2 として Vercel に配信するフォント変換ツールです。主に Python / fonttools で、変換から配信まで完成・稼働中です。

`src/` の想定シナリオは、小さな離島の小さな中学校です。ログインした校長先生が、全校生徒の先生と事務を兼ねて校務を行います。生徒定員は 25 名、各学年 4 名で初期 12 名在籍という前提です。氏名の MJ 特有文字、たとえば戸籍漢字などを IPAmjexMincho で正しく表示することが眼目です。

実装済みの基盤は次の通りです。

- 認証: Google / LINE、Auth.js v5
- ログイン履歴: サーバ側記録 + クライアント側補完
- 右上ユーザーメニュー: ログアウト / About / ログイン履歴
- DB: Turso (SQLite, 東京 NRT) への一本化
- UI: MUI Theme

`home`、`students`、`interop` はプレースホルダ表示のみのスキャフォールドです。業務ロジックは未着手です。`students` は生徒一覧、転入/転出/編集、在学/成績証明書発行を担う予定です。`interop` は学齢簿インポート、OneRoster 入出力を担う予定です。業務ドメインの設計は `docs/design/` を参照してください。

重要: このリポジトリは別アプリ (`life-todo`: todo / routines / packing) からの fork が出発点です。旧アプリの名残が一部残っています。`todo` / `routines` / `packing` / `data-transfer` / `memo` といった機能は現存しません。ドキュメントやコメントにこれらが出てきたら旧記述として扱ってください。

## 重要な変更の前に必読

`docs/` 配下の設計文書がレイヤ責務・規約の基準です。ただし一部の例が旧アプリ (`todo` など) のままなので、具体例より考え方を参照してください。

- `docs/dev-guideline.md`: 技術スタック、「正本」の考え方、未決事項
- `docs/architecture-guidelines.md`: レイヤ責務、Server Action と Route Handler の使い分け、認証・認可
- `docs/directory-structure.md`: `src/` 配下の配置方針
- `docs/coding-guidelines.md`: TypeScript / React / MUI のルール、セキュリティ、a11y

設計の軸は次の 2 つです。

- データの正本: Turso (SQLite, 東京 NRT) 1 系統
- デザインの正本: MUI Theme

環境構築、Turso、Google OAuth、LINE Login、`.env.local` の手順は `docs/environment-setup.md` を参照してください。

政府機関などが公開する外部仕様書 PDF は `docs/references/` に置き、出典・取得日・再配布条件を `docs/references/README.md` の索引で管理します。それらを踏まえて本プロジェクトが作成する設計・調査ドキュメントは `docs/design/` に置きます。外部資料とは分離してください。

## 技術スタック

- Runtime: Node.js 22 LTS
- Package Manager: npm
- Language: TypeScript
- Framework: Next.js 16 App Router
- Frontend: React 19
- UI: MUI v7 / MUI Theme
- Backend: Next.js Server Actions / Route Handlers
- Auth: Auth.js v5, Google OAuth, LINE Login
- DB: Turso (SQLite, 東京 NRT) 1 系統
- ORM: Drizzle ORM (`drizzle-orm/libsql`)
- Validation: Zod
- Lint: ESLint
- Hosting: Vercel

`.npmrc` で `legacy-peer-deps=true` が設定されています。`next-auth@5.0.0-beta.*` の peer dependencies が Next 16 を明示していないため、依存関係を扱うときはこの前提を維持してください。

## セットアップ手順

1. Node.js 22 LTS を使用する。
2. 依存関係をインストールする。

   ```bash
   npm install
   ```

3. `.env.example` を参考に `.env.local` を作成する。
4. Turso、Google OAuth、LINE Login などの外部サービスを設定する。詳細は `docs/environment-setup.md` を参照する。
5. 必要に応じて DB マイグレーションを適用する。

   ```bash
   npm run db:migrate:turso
   ```

6. 開発サーバを起動する。

   ```bash
   npm run dev
   ```

## 開発・ビルド・Lint コマンド

```bash
npm run dev                  # 開発サーバ起動 http://localhost:3000
npm run build                # 本番ビルド
npm run lint                 # ESLint
npm run typecheck            # TypeScript 型チェック
npm run db:generate:turso    # Turso の Drizzle マイグレーション生成
npm run db:migrate:turso     # Turso に未適用マイグレーションを適用
npm run db:studio:turso      # Turso の Drizzle Studio 起動
npm run icons                # public/icon.svg から PWA アイコン再生成
```

本物のシークレットが未設定の CI ビルドなどでは、必要に応じて env 検証を迂回できます。

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

Windows PowerShell では次のように実行します。

```powershell
$env:SKIP_ENV_VALIDATION='1'; npm run build
```

`webfont/` の変換・配信は npm ではなく Python ノートブックと `vercel` CLI で行います。入口は `webfont/README.md`、デプロイ手順は `webfont/docs/deploy.md` を参照してください。

## アーキテクチャのレイヤ

`docs/architecture-guidelines.md` に基づき、`src/` は次の責務分離を守ってください。

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

- `app`: ルーティング、page / layout、Route Handler
- `features/<domain>`: UI、`actions.ts`、schema、types、表示用 services
- `server/services`: 業務ロジック、複数 repository の横断処理
- `server/repositories`: Drizzle クエリのみ。DB アクセスはここに閉じる
- `server/db`: schema、migrations、client

Server Action (`features/*/actions.ts`) は薄い受け口に保ち、実処理は `server/services` へ委譲してください。Route Handler (`app/api/**/route.ts`) は Webhook / 外部公開 API 用途を基本とし、内部更新は原則 Server Action を使います。`middleware.ts` はログイン要否の判定に留め、リソース単位の認可は service / Server Action 側で行います。UI 層から Drizzle、DB クライアント、外部 SaaS SDK を直接呼ばないでください。

現在の `src/features/` は、`auth` と `login-history` が実装済み、`home` / `students` / `interop` は placeholder component のみです。

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
- 一覧取得は service で `unstable_cache(fn, key, { tags, revalidate })` で包み、タグは `src/server/cache/tags.ts` のヘルパ経由で生成する。タグ名の文字列リテラルを直接書かない。
- 更新系 Server Action は処理成功後に `updateTag(<tag>(userId))` を呼んでキャッシュを失効させる。
- 新しい依存関係を追加する前に、既存実装・標準 API・導入済みライブラリで対応できないか確認する。大きな依存追加は作業内容に明記する。

## 認証プロバイダ

Auth.js v5 + DrizzleAdapter で Google と LINE の 2 プロバイダを `providers` 配列にぶら下げています。同種の OAuth プロバイダを追加するときは、次の箇所を揃えて更新してください。

- `src/server/auth/config.ts`
- `src/lib/env/index.ts`
- `src/features/auth/actions.ts`
- `src/features/auth/components/SignInButton.tsx` と関連メニューのボタン

アカウントは provider ごとに別ユーザ扱いです。`allowDangerousEmailAccountLinking` は使わないでください。LINE は Email permission を申請しないと email を返さないため、`users.email` は nullable 前提で UI も null safe にしてください。

## ログイン履歴

ログイン履歴は後続機能のリファレンス実装です。

- `src/server/auth/config.ts` の `events.signIn` が `recordLogin(userId, account?.provider ?? null)` を呼ぶ。
- サーバ側で取れる provider / IP / UA / Referer / Geo は `headers()` 経由で記録する。
- `src/app/ClientLayout.tsx` にマウントされた `ClientEnricher` が、OS / ブラウザ / 解像度 / UA Data などクライアント側でしか取れない情報を収集する。
- `enrichLatestLoginAction` で同じ行を UPDATE する。冪等性は repository 側の `os IS NULL` フィルタで担保する。

## ユーザ設定とキャッシュ

サーバ側に永続化する設定は `user_preferences` テーブルに列を足し、`server/services/user-preferences.ts` と `server/repositories/user-preferences.ts` を経由してください。

取得系の service は `unstable_cache(fn, key, { tags: [preferencesTag(userId)], revalidate })` で包みます。タグは `src/server/cache/tags.ts` の `preferencesTag(userId)` などのヘルパを必ず経由してください。更新系 Server Action は処理成功後に `updateTag(preferencesTag(userId))` を呼びます。

## ディレクトリ構成

```text
.
├── docs/                  # 開発・設計・環境構築ドキュメント
├── public/                # 静的アセット、PWA アイコン
├── scripts/               # 運用・生成スクリプト
├── tests/                 # E2E / 統合テスト用
├── webfont/               # IPAmjexMincho 変換・配信サブプロジェクト
├── src/
│   ├── app/               # App Router のルート、page/layout、Route Handler
│   ├── components/        # 機能横断の共通 UI
│   ├── contexts/          # クライアント側の共有 state
│   ├── features/          # 機能単位の UI、actions、schema、types、format
│   ├── hooks/             # 共通 React hooks
│   ├── lib/               # env、logging、共通 utils
│   ├── server/            # DB、repositories、services、cache、auth などサーバ専用コード
│   ├── theme/             # MUI Theme
│   └── types/             # 横断的な型定義
├── drizzle.turso.config.ts # Drizzle 設定 (Turso)
├── middleware.ts          # 認証要否の middleware
├── next.config.ts         # Next.js 設定
└── package.json
```

## ナビゲーション

左メニュー / ボトムナビに項目を追加するときは `src/app/ClientLayout.tsx` の `navigationItems` 配列にエントリを足してください。ログイン必須なら `requiresAuth: true` を付けます。登録場所はこの配列に集約されています。

現在のエントリは、ホーム (`/home`, 公開)、生徒一覧 (`/students`, 認証必須)、データ連携 (`/interop`, 認証必須) です。

## webfont サブプロジェクト

`webfont/` は `src/` とは独立しています。npm ではなく Python + Vercel CLI を使います。

- 入口は `webfont/README.md`
- ビルドは `webfont/notebooks/build_webfont.ipynb` を Section 0 から 7 まで実行する
- 合成、リネーム、256 分割、WOFF2、配信物 `site/` 生成の順で進む
- 配信物 `webfont/site/` は Vercel の専用静的プロジェクト
- `woff2` 約 47MB は gitignore し、`vercel` CLI が直接アップロードする
- 公開先は `https://ipamjexmincho.shumy.app`
- ライセンスは IPA フォントライセンス v1.0、派生名は `IPAmjexMincho`

## 変更してはいけないファイルや注意点

- `.env.local` には実シークレットが入る可能性があります。値を表示・コミット・不要に編集しないでください。
- `src/server/auth/config.ts` の `NextAuth(() => config)` 形式を eager な設定に戻さないでください。env / DB の評価をリクエスト時まで遅延させ、シークレット未設定時の build を通すためです。
- `src/server/db/turso/client.ts` の lazy な `getTursoDb()` をトップレベルの `db` 定数 import 方式へ戻さないでください。
- DB は Turso 1 系統です。認証、ログイン履歴、ユーザ設定はすべて同一 DB に同居しています。
- `drizzle.turso.config.ts` は Node 22 の `process.loadEnvFile('.env.local')` で `.env.local` を明示的に読んでいます。理由なく dotenv へ置き換えないでください。
- drizzle-kit は常に `--config` 指定で呼び出す npm scripts (`db:*:turso`) を使ってください。
- 既存の Drizzle migration は履歴です。過去 migration を手編集せず、新しい schema 変更は `npm run db:generate:turso` で追加 migration を生成してください。
- ユーザ削除は `src/server/services/user-deletion.ts` の `deleteUserAndAllData()` を経由してください。
- `src/features/auth/actions.ts` の sign out フローは、`signOut({ redirect: false })`、`revalidatePath('/', 'layout')`、`redirect('/home')` の順序を維持してください。
- Server Component で MUI Button に `component={Link}` を直接渡すと RSC の関数 prop エラーになり得ます。`<Link>` で `<Button component="span">` を包む既存方針に従ってください。
- 現在の依頼範囲を尊重し、将来機能を先回りしてスキャフォールドしないでください。

## 既知の名残・要整理

旧 `life-todo` 由来の不整合があります。新規にこれらへ依存しないでください。

- `user_preferences` に `routines*` / `packing*` の未使用カラムが残っている。
- `tsconfig.json` の `include` に存在しない `drizzle.neon.config.ts` への参照がある。
- `exceljs` / `@vercel/blob` など旧 data-transfer 用の依存が残っているが、現状未使用。
- README や旧ドキュメントに出ていた `data-transfer` / `app/api/export` は未実装。
- `src/app/about/page.tsx` の説明文が旧アプリのまま。
- Turso の古いマイグレーションに `todos` / `packing_*` などの旧テーブル定義が含まれるが、現スキーマにはない。

## スコープの健全性

`home` / `students` / `interop` はプレースホルダです。業務機能に着手するときは `src/features/login-history/` を参照実装として、`actions.ts`、schema、services、`format.ts` の `toView()`、components を同じ構造で起こしてください。

将来の機能を先回りしてスキャフォールドせず、今やる 1 機能に集中してください。依存追加は事前に確認してください。テスト導入時に `vitest` 一式 + `@playwright/test`、フォーム本格化時に `react-hook-form` + `@hookform/resolvers` を初回利用時にまとめて install する前提は docs 上の未決事項です。

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
