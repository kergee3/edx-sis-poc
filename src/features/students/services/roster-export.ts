import ExcelJS from 'exceljs';
import type { RosterEntry } from '@/server/repositories/students';

/**
 * 名簿 xlsx の正式氏名セルに指定するフォント名。
 *
 * NOTE: アプリ画面では Web フォント "IPAmjexMincho"（[src/theme/fonts.ts](../../theme/fonts.ts)）を
 * 使うが、xlsx に埋め込めるのは「閲覧端末にインストール済みのデスクトップフォント名」だけ。
 * 校務の現場で配布される MJ明朝のデスクトップフォント名は "IPAmj明朝" なので、
 * ファイル内のフォント指定にはこちら（ユーザ指定どおり）を用いる。
 */
const FONT_MJ_DESKTOP = 'IPAmj明朝';

/**
 * 生年月日の整形（例: '2013/05/12'）。
 * birthDate は `Date.UTC(...)`（その日の UTC 0時）で保存されているため、
 * UTC で解釈して保存時の年月日をそのまま出す（ローカルTZのズレを避ける）。
 */
const birthDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 名簿の列定義（順序＝出力列順）。`mj` の列だけ IPAmj明朝 を当てる。 */
const COLUMNS: { header: string; width: number; mj?: boolean }[] = [
  { header: '学年・組', width: 10 },
  { header: '出席番号', width: 9 },
  { header: '正式氏名（姓）', width: 14, mj: true },
  { header: '正式氏名（名）', width: 14, mj: true },
  { header: '表示名（姓）', width: 12 },
  { header: '表示名（名）', width: 12 },
  { header: 'フリガナ（姓）', width: 14 },
  { header: 'フリガナ（名）', width: 14 },
  { header: '性別', width: 6 },
  { header: '生年月日', width: 13 },
];

/** 正式氏名セルの 1 始まり列番号（COLUMNS で mj=true の列）。 */
const MJ_CELL_INDEXES = COLUMNS.reduce<number[]>((acc, c, i) => {
  if (c.mj) acc.push(i + 1);
  return acc;
}, []);

/**
 * 名簿（生徒＋在籍）を xlsx ブックに組み立てて Buffer を返す。
 * 正式氏名（姓・名）の列だけ IPAmj明朝 を指定し、MJ特有文字（戸籍漢字等）が
 * 対応端末で正しく表示されるようにする。
 */
export async function buildRosterWorkbookBuffer(
  entries: RosterEntry[],
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'edx-sis-poc';

  // 見出し行を固定してスクロールしても列が分かるようにする。
  const sheet = workbook.addWorksheet('生徒名簿', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((c) => ({ width: c.width }));

  const headerRow = sheet.addRow(COLUMNS.map((c) => c.header));
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (const { student, enrollment } of entries) {
    const gradeClassLabel =
      enrollment?.className ??
      (enrollment?.grade ? `${enrollment.grade}年` : '(未在籍)');
    const attendance =
      enrollment?.attendanceNumber != null ? enrollment.attendanceNumber : '';

    const row = sheet.addRow([
      gradeClassLabel,
      attendance,
      student.officialFamilyName,
      student.officialGivenName,
      student.preferredFamilyName,
      student.preferredGivenName,
      student.kanaFamilyName,
      student.kanaGivenName,
      student.sex ?? '',
      birthDateFormatter.format(student.birthDate),
    ]);

    // 正式氏名の列のみ IPAmj明朝。他列は既定フォント（端末の標準和文）。
    for (const idx of MJ_CELL_INDEXES) {
      row.getCell(idx).font = { name: FONT_MJ_DESKTOP };
    }
  }

  return workbook.xlsx.writeBuffer();
}

/** ダウンロードファイル名（例: '生徒名簿_2026-06-06.xlsx'）。 */
export function rosterFileName(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `生徒名簿_${y}-${m}-${d}.xlsx`;
}
