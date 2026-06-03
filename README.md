# jtp-mj-font — IPAmjexMincho Web フォントと、それを活かす校務支援システム PoC（SSS-PoC）

本リポジトリは独立した 2 つの部分からなる。

- **`src/` — SSS-PoC（School affairs Support System - Proof of Concept）**
  IPAmjexMincho Web フォントを活かした、**校務支援システム（School affairs Support System, SSS）の実証実験（PoC）**アプリ。Next.js 16 App Router + MUI v7。
- **`webfont/` — IPAmjexMincho Web フォント変換・配信ツール**
  文字情報基盤(MJ)の漢字を Web フォント化して配信するツール。主に Python。**変換から配信まで完成・稼働中**（https://ipamjexmincho.shumy.app）。

> 背景: もともと「MJ 漢字を Web フォントとして使う」実証から出発し、その応用先として、**氏名に MJ特有文字（戸籍漢字等）が現れる校務支援システム**を PoC として作る方針に転換した。氏名の正確な表示こそ IPAmjexMincho Web フォントの価値が最も活きる領域である。

---

## `src/` — SSS-PoC（校務支援システム PoC）

### コンセプト

**小さな離島にある小さな中学校**を舞台にした校務支援システムの PoC。ログインすると、あなたは**その中学校の校長先生**になる。校長は**ワンマン**で全校生徒に対する「先生」と「事務」を兼ね、校務を行う。

- 生徒定員: **25 名**（各学年 5 名・3 学年で初期 **15 名** が在籍）
- IPAmjexMincho Web フォントにより、**氏名に含まれる MJ特有文字（戸籍漢字等）も正しく表示**される。これが本アプリでフォントを活かす中心的なポイント。

### ナビゲーション

| メニュー | ルート | 内容 |
|---|---|---|
| ホーム | `/home` | アプリの位置づけと説明。ログイン後は校長として校務支援システムを操作 |
| 生徒一覧 | `/students` | 生徒名簿の表示・編集、転入（追加）／転出（削除）、在学証明書・成績証明書の発行 |
| データ連携 | `/interop` | 学齢簿からのインポート、OneRoster に沿ったインポート／エクスポート |

### 各画面

- **ホーム（`/home`）**: アプリの位置づけと説明を示す。ログインすると、小さな離島の小さな中学校の校長先生として校務支援システムを操作する設定。校長はワンマンで全生徒に対する先生・事務を担う。定員 25 名、初期状態は各学年 5 名（計 15 名）が在籍。
- **生徒一覧（`/students`）**: 生徒の一覧を表示する。名簿への追加（転入）・名簿からの削除（転出）ができ、一覧表内で生徒情報を編集できる。さらに**在学証明書・成績証明書の発行**ができる。
- **データ連携（`/interop`）**: 学齢簿からのインポート、**OneRoster**（名簿連携の国際規格／日本向けの Japan Profile）に沿ったインポート・エクスポートを行う。

### 認証・ユーザーメニュー（実装済み）

Google / LINE による認証（Auth.js v5）は実装済み。ログイン時は**右上に ID が表示**され、それをクリックすると **ログアウト / About / ログイン履歴** などにアクセスできる。ログイン履歴はサーバ／クライアント両側から記録される（`src/features/login-history`）。

### 実装状況

- **実装済み**: 認証（Google / LINE）、ログイン履歴、右上のユーザーメニュー（ログアウト / About / ログイン履歴）。
- **これから開発**: ホーム画面の内容、生徒一覧（CRUD・転入転出・証明書発行）、データ連携（学齢簿インポート・OneRoster 入出力）。方針転換に伴い、旧スキャフォールド（`edu` / `gov` / `roster`）は `students` / `interop` へ再編する。

### 設計の基礎資料

PoC の業務設計は、学齢簿〜校務支援システム〜学習eポータルの標準仕様を調査した [docs/design/](docs/design/) の設計ドキュメントに基づく。

- [学校受入に必要な最小限データ項目（入学・転入学）](docs/design/gakureibo-acceptance-data-items.md)
- [校務支援システムと学習eポータルにおける児童生徒情報の持ち方](docs/design/koumu-eportal-student-data-model.md)
- [児童生徒スキーマ設計（あるべき持ち方とステージ別データ充足）](docs/design/student-schema-design.md)

> 一次資料（政府の標準仕様書 PDF/xlsx・外部リンク集）は [docs/references/](docs/references/) に分離して保管している。

---

## `webfont/` — IPAmjexMincho Web フォント（実装ひと段落・稼働中）

`webfont/` は MJ フォント(ttf)を Web フォント化して配信するツールで、**変換から配信まで一通り完成**している。SSS-PoC の氏名表示はこのフォントを利用する。

- **合成**: IPAmj明朝 + IPAex明朝 を 1 つのフォント **IPAmjexMincho** に合成（54,857 コードポイント / 異体字(IVS) 11,833 / 縦書き対応）
- **サブセット化**: 256 個の WOFF2 に分割し、CSS の `unicode-range` で表示に必要な分だけ遅延配信
- **配信**: Vercel の専用静的プロジェクト＋独自ドメインで公開中 → **https://ipamjexmincho.shumy.app**

ビルド・配信の詳細は次を参照:

- [webfont/README.md](webfont/README.md) — サブプロジェクトの入口（前提・ビルド手順・ディレクトリ構成）
- [フォント分析](webfont/docs/font-analysis.md) — IPAmj明朝 / IPAex明朝 の特徴比較と合成方針の根拠
- [デプロイ手順](webfont/docs/deploy.md) — 変換物の配置・CORS/キャッシュ・独自ドメイン・更新フロー

---

## 開発ルールのまとめ

個人開発における技術選定、設計方針、実装ルールをまとめた開発ガイドラインは `docs/` 配下の 4 ドキュメントに分かれている。

- [開発ガイドライン](docs/dev-guideline.md)
  プロジェクト全体の前提、正本の考え方、採用している技術スタック、現時点で未決の事項をまとめた入口ドキュメント。まずここから読む。
- [設計方針](docs/architecture-guidelines.md)
  レイヤ構成、Server Action と Route Handler の使い分け、認証・認可、データ責務など、アプリケーション設計上の判断基準。
- [推奨ディレクトリ構成](docs/directory-structure.md)
  `src/` 以下の配置方針、各ディレクトリの責務、Server Action やテストの置き場所などを示した物理構成のリファレンス。
- [コーディング規約ドラフト](docs/coding-guidelines.md)
  TypeScript / React / MUI の実装ルール、セキュリティ・アクセシビリティ・パフォーマンス観点、テスト方針、レビュー時に見る点をまとめた規約。

業務ドメイン（児童生徒・名簿）の設計は [docs/design/](docs/design/) を参照する。

## 読む順序の目安

1. まず [開発ガイドライン](docs/dev-guideline.md) で前提と技術スタックを押さえる
2. 次に [設計方針](docs/architecture-guidelines.md) で責務境界の考え方を理解する
3. 実装時は [推奨ディレクトリ構成](docs/directory-structure.md) と [コーディング規約ドラフト](docs/coding-guidelines.md) を参照する
4. 業務機能の設計は [docs/design/](docs/design/) を参照する

## 環境構築

ローカル開発を始めるには、Turso（DB）と Google OAuth / LINE Login（認証）のセットアップが必要です。手順は [環境構築手順](docs/environment-setup.md) を参照してください。
