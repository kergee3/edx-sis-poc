# OneRoster Japan Profile 出力（名簿 ZIP エクスポート）設計

生徒一覧画面の「OneRoster出力」ボタンから、ログイン中の校長の名簿を **OneRoster v1.2 Japan Profile** の CSV（ZIP）で出力する機能の設計・実装メモ。

> 典拠: [external-references.md](external-references.md) の **OneRoster Japan Profile v1.2.1**（1EdTech Japan, 2024-01-11）、**相互運用標準モデル Ver.6.00**（ICT CONNECT 21）、および OneRoster v1.2 CSV Binding（1EdTech）。写像方針は [student-schema-design.md](student-schema-design.md) §5・[koumu-eportal-student-data-model.md](koumu-eportal-student-data-model.md) §3 に従う。
>
> 本 PoC は名簿（生徒＋在籍）しか持たないため、学校(orgs)・年度(academicSessions)・コース(courses)・学級(classes) は在籍情報から**それらしく合成**する。実データではない点に注意。

## 実装

| 役割 | ファイル |
| --- | --- |
| ビルダー（CSV 直列化 ＋ ZIP 化） | [src/features/students/services/oneroster-export.ts](../../src/features/students/services/oneroster-export.ts) |
| ダウンロード Route Handler（GET, `runtime='nodejs'`, `requireUser()`→401） | [src/app/api/students/oneroster/route.ts](../../src/app/api/students/oneroster/route.ts) |
| ボタン（`<a href>` GET ダウンロード） | [src/app/students/page.tsx](../../src/app/students/page.tsx) |
| ZIP 生成ライブラリ | `fflate`（`zipSync`） |

データ取得は既存の `listRosterForUser(userId)`（xlsx 出力と共通）。teacher は `requireUser()` のセッション（id/name/email）から構成する。

## 出力フォーマット

- 符号化 **UTF-8（BOMなし）**、全値を `"` で囲む、改行 **CRLF**、カナは全角。
- ZIP 命名: `RO_YYYYMMDD_[学校コード].zip`（学校コードは `student_enrollments.schoolCode`）。
- `manifest.csv` で各ファイルを `bulk`/`absent` 指定。

### 出力する CSV

| ファイル | 要否 | 内容 |
| --- | --- | --- |
| `manifest.csv` | 必須 | 必須7ファイルを `bulk`、他は `absent` |
| `academicSessions.csv` | 必須 | 当年度（4月始まり）を `schoolYear` 1件で合成 |
| `orgs.csv` | 必須 | 学校1件。`identifier`=学校コード、`type`=school |
| `courses.csv` | 必須 | ホームルームコース1件を合成 |
| `classes.csv` | 必須 | 在籍の distinct な学級を `classType`=homeroom で生成 |
| `users.csv` | 必須 | 生徒＋校長(teacher 1件) |
| `enrollments.csv` | 必須 | 生徒→自学級(student, primary=false)、校長→全学級(teacher, primary=true) |
| `roles.csv` | 必須 | 各 user に `roleType`=primary・`role`=student/teacher |
| `demographics.csv` / `userProfiles.csv` | 任意 | 出力しない（`absent`） |

### users.csv の主要写像（生徒）

| OneRoster | 写像元 | 備考 |
| --- | --- | --- |
| `sourcedId` | `students.id` | |
| `enabledUser` | 固定 `true` | |
| `givenName` / `familyName` | `preferred_given_name` / `preferred_family_name` | **JIS文字**。正式氏名(official_*)は使わない |
| `preferredGivenName` / `preferredFamilyName` / `preferredMiddleName` | `preferred_*` | |
| `grades` | `student_enrollments.grade` | |
| `userMasterIdentifier` | `user_master_identifier` | UUID v4 |
| `primaryOrgSourcedId` | 学校 org | |
| `metadata.jp.kanaGivenName` / `kanaFamilyName` / `kanaMiddleName` | `kana_*` | 全角カナ |
| `metadata.jp.homeClass` | `class_name` | |

### 連携に出さない（個人情報層分離・[student-schema-design.md](student-schema-design.md) §5 禁止リスト）

`official_*`（正式氏名＝MJ特有文字を含む）／`birth_date`／`sex`／`nationality`／住所／保護者／出欠・成績。

## 準備できない必須/主要属性（合成した属性の列挙）

実データが無く「それらしい値」を合成した属性。コードでは定数 `SYNTHESIZED_REQUIRED_FIELDS`（[oneroster-export.ts](../../src/features/students/services/oneroster-export.ts)）に一元管理する。

| 属性 | 合成方法 |
| --- | --- |
| `users.username` | ログインID未保持のため `s-<userMasterIdentifier>`（生徒）/ email or `t-<id>`（校長）を合成 |
| `orgs.name` | 校名未保持のため学校コードから `学校 (<コード>)` を合成 |
| `orgs.parentSourcedId` | 教育委員会未保持のため空 |
| `academicSessions.*` | 学期データ未保持のため現在日から当年度を合成 |
| `courses.title` / `courseCode` | コースマスタ未保持のためホームルームコースを合成 |
| `classes.courseSourcedId` | 合成コースを参照 |
| 校長 `givenName` / `familyName` | 表示名の姓名分割が無いため空白区切りで分割し、不足分を補完 |
| 校長 `userMasterIdentifier` | UUID を合成 |
| 校長 `metadata.jp.kana*` | カナ未保持のため合成（`キョウイン`/`センセイ`） |
| `enrollments.beginDate` | `admission_date`/`transfer_in_date` があれば使用、無ければ空 |

## 今後の課題

- 教職員名簿（teacher）を業務ドメインとして持てば、校長合成をやめ実データ出力に置換できる。
- 学校マスタ（校名・教育委員会コード）を保持すれば `orgs` の合成を解消できる。
- MJ特有文字の JIS X 0213 正規化（[mji-jisx0213-mapping-design.md](mji-jisx0213-mapping-design.md)）と連動し、`preferred_*` が確実に JIS 文字であることを保証する。
