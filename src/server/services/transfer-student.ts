import {
  findRosterByOwner,
  insertStudentsWithEnrollments,
  type RosterEntry,
} from '@/server/repositories/students';
import { findIvsVariantsByCorrespondingUcs } from '@/server/repositories/mji';
import { readNameList, type SurnameSource, type GivenSource } from './name-list';
import { birthWindow, currentFiscalYear } from './roster-master';

/**
 * 転入生（新規生徒）の自動生成と登録。生成ロジックはここ（service）に集約し、
 * 参照データ（名簿統計・name_list.xlsx・MJ異体字）は repository / name-list から引く。
 * UI（features/students）は薄い Server Action 経由で本 service を呼ぶ。
 *
 * 氏名の作り方（name_list.xlsx が正本）:
 *   - 正式苗字 = surnames の異体元テンプレート（"渡s" 等）の "s" を、基底漢字（A列）の
 *     **同符号位置 IVS 異体字**からランダムに選んだ 1 字形に置換したもの（IPAmjexMincho で映える）。
 *   - 表示用の苗字 = surnames の C列（苗字）。読み = D列。
 *   - 名 = 性別に応じ boys / girls からランダム抽出（漢字＋読み。JIS）。
 * 学年・性別は現名簿の偏りを均す向きに選ぶ（下記 chooseGrade / chooseSex）。
 */

const SCHOOL_CODE = 'B999999999999'; // PoC 用の架空の学校コード（離島の中学校）
const DAY_MS = 24 * 60 * 60 * 1000;
const GRADES = [1, 2, 3] as const;

export type Grade = (typeof GRADES)[number];
export type Sex = '男' | '女';

/** 確認ダイアログに渡す・確認後そのまま登録する転入生の下書き（シリアライズ可能）。 */
export interface TransferStudentDraft {
  officialFamily: string;
  officialGiven: string;
  preferredFamily: string;
  preferredGiven: string;
  kanaFamily: string;
  kanaGiven: string;
  sex: Sex;
  grade: Grade;
  /** 生年月日（エポックミリ秒。UTC 深夜） */
  birthDateMs: number;
}

/** 非空配列から 1 件をランダムに選ぶ（空なら例外）。 */
function pick<T>(arr: readonly T[]): T {
  const value = arr[Math.floor(Math.random() * arr.length)];
  if (value === undefined) throw new Error('cannot pick from an empty array');
  return value;
}

/** コードポイント → "U+XXXX"（mji の D 列形式）。 */
function ucsKey(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

/** "BASE_VS"（mji の F 列形式。例 9089_E010F）→ IVS 字形（基底＋異体字セレクタ）。失敗時は空文字。 */
function ivsToChar(ivs: string | null | undefined): string {
  const [b, v] = (ivs ?? '').split('_');
  if (!b || !v) return '';
  try {
    return String.fromCodePoint(Number.parseInt(b, 16), Number.parseInt(v, 16));
  } catch {
    return '';
  }
}

/** その学年の在籍生徒だけを抜き出す。 */
function studentsInGrade(roster: RosterEntry[], grade: Grade): RosterEntry[] {
  return roster.filter((e) => e.enrollment?.grade === String(grade));
}

/** 最も生徒数が少ない学年を選ぶ（同数はランダム）。 */
function chooseGrade(roster: RosterEntry[]): Grade {
  const counts = GRADES.map((g) => ({ grade: g, count: studentsInGrade(roster, g).length }));
  const min = Math.min(...counts.map((c) => c.count));
  return pick(counts.filter((c) => c.count === min).map((c) => c.grade));
}

/** 選んだ学年の中で人数が少ない側の性別を選ぶ（同数はランダム）。 */
function chooseSex(roster: RosterEntry[], grade: Grade): Sex {
  const inGrade = studentsInGrade(roster, grade);
  const boys = inGrade.filter((e) => e.student.sex === '男').length;
  const girls = inGrade.filter((e) => e.student.sex === '女').length;
  if (boys < girls) return '男';
  if (girls < boys) return '女';
  return pick(['男', '女'] as const);
}

/** 学年の「日本の学齢」の生年月日範囲内にランダムな 1 日を返す（UTC 深夜のエポックミリ秒）。 */
function randomBirthDateMs(fiscalYear: number, grade: Grade): number {
  const { startMs, endMs } = birthWindow(fiscalYear, grade);
  const spanDays = Math.max(1, Math.round((endMs - startMs) / DAY_MS));
  return startMs + Math.floor(Math.random() * spanDays) * DAY_MS;
}

/**
 * 正式苗字を組み立てる。基底漢字（A列）の同符号位置 IVS 異体字を 1 字形ランダムに選び、
 * 異体元テンプレートの "s" と置き換える。異体字が無い基底漢字は基底字そのものを使う。
 */
async function buildOfficialFamily(surname: SurnameSource): Promise<string> {
  const cp = surname.base.codePointAt(0);
  let variant = surname.base;
  if (cp !== undefined) {
    const glyphs = (await findIvsVariantsByCorrespondingUcs(ucsKey(cp)))
      .map((r) => ivsToChar(r.ivs))
      .filter((g) => g !== '');
    if (glyphs.length > 0) variant = pick(glyphs);
  }
  return surname.template.replace('s', variant);
}

/**
 * 転入生 1 名の下書きを生成する（DB へは書き込まない）。
 * 現名簿の統計から学年・性別を決め、name_list.xlsx と MJ異体字から氏名を作る。
 */
export async function generateTransferStudentDraft(userId: string): Promise<TransferStudentDraft> {
  const [roster, nameList] = await Promise.all([findRosterByOwner(userId), readNameList()]);

  const grade = chooseGrade(roster);
  const sex = chooseSex(roster, grade);
  const surname = pick(nameList.surnames);
  const given: GivenSource = pick(sex === '男' ? nameList.boys : nameList.girls);
  const officialFamily = await buildOfficialFamily(surname);

  return {
    officialFamily,
    officialGiven: given.kanji,
    preferredFamily: surname.preferred,
    preferredGiven: given.kanji,
    kanaFamily: surname.reading,
    kanaGiven: given.reading,
    sex,
    grade,
    birthDateMs: randomBirthDateMs(currentFiscalYear(new Date()), grade),
  };
}

/**
 * 転入生の下書きを名簿へ登録する（生徒＋在籍）。出席番号は登録時点の名簿から
 * 当該学年の最大＋1 を採る（下書き生成後に名簿が変わっても破綻しない）。
 */
export async function commitTransferStudent(
  userId: string,
  draft: TransferStudentDraft,
): Promise<void> {
  const roster = await findRosterByOwner(userId);
  const maxAttendance = studentsInGrade(roster, draft.grade).reduce(
    (max, e) => Math.max(max, e.enrollment?.attendanceNumber ?? 0),
    0,
  );
  const fiscalYear = currentFiscalYear(new Date());
  const studentId = crypto.randomUUID();

  await insertStudentsWithEnrollments(
    [
      {
        id: studentId,
        ownerUserId: userId,
        userMasterIdentifier: crypto.randomUUID(),
        officialFamilyName: draft.officialFamily,
        officialGivenName: draft.officialGiven,
        preferredFamilyName: draft.preferredFamily,
        preferredGivenName: draft.preferredGiven,
        kanaFamilyName: draft.kanaFamily,
        kanaGivenName: draft.kanaGiven,
        birthDate: new Date(draft.birthDateMs),
        sex: draft.sex,
      },
    ],
    [
      {
        studentId,
        schoolCode: SCHOOL_CODE,
        grade: String(draft.grade),
        classCode: `0${draft.grade}01`,
        className: `${draft.grade}年1組`,
        attendanceNumber: maxAttendance + 1,
        enrollmentStatus: 'enrolled',
        // 入学日は中1だった年度の 4/6（証明書等の整合のため）、転入日は本日。
        admissionDate: new Date(Date.UTC(fiscalYear - (draft.grade - 1), 3, 6)),
        transferInDate: new Date(),
      },
    ],
  );
}
