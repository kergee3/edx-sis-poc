import { zipSync, strToU8 } from 'fflate';
import type { RosterEntry } from '@/server/repositories/students';

/**
 * OneRoster v1.2 Japan Profile の名簿 ZIP を生成する。
 *
 * 校務支援システム → 学習eポータルの名簿連携は OneRoster（CSV/ZIP）で行うのが標準
 * （docs/design/koumu-eportal-student-data-model.md §3、student-schema-design.md §5）。
 * 本 PoC は名簿（生徒＋在籍）しか持たないため、学校(orgs)・年度(academicSessions)・
 * コース(courses)・学級(classes) は在籍情報から**それらしく合成**する。
 *
 * 個人情報の層分離（student-schema-design.md §5 の禁止リスト）に従い、
 * 正式氏名(official_*)・生年月日(birth_date)・性別(sex)・国籍(nationality)・住所は
 * **連携に出さない**。表示名(preferredName, JIS文字)＋カナで運用する。
 */

/**
 * 実データが無く「それらしい値」を合成した必須/主要属性の一覧（＝準備できない属性）。
 * ユーザ要件「準備できない属性名を列挙する」への回答。詳細は
 * docs/design/oneroster-export-design.md を参照。
 */
export const SYNTHESIZED_REQUIRED_FIELDS = [
  'users.username（ログインID未保持 → userMasterIdentifier 由来で合成）',
  'orgs.name（校名未保持 → 学校コードから合成）',
  'orgs.parentSourcedId（教育委員会未保持 → 空）',
  'academicSessions.*（学期データ未保持 → 現在日から当年度を合成）',
  'courses.title / courses.courseCode（コースマスタ未保持 → ホームルームコースを合成）',
  'classes.courseSourcedId（合成コースを参照）',
  'teacher(校長) givenName / familyName（表示名の姓名分割なし → 合成）',
  'teacher(校長) userMasterIdentifier（UUID 合成）',
  'teacher(校長) metadata.jp.kanaGivenName / kanaFamilyName（カナ未保持 → 合成）',
  'enrollments.beginDate（admissionDate/transferInDate があれば使用、無ければ空）',
] as const;

export interface OneRosterTeacher {
  id: string;
  name?: string | null;
  email?: string | null;
}

// ---- CSV 直列化ヘルパ（全値を "" で囲み、改行は CRLF、UTF-8 BOMなし） ----

type Cell = string | number | null | undefined;

function csvCell(value: Cell): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(values: readonly Cell[]): string {
  return values.map(csvCell).join(',');
}

/** ヘッダ＋データ行を CSV 文字列にする（各行 CRLF、末尾にも CRLF）。 */
function csvFile(header: readonly string[], rows: Cell[][]): string {
  return [csvRow(header), ...rows.map(csvRow)].join('\r\n') + '\r\n';
}

// ---- 日付ヘルパ ----

/** ローカル暦の YYYY-MM-DD（年度計算・命名用）。 */
function ymdLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYYMMDD（ZIP 命名用）。 */
function ymdCompact(date: Date): string {
  return ymdLocal(date).replace(/-/g, '');
}

/**
 * timestamp_ms（その日の UTC 0時で保存）を YYYY-MM-DD にする。
 * roster-export.ts の birthDate と同じく UTC で解釈する。
 */
const utcDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
function ymdUtc(date: Date | null | undefined): string {
  return date ? utcDateFmt.format(date) : '';
}

/** 日本の年度（4月始まり）。 */
function schoolYearOf(date: Date): number {
  return date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

// ---- OneRoster 各 CSV のヘッダ（列順） ----

const HEADERS = {
  academicSessions: [
    'sourcedId', 'status', 'dateLastModified', 'title', 'type',
    'startDate', 'endDate', 'parentSourcedId', 'schoolYear',
  ],
  orgs: [
    'sourcedId', 'status', 'dateLastModified', 'name', 'type',
    'identifier', 'parentSourcedId',
  ],
  courses: [
    'sourcedId', 'status', 'dateLastModified', 'schoolYearSourcedId', 'title',
    'courseCode', 'grades', 'orgSourcedId', 'subjects', 'subjectCodes',
  ],
  classes: [
    'sourcedId', 'status', 'dateLastModified', 'title', 'grades',
    'courseSourcedId', 'classCode', 'classType', 'location', 'schoolSourcedId',
    'termSourcedIds', 'subjects', 'subjectCodes', 'periods',
  ],
  users: [
    'sourcedId', 'status', 'dateLastModified', 'enabledUser', 'username',
    'userIds', 'givenName', 'familyName', 'middleName', 'identifier', 'email',
    'sms', 'phone', 'agentSourcedIds', 'grades', 'password',
    'userMasterIdentifier', 'preferredGivenName', 'preferredMiddleName',
    'preferredFamilyName', 'primaryOrgSourcedId', 'pronouns',
    'metadata.jp.kanaGivenName', 'metadata.jp.kanaFamilyName',
    'metadata.jp.kanaMiddleName', 'metadata.jp.homeClass',
  ],
  enrollments: [
    'sourcedId', 'status', 'dateLastModified', 'classSourcedId',
    'schoolSourcedId', 'userSourcedId', 'role', 'primary', 'beginDate', 'endDate',
  ],
  roles: [
    'sourcedId', 'status', 'dateLastModified', 'userSourcedId', 'roleType',
    'role', 'beginDate', 'endDate', 'orgSourcedId', 'userProfileSourcedId',
  ],
} as const;

/**
 * manifest.csv。bulk/absent を指定する。必須7ファイルを bulk、他は absent。
 */
function buildManifestCsv(): string {
  const props: [string, string][] = [
    ['manifest.version', '1.0'],
    ['oneroster.version', '1.2'],
    ['file.academicSessions', 'bulk'],
    ['file.categories', 'absent'],
    ['file.classes', 'bulk'],
    ['file.classResources', 'absent'],
    ['file.courses', 'bulk'],
    ['file.courseResources', 'absent'],
    ['file.demographics', 'absent'],
    ['file.enrollments', 'bulk'],
    ['file.lineItems', 'absent'],
    ['file.lineItemLearningObjectiveIds', 'absent'],
    ['file.lineItemScoreScales', 'absent'],
    ['file.orgs', 'bulk'],
    ['file.resources', 'absent'],
    ['file.resultLearningObjectiveIds', 'absent'],
    ['file.results', 'absent'],
    ['file.resultScoreScales', 'absent'],
    ['file.roles', 'bulk'],
    ['file.scoreScales', 'absent'],
    ['file.userProfiles', 'absent'],
    ['file.userResources', 'absent'],
    ['file.users', 'bulk'],
    ['source.systemName', 'SIS-PoC (edx-sis-poc)'],
  ];
  return csvFile(['propertyName', 'value'], props);
}

/** 学級の合成キー（学級コードがあれば優先、無ければ学年でまとめる）。 */
function classKeyOf(grade: string, classCode: string | null): string {
  return classCode && classCode.length > 0 ? classCode : `grade-${grade}`;
}

/**
 * 名簿（生徒＋在籍）と校長 teacher から OneRoster Japan Profile の ZIP を組み立てる。
 * @returns ZIP バイト列とダウンロードファイル名
 */
export function buildOneRosterZip(
  entries: RosterEntry[],
  teacher: OneRosterTeacher,
  date: Date,
): { zip: Uint8Array; fileName: string } {
  // 在籍が無い生徒は student ロールに必須の grade を欠くため除外する。
  const rostered = entries.filter((e) => e.enrollment !== null);

  const schoolCode = resolveSchoolCode(rostered);
  const orgSourcedId = `org-${schoolCode}`;
  const schoolYear = schoolYearOf(date);
  const sessionSourcedId = `session-${schoolYear}`;
  const courseSourcedId = 'course-homeroom';

  // ---- academicSessions（当年度 1 件を合成） ----
  const academicSessionsCsv = csvFile(HEADERS.academicSessions, [
    [
      sessionSourcedId, '', '', `${schoolYear}年度`, 'schoolYear',
      `${schoolYear}-04-01`, `${schoolYear + 1}-03-31`, '', String(schoolYear),
    ],
  ]);

  // ---- orgs（学校 1 件。校名は合成） ----
  const orgsCsv = csvFile(HEADERS.orgs, [
    [orgSourcedId, '', '', `学校 (${schoolCode})`, 'school', schoolCode, ''],
  ]);

  // ---- classes（在籍の distinct な学級を homeroom で合成） ----
  const classMap = new Map<
    string,
    { sourcedId: string; grade: string; className: string; classCode: string | null }
  >();
  for (const { enrollment } of rostered) {
    if (!enrollment) continue;
    const key = classKeyOf(enrollment.grade, enrollment.classCode);
    if (!classMap.has(key)) {
      classMap.set(key, {
        sourcedId: `class-${key}`,
        grade: enrollment.grade,
        className: enrollment.className ?? `${enrollment.grade}年`,
        classCode: enrollment.classCode,
      });
    }
  }
  const classesCsv = csvFile(
    HEADERS.classes,
    [...classMap.values()].map((c) => [
      c.sourcedId, '', '', c.className, c.grade, courseSourcedId,
      c.classCode ?? '', 'homeroom', '', orgSourcedId, sessionSourcedId, '', '', '',
    ]),
  );

  // ---- courses（ホームルームコース 1 件を合成） ----
  const grades = [...new Set([...classMap.values()].map((c) => c.grade))].join(',');
  const coursesCsv = csvFile(HEADERS.courses, [
    [
      courseSourcedId, '', '', sessionSourcedId, 'ホームルーム',
      'HR', grades, orgSourcedId, '', '',
    ],
  ]);

  // ---- users / enrollments / roles ----
  const userRows: Cell[][] = [];
  const enrollmentRows: Cell[][] = [];
  const roleRows: Cell[][] = [];

  // 生徒
  for (const { student, enrollment } of rostered) {
    if (!enrollment) continue;
    const classKey = classKeyOf(enrollment.grade, enrollment.classCode);
    const classSourcedId = classMap.get(classKey)?.sourcedId ?? `class-${classKey}`;
    const username = `s-${student.userMasterIdentifier}`;

    userRows.push([
      student.id, '', '', 'true', username,
      '', student.preferredGivenName, student.preferredFamilyName,
      student.preferredMiddleName ?? '', '', '',
      '', '', '', enrollment.grade, '',
      student.userMasterIdentifier, student.preferredGivenName,
      student.preferredMiddleName ?? '', student.preferredFamilyName,
      orgSourcedId, '',
      student.kanaGivenName, student.kanaFamilyName,
      student.kanaMiddleName ?? '', enrollment.className ?? '',
    ]);

    const beginDate = ymdUtc(enrollment.admissionDate ?? enrollment.transferInDate);
    enrollmentRows.push([
      `enrollment-${student.id}`, '', '', classSourcedId, orgSourcedId,
      student.id, 'student', 'false', beginDate, '',
    ]);
    roleRows.push([
      `role-${student.id}`, '', '', student.id, 'primary',
      'student', beginDate, '', orgSourcedId, '',
    ]);
  }

  // 校長（teacher 1 件）。姓名/カナ/利用者識別子は合成。
  const teacherName = splitTeacherName(teacher);
  const teacherUserMasterId = crypto.randomUUID();
  const teacherUsername = teacher.email ?? `t-${teacher.id}`;
  userRows.push([
    teacher.id, '', '', 'true', teacherUsername,
    '', teacherName.given, teacherName.family, '', '', teacher.email ?? '',
    '', '', '', '', '',
    teacherUserMasterId, teacherName.given, '', teacherName.family,
    orgSourcedId, '',
    teacherName.kanaGiven, teacherName.kanaFamily, '', '',
  ]);
  // 校長は全学級を担当する想定（ワンオペ）。各 homeroom に teacher で紐付ける。
  for (const c of classMap.values()) {
    enrollmentRows.push([
      `enrollment-teacher-${teacher.id}-${c.sourcedId}`, '', '', c.sourcedId,
      orgSourcedId, teacher.id, 'teacher', 'true', '', '',
    ]);
  }
  roleRows.push([
    `role-${teacher.id}`, '', '', teacher.id, 'primary',
    'teacher', '', '', orgSourcedId, '',
  ]);

  const files: Record<string, Uint8Array> = {
    'manifest.csv': strToU8(buildManifestCsv()),
    'academicSessions.csv': strToU8(academicSessionsCsv),
    'orgs.csv': strToU8(orgsCsv),
    'courses.csv': strToU8(coursesCsv),
    'classes.csv': strToU8(classesCsv),
    'users.csv': strToU8(csvFile(HEADERS.users, userRows)),
    'enrollments.csv': strToU8(csvFile(HEADERS.enrollments, enrollmentRows)),
    'roles.csv': strToU8(csvFile(HEADERS.roles, roleRows)),
  };

  return { zip: zipSync(files), fileName: oneRosterZipFileName(date, schoolCode) };
}

/** 名簿から学校コードを決める（最初の非空を採用。無ければ 'unknown'）。 */
function resolveSchoolCode(entries: RosterEntry[]): string {
  for (const { enrollment } of entries) {
    if (enrollment?.schoolCode) return enrollment.schoolCode;
  }
  return 'unknown';
}

/**
 * 表示名（単一文字列になりがち）を OneRoster の姓/名に分割する。
 * 空白区切りで 2 語以上あれば [姓, 名]、1 語なら姓に入れ名は補完。カナは合成。
 */
function splitTeacherName(teacher: OneRosterTeacher): {
  family: string;
  given: string;
  kanaFamily: string;
  kanaGiven: string;
} {
  const raw = (teacher.name ?? teacher.email?.split('@')[0] ?? 'ユーザー').trim();
  const parts = raw.split(/\s+/).filter((p) => p.length > 0);
  const family = parts[0] ?? 'ユーザー';
  const given = parts.length >= 2 ? parts.slice(1).join(' ') : '先生';
  // カナは原データが無いため合成（Japan Profile では kana が REQUIRED）。
  return { family, given, kanaFamily: 'キョウイン', kanaGiven: 'センセイ' };
}

/** ダウンロードファイル名（例: 'RO_20260704_B101210000000.zip'）。 */
export function oneRosterZipFileName(date: Date, schoolCode: string): string {
  return `RO_${ymdCompact(date)}_${schoolCode}.zip`;
}
