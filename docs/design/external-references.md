# 外部仕様書リファレンス

政府機関などが公開する**外部の仕様書 PDF / xlsx 等へのリンク**をここに記録し、いつでも原典を参照できるようにする。
本プロジェクト（主にアプリ本体＝行政/教育/名簿）が依拠する公開仕様の索引。

> このドキュメントは**外部の一次資料へのリンク索引**。外部から複製した PDF / xlsx 等の資料ファイルは、このリポジトリには保持しない（リンクのみ）。これらを踏まえて本プロジェクトが作成する**設計・調査ドキュメントは、同じ `docs/design/` の各文書**に置く。

## 運用ルール

- 外部資料ファイル（PDF / xlsx / docx など）は **git にコミットしない**。
- 出典ページ、取得元 URL、取得日、版・年月、利用条件を**必ず**記録する（後から原典の最新版を辿れるように）。
- 再配布条件が明確な資料であっても、このリポジトリではリンクのみを保持する。
- 調査・設計に必要な要約や整理は同じ `docs/design/` の設計文書に置き、原典本文の複製にならない範囲に留める。

## 索引

掲載元ページ（学齢簿編製等 第4.0版の一式）: https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1309979_00014.htm

| 正式名称 | 発行元 | 取得元 URL | 取得日 | 版・年月 | ライセンス・再配布条件 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 就学事務システム（学齢簿編製等）標準仕様書【第4.0版】_標準仕様書（本体） | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-1-1.pdf | 2026-06-03 | 第4.0版（2026-01-08） | 政府標準利用規約2.0版 / CC BY 4.0互換（出典明記で再配布可） | PDF 9.2MB。掲載元は上記ページ |
| 同上_機能要件 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-2-2.xlsx | 2026-06-03 | 第4.0版 | 同上 | 学齢簿データ項目（施行規則30条）の定義元 |
| 同上_帳票要件 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-3-3.xlsx | 2026-06-03 | 第4.0版 | 同上 | 通知書・名簿等の帳票一覧 |
| 同上_標準レイアウト及び標準印字項目 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-4-4.pdf | 2026-06-03 | 第4.0版 | 同上 | PDF 3.2MB。各帳票の印字項目（印字フォント=IPAmj明朝） |
| 同上_更新履歴 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-5-5.xlsx | 2026-06-03 | 第4.0版 | 同上 | 版間の変更履歴 |
| 初等中等教育におけるシステム間連携のための相互運用標準モデル Ver.6.00 | ICT CONNECT 21 | https://ictconnect21.jp/ict/wp-content/uploads/2026/03/PSE_interoperability_standard_V6p00.pdf | 2026-06-03 | Ver.6.00（2026-03-27） | 再配布条件不明。リンクのみ | 校務支援⇔学習eポータルの名簿連携（OneRoster/UUID）。掲載元 https://ictconnect21.jp/document/eportal/ |
| OneRoster Japan Profile | 一般社団法人 日本1EdTech協会 | https://www.1edtechjapan.org/orjpp | 2026-06-03 | v1.2.1（2024-01-11） | © 1EdTech Japan Society。リンクのみ | users 等名簿項目の日本向け定義元 |
| MJ文字情報一覧表 | 一般社団法人 文字情報技術促進協議会（IPA） | https://moji.or.jp/wp-content/uploads/2024/01/mji.00602.xlsx | 2026-06-28 | Ver.006.02（2024-01） | CC BY-SA 2.1 JP（IPA著作物である旨を明記） | 氏名のJIS X 0213マッピングの一次データ（UCS/IVS/X0213面区点/水準/同符号位置の異体字）。掲載元 https://moji.or.jp/mojikiban/mjlist/ |
| MJ縮退マップ | 一般社団法人 文字情報技術促進協議会（IPA） | https://moji.or.jp/wp-content/mojikiban/oscdl/MJShrinkMap.1.2.0.json | 2026-06-28 | Ver.1.2.0（2018-01-26） | CC BY-SA 2.1 JP（IPA著作物である旨を明記） | 約6万MJ文字→約1万JIS X 0213文字の縮退対応（別符号位置の異体字）。JSON/XMLのみ（xlsx無し）。掲載元 https://moji.or.jp/mojikiban/map/ |
