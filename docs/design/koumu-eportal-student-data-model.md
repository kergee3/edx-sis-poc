# 校務支援システムと学習eポータルにおける児童生徒情報の持ち方

学齢簿（就学事務システム）から学校が受け入れた児童生徒情報（[gakureibo-acceptance-data-items.md](gakureibo-acceptance-data-items.md)）は、DB 格納後に**校務支援システム**・**学習eポータル**で活用される。本書は「初等中等教育におけるシステム間連携のための相互運用標準モデル Ver.6.00」（ICT CONNECT 21）を踏まえ、各システムが児童生徒情報を**どう持つべきか**を整理する。

> 調査日: 2026-06-03 ／ 典拠: 相互運用標準モデル Ver.6.00（2026-03-27）、OneRoster v1.2 Japan Profile v1.2.1（1EdTech Japan）。両文書は再配布条件が不明なため repo には保存せず**リンクのみ**（[docs/references/README.md](../references/README.md) の索引参照）。
>
> 用語（英語表記）: 学習eポータル = Learning e-Portal ／ 校務支援システム = School affairs support system (SSS) ／ 学習ツール = Learning tool

## 0. 全体像（データの流れと各層の責務）

```
[就学事務システム / 学齢簿]   教育委員会が編製（法定の本人・保護者・就学情報）
        │  入学/転入学通知 → 受入
        ▼
[校務支援システム]            ★児童生徒情報のマスタ（source of truth）
        │                    学齢簿由来＋学籍番号/クラス/出欠/成績/指導要録
        │  OneRoster v1.2 Japan Profile（CSV / ZIP）で名簿を出力
        ▼
[学習eポータル]               ★ハブ。受け取るのは最小限の名簿（識別子・表示名・学年・所属）
        │  LTI で呼び出し / 属性連携        ┌──────────────┐
        ├───────────────────────────────▶ [学習ツール]（さらに最小限）
        └───────────────────────────────▶ [LRS]（スタディ・ログを UUID で紐づけ）
```

- **協調領域（標準で揃える）**: データ連携規格（OneRoster / LTI / xAPI）と利用者識別子。
- **競争領域（各社独自）**: 各システム内部の機能・UX。
- データ保護・管理の主体は**学校設置者**、事業者は委託に基づき取り扱う（個人情報保護法66条）。

## 1. 役割分担と「持つべき情報」の原則

| システム | 位置づけ | 持つべき児童生徒情報 | 持たない/最小化すべき情報 |
| --- | --- | --- | --- |
| 校務支援システム | 名簿の**マスタ**・OneRoster 出力元 | 学齢簿由来の本人情報（正式氏名＝MJ特有文字を含み得る、生年月日、性別、住所、保護者）＋学籍番号・クラス・出席番号・出欠・成績・指導要録 | — |
| 学習eポータル | **ハブ** | OneRoster で受領する**最小限**: 利用者識別子(UUID)・表示名(preferredName)・カナ氏名・学年(grade)・所属クラス(enrollments)・ロール | 住所・生年月日・保護者・成績・**本名のMJ特有文字** |
| 学習ツール | 末端 | LTI 経由で都度受領する属性のみ（将来像はローカルにアカウントを持たない） | 名簿の常時保持 |
| LRS | ログ蓄積 | スタディ・ログ（xAPI）＋利用者識別子(UUID) | 名簿属性 |

**原則**: 児童生徒情報はマスタ（校務支援）に集約し、下流（eポータル→ツール）へは目的に必要な最小限のみを渡す。下流に行くほど属性は減り、共通の識別子(UUID)で名寄せする。

## 2. 利用者識別子の統一（UUID v4）

- OneRoster の `users.userMasterIdentifier` に、システム横断でユーザーを特定する**利用者識別子（UUID v4）**を入れる。
- 生成責務は**原則 校務支援システム**。ただし学習eポータル／他校務支援が既に発番した UUID があればそれを優先（②③ → ①の順）。連携する校務支援システムには「UUID を生成できる」「自他問わず割り当て・登録できる」機能が求められる。
- スタディ・ログ（LRS）もこの UUID で紐づくため、**転校・進学・システム移管でも UUID を引き継ぐ**べき（1人1UUIDが理想）。現状は複数 UUID が振られうるため、引継ぎルールは標準でも今後の課題とされている。
- UUID は OneRoster 各 CSV の `sourcedId` 等にも流用してよい。

> 設計含意: 本プロジェクトで児童生徒を DB 格納する際、**最初から UUID(v4) の利用者識別子列を持たせる**と、後段の校務支援/eポータル連携にそのまま乗る。

## 3. 名簿連携の具体仕様（OneRoster v1.2 Japan Profile, CSV）

校務支援システム → 学習eポータルの名簿受け渡しは CSV（ZIP）で行う。

### データ形式
- 文字集合 **JIS X 0213** ／ 符号化 **UTF-8（BOMなし）** ／ 値はすべて `""` で囲む ／ カナは全角。
- ZIP 命名: `RO_YYYYMMDD_[学校コード または 教育委員会コード].zip`
  - 学校単位は文科省[学校コード](https://www.mext.go.jp/b_menu/toukei/mext_01087.html)、複数校まとめは[教育委員会コード](https://www.mext.go.jp/b_menu/toukei/mext_00004.html)。設置者の異なる学校を1ファイルに混在させない。

### CSV ファイル（manifest で bulk/absent を指定）
- **必須**: `academicSessions` / `classes` / `courses` / `enrollments` / `orgs` / `roles` / `users`
- **任意**: `demographics` / `userProfiles`（userProfiles は vendorId/applicationId による真正性確認に有益で出力が望ましい）

### users.csv の児童生徒・主要項目

| 項目 | 要否 | 内容 |
| --- | --- | --- |
| `enabledUser` | REQUIRED | `True`（固定） |
| `username` | REQUIRED | 主たる IdP のログインID/クラウドID。無ければ各システムの識別ID |
| `grade` | REQUIRED※ | role が student の場合のみ（学年） |
| `userMasterIdentifier` | REQUIRED | 利用者識別子（UUID v4）。§2 参照 |
| `preferredGivenName` / `preferredFamilyName` | REQUIRED | 画面表示名（名/氏）。**JIS文字とすることが望ましい**（規格原文: 外字を含まない）。通称名/表示名があればその値 |
| `preferredMiddleName` | OPTIONAL | 表示名（ミドル） |
| `metadata.jp.kanaGivenName` / `kanaFamilyName` | REQUIRED | カナ氏名（**全角カタカナ**） |
| `metadata.jp.kanaMiddleName` / `metadata.jp.homeClass` | OPTIONAL | カナ（ミドル）／所属クラス等 |

> 戸籍上の正式氏名（漢字、MJ特有文字を含みうる）ではなく、**JIS文字とした表示名(preferredName)** を連携・表示に使う点が要。正式氏名は校務支援/帳票側に留める（§5）。

### roles / enrollments
- `roles.role`: 児童生徒=`student`(MUST)、教職員=`teacher`(MUST)。**保護者は guardian(MAY)** に統合し、`parent`/`relative` は使わない（MUST NOT）。
- `enrollments`: 児童生徒は所属する学級（`classType:homeroom`＝学籍クラス）に関連付ける。`primary` は児童生徒=`False`。

## 4. 名簿種別（ロール）の対応要否

| 名簿種別 | OneRoster ロール | 要否 |
| --- | --- | --- |
| 児童生徒 | student | MUST |
| 教職員 | teacher | MUST（管理職・学校長・教育長も teacher に含める） |
| 保護者 | guardian | MAY（parent/relative は guardian に統合・使用不可） |
| 管理職・各種 | districtAdministrator / siteAdministrator / principal 等 | MAY（出力時は primary=teacher, secondary=各ロール） |

## 5. 氏名と文字の扱い（本プロジェクト直結）

### 5.0 文字集合の分類（本プロジェクトの用語定義）

本プロジェクトでは文字集合を次のように分類する（これが他の成果物からも参照する正本）:

- **JIS文字**: JIS X 0213 で定義された文字
- **MJ文字**: 文字情報基盤（MJ）で定義された文字
- **MJ特有文字**: JIS標準文字ではない MJ 文字

集合論的に **MJ文字 = JIS文字 ＋ MJ特有文字**。

> 補足: 旧来「外字」と呼ばれてきた、システム標準で表示できない文字は、本分類では概ね **MJ特有文字**に相当する。OneRoster 等の規格原文にある「外字」は、本書ではこの意味（JIS文字以外＝MJ特有文字等）で読み替える。

### 5.1 役割の棲み分け

- **正式氏名（戸籍・住基ベース、MJ漢字＝MJ特有文字を含みうる）** は学齢簿・校務支援システムが管理し、就学通知書等の**帳票印字**で必要（標準レイアウトの印字指定が IPAmj明朝）。
- **連携・学習eポータル/ツールでの表示** は `preferredName`（通称名/表示名）を使い、**JIS文字とすることが望ましい**（規格原文: 外字を含まない）。カナ氏名は全角カタカナ。
- したがって役割は次のように棲み分く:
  - 本プロジェクトの **webfont（IPAmjexMincho）**＝校務支援/帳票での**正式氏名（MJ特有文字を含む）の正確な表示・印字**を担う。
  - **連携層（OneRoster→eポータル→ツール/LRS）**＝MJ特有文字を持ち出さず（JIS文字に限定し）、表示名＋カナで運用。
- 文字集合は連携で JIS X 0213 に正規化される点に注意（学齢簿側の **MJ特有文字を連携用の JIS文字へ**どう写像するかは別途設計事項）。

## 6. 個人情報・法令

- データ保護・管理の主体は**学校設置者**。事業者は設置者の監督下で委託に基づき取り扱う（個人情報保護法66条、行政機関等編Q&A）。
- 学習ツールで得られるスタディ・ログは、一定範囲を標準化して設置者・学校・児童生徒に還元。
- セキュリティは「教育情報セキュリティポリシーに関するガイドライン」等を踏まえる。
- 設計含意: 下流システムには**目的に必要な最小限**のみ。住所・生年月日・保護者・成績は eポータル/ツールへ渡さない。

## 7. 本プロジェクトへの示唆（児童生徒情報の持ち方）

学齢簿/受入データ（[gakureibo-acceptance-data-items.md](gakureibo-acceptance-data-items.md)）を DB に格納する際、後段の校務支援/eポータル連携を見据えて以下を「持ち方」として推奨する（具体スキーマは別途設計）:

1. **利用者識別子（UUID v4）列**を児童生徒に最初から持たせる（`userMasterIdentifier` 相当）。転校・進学でも不変に引き継ぐ運用を想定。
2. **氏名を3系統で分離して保持**:
   - 正式氏名（漢字。MJ特有文字を許容）— 帳票印字・本人特定用（webfont で表示）
   - 表示名 preferredName（JIS文字）— 連携・画面表示用
   - カナ氏名（全角カタカナ）
3. **学校コード／教育委員会コード**（文科省コード）を連携キーとして保持。
4. **学籍情報（学年・学級・出席番号）を本人属性と分離**して持つ（OneRoster の classes/enrollments に対応）。
5. **属性の所在を層で分ける**: 住所・生年月日・保護者・成績などセンシティブ項目はマスタ層に閉じ、連携層には出さない設計を初期から徹底。

> これらを具体的なテーブル定義（論理モデル＋Drizzle）と、§0 の流れの中での**ステージ別データ充足**に落とし込んだ設計書: [student-schema-design.md](student-schema-design.md)。

## 出典・ライセンス

- 相互運用標準モデル Ver.6.00（ICT CONNECT 21, 2026-03-27）: https://ictconnect21.jp/document/eportal/ ／ 本体PDF https://ictconnect21.jp/ict/wp-content/uploads/2026/03/PSE_interoperability_standard_V6p00.pdf
- OneRoster Japan Profile v1.2.1（1EdTech Japan, 2024-01-11, © 1EdTech Japan Society）: https://www.1edtechjapan.org/orjpp
- OneRoster v1.2（1EdTech / IMS Global）: https://www.imsglobal.org/spec/oneroster/v1p2
- いずれも明示的な再配布ライセンスが確認できないため、repo には保存せずリンクのみ。引用は出典明記の範囲。
