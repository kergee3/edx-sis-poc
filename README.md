# jtp-mj-font - 文字情報基盤(MJ)の漢字をWebアプリでFontとして使うためのデモアプリ
- 基本的な文書をMJフォントを使って表示します。ログインして、文書設定を記録することができます。Next.jsの簡単なアプリです。
- 文字情報基盤(MJ)のフォントをWeb Fontに変換してアップロードするためのツールです。webfontのディレクトリにあり、主にPython で記述されます。

## Webアプリの機能一覧(src)
ログインをしたユーザーに対して以下の機能を順に開発します。

| 機能 | 概要 | | ルート / ディレクトリ |
|---|---|---|
| ホーム | ホーム画面  | `/home` / `src/features/home` |
| 教育 | 卒業・在学証明書など教育関連の証明書を発行 | `/edu` / `src/features/edu` |
| 行政 | 住民票、出生証明書など行政関連の証明書を発行 | `/gov` / `src/features/gov` |
| 名簿 | 氏名、住所、学歴などの名簿情報 | `/roster` / `src/features/roster` |

基盤機能として、Google アカウントまたは LINE による認証（Auth.js v5）と、認証後にサーバ／クライアント両側からログイン履歴を記録する仕組み（`/login-history` / `src/features/login-history`）が常時動作します。3 機能のデータを xlsx で書き出し / 取り込みするデータ移行機能（`src/features/data-transfer`）も付属しており、ユーザメニューから利用できます。

## ツールの基本機能(webfont)
- 文字情報基盤(MJ)のフォント(ttfファイル)をWebフォントに変換してデプロイします。

## 開発ルールのまとめ
個人開発における技術選定、設計方針、実装ルールをまとめた開発ガイドラインは `docs/` 配下の 4 ドキュメントに分かれています。

- [開発ガイドライン](docs/dev-guideline.md)
  プロジェクト全体の前提、正本の考え方、採用している技術スタック、現時点で未決の事項をまとめた入口ドキュメント。まずここから読む。

- [設計方針](docs/architecture-guidelines.md)
  レイヤ構成、Server Action と Route Handler の使い分け、認証・認可、データ責務、ETL 運用など、アプリケーション設計上の判断基準。

- [推奨ディレクトリ構成](docs/directory-structure.md)
  `src/` 以下の配置方針、各ディレクトリの責務、Server Action やテストの置き場所などを示した物理構成のリファレンス。

- [コーディング規約ドラフト](docs/coding-guidelines.md)
  TypeScript / React / MUI の実装ルール、セキュリティ・アクセシビリティ・パフォーマンス観点、テスト方針、レビュー時に見る点をまとめた規約。

## 読む順序の目安

1. まず [開発ガイドライン](docs/dev-guideline.md) で前提と技術スタックを押さえる
2. 次に [設計方針](docs/architecture-guidelines.md) で責務境界の考え方を理解する
3. 実装時は [推奨ディレクトリ構成](docs/directory-structure.md) と [コーディング規約ドラフト](docs/coding-guidelines.md) を参照する

## 環境構築

ローカル開発を始めるには、Turso（DB）と Google OAuth / LINE Login（認証）のセットアップが必要です。手順は [環境構築手順](docs/environment-setup.md) を参照してください。
