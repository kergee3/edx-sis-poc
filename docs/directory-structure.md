# 推奨ディレクトリ構成

このドキュメントは、MUI 主体、Next.js App Router 採用、RDB（Turso 単一 DB）を正本とする前提での推奨ディレクトリ構成を整理したものです。関連ドキュメント: [設計方針](architecture-guidelines.md) / [コーディング規約](coding-guidelines.md)。

## 目的

- 画面責務と業務責務を分離する
- UI とサーバー処理の境界を明確にする
- 再利用コンポーネントと業務単位の実装を分ける
- 外部サービス接続をアプリケーション本体から切り離す

## 推奨構成

```text
.
├── public/
├── scripts/
├── tests/
└── src/
    ├── app/
    │   ├── (routes)/
    │   ├── api/
    │   ├── layout.tsx
    │   └── page.tsx
    ├── features/
    │   ├── login-history/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── schema/
    │   │   ├── types/
    │   │   └── actions.ts
    │   ├── data-transfer/        # 複数機能を横断する xlsx エクスポート / インポート
    │   │   ├── components/
    │   │   ├── schema/
    │   │   ├── services/
    │   │   └── actions.ts
    │   └── auth/
    │       ├── components/
    │       └── actions.ts
    ├── components/
    │   ├── mui/
    │   ├── layout/
    │   ├── feedback/
    │   └── form/
    ├── theme/
    │   ├── index.ts
    │   ├── palette.ts
    │   ├── typography.ts
    │   └── components/
    ├── server/
    │   ├── db/
    │   │   └── turso/
    │   │       ├── schema/      # Turso (SQLite, 東京 NRT): 認証・履歴・ユーザ設定・業務テーブル
    │   │       ├── migrations/  # Turso マイグレーション
    │   │       └── client.ts    # getTursoDb()
    │   ├── repositories/
    │   ├── services/
    │   ├── cache/               # unstable_cache 用タグ生成（todosTag 等）
    │   ├── auth/
    │   └── adapters/
    ├── lib/
    │   ├── env/
    │   ├── logging/
    │   ├── blob/
    │   └── utils/
    └── types/
```

## 各ディレクトリの役割

### app

- App Router のルーティングを置く
- page.tsx、layout.tsx、loading.tsx、error.tsx など画面エントリを管理する
- 各ルート（`app/<route>/page.tsx`）には原則 `loading.tsx` を隣に置く（[コーディング規約 #ローディング UI](coding-guidelines.md#ローディング-ui) 参照）
- 外部連携（Webhook、外部公開 API など）の Route Handler を `app/api/**/route.ts` に置く
- Server Action は原則 features 配下に置き、app 直下には置かない
- ここには重い業務ロジックを置かない

### features

- 機能単位で UI、ユースケース、入力スキーマ、型定義をまとめる
- 画面に近い処理はここに寄せる
- Server Action は `features/*/actions.ts` に定義し、実処理は `server/services` を呼び出す
- DB 直接操作やインフラ依存は server 側へ逃がす
- 単一ドメインに収まらない横断機能（例: `data-transfer` の xlsx エクスポート / インポート）も `features/<横断機能名>/` を切って独立させる。複数ドメインに跨る読み書きが必要なときは、横断機能側からドメイン services / repositories を呼び出す（個別ドメインの features 配下に紛れ込ませない）

### components

- 全機能で再利用する共通 UI を置く
- `components/mui/` には MUI ベースの薄いラッパーコンポーネントを集約する（shadcn/ui ではない点に注意して `ui/` は使わない）
- 業務知識を持たないことを原則とする

### theme

- MUI Theme の定義を集約する
- 色、余白、角丸、タイポグラフィ、コンポーネントごとのデフォルト設定を管理する
- 見た目（色・余白・タイポグラフィ・コンポーネントのデフォルト）はここを正本とし、個別コンポーネントの `sx` へ散らさない

### server

- サーバー専用コードを置く
- DB 接続、Drizzle スキーマ、マイグレーション、リポジトリ、アプリケーションサービス、認証、外部サービスアダプタを管理する
- DB は Turso (SQLite, 東京 NRT) 1 系統: 認証・履歴・ユーザ設定・業務テーブルをすべて単一 DB に集約
- Turso は `server/db/turso/schema/`（`auth.ts` / `login-history.ts` / `user-preferences.ts` / `todo.ts` / `routines.ts` / `packing.ts`）+ `server/db/turso/migrations/` + `server/db/turso/client.ts` (`getTursoDb()`)
- リポジトリは `getTursoDb()` を import して使う。全テーブルが同一 DB に同居するため、ユーザ削除など複数テーブルに跨る整理は単一トランザクションで `server/services/user-deletion.ts` を経由
- `server/auth/` はセッション検証、認可ロジック、権限判定を担う（UI 側の認証画面は `features/auth/` と分離する）
- `server/cache/` は `unstable_cache` 用のタグ名生成ヘルパを置く。生成済みタグは services の `unstable_cache({ tags })` と Server Action の `updateTag(...)` の両側から参照する
- UI から直接参照するのではなく、サーバー境界経由で使う

### lib

- 機能横断の補助コードを置く
- 環境変数、ロガー、Blob クライアント、共通ユーティリティを管理する
- ドメイン知識を持ち込みすぎない

### types

- 全体共有の型を置く
- API、DB、UI の責務が異なる型は無理に共通化しない
- features 内でしか使わない型は `features/*/types/` に置き、top-level `types/` には API レスポンス型や横断的なエンティティ表現のみを置く

### tests（トップレベル）

- E2E テストと統合テスト、テストユーティリティをまとめる
- ユニットテストはソースとコロケーション（`*.test.ts` を対象ファイル隣に置く）を原則とする
- UI テストより先に業務ロジックとデータ変換のテストを優先する

### public

- 静的アセット（画像、favicon、OG 画像など）を置く
- 動的に生成されるファイルは Blob 側に置き、public には含めない

### scripts

- 運用スクリプト、ETL エントリ、マイグレーション補助などのスクリプトを置く
- Python ETL のエントリも他のリポジトリに分ける前はここに集める

## 配置ルール

- ページ固有の UI は features 配下に置く
- 全体共通 UI は components 配下に置く
- DB アクセスは server/repositories に集約し、Drizzle のクエリも同層に閉じる
- 業務ルールは server/services に集約する（feature 固有の一時的な整形処理は features/*/services/ で受けても良い）
- 外部 API や SaaS の接続は server/adapters または lib 配下に閉じ込める
- 更新系処理は Server Action、外部連携は Route Handler（詳細は [設計方針](architecture-guidelines.md) を参照）
- Theme の変更で全体の見た目が揃う構造を維持する

## 避けるべき配置

- page.tsx に業務ロジックや DB クエリを直書きする
- components 配下に機能固有のコンポーネントを混在させる
- MUI Theme で管理すべき見た目を個別コンポーネントの `sx` prop に散らす
- Blob へのアクセスを UI 層から直接呼ぶ
- 外部サービス SDK の呼び出しを複数箇所へ散らす
- Server Action に実業務ロジックを直書きする（service 層に委譲する）

## 運用メモ

- 新しい機能を追加する場合は、まず features に閉じた形で始める
- 複数機能で再利用が確定した時点で components や lib へ昇格する
- 設計上の正本は RDB（Turso 単一 DB）と MUI Theme の 2 つと考える
