# コーディング規約ドラフト

このドキュメントは、このプロジェクトで採用する設計方針に沿った実装ルールのドラフトです。思想面（なぜこの方針なのか）は [設計方針](architecture-guidelines.md) 側にまとめ、ここでは手が従うべき実装ルールに絞ります。ディレクトリ配置の詳細は [推奨ディレクトリ構成](directory-structure.md) を参照してください。

## 基本原則

- 実装は責務が分かる形で分離する
- UI 層に業務ルールを持ち込まない
- データの正本は RDB（Turso (SQLite, 東京 NRT) の単一 DB に全テーブルを集約）、デザインの正本は MUI Theme（定義は [設計方針](architecture-guidelines.md#用語と正本) を参照）
- 一時的な都合で入れた例外ルールを常態化させない

## ライブラリ想定

採用済み:

- **Drizzle ORM**: DB アクセスはすべて Drizzle 経由で `server/repositories` に閉じる
- **Auth.js（JWT セッション）**: 認証のみに使用する
- **Zod**: 入出力境界のバリデーションと `lib/env` の環境変数検証に使用する
- **React Hook Form**: クライアント側のフォーム状態管理とバリデーションに使用する（新規フォームから順次採用。既存フォームには `useState` + `useTransition` で書かれたものが残っており、機能追加・修正のタイミングで置き換える前提）。詳細は [フォーム](#フォーム) を参照
- **exceljs**: xlsx 読み書き用。依存は残るが現状未使用（データ入出力機能の実装時に使用予定）
- **Vitest**: ユニットテスト用。ソースとコロケーションした `*.test.ts` を対象。詳細は [テスト](#テスト) を参照
- **Playwright**: E2E / 統合テスト用。トップレベル `tests/` に配置。詳細は [テスト](#テスト) を参照
- **Prettier + `prettier-plugin-tailwindcss`**: コードフォーマッタ。ESLint とのルール衝突は `eslint-config-prettier` で抑止する。詳細は [フォーマット](#フォーマット) を参照
- **date-fns + `@date-fns/utc`**: カレンダー日付の演算ユーティリティ。詳細は [日付の取り扱い](#日付の取り扱い) を参照
- **React Context（標準）/ Zustand（escalate 時）**: クライアント状態管理は Context を標準とし、Context では扱いきれなくなった時点で Zustand に切り替える。詳細は [状態管理](#状態管理) を参照

未決（採用時に本ドキュメントへ反映）:

- Tailwind 導入可否（補助スタイリングが必要になった時点で判断）

## TypeScript

- any は原則使わない
- `strict` および `noUncheckedIndexedAccess` を有効化済み（[tsconfig.json](../tsconfig.json)）
- 型は API、DB、UI の責務ごとに分ける
- 共通化よりも責務の明確さを優先する
- 入出力境界では型だけでなくバリデーションも行う（Zod を使用）
- nullable と optional を混同しない

## React と Next.js

- Server Component を基本とし、Client Component は必要最小限にする
- page.tsx は画面構成とデータ取得に集中させる
- Client Component にサーバー責務を持たせない
- 更新系処理は Server Action、外部連携は Route Handler（使い分け基準は [設計方針](architecture-guidelines.md#server-action-と-route-handler-の使い分け) を参照）
- Server Action の実処理は `server/services` に委譲し、`features/*/actions.ts` は薄い受け口に保つ
- データ取得方法は画面ごとにばらつかせず、同系統の実装パターンを揃える

### ローディング UI

- ユーザ向けルート（`app/<route>/page.tsx`）には原則 `loading.tsx` を隣に置く。Server Component でのデータ取得中に画面が空白のままになるのを避け、遷移直後に「処理中である」ことを伝えるのが目的
  - 例外として、ヘッダのみで取得処理を伴わない静的ページ（例: `about` 等）は省略してよい
- 構造は対応する page.tsx の **外枠を同じに保つ**（`Card` / `CardContent` / [PageHeader](../src/components/layout/PageHeader.tsx) など）。本物のコンテンツに切り替わった瞬間にレイアウトがジャンプしないようにするため
- スケルトン本体は共通コンポーネント [PageContentSkeleton](../src/components/layout/PageContentSkeleton.tsx) を使う。スケルトンの見た目を個別ページで作り込まない。`rows` 等の prop で粒度だけ揃える
- 参考実装: [src/app/home/loading.tsx](../src/app/home/loading.tsx)

## MUI とスタイリング

- UI 実装は MUI 主体で行う
- 色、余白、角丸、タイポグラフィは MUI Theme に集約する
- Tailwind は現時点では未導入。導入する場合も補助用途に限定し、色や文字サイズなどデザイン基準を上書きしない
- 共通化すべき見た目は sx のコピペではなく Theme または共通コンポーネントへ寄せる

## コンポーネント設計

- 共通 UI と機能固有 UI を分ける
- コンポーネントは見た目と振る舞いの責務を意識して分割する
- props は必要最小限に保つ
- フラグ引数が増えたら責務分割を検討する
- 業務知識を持つコンポーネントは features 配下に置く

## 日付の取り扱い

- カレンダー日付（時刻情報を持たない日付）は **ISO 8601 の `'YYYY-MM-DD'` 文字列を正本** として保持する。`Date` を経由するとサーバ TZ 依存のバグが入りやすい
- 日付演算は [src/lib/date.ts](../src/lib/date.ts) の共通 helper を使う。各 feature で `addDaysToIso` 等を再実装しない
- TZ 非依存な演算が必要な場合は `@date-fns/utc` の `UTCDate` を用いる。`new Date(...)` の Local TZ semantics を `lib/date.ts` の外に染み出させない
- 表示整形は `Intl.DateTimeFormat`（`timeZone: 'Asia/Tokyo'`）を継続して使う。date-fns の `format` で置き換える必然性は無く、Intl と date-fns で表記が散らからないよう、**演算 = date-fns、表示 = Intl** に責務を分ける
- 「Tokyo の今日」は `lib/date.ts` の `todayIsoInTokyo()` を使う（サーバ環境の TZ が `UTC` 等になっていても正しく動く）
- 祝日 / 営業日判定は [src/lib/holidays.ts](../src/lib/holidays.ts) (`@holiday-jp/holiday_jp` ラッパ) を使う

## フォーム

- フォーム状態とバリデーションは React Hook Form (`useForm`) を使い、`useState` で個別フィールドを束ねる実装は新規には書かない
- 入力スキーマは Zod で `features/<domain>/schema/` に定義し、クライアント側は `@hookform/resolvers/zod` で同じスキーマを `useForm({ resolver: zodResolver(schema) })` に渡す
- 同じ Zod スキーマを Server Action 入力の `safeParse` でも再利用し、クライアントとサーバーで二重定義しない（境界バリデーションは [セキュリティ](#セキュリティ) の通りサーバー側でも必ず行う）
- MUI 入力コンポーネントは `Controller` 経由で接続するか、`register` で値・ref を渡しつつ `error` / `helperText` に `formState.errors` を流す
- 送信中状態 (`formState.isSubmitting`) を Submit ボタンの `disabled` / `loading` に必ず反映する
- `useTransition` と組み合わせて Server Action を呼ぶ場合、`isSubmitting` だけでなく transition の pending 状態も考慮する

## 状態管理

- サーバー由来データは原則 Server Component で取得し、Client 側の state ストアに二重に持たせない（一覧の楽観的更新等は `useState` + Server Action revalidate で完結させる）
- ローカル UI 状態（dialog の開閉、フォーム編集中の値、フィルタ選択など）は `useState` / `useReducer` を第一選択にする
- 複数コンポーネント横断で共有したい設定値・派生状態は **React Context** を使う（参考: [src/contexts/settings-context.tsx](../src/contexts/settings-context.tsx)）
- Context が以下のいずれかを満たし始めたら **Zustand** へ escalate する: (a) 更新頻度が高くサブツリー全体の再レンダーがコストになる、(b) 関連する複数の Context が増えてプロバイダ階層が深くなる、(c) reducer + action 配線の boilerplate が肥大化する
- escalate のタイミングで `npm i zustand` し、`src/stores/` を作って store 単位でファイルを切る（このディレクトリは Zustand 採用時に新設）
- グローバルに何でも詰め込まず、機能境界をまたぐ最小限の状態だけを置く

## データアクセス

- DB へのアクセスは Drizzle を通して repository 層に集約する
- 複数リポジトリをまたぐ業務処理は service 層に置く
- UI 層から DB クエリや SaaS SDK を直接呼ばない
- Blob にはファイル本体のみを保存し、メタデータは DB で管理する

### キャッシュとタグ無効化

- 一覧取得は service で `unstable_cache(fn, key, { tags, revalidate })` で包む
- タグは `server/cache/tags.ts` のヘルパ（`preferencesTag(userId)` 等）経由で生成する。文字列リテラルを直接書かない（ユーザ ID をキーに含めて他ユーザのキャッシュを巻き込まないため）
- 更新系 Server Action は処理成功後に `updateTag(<tag>(userId))` を呼んで対応するキャッシュを失効させる。`revalidatePath` は最終手段（認証関連レイアウト等、タグでは表現しづらい範囲に限定）

## 認証と認可

- 認証と認可を混同しない
- 表示制御だけで権限制御を済ませない
- 更新系処理では常にサーバー側（Server Action または service 層）で権限確認を行う
- 監査が必要な操作はログまたは監査テーブルに残す

## セキュリティ

- 入力は境界（Route Handler / Server Action / 外部 API 呼び出し）で必ず検証する
- SQL は Drizzle の型付きクエリで構築し、生 SQL に文字列連結でユーザー入力を混ぜない
- Server Action は Auth.js セッションから取得した識別情報だけを信頼し、クライアントから来た識別 ID は認可判定の根拠にしない
- 外部 URL への fetch は許可リストで制御し、SSRF を避ける
- ユーザー入力を dangerouslySetInnerHTML 等に渡さない（必要な場合はサニタイズを経由する）
- 秘密情報は環境変数に寄せ、クライアントバンドルに含めない（`NEXT_PUBLIC_` の誤用に注意）

## アクセシビリティ

- MUI の既定の a11y 属性を無効化しない
- 画像には意味のある alt を付ける（装飾画像は空 alt）
- フォーム入力には常にラベルを付け、エラーは aria 経由でも伝える
- キーボードのみで主要フローを操作できる状態を維持する

## パフォーマンス

- 画像は `next/image` を使い、サイズを指定する
- Client Component は必要な範囲に切り出し、RSC ペイロードを不必要に増やさない
- 一覧表示ではサーバー側でページング／ソート／フィルタを済ませる
- 重い同期処理を Server Action 内で実行しない（必要なら非同期ジョブに逃がす）

## エラーハンドリング

- 想定内エラーと障害を分けて扱う
- ユーザー向けメッセージと内部ログを分離する
- 外部 API エラーは境界で握りつぶさず、追跡できる形で記録する
- 再試行可能な処理と不可能な処理を区別する

## ログと監視

- 重要な更新処理は誰が何をしたか追えるようにする
- 外部 API 呼び出しは失敗時に調査できる情報を残す
- ETL やバッチは開始、成功、失敗、再試行回数を記録する
- 個人情報や秘密情報をログに出さない

## テスト

- 業務ロジックとデータ変換を優先してテストする
- 画面テストは主要フローに絞る
- 外部サービス依存部分はアダプタ層を介してテストしやすくする
- 不具合修正時は再発防止の観点でテスト追加を検討する
- ユニットテストは **Vitest** を使い、ソースとコロケーション（対象ファイル隣に `*.test.ts`）で配置する
- E2E / 統合テストは **Playwright** を使い、トップレベル `tests/` に置く（DB を伴うものはテスト用の Turso DB、またはローカルの libsql/SQLite ファイルに対して実行する）
- DB 層のテストは Drizzle のクエリビルダをモックせず、テスト用 DB（テスト用 Turso DB / ローカル libsql）に対する実行を基本とする

## 命名

- 機能名、責務名、データ名が一致する命名を優先する
- 略語は一般的なものに限定する
- UI 用の型と DB 用の型に同じ名前を安易に使い回さない
- use で始まる名前は React Hook に限定する
- ファイル命名: React コンポーネントは `PascalCase.tsx`、それ以外（hooks、utils、services、repositories、types 等）は `kebab-case.ts`

## フォーマット

- コード整形は Prettier に一任し、エディタの save-on-format で揃える
- 設定はプロジェクト直下の `.prettierrc`（または `prettier.config.mjs`）に集約し、個別ファイルでの上書きは避ける
- ESLint と Prettier のルールは責務分離: 構文・バグ寄りは ESLint、見た目は Prettier。重複ルールは `eslint-config-prettier` を ESLint 設定の最後で extend して無効化する
- `prettier-plugin-tailwindcss` は Tailwind 導入後に自動でクラス順序を整える前提（Tailwind 未導入の現在は no-op）。手で並び替えない
- フォーマットはコミット前に走らせる（`npm run format` を整備し、CI でも `npm run format:check` を回す）

## i18n

- 本プロジェクトは現時点で多言語対応の予定なし。必要が生じた時点で方針を決める。

## レビュー観点

- 責務の境界が守られているか
- UI 層に業務ロジックが漏れていないか
- RDB（Turso 単一 DB）を正本とする前提が崩れていないか
- Theme を無視した見た目の実装が増えていないか
- Server Action / Route Handler の使い分けが基準通りか
- 一覧取得が `unstable_cache` + タグで包まれ、更新系 Action で `updateTag` が呼ばれているか
- 例外処理とログが運用に耐えるか

## 例外対応

- 例外的な実装を入れる場合は理由を明示する
- 暫定対応は恒久対応の条件を残す
- 規約より優先すべき事情がある場合でも、責務の所在だけは曖昧にしない

## 要約

このプロジェクトでは、MUI Theme と RDB（Turso 単一 DB）をそれぞれデザインとデータの正本とし、Next.js はその間をつなぐ責務境界として使う。更新は Server Action、外部連携は Route Handler で受け、実処理は service 層に委譲する。DB アクセスは Drizzle で repository に集約し、一覧取得は `unstable_cache` + タグで包んで Server Action から `updateTag` で失効させる。UI、業務ロジック、データアクセス、外部接続を分離して例外を増やさない方向で保守性を確保する。
