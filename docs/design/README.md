# 設計・調査ドキュメント

本プロジェクトが自ら作成する**設計・調査ドキュメント**の置き場所。外部の一次資料（政府PDF/xlsx 等）へのリンク索引 [external-references.md](external-references.md) もここに同居し、その他の文書はそれらを踏まえて**自分たちで育てていく**。

> 区別: [external-references.md](external-references.md) ＝外部出典へのリンク索引（資料ファイルは保持しない）。その他＝それを踏まえた派生的な設計・調査成果物（自由に更新）。

## 用語（英語表記）

| 日本語 | 英語表記 | 略称 |
| --- | --- | --- |
| 学習eポータル | Learning e-Portal | — |
| 校務支援システム | Student Information System | SIS |
| 学習ツール | Learning tool | — |

> ※ 校務支援システムの英語表記について: 本 PoC は児童生徒の情報管理に絞っているため、校務支援システムを **SIS (Student Information System)** と呼称している。一方、政府標準仕様（学習eポータル標準モデル等）での英語表記は **School affairs support system (SSS)** である。本フォルダの設計文書で「SIS」と書く場合、対象とする業務範囲は標準仕様の「校務支援システム（SSS）」のうち児童生徒情報に関わる部分を指す。

## 一覧

| ファイル | 内容 |
| --- | --- |
| [gakureibo-acceptance-data-items.md](gakureibo-acceptance-data-items.md) | 学校受入に必要な最小限データ項目（入学・転入学）。学齢簿 標準仕様書からの抽出・整理 |
| [koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md) | 校務支援システムと学習eポータルにおける児童生徒情報の持ち方。§5.0 に**文字集合の分類（JIS文字／MJ文字／MJ特有文字）の用語定義（正本）** |
| [student-schema-design.md](student-schema-design.md) | 児童生徒スキーマ設計（あるべき持ち方とステージ別データ充足）。論理モデル＋Drizzle＋OneRoster写像 |
| [mji-jisx0213-mapping-design.md](mji-jisx0213-mapping-design.md) | MJ文字（IVS）→ JIS X 0213 マッピング設計。`official_*`→`preferred_*` の文字正規化。MJ文字情報一覧表＋MJ縮退マップを Turso 参照テーブル化し、0213定義判定/水準/代表字/異体字候補/非漢字判定を行う |
| [external-references.md](external-references.md) | 外部の一次資料（政府の標準仕様書 PDF/xlsx 等）へのリンク索引。資料ファイルは repo に保持せずリンクのみ |

読み順は上から（学齢簿の受入項目 → 校務支援/eポータルでの持ち方 → 具体スキーマ設計 → 氏名文字の MJ→JIS X 0213 マッピング）。
