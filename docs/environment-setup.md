# 環境構築手順

ローカル開発に必要な外部サービス（Turso / Google OAuth / LINE Login）のセットアップと `.env.local` の作成手順をまとめたドキュメント。初回セットアップ時、または別マシンで環境を再構築する際のリファレンスとして使う。

DB は **Turso (SQLite, 東京 NRT)** 1 系統。認証・ログイン履歴・ユーザ設定をすべて同一 DB に集約している（業務テーブルは今後の機能実装時に追加）。接続情報（`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`）を `.env.local` に揃える必要がある。

関連ドキュメント: [dev-guideline.md](dev-guideline.md) / [architecture-guidelines.md](architecture-guidelines.md)

## 前提

- Node.js 22 LTS がインストール済み
- このリポジトリを clone 済み
- リポジトリルートで `npm install` 済み（`.npmrc` により `--legacy-peer-deps` が自動適用）

必要な環境変数は [.env.example](../.env.example) を参照。以下の手順で `.env.local` を作成してすべて埋める。

---

## 1. Turso データベース作成（DB）

認証・ログイン履歴・ユーザ設定・業務テーブルをすべて格納する単一の DB を作成する。

1. [turso.tech](https://turso.tech/) にサインアップ（GitHub アカウント可）し、Turso CLI を入れるかブラウザ Dashboard を使う
2. **Create Database** から新規 DB を作成
   - **Database name**: `edx-poc`（任意）
   - **Region group**: `nrt` (Tokyo) を選ぶ
3. 作成した DB のページから **Database URL**（`libsql://...`）と **Auth Token** を取得
   - CLI なら `turso db show edx-poc --url` / `turso db tokens create edx-poc`
4. `.env.local` に `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` として貼る

---

## 2. Google OAuth クライアント作成（認証）

### 2.1 Google Cloud プロジェクト作成

1. [console.cloud.google.com](https://console.cloud.google.com/) にアクセス
2. 画面上部のプロジェクトセレクタから **New Project**
   - **Project name**: `sss-poc`（任意）
   - **Location**: No organization で可
3. 作成後、プロジェクトセレクタが `sss-poc` に切り替わっていることを確認

### 2.2 OAuth 同意画面の設定

1. 左メニュー ☰ → **APIs & Services** → **OAuth consent screen**
2. **Get started** をクリック
3. **App information**
   - **App name**: `SSS-PoC`
   - **User support email**: 自分の Gmail アドレス
4. **Audience**: **External** を選択（個人 Gmail では Internal は使用不可）
5. **Contact Information**: 自分の Gmail アドレス
6. ポリシーに同意して **Create**

### 2.3 OAuth クライアント ID 作成

1. 左メニュー → **APIs & Services** → **Credentials**
2. 上部 **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: **Web application**
4. **Name**: `sss-poc-local`（任意）
5. **Authorized JavaScript origins** に追加:
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs** に追加（パスは厳密に一致させる）:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. **Create**
8. 表示される **Client ID** と **Client secret** をコピー（**Credentials** 画面で後から再取得可能）

### 2.4 テストユーザー登録

External + 未公開状態では、テストユーザーとして登録したアカウントしかサインインできない。

1. **APIs & Services** → **OAuth consent screen** → **Audience** タブ
2. **Test users** セクション → **+ Add users**
3. 自分の Gmail アドレスを追加 → **Save**

### 本番デプロイ時

公開ドメイン（本番: https://sss-poc.shumy.app）を同じ手順で追加する（ローカル用の値は消さず併記する）:

- **Authorized JavaScript origins**: `https://sss-poc.shumy.app`
- **Authorized redirect URIs**: `https://sss-poc.shumy.app/api/auth/callback/google`

Testing モードのまま運用可能（テストユーザー枠 100 人まで）。

---

## 2b. LINE Login チャネル作成（認証）

### 2b.1 Provider 作成

1. [LINE Developers Console](https://developers.line.biz/console/) に LINE アカウントでログイン
2. **Create a new provider** から Provider を作成
   - **Provider name**: `SSS-PoC`（任意）

### 2b.2 LINE Login チャネル作成

1. 作成した Provider を開き、**Create a new channel** → **LINE Login** を選択
2. 設定値:
   - **Channel name**: `SSS-PoC`
   - **Channel description**: 任意
   - **App types**: **Web app** にチェック
   - **Region where you provide your service**: Japan
3. 同意事項にチェックして **Create**

### 2b.3 Channel ID / Secret の取得

1. **Basic settings** タブを開く
2. **Channel ID** と **Channel secret** をコピー（**Channel secret** は **Issue** ボタンで初回発行）

### 2b.4 Callback URL の登録

1. **LINE Login** タブを開く
2. **Callback URL** に追加（パスは厳密に一致させる）:
   ```
   http://localhost:3000/api/auth/callback/line
   ```
3. **Update**

### 2b.5 email を取得したい場合（任意）

LINE はデフォルトでは email を返さない。取得したい場合は **OpenID Connect** → **Email address permission** から申請する（本人確認書類のアップロードが必要）。未申請でも本アプリは動作するが、`user.email` が NULL になる。

### 本番デプロイ時

公開ドメインのコールバック URL（本番: `https://sss-poc.shumy.app/api/auth/callback/line`）を **Callback URL** に追加する（ローカル用の値は消さず併記する）。

---

## 3. `AUTH_SECRET` の生成

ターミナルで以下のコマンドを実行し、出力された 44 文字の文字列（末尾に `=` が付く）を控える:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`npx auth secret` は別パッケージに解決されるため使わない。

---

## 4. `.env.local` の作成

[.env.example](../.env.example) をコピーして `.env.local` を作成し、取得した値を貼り付ける:

```
# Database — Turso (認証・履歴・ユーザ設定・業務テーブルをすべて格納)
TURSO_DATABASE_URL=libsql://<db-name>-<org>.turso.io
TURSO_AUTH_TOKEN=<手順 1 で取得した Auth Token>

# Auth.js
AUTH_SECRET=<手順 3 で生成した値>
AUTH_GOOGLE_ID=<手順 2.3 で取得した Client ID>
AUTH_GOOGLE_SECRET=<手順 2.3 で取得した Client secret>
AUTH_LINE_ID=<手順 2b.3 で取得した Channel ID>
AUTH_LINE_SECRET=<手順 2b.3 で取得した Channel secret>
NEXTAUTH_URL=http://localhost:3000

# Vercel Blob — optional
BLOB_READ_WRITE_TOKEN=
```

`.env.local` は [.gitignore](../.gitignore) で除外済み。

### Blob は任意

現時点では使用していないため、空のままで問題ない。空文字は Zod 側で `undefined` 扱いになる（[src/lib/env/index.ts](../src/lib/env/index.ts)）。

---

## 5. マイグレーション適用

初回のみ、Drizzle のスキーマを Turso に適用する:

```bash
npm run db:generate:turso  # src/server/db/turso/migrations/ に SQL を生成
npm run db:migrate:turso   # Turso に適用
```

### 確認

`npm run db:studio:turso`（Drizzle Studio）か `turso db shell` で以下のテーブルが作成されていれば成功:

- `user`
- `account`
- `session`
- `verificationToken`
- `login_history`
- `user_preferences`

---

## 6. 動作確認

```bash
npm run dev
```

1. [http://localhost:3000/](http://localhost:3000/) → `/home` にリダイレクトされる
2. 右下のユーザーメニューから **サインイン**（Google または LINE）を選ぶ
3. テストユーザーとして登録したアカウントでサインイン
4. `/account` に戻り、アバター・メール・「ログイン履歴へ」リンクが表示される
5. Drizzle Studio (`npm run db:studio:turso`) の `login_history` テーブルに 1 行追加されている

---

## 7. 本番デプロイ（Vercel）

`src` アプリは Vercel の専用プロジェクトとして **https://sss-poc.shumy.app** に配信している（`webfont/site` の ipamjexmincho.shumy.app とは別プロジェクト）。

- **環境変数**: Vercel の Settings → Environment Variables に、Production 用として手順 1〜3 の値（`TURSO_*` / `AUTH_SECRET` / `AUTH_GOOGLE_*` / `AUTH_LINE_*`）を登録する。加えて **`AUTH_URL=https://sss-poc.shumy.app`** を設定する（カスタムドメインでコールバック URL を正しく組み立てるため）。`NEXTAUTH_URL` はローカル専用なので本番には登録しない。`SKIP_ENV_VALIDATION` も本番では設定しない
- **Turso**: 本番もローカルと同じ Turso DB を共用（マイグレーション適用済み）。開発と分けたい場合のみ別 DB を作って本番 env に別 URL/Token を入れる
- **ドメイン**: Settings → Domains に `sss-poc.shumy.app` を追加。`shumy.app` が同一 Vercel アカウント/チーム管理下なら DNS と TLS は自動発行される
- **OAuth コールバック**: 本番ドメインの URL を Google / LINE に追記する（手順 2「本番デプロイ時」/ 2b「本番デプロイ時」参照）
- 以後 `main` への push で自動的に本番デプロイされる

---

## トラブルシューティング

### `npm run dev` 起動時に env 関連エラー

- `.env.local` に必須項目（`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` / `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_LINE_ID` / `AUTH_LINE_SECRET`）が全て埋まっているか確認
- 任意項目（Blob）を空文字のまま残してもエラーにならないのが正常。もしエラーになる場合は [src/lib/env/index.ts](../src/lib/env/index.ts) の preprocess が壊れていないか確認

### `npm run db:migrate:*` 実行時に `url: ''` エラー

- drizzle-kit は `.env.local` を自動読込しない。[drizzle.turso.config.ts](../drizzle.turso.config.ts) の `process.loadEnvFile('.env.local')` が残っているか確認

### サインイン時に `redirect_uri_mismatch` エラー

- Google: Google Cloud Console の **Authorized redirect URIs** が `http://localhost:3000/api/auth/callback/google` と完全一致しているか確認
- LINE: LINE Developers Console の **Callback URL** が `http://localhost:3000/api/auth/callback/line` と完全一致しているか確認
- 末尾スラッシュや typo、HTTPS/HTTP の違いに注意

### サインイン時に `Error 403: access_denied`

- **Test users** に自分のアカウントが登録されているか確認（手順 2.4）

### ビルドだけ通したい（env が無い状況）

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

CI などで実値が無いケースで使う。本番実行時は設定しないこと。
