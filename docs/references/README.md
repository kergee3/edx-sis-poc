# 外部仕様書リファレンス

政府機関などが公開する**外部の仕様書 PDF** をここに保存し、いつでも参照できるようにする。
本プロジェクト（主にアプリ本体＝行政/教育/名簿）が依拠する公開仕様の置き場所。

> このフォルダは**外部の一次資料専用**（複製した PDF/xlsx と外部リンク索引）。これらを踏まえて本プロジェクトが作成する**設計・調査ドキュメントは [docs/design/](../design/) に置く**（混在させない）。

## 運用ルール

- **置く前に必ず出典ページの利用規約を確認する。**
  - **再配布可**（政府標準利用規約系など）: PDF を本フォルダにコミットし、下表に追記する。
  - **再配布不可・不明**: PDF は置かず、下表に「リンクのみ（取得元 URL）」として記録する。
- ファイル名は repo 規約どおり **kebab-case**。版・年月が分かるよう日付/版を含める。
  - 例: `<発行元略称>-<内容>-<版または年月>.pdf` → `digital-agency-base-registry-2024-03.pdf`
- 取得元 URL と取得日を**必ず**記録する（後から原典の最新版を辿れるように）。
- 容量は少量（〜数十MB）想定のため **git に直接コミット**する（Git LFS は使わない）。
  総量が数百MB に向かう兆しが出たら LFS 導入を検討する。

## 索引

掲載元ページ（学齢簿編製等 第4.0版の一式）: https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1309979_00014.htm

| ファイル名 | 正式名称 | 発行元 | 取得元 URL | 取得日 | 版・年月 | ライセンス・再配布条件 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [mext-shugakujimu-gakureibo-v4-0-honbun-20260108.pdf](mext-shugakujimu-gakureibo-v4-0-honbun-20260108.pdf) | 就学事務システム（学齢簿編製等）標準仕様書【第4.0版】_標準仕様書（本体） | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-1-1.pdf | 2026-06-03 | 第4.0版（2026-01-08） | 政府標準利用規約2.0版 / CC BY 4.0互換（出典明記で再配布可） | PDF 9.2MB |
| [mext-shugakujimu-gakureibo-v4-0-kinou-youken-20260108.xlsx](mext-shugakujimu-gakureibo-v4-0-kinou-youken-20260108.xlsx) | 同上_機能要件 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-2-2.xlsx | 2026-06-03 | 第4.0版 | 同上 | 学齢簿データ項目（施行規則30条）の定義元 |
| [mext-shugakujimu-gakureibo-v4-0-chohyo-youken-20260108.xlsx](mext-shugakujimu-gakureibo-v4-0-chohyo-youken-20260108.xlsx) | 同上_帳票要件 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-3-3.xlsx | 2026-06-03 | 第4.0版 | 同上 | 通知書・名簿等の帳票一覧 |
| [mext-shugakujimu-gakureibo-v4-0-hyojun-layout-20260108.pdf](mext-shugakujimu-gakureibo-v4-0-hyojun-layout-20260108.pdf) | 同上_標準レイアウト及び標準印字項目 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-4-4.pdf | 2026-06-03 | 第4.0版 | 同上 | PDF 3.2MB。各帳票の印字項目（印字フォント=IPAmj明朝） |
| [mext-shugakujimu-gakureibo-v4-0-koshin-rireki-20260108.xlsx](mext-shugakujimu-gakureibo-v4-0-koshin-rireki-20260108.xlsx) | 同上_更新履歴 | 文部科学省 | https://www.mext.go.jp/content/20260108-mtx_syoto02-000046887-5-5.xlsx | 2026-06-03 | 第4.0版 | 同上 | 版間の変更履歴 |
| _（リンクのみ）_ | 初等中等教育におけるシステム間連携のための相互運用標準モデル Ver.6.00 | ICT CONNECT 21 | https://ictconnect21.jp/ict/wp-content/uploads/2026/03/PSE_interoperability_standard_V6p00.pdf | 2026-06-03 | Ver.6.00（2026-03-27） | 再配布条件不明のためリンクのみ（PDF未保存） | 校務支援⇔学習eポータルの名簿連携（OneRoster/UUID）。掲載元 https://ictconnect21.jp/document/eportal/ |
| _（リンクのみ）_ | OneRoster Japan Profile | 一般社団法人 日本1EdTech協会 | https://www.1edtechjapan.org/orjpp | 2026-06-03 | v1.2.1（2024-01-11） | © 1EdTech Japan Society。リンクのみ（PDF未保存） | users 等名簿項目の日本向け定義元 |
