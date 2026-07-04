import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';

/**
 * 転入生の氏名生成の正本 xlsx（public/poc-data/name_list.xlsx）を読み込む。
 * transfer-student.ts（転入処理）から使う。
 *
 * シート構成:
 *   - surnames: 1=基底漢字 2=コードポイント 3=苗字(表示用) 4=読み 5=異体元("s" 入りテンプレート)
 *   - boys / girls: 1=漢字 2=読み
 *
 * 「異体元」列は Excel の共有数式（"渡s" 等の結果文字列を持つ）。数式の計算結果
 * （cell.result）を採用する。roster-master.ts と同じ cellText 方針。
 */

const NAME_LIST_PATH = path.join(process.cwd(), 'public', 'poc-data', 'name_list.xlsx');

/** surnames シート 1 行分。異体元テンプレートの "s" を基底漢字の異体字に置換して正式苗字を作る。 */
export interface SurnameSource {
  /** A列 基底漢字（例 "邉"） */
  base: string;
  /** C列 苗字（表示用。例 "渡邉"） */
  preferred: string;
  /** D列 読み（全角カナ。例 "ワタナベ"） */
  reading: string;
  /** E列 異体元（"s" を 1 箇所含むテンプレート。例 "渡s"） */
  template: string;
}

/** boys / girls シート 1 行分（名＋読み）。 */
export interface GivenSource {
  /** 漢字（JIS。例 "蓮" / "大翔"） */
  kanji: string;
  /** 読み（全角カナ。例 "レン"） */
  reading: string;
}

export interface NameList {
  surnames: SurnameSource[];
  boys: GivenSource[];
  girls: GivenSource[];
}

/** ExcelJS のセル値を素のテキストへ。richText / 数式結果（result）も文字列化する。 */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join('');
    }
    if ('result' in value && value.result != null) return String(value.result);
    if ('text' in value && value.text != null) return String(value.text);
  }
  return '';
}

async function loadWorkbook(): Promise<ExcelJS.Workbook> {
  const buffer = await readFile(NAME_LIST_PATH);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
}

function readSurnames(sheet: ExcelJS.Worksheet | undefined): SurnameSource[] {
  if (!sheet) throw new Error('name_list.xlsx: シート「surnames」が見つかりません');
  const out: SurnameSource[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 見出し行
    const base = cellText(row.getCell(1)).trim();
    const template = cellText(row.getCell(5)).trim();
    if (base === '' || !template.includes('s')) return; // 空行・不正テンプレートは無視
    out.push({
      base,
      preferred: cellText(row.getCell(3)).trim(),
      reading: cellText(row.getCell(4)).trim(),
      template,
    });
  });
  if (out.length === 0) throw new Error('name_list.xlsx: surnames シートに有効な行がありません');
  return out;
}

function readGiven(sheet: ExcelJS.Worksheet | undefined, sheetName: string): GivenSource[] {
  if (!sheet) throw new Error(`name_list.xlsx: シート「${sheetName}」が見つかりません`);
  const out: GivenSource[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 見出し行
    const kanji = cellText(row.getCell(1)).trim();
    if (kanji === '') return; // 空行は無視
    out.push({ kanji, reading: cellText(row.getCell(2)).trim() });
  });
  if (out.length === 0) throw new Error(`name_list.xlsx: ${sheetName} シートに有効な行がありません`);
  return out;
}

/** name_list.xlsx を読み、苗字・男名・女名の候補群を返す。読み込み失敗時は例外を投げる。 */
export async function readNameList(): Promise<NameList> {
  const workbook = await loadWorkbook();
  return {
    surnames: readSurnames(workbook.getWorksheet('surnames')),
    boys: readGiven(workbook.getWorksheet('boys'), 'boys'),
    girls: readGiven(workbook.getWorksheet('girls'), 'girls'),
  };
}
