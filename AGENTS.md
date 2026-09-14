# AGENTS.md

このファイルは、Codex や Claude Code などの AI コーディングエージェントがこのリポジトリで作業するときの入口です。詳細な設計判断は `docs/` 配下を正本として扱い、このファイルは作業開始時の要点確認に使ってください。

ルート直下の `CLAUDE.md` はこのファイルへのポインタです。エージェント向けの記述を足すときは、このファイル（正本）だけを更新してください。

## プロジェクト概要

`edx-sis-poc` は、「行政事務標準文字（文字情報基盤 MJ + GJ）の漢字を Web フォントとして使う」実証から出発し、その応用として校務支援システムの PoC を作るプロジェクトです。本体は `src/` の Web アプリです。

- `src/`: SIS-PoC (Student Information System - Proof of Concept)。GyoseiHyojunMincho Web フォントを活かした校務支援システムの実証実験です。Next.js 16 App Router、React 19、MUI v7 を使います。認証・基盤に加え、ホームと生徒一覧（名簿・転入転出・編集・在学証明書・表示名マッピング・OneRoster 出力）まで、計画していた PoC の機能は一通り実装済みです。
- 想定シナリオは、小さな離島の小さな中学校です。ログインした校長先生が、全校生徒の先生と事務を兼ねて校務を行います。生徒定員は 25 名、各学年 4 名で初期 12 名在籍という前提です。
- 氏名の MJ 特有文字、たとえば戸籍漢字などを GyoseiHyojunMincho で正しく表示することが眼目です。GJ 文字（MJ に無い約 9,400 字）も同じフォントで表示できます。

氏名表示に使う `GyoseiHyojunMincho` Web フォント（`IPAmjexMincho` の MJ 2048 スライス + `GJ2608puaMinchoAddon` の GJ 512 スライスを CSS 合成した計 2560 サブセット WOFF2）は、外部に配信されているもの（`https://gyoseihyojun.shumi.dev`）を利用します。フォントの合成・配信ツール自体はこのリポジトリには含みません。アプリ側の利用箇所は `src/theme/fonts.ts` / `src/app/layout.tsx` です。

主な機能は次の通りです。

- 認証: Google / LINE / ゲスト、Auth.js v5
- ログイン履歴: サーバ側記録 + クライアント側補完
- 右上ユーザーメニュー: ログアウト / About / ログイン履歴
- バグ報告: スクリーンショット付き GitHub Issue 起票（ゲストログイン時はボタン非表示）
- `home`: ログイン中の校長氏名・学校名・在籍数を差し込む案内表示
- `students`: 生徒一覧、転入/転出/編集、在学証明書発行、表示名（姓）の JIS X 0213 マッピング、OneRoster 出力
- `settings`: 学校情報、名簿の初期化、表示名編集の JIS X 0213 対応付け候補の生成元、表示名のフォント、Navigation Bar の位置
- DB: Turso (SQLite, 東京 NRT) への一本化
- UI: MUI Theme

データ連携（学齢簿マッピング・OneRoster 出力）は当初 `interop` ページで試作しましたが、`students` へ統合済みです。業務ドメインの設計は `docs/design/` を参照してください。

重要: このリポジトリは別アプリ (`life-todo`: todo / routines / packing) からの fork が出発点です。旧アプリの名残が一部残っていた経緯があります。`todo` / `routines` / `packing` / `data-transfer` といった旧機能名を見かけた場合は、現行機能ではなく旧記述として扱ってください。なおルート直下の `memo/` は旧機能ではなく、現行の設計メモ置き場です。

## 重要な変更の前に必読

`docs/` 配下の設計文書がレイヤ責務・規約の基準です。ただし一部の例が旧アプリ (`todo` など) のまま残る可能性があるため、具体例より考え方を参照してください。

- `docs/dev-guideline.md`: 技術スタック、「正本」の考え方、未決事項
- `docs/architecture-guidelines.md`: レイヤ責務、Server Action と Route Handler の使い分け、認証・認可
- `docs/directory-structure.md`: `src/` 配下の配置方針
- `docs/coding-guidelines.md`: TypeScript / React / MUI のルール、セキュリティ、a11y
- `docs/environment-setup.md`: Turso、Google OAuth、LINE Login、`.env.local` の手順

設計の軸は次の 2 つです。

- データの正本: Turso (SQLite, 東京 NRT) 1 系統
- デザインの正本: MUI Theme

政府機関などが公開する外部仕様書 PDF / xlsx 等はリポジトリに複製せず、`docs/design/external-references.md` の索引に外部リンク、出典、取得日、利用条件を記録します。それらを踏まえて本プロジェクトが作成する設計・調査ドキュメントも同じ `docs/design/` に置きます。

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
- 主なライブラリ: `exceljs`（名簿 xlsx の読み書き・在学証明書）、`fflate`（OneRoster の zip 生成）、`modern-screenshot` + `@vercel/blob`（バグ報告のスクリーンショット）、`@base-ui/react`（数値入力などの低レベル UI）、`date-fns` / `@holiday-jp/holiday_jp`（日付・祝日）、`@vercel/analytics`

`.npmrc` で `legacy-peer-deps=true` が設定されています。`next-auth@5.0.0-beta.*` の peer dependencies が Next 16 を明示していないため、依存関係を扱うときはこの前提を維持してください。

## セットアップ手順

1. Node.js 22 LTS を使用する。
2. 依存関係をインストールする。

   ```bash
   npm install
   ```

3. `.env.example` を参考に `.env.local` を作成する。
4. Turso、Google OAuth、LINE Login、GitHub Issue 起票、Vercel Blob など必要な外部サービスを設定する。詳細は `docs/environment-setup.md` と関連コードを参照する。
5. 必要に応じて DB マイグレーションを適用する。

   ```bash
   npm run db:migrate:turso
   ```

6. 開発サーバを起動する。

   ```bash
   npm run dev
   ```

## 開発・ビルド・テスト・Lint コマンド

```bash
npm run dev                  # 開発サーバ起動 http://localhost:3000
npm run build                # 本番ビルド
npm run start                # 本番ビルド後の起動
npm run lint                 # ESLint
npm run typecheck            # TypeScript 型チェック (tsc --noEmit)
npm run db:generate:turso    # Turso の Drizzle マイグレーション生成
npm run db:migrate:turso     # Turso に未適用マイグレーションを適用
npm run db:studio:turso      # Turso の Drizzle Studio 起動
npm run db:import:mji        # MJ 文字情報の参照データ取り込み
npm run icons                # public/icon.svg から PWA アイコン再生成
```

現時点で専用の `npm test` script はありません。作業内容に応じて `npm run typecheck`、`npm run lint`、`npm run build` を確認してください。テストを追加する場合は、既存方針と `docs/` の未決事項に従い、導入範囲を明記してください。

本物のシークレットが未設定の CI ビルドなどでは、必要に応じて env 検証を迂回できます。

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

Windows PowerShell では次のように実行します。

```powershell
$env:SKIP_ENV_VALIDATION='1'; npm run build
```

## アーキテクチャのレイヤ

`docs/architecture-guidelines.md` に基づき、`src/` は次の責務分離を守ってください。

```text
app
  ↓
features/<domain>
  ↓
server/services  →  server/adapters (外部 API の薄いラッパ)
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
- `server/adapters`: 外部 HTTP API の薄いラッパ。現在は `github`（Issue 起票）と `mj2jis`（MJ→JIS 変換 API）

Server Action (`features/*/actions.ts`) は薄い受け口に保ち、実処理は `server/services` へ委譲してください。`middleware.ts` はログイン要否の判定に留め、リソース単位の認可は service / Server Action 側で行います。UI 層から Drizzle、DB クライアント、外部 SaaS SDK を直接呼ばないでください。

Route Handler (`app/api/**/route.ts`) は、Webhook / 外部公開 API と、Server Action では返せないバイナリ・ファイルダウンロードに限定します。内部の状態更新は原則 Server Action です。現在の Route Handler は次の 5 本です。

- `api/auth/[...nextauth]`: Auth.js
- `api/bug-report/upload`: Vercel Blob のクライアント直アップロード用トークン発行
- `api/students/export`: 名簿・在学証明書の xlsx ダウンロード（`exceljs` のため Node ランタイム前提）
- `api/students/oneroster`: OneRoster 一式の zip ダウンロード（`fflate` のため Node ランタイム前提）
- `api/env`: 動作確認用の env 疎通エンドポイント（`requireUser` 必須）

現在の `src/features/` は、`auth` / `bug-report` / `home` / `login-history` / `settings` / `students` です。

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
- 将来の機能を先回りしてスキャフォールドせず、今やる 1 機能に集中する。

## 認証プロバイダ

Auth.js v5 + DrizzleAdapter で Google と LINE の 2 プロバイダを `providers` 配列にぶら下げています。同種の OAuth プロバイダを追加するときは、次の箇所を揃えて更新してください。

- `src/server/auth/config.ts`
- `src/lib/env/index.ts`
- `src/features/auth/actions.ts`
- `src/features/auth/components/SignInButton.tsx` と関連メニューのボタン

アカウントは provider ごとに別ユーザ扱いです。`allowDangerousEmailAccountLinking` は使わないでください。`account` テーブルが `(provider, providerAccountId)` の複合主キーなので、同じ人が Google と LINE でログインすると別 `user` 行が作られます。これは仕様です。LINE は Email permission を申請しないと email を返さないため、`users.email` は nullable 前提で UI も null safe にしてください。

ゲストログインは OAuth 系と同じ 4 箇所パターンではなく、Credentials プロバイダ (`id: 'guest'`) 1 本で完結します。`authorize()` が `src/server/repositories/users.ts` の `insertGuestUser()` を直接呼んで `users` 行を払い出します（Credentials は OAuth と違いアダプタの `createUser` を自動実行しないため）。`users.isGuest` フラグで判別でき、JWT / session にも載ります。現時点で削除・掃除処理はありません（将来のクリーンアップ用に列だけ用意）。アカウント連携（ゲストから Google / LINE へのデータ引き継ぎ）も未実装です。

## ログイン履歴

ログイン履歴は後続機能のリファレンス実装です。

- `src/server/auth/config.ts` の `events.signIn` が `recordLogin(userId, account?.provider ?? null)` を呼ぶ。
- サーバ側で取れる provider / IP / UA / Referer / Geo は `headers()` 経由で記録する。
- `src/app/ClientLayout.tsx` にマウントされた `ClientEnricher` が、OS / ブラウザ / 解像度 / UA Data などクライアント側でしか取れない情報を収集する。
- `enrichLatestLoginAction` で同じ行を UPDATE する。冪等性は repository 側の `os IS NULL` フィルタで担保する。

## バグ報告

バグ報告は、スクリーンショット付きで GitHub Issue を自動起票する機能です。

- ヘッダ右上のバグ報告ボタンが `modern-screenshot` で `document.body` をキャプチャし、JPEG に縮小してダイアログを開く。
- スクリーンショットは Vercel Blob にクライアント直アップロードし、公開 URL を Server Action に渡す。`userId` はクライアントを信用せず、Server Action 側で `auth()` から取得する。
- Vercel Blob ストアは公開 URL が必要なため public access で作成する。private ストアでは GitHub Issue に画像を埋め込めない。
- `BLOB_READ_WRITE_TOKEN`、`GITHUB_TOKEN`、`GITHUB_REPO` などの実シークレットは表示・ログ出力・コミットしない。
- GitHub Issue に付けるラベルは GitHub 側で事前作成が必要です。GitHub API は未存在ラベルを自動作成しません。

## 表示名編集の JIS X 0213 対応付け候補（ローカル / Web API 切り替え）

生徒詳細・転入の表示名編集 (`src/features/students/components/FamilyMappingFields.tsx`) が使う対応付け候補は、`src/server/services/mji-mapping.ts` の `mapSurnameWithSource(input, source)` が生成元を切り替えます。

- `mapSurname()`: アプリ内蔵のローカル MJ 縮退マップ。DB 照合で 1 字につき複数候補を返す。
- `mapSurnameViaApi()`: maji.shumi.dev の MJ→JIS 変換 Web API を `src/server/adapters/mj2jis/client.ts` 経由で叩き、1 字につき候補 0〜1 件に一意解決する。

生成元は `user_preferences.mj_mapping_source` (`'local' | 'api'`、既定は `'api'`) に保存し、設定ページの `MjMappingSourceSetting` から切り替えます。取得は `getMjMappingSourceForUser()` (`src/server/services/user-preferences.ts`) です。

API 呼び出しが失敗（タイムアウト 5 秒・通信断など）した場合は `mapSurnameWithSource` が例外を握りつぶしてローカルへ自動フォールバックします。表示名編集自体を止めないための best-effort 方針で、バグ報告のスクリーンショット送信と同じ考え方です。

## ユーザ設定とキャッシュ

サーバ側に永続化する設定は `user_preferences` テーブルに列を足し、`server/services/user-preferences.ts` と `server/repositories/user-preferences.ts` を経由してください。

取得系の service は `unstable_cache(fn, key, { tags: [preferencesTag(userId)], revalidate })` で包みます。タグは `src/server/cache/tags.ts` のヘルパ（現在は `preferencesTag(userId)` と `studentsTag(userId)`）を必ず経由してください。新しい一覧 service を足すときも同じパターンで、ドメインごとのタグ関数を `tags.ts` に追加します。更新系 Server Action は処理成功後に `updateTag(preferencesTag(userId))` などを呼びます。

## ディレクトリ構成

```text
.
├── docs/                  # 開発・設計・環境構築ドキュメント
├── memo/                  # 設計メモ（学齢簿と転入転出の扱いなど）
├── public/                # 静的アセット、PWA アイコン、PoC 用の名簿 xlsx
├── scripts/               # 運用・生成スクリプト
├── tests/                 # E2E / 統合テスト用（現状は空のプレースホルダ）
├── src/
│   ├── app/               # App Router のルート、page/layout、Route Handler
│   ├── components/        # 機能横断の共通 UI
│   ├── contexts/          # クライアント側の共有 state
│   ├── features/          # 機能単位の UI、actions、schema、types、format
│   ├── hooks/             # 共通 React hooks
│   ├── lib/               # env、logging、共通 utils
│   ├── server/            # db、repositories、services、adapters、cache、auth などサーバ専用コード
│   ├── theme/             # MUI Theme
│   └── types/             # 横断的な型定義
├── drizzle.turso.config.ts # Drizzle 設定 (Turso)
├── middleware.ts          # 認証要否の middleware
├── next.config.ts         # Next.js 設定
└── package.json
```

## ナビゲーション

左メニュー / ボトムナビに項目を追加するときは `src/app/ClientLayout.tsx` の `navigationItems` 配列にエントリを足してください。ログイン必須なら `requiresAuth: true` を付けます。登録場所はこの配列に集約されています。

現在のエントリは、ホーム (`/home`, 公開)、生徒一覧 (`/students`, 認証必須)、設定 (`/settings`, 認証必須) です。

## GyoseiHyojunMincho Web フォント（外部配信を利用）

氏名表示に使う GyoseiHyojunMincho Web フォント（行政事務標準文字＝MJ+GJ、約 6.4 万字）は、外部に配信されているもの（`https://gyoseihyojun.shumi.dev`）を参照します。フォントの合成・配信ツールはこのリポジトリには含みません。

- 配信元 URL は `src/theme/fonts.ts` の `GYOSEI_FONT_CSS_URL` / `GYOSEI_FONT_ORIGINS` で定義（環境変数 `GYOSEI_FONT_CSS_URL` で上書き可）。`src/app/layout.tsx` が preconnect と CSS の `<link>` を出力する。
- preconnect は 3 オリジンです。CSS (`gyoseihyojun.shumi.dev`) が woff2 を別オリジンの絶対 URL で参照する（MJ は `ipamjexmincho.shumi.dev`、GJ は `gj2608pua.shumi.dev`）ため、CSS 自身のオリジンだけでは足りません。`GYOSEI_FONT_ORIGINS` を map して出します。
- 適用は正式氏名（MJ 特有文字・GJ 文字を含みうる）の表示に限定する（`FONT_MJ`）。アプリ全体のフォントには当てない。
- ライセンスは MJ 部分が IPA フォントライセンス v1.0、GJ 部分が SIL Open Font License 1.1 です。
- GJ 文字は Unicode 第16面私用領域の GJ 暫定私用コード (`U+100000` 〜) による暫定符号です。正式な UCS 符号位置ではなく、合意組織間以外への伝送は避けるべきものなので、画面表示の実験に留めます。xlsx（デスクトップの IPAmj明朝に GJ 字形はありません）や OneRoster 出力には載せません。

## 変更してはいけないファイルや注意点

- `.env.local` には実シークレットが入る可能性があります。値を表示・コミット・不要に編集しないでください。
- `src/server/auth/config.ts` の `NextAuth(() => config)` 形式を eager な設定に戻さないでください。env / DB の評価をリクエスト時まで遅延させ、シークレット未設定時の build を通すためです。
- `src/server/db/turso/client.ts` の lazy な `getTursoDb()` をトップレベルの `db` 定数 import 方式へ戻さないでください。
- DB は Turso 1 系統です。認証、ログイン履歴、ユーザ設定などは同一 DB に同居しています。
- `drizzle.turso.config.ts` は Node 22 の `process.loadEnvFile('.env.local')` で `.env.local` を明示的に読んでいます。理由なく dotenv へ置き換えないでください。
- drizzle-kit は常に `--config` 指定で呼び出す npm scripts (`db:*:turso`) を使ってください。
- 既存の Drizzle migration は履歴です。過去 migration を手編集せず、新しい schema 変更は `npm run db:generate:turso` で追加 migration を生成してください。
- ユーザ削除は `src/server/services/user-deletion.ts` の `deleteUserAndAllData()` を経由してください。
- `src/features/auth/actions.ts` の sign out フローは、`signOut({ redirect: false })`、`revalidatePath('/', 'layout')`、`redirect('/home')` の順序を維持してください。
- Server Component で MUI Button に `component={Link}` を直接渡すと RSC の関数 prop エラーになり得ます。`<Link>` で `<Button component="span">` を包む既存方針に従ってください。
- 現在の依頼範囲を尊重し、将来機能を先回りしてスキャフォールドしないでください。
- Claude Code 固有のコマンド、サブエージェント指定、ツール呼び出し前提はこのファイルへ移植しないでください。汎用的な AI コーディングエージェント向けの作業原則として記述してください。

## 既知の名残・要整理

旧 `life-todo` 由来の不整合は順次解消されています。新規に旧機能名へ依存しないでください。

- `tsconfig.json` の存在しない `drizzle.neon.config.ts` 参照は削除済み。
- `src/app/about/page.tsx` の説明文は SIS-PoC の内容へ更新済み。
- `@vercel/blob` は旧 data-transfer 用ではなく、現在はバグ報告スクリーンショット保存用途で利用しています。
- Turso を `edx-poc` へ切り替える際に、旧 `todos` / `packing_*` などのテーブル定義はクリーンなベースラインへ整理済みです。
- `exceljs` は旧 data-transfer 用としていったん除去しましたが、名簿 xlsx の読み書きと在学証明書の発行で再導入済みです。
- `todo` / `routines` / `packing` / `data-transfer` といった語が古いドキュメントやコメントに残っていた場合は、現行仕様ではなく旧記述として扱ってください。

## スコープの健全性

計画していた PoC の機能は一通り実装済みです。新しい業務機能を追加するときは `src/features/students/` や `src/features/login-history/` を参照実装として、`actions.ts`、schema、services、`format.ts` の `toView()`、components を同じ構造で起こしてください。

将来の機能を先回りしてスキャフォールドせず、今やる 1 機能に集中してください。依存追加は事前に確認してください。テスト導入時に `vitest` 一式 + `@playwright/test`、フォーム本格化時に `react-hook-form` + `@hookform/resolvers` を初回利用時にまとめて install する前提は docs 上の未決事項です。

## 作業完了前の確認事項

作業内容に応じて、完了前に次を確認してください。

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 専用テストを追加した場合は、そのテストコマンド
- DB schema を変えた場合は migration が生成され、内容が意図通りであること
- UI を変えた場合は主要 viewport で崩れや操作不能がないこと
- 認証・認可・ユーザ別データに関わる変更では、未ログイン時、別ユーザ、email null のケースを考慮していること
- Server Action / Route Handler の外部入力が Zod などで検証されていること
- DB アクセスが repository 層に閉じていること
- 一覧取得 service が `unstable_cache` + タグで包まれ、対応する更新系 Server Action で `updateTag` が呼ばれていること
- 表示用データが ViewModel に整形され、DB 行をそのまま UI に漏らしていないこと
- `.env.local` や生成物、不要なビルド成果物をコミット対象に含めていないこと
- 既存の設計ドキュメントと矛盾する変更をした場合は、関連 docs も更新していること

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
