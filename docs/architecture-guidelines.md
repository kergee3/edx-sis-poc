# 設計方針

このドキュメントは、本プロジェクト（jtp-mj-font）で採用する技術スタックに対する設計方針を整理したものです。関連ドキュメント: [推奨ディレクトリ構成](directory-structure.md) / [コーディング規約](coding-guidelines.md)。

## 前提

- UI は Material UI 主体で構成する
- アプリケーション基盤は Next.js App Router を採用する
- 永続データの正本はリレーショナル DB とする（認証・履歴・ユーザ設定・業務テーブルをすべて Turso/SQLite (東京 NRT) の単一 DB に集約）
- DB アクセスには Drizzle ORM を使う
- 認証は Auth.js（JWT セッション）を使い、認可はアプリ側で管理する
- Blob はファイル本体の保存先に限定する
- ETL や重いデータ処理は Python で分離して扱う

## 用語と正本

- **正本**: 同じ情報が複数箇所に存在するとき、矛盾時に正しいと見なす唯一の場所
- **データの正本**: RDB（Turso (SQLite, 東京 NRT) の単一 DB に全テーブルを集約）
- **デザインの正本**: MUI Theme
- **service（アプリケーションサービス）**: 業務ルールと複数リポジトリ横断の処理をまとめる層
- **repository**: DB への読み書きを集約する層
- **adapter**: 外部 SaaS / API 呼び出しを包む薄い層
- 「業務ロジック」「業務ルール」「ユースケース」は原則として service 層の責務を指すものとする

## 基本方針

- UI は MUI 主体に統一し、見た目の基準は MUI Theme を唯一の正本とする
- Next.js は画面配信、BFF、軽量な業務処理を担う
- RDB を業務データの唯一の正本とする（全テーブルを単一の Turso DB に集約する）
- Blob はアップロードファイルや生成ファイルの保存先として扱う
- Python ETL はアプリ本体から分離し、非同期ジョブとして運用する

## フロントエンド指針

- 画面は page.tsx でデータ取得と構成に徹し、UI ロジックは配下のコンポーネントへ分離する
- MUI コンポーネントは各所で直接使い散らさず、必要に応じて薄い共通ラッパーを用意する
- 色、余白、角丸、タイポグラフィ、ブレークポイントは Theme に集約する
- Tailwind は現時点では未導入。補助的なスタイリングが必要になった場合も、まずは Theme 拡張・`sx` prop・共通ラッパーで解決し、Tailwind 導入の判断は別途行う
- 将来 Tailwind を導入する場合も、色・余白・フォントサイズなど見た目の基準は Theme に寄せ、Tailwind はレイアウトの微調整等の補助に留める
- フォームは React Hook Form を基盤に、Zod スキーマでバリデーションを定義し、表示、送信中状態、エラー表示の責務を分離する（同じ Zod スキーマを Server Action 入力検証でも再利用する）
- 一覧、詳細、編集などの画面パターンはテンプレート化して再利用する

## アプリケーション境界

- Server Component を基本とし、Client Component は対話が必要な箇所に限定する
- 更新系処理は Server Action を基本とする
- 外部連携（Webhook 受信、外部公開 API、サードパーティからのコールバック）は Route Handler で受ける
- DB アクセスはページやコンポーネントに直書きせず、repository または service 層に集約する
- 業務ルールは UI 層に置かず、service 層にまとめる
- 外部サービスへのアクセスは SDK 呼び出しを分散させず、薄いアダプタ層を挟む

### Server Action と Route Handler の使い分け

| 用途 | 採用 | 補足 |
| --- | --- | --- |
| フォーム送信、自社 DB への更新、ログイン後の内部操作 | Server Action | `features/*/actions.ts` に置く |
| Webhook 受信、外部公開 API、OAuth コールバック、ファイルストリーム | Route Handler | `app/api/**/route.ts` に置く |
| サーバーからサーバーへの内部 RPC 的呼び出し | Route Handler | 認証ヘッダで保護する |

いずれの場合も、実処理本体は `server/services` に置き、Action / Handler は薄い受け口に保つ。例えば、ファイルストリーム返却が必要な処理は Route Handler、ユーザの DB を更新する処理は Server Action に分けて受ける。

### 大きな入力を受ける Server Action

- ファイルアップロード等で 1MB を超える `FormData` を Server Action で受ける場合は、`next.config.ts` の `experimental.serverActions.bodySizeLimit` を引き上げる（現在は `'4mb'`）
- Server Action 内でも改めてサイズチェックを行い、コンフィグだけに頼らない（壁を二重に置くことで、`next.config.ts` を緩めた途端に Action が無防備になるのを防ぐ）

## 推奨レイヤ構成

実装上のレイヤ（責務）は以下の 5 つ。トップレベルディレクトリ構成（theme / types / tests を含む全体像）は [推奨ディレクトリ構成](directory-structure.md) を参照。

1. app
   画面、ルーティング、Server Action のエントリ、Route Handler を置く
2. features
   画面単位または業務単位の UI とユースケース、Server Action 定義を置く
3. components
   全体で再利用する共通 UI を置く
4. lib
   外部サービス接続、ユーティリティ、設定を置く
5. server
   DB、認証、サービス、リポジトリなどサーバー専用処理を置く

## データ責務

- RDB を業務データの唯一の正本とする。全テーブルは単一の Turso DB に集約する（下記「保存先の責務分担」参照）
- DB アクセスは Drizzle ORM を通して `server/repositories` に集約する。DB クライアントは `getTursoDb()` の 1 つに統一されている
- Blob にはファイル本体のみを置き、メタデータは RDB で管理する
- データ更新の起点は RDB に統一する
- Blob のパス、所有者、公開範囲、削除状態は DB 側で管理する
- **整合性**: 全テーブルが同一 DB に同居するため、ユーザ削除のように複数テーブルにまたがる整理は単一トランザクションで原子的に処理できる（例: `server/services/user-deletion.ts`）。auth 系テーブルは FK + onDelete cascade、業務テーブルの `user_id` は `users.id` への論理参照（FK なし）なので、サービス側で対象を明示的に削除する

### キャッシュとタグ無効化

- 一覧取得系の service は `unstable_cache(fn, key, { tags, revalidate })` でラップする。タグ名は `server/cache/tags.ts` の `preferencesTag(userId)` などのヘルパで必ず生成し、文字列リテラルを直接書かない（ユーザ ID を含めることで他ユーザのキャッシュを巻き込まないため）
- 更新系 Server Action は処理成功後に `updateTag(<tag>(userId))` を呼んで対応するキャッシュを失効させる。ページ単位の `revalidatePath` には頼らず、service が握っているタグを起点に無効化する
- 複数ドメインを更新する横断的な処理は、影響範囲のタグを必要に応じて複数立てる

### 保存先の責務分担

- Turso (SQLite, 東京 NRT): 全テーブルを単一 DB に集約する
  - 認証: `user` / `account` / `session` / `verificationToken`
  - ログイン履歴: `login_history`
  - ユーザ設定: `user_preferences`
  - 業務: 各機能のテーブル（今後 edu / gov / roster 等の実装時に追加）
  - ほか Blob メタデータ、監査ログもここに置く
- Blob: 画像、CSV、PDF、生成成果物

### Blob 削除戦略（未決）

現時点では以下いずれかを選択する前提で未決。最初のファイル扱い機能を実装する時点までに確定する。

- 即時削除: DB レコード削除と同時に Blob も削除
- ソフトデリート + バッチ掃除: DB 側に削除フラグを立て、定期バッチで Blob を回収

## 認証と認可

- Auth.js v5 を認証に限定して使い、セッションは JWT 戦略を採用する
- ログインプロバイダは Google と LINE を採用する。他プロバイダ（GitHub、Email Magic Link など）は必要が生じた時点で追加する
- Credentials プロバイダ（自前 ID / パスワード）は採用しない
- ログイン状態の確認と操作権限の確認は別の責務として扱う
- 権限モデルは role または permission として DB に保持する
- middleware は原則ログイン要否の判定までに限定し、具体的な権限チェックはサーバー側（Server Action / Route Handler / service）で行う
- 監査が必要な操作は、誰がいつ何をしたかを記録する

## ETL 指針

- Python は分析、集計、外部データ取り込み、定期バッチに集中させる
- Web リクエスト中に重い Python 処理を同期実行しない
- ETL の入出力契約を定義し、入力元、出力先、失敗時の再実行方法を固定する
- ETL 結果の DB 反映では冪等性を意識する
- ジョブ管理が必要な場合は、開始、成功、失敗、リトライ回数を記録する

### 実行基盤の想定

- 軽量 / 短時間: Vercel Cron から Route Handler を叩く
- 重量 / 長時間: 外部 Worker（別ホスト or GitHub Actions 等）で実行し、結果を API 経由で DB に反映
- いずれの場合も、成果物を置くのは Turso DB か Blob、進捗管理は DB とする

## 実装ルール

- 型は API、DB、UI で責務ごとに分ける
- DB モデルをそのままフロントに渡さず、必要に応じて ViewModel を挟む
- エラーは想定内エラーと障害に分けて扱う
- ログはユーザー操作、外部 API 呼び出し、バッチ処理を追跡できる粒度で残す
- 設定値と秘密情報は環境変数に寄せ、参照箇所を一本化する
- テストは業務ロジックとデータ変換を優先し、UI テストは主要フローに絞る

具体的な実装ルール（TypeScript 設定、命名、テスト方針など）は [コーディング規約](coding-guidelines.md) を参照。

## 未決事項

- Blob 削除戦略の確定
- Tailwind 導入可否（現状は MUI Theme + `sx` で十分。導入時は `prettier-plugin-tailwindcss` のクラス整列が自動的に有効化される）

## 要約

このプロジェクトでは、UI は MUI Theme に統一し、Next.js は BFF として使う。更新は Server Action、外部連携は Route Handler、データアクセスは Drizzle 経由で repository 層に集約する。RDB（Turso 単一 DB）を正本とし、Blob はファイル保存、Python は非同期バッチ処理に限定する。
