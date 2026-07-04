import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
import type {
  StudentInsert,
  StudentEnrollmentInsert,
} from '@/server/db/turso/schema/students';

/**
 * 「初期名簿」xlsx（public/poc-data/initial-student-roster.xlsx）を正本として
 * 初期名簿（生徒＋在籍）を組み立てる。設定ページの「既定の名簿に設定する」と
 * 新規ログイン時のシード（[students.ts](./students.ts) の ensureSeededForUser）の双方から使う。
 *
 * xlsx には `v2` / `v1` の 2 シートがあり、先頭の `v2` シートを使う。
 *
 * xlsx の列（1始まり）:
 *   1=学年 2=正式氏名(姓) 3=正式氏名(名) 4=表示名(姓) 5=表示名(名)
 *   6=フリガナ(姓) 7=フリガナ(名) 8=性別
 *
 * xlsx には「組」と「生年月日」が無いため、ここで補完する:
 *   - 組 = 一律 1 組（classCode=`0{grade}01` / className=`{grade}年1組`）
 *   - 生年月日 = 現在日付から求めた年度と学年に対応する「日本の学齢」の生年月日範囲内に、
 *     学年内の並び順から *決定的* に散らばらせて割り当てる（毎回同じ値になる）。
 *
 * 正式氏名（姓・名）は MJ特有文字（戸籍漢字・異体字。IVS を含みうる）をそのまま保持する。
 */

const MASTER_ROSTER_PATH = path.join(
  process.cwd(),
  'public',
  'poc-data',
  'initial-student-roster.xlsx',
);

const SCHOOL_CODE = 'B999999999999'; // PoC 用の架空の学校コード（離島の中学校）

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MasterEntry {
  grade: number;
  officialFamily: string;
  officialGiven: string;
  preferredFamily: string;
  preferredGiven: string;
  kanaFamily: string;
  kanaGiven: string;
  sex: string;
}

/** ExcelJS のセル値を素のテキストへ。richText（IVS を保ったまま）も連結する。 */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join('');
    }
    if ('text' in value && value.text != null) return String(value.text);
    if ('result' in value && value.result != null) return String(value.result);
  }
  return '';
}

/** initial-student-roster.xlsx を読み込み Workbook を返す（共通処理）。 */
async function loadRosterWorkbook(): Promise<ExcelJS.Workbook> {
  const buffer = await readFile(MASTER_ROSTER_PATH);
  // exceljs の load は ArrayBuffer も受け付ける。@types/node の NonSharedBuffer と
  // exceljs の Buffer 型の差を避けるため、素の ArrayBuffer を切り出して渡す。
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
}

/**
 * 初期名簿 xlsx のシート名を、ファイル内の並び順で返す（先頭が既定シート。現在は "v2"）。
 * 設定ページ「名簿の初期化」のシート選択肢として使う。今後シートが増えても先頭が既定。
 */
export async function listRosterSheetNames(): Promise<string[]> {
  const workbook = await loadRosterWorkbook();
  return workbook.worksheets.map((w) => w.name);
}

/**
 * xlsx を読み、ヘッダ行を除いた各生徒のマスタ項目を返す。
 * sheetName 未指定時は先頭シート（既定）を使う。
 */
export async function readMasterEntries(sheetName?: string): Promise<MasterEntry[]> {
  const workbook = await loadRosterWorkbook();

  const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!sheet) {
    throw new Error(
      `initial-student-roster.xlsx: シート「${sheetName ?? '(先頭)'}」が見つかりません`,
    );
  }

  const entries: MasterEntry[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 見出し行
    const grade = Number.parseInt(cellText(row.getCell(1)).trim(), 10);
    const officialFamily = cellText(row.getCell(2)).trim();
    if (!Number.isFinite(grade) || officialFamily === '') return; // 空行は無視

    entries.push({
      grade,
      officialFamily,
      officialGiven: cellText(row.getCell(3)).trim(),
      preferredFamily: cellText(row.getCell(4)).trim(),
      preferredGiven: cellText(row.getCell(5)).trim(),
      kanaFamily: cellText(row.getCell(6)).trim(),
      kanaGiven: cellText(row.getCell(7)).trim(),
      sex: cellText(row.getCell(8)).trim(),
    });
  });

  if (entries.length === 0) {
    throw new Error(`initial-student-roster.xlsx: シート「${sheet.name}」に生徒データが 0 件です`);
  }
  return entries;
}

/**
 * 「現在の年度」（4月始まり）。現在月が4月以降ならその年、3月以前なら前年。
 * 例: 2026-06 → 2026 年度、2026-02 → 2025 年度。
 */
export function currentFiscalYear(now: Date): number {
  // getMonth(): 0=1月 … 3=4月。
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * 学年 grade の生徒の「日本の学齢」に基づく生年月日範囲（[開始, 終了] の UTC ミリ秒）。
 * 学年相当の児童生徒は 4/2 〜 翌 4/1 生まれ。
 * 例: 2026 年度の中1（grade=1）→ 2013-04-02 〜 2014-04-01。
 */
export function birthWindow(
  fiscalYear: number,
  grade: number,
): { startMs: number; endMs: number } {
  const startMs = Date.UTC(fiscalYear - 12 - grade, 3, 2); // 4/2
  const endMs = Date.UTC(fiscalYear - 11 - grade, 3, 1); // 翌 4/1
  return { startMs, endMs };
}

/**
 * 学年内の index 番目（0始まり, 全 count 名）の生年月日を、範囲内に決定的に散らばらせて返す。
 * (index + 0.5) / count の位置を取り、毎回同じ日付になる。
 */
function scatteredBirthDate(
  fiscalYear: number,
  grade: number,
  index: number,
  count: number,
): Date {
  const { startMs, endMs } = birthWindow(fiscalYear, grade);
  const spanDays = Math.max(1, Math.round((endMs - startMs) / DAY_MS));
  const offsetDays = Math.floor((spanDays * (index + 0.5)) / count);
  return new Date(startMs + offsetDays * DAY_MS);
}

export interface BuildRosterOptions {
  /** 使用するシート名。未指定なら先頭シート（既定。現在は "v2"）。 */
  sheetName?: string;
  /** 年度・生年月日の基準日（既定 = 実行時の現在日時）。 */
  now?: Date;
}

/**
 * 初期名簿 xlsx から、指定オーナー（校長 = users.id）向けの初期名簿
 * （生徒＋在籍）を組み立てる。xlsx の読み込み・解釈に失敗した場合は例外を投げる。
 */
export async function buildRosterFromMaster(
  ownerUserId: string,
  options: BuildRosterOptions = {},
): Promise<{ studentRows: StudentInsert[]; enrollmentRows: StudentEnrollmentInsert[] }> {
  const { sheetName, now = new Date() } = options;
  const entries = await readMasterEntries(sheetName);
  const fiscalYear = currentFiscalYear(now);

  // 学年ごとに件数を数え、学年内の並び順（= 出席番号）と生年月日の散らばりに使う。
  const gradeCounts = new Map<number, number>();
  for (const e of entries) gradeCounts.set(e.grade, (gradeCounts.get(e.grade) ?? 0) + 1);

  const gradeSeen = new Map<number, number>();
  const studentRows: StudentInsert[] = [];
  const enrollmentRows: StudentEnrollmentInsert[] = [];

  for (const e of entries) {
    const indexInGrade = gradeSeen.get(e.grade) ?? 0;
    gradeSeen.set(e.grade, indexInGrade + 1);
    const countInGrade = gradeCounts.get(e.grade) ?? 1;

    const studentId = crypto.randomUUID();
    studentRows.push({
      id: studentId,
      ownerUserId,
      userMasterIdentifier: crypto.randomUUID(),
      officialFamilyName: e.officialFamily,
      officialGivenName: e.officialGiven,
      preferredFamilyName: e.preferredFamily,
      preferredGivenName: e.preferredGiven,
      kanaFamilyName: e.kanaFamily,
      kanaGivenName: e.kanaGiven,
      birthDate: scatteredBirthDate(fiscalYear, e.grade, indexInGrade, countInGrade),
      sex: e.sex || null,
    });
    enrollmentRows.push({
      studentId,
      schoolCode: SCHOOL_CODE,
      grade: String(e.grade),
      classCode: `0${e.grade}01`,
      className: `${e.grade}年1組`,
      attendanceNumber: indexInGrade + 1, // 学年内の並び順 = 出席番号
      enrollmentStatus: 'enrolled',
      admissionDate: new Date(Date.UTC(fiscalYear - (e.grade - 1), 3, 6)), // 中1だった年度の 4/6
    });
  }

  return { studentRows, enrollmentRows };
}
