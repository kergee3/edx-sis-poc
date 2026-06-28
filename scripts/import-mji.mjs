// MJ文字 → JIS X 0213 マッピング用の参照データを Turso に投入する。
// 設計: docs/design/mji-jisx0213-mapping-design.md（§3 スキーマ / §8 後続実装）
//
// 一次データ（repo 非追跡, docs/ref-data/ に配置）:
//   - mji.00602.xlsx        … MJ文字情報一覧表 Ver.006.02
//   - MJShrinkMap.1.2.0.json … MJ縮退マップ Ver.1.2.0
// どちらも一般社団法人 文字情報技術促進協議会(IPA) / CC BY-SA 2.1 JP。
//
// 実行: node scripts/import-mji.mjs   （npm run db:import:mji）
// 事前に db:migrate:turso でテーブルが作成済みであること。冪等（全件 DELETE → 再投入）。

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@libsql/client';
import ExcelJS from 'exceljs';

// drizzle 同様 .env.local を明示ロード（無ければ通常の環境変数を使う）
try {
  process.loadEnvFile('.env.local');
} catch {
  /* noop */
}

const REF_DIR = path.join(process.cwd(), 'docs', 'ref-data');
const MJI_XLSX = path.join(REF_DIR, 'mji.00602.xlsx');
const SHRINK_JSON = path.join(REF_DIR, 'MJShrinkMap.1.2.0.json');

// MJ縮退マップの根拠区分 → (criterion, priority)。信頼度の高い順。
// 設計書 §2.2 / schema の ShrinkCriterion と対応。
const CRITERIA = [
  ['JIS包摂規準・UCS統合規則', 'jis_ucs', 1],
  ['法務省戸籍法関連通達・通知', 'koseki', 2],
  ['法務省告示582号別表第四', 'kokuji582', 3],
  ['辞書類等による関連字', 'dict', 4],
  ['読み・字形による類推', 'reading_shape', 5],
];

/**
 * JIS X 0213 面区点（例 "1-25-66"）→ JIS 水準（1〜4）。非漢字 / 0213外は null。
 * 正本は src/server/services/mji-mapping.ts の jisLevel()。**両者を同期して保つこと**。
 * 規則: docs/design/mji-jisx0213-mapping-design.md §4。
 */
function jisLevel(menKuTen) {
  if (!menKuTen) return null;
  const parts = menKuTen.split('-').map((n) => Number.parseInt(n, 10));
  const [men, ku, ten] = parts;
  if (!Number.isFinite(men) || !Number.isFinite(ku) || !Number.isFinite(ten)) return null;
  if (men === 2) return 4;
  if (men !== 1) return null;
  if (ku >= 1 && ku <= 13) return null; // 非漢字（記号・かな等）
  if (ku === 14 || ku === 15) return 3;
  if (ku >= 16 && ku <= 46) return 1;
  if (ku === 47) return ten <= 51 ? 1 : 3;
  if (ku >= 48 && ku <= 83) return 2;
  if (ku === 84) return ten <= 6 ? 2 : 3;
  if (ku >= 85 && ku <= 94) return 3;
  return null;
}

/** ExcelJS のセル値を素のテキストへ。richText（IVS を保持）も連結する。 */
function cellText(value) {
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

const orNull = (s) => {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
};
const intOrNull = (s) => {
  const t = (s ?? '').trim();
  if (t === '') return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
};

/** mji.00602.xlsx をストリームで読み、文字行を組み立てる（メモリ節約）。 */
async function readMjiCharacters() {
  // 列(1始まり): C=3 mj_id, D=4 corresponding_ucs, E=5 implemented_ucs, F=6 ivs,
  //   G=7 svs, N=14 x0213, O=15 serial, P=16 class, Q=17 x0212, AB=28 strokes, AC=29 readings
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(MJI_XLSX, {
    sharedStrings: 'cache',
    worksheets: 'emit',
    entries: 'ignore',
    styles: 'ignore',
  });

  const rows = [];
  for await (const worksheet of reader) {
    for await (const row of worksheet) {
      if (row.number === 1) continue; // 見出し行
      const mjId = cellText(row.getCell(3).value).trim();
      if (!mjId) continue; // 空行
      const correspondingUcs = cellText(row.getCell(4).value).trim();
      const x0213 = orNull(cellText(row.getCell(14).value));
      rows.push({
        mjId,
        correspondingUcs,
        implementedUcs: orNull(cellText(row.getCell(5).value)),
        ivs: orNull(cellText(row.getCell(6).value)),
        svs: orNull(cellText(row.getCell(7).value)),
        x0213,
        x0213UnificationSerial: orNull(cellText(row.getCell(15).value)),
        x0213UnificationClass: orNull(cellText(row.getCell(16).value)),
        x0212: orNull(cellText(row.getCell(17).value)),
        jisLevel: jisLevel(x0213),
        totalStrokes: intOrNull(cellText(row.getCell(28).value)),
        readings: orNull(cellText(row.getCell(29).value)),
      });
    }
    break; // 先頭シートのみ
  }
  if (rows.length === 0) throw new Error(`${MJI_XLSX}: 文字データが 0 件です`);
  return rows;
}

/** MJShrinkMap.1.2.0.json を読み、1 候補 = 1 行に展開する。 */
async function readShrinkCandidates() {
  const json = JSON.parse(await readFile(SHRINK_JSON, 'utf-8'));
  const content = json.content;
  if (!Array.isArray(content)) throw new Error(`${SHRINK_JSON}: content 配列が見つかりません`);

  const rows = [];
  for (const rec of content) {
    const mjId = rec['MJ文字図形名'];
    if (!mjId) continue;
    for (const [key, criterion, priority] of CRITERIA) {
      const list = rec[key];
      if (!Array.isArray(list)) continue;
      for (const cand of list) {
        const { ['JIS X 0213']: targetX0213, UCS: targetUcs, ...rest } = cand;
        const meta = Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;
        rows.push({
          id: crypto.randomUUID(),
          mjId,
          criterion,
          priority,
          targetX0213: targetX0213 ?? null,
          targetUcs: targetUcs ?? null,
          meta,
        });
      }
    }
  }
  return rows;
}

/** [dbColumn, objKey] のペア配列で多行 INSERT をチャンク実行する。 */
async function bulkInsert(db, table, colPairs, rows, rowsPerStmt) {
  const dbCols = colPairs.map(([c]) => c);
  const keys = colPairs.map(([, k]) => k);
  const placeholders = `(${dbCols.map(() => '?').join(',')})`;
  let done = 0;
  for (let i = 0; i < rows.length; i += rowsPerStmt) {
    const chunk = rows.slice(i, i + rowsPerStmt);
    const sql =
      `INSERT INTO ${table} (${dbCols.join(',')}) VALUES ` +
      chunk.map(() => placeholders).join(',');
    const args = [];
    for (const r of chunk) for (const k of keys) args.push(r[k] ?? null);
    await db.execute({ sql, args });
    done += chunk.length;
    process.stdout.write(`\r  ${table}: ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN が未設定です（.env.local を確認）');
  }

  console.log('Reading mji.00602.xlsx ...');
  const characters = await readMjiCharacters();
  console.log(`  characters: ${characters.length}`);

  console.log('Reading MJShrinkMap.1.2.0.json ...');
  const candidates = await readShrinkCandidates();
  console.log(`  shrink candidates: ${candidates.length}`);

  const db = createClient({ url, authToken });

  console.log('Clearing existing reference data ...');
  await db.execute('DELETE FROM mji_shrink_candidates');
  await db.execute('DELETE FROM mji_characters');

  console.log('Inserting mji_characters ...');
  await bulkInsert(
    db,
    'mji_characters',
    [
      ['mj_id', 'mjId'],
      ['corresponding_ucs', 'correspondingUcs'],
      ['implemented_ucs', 'implementedUcs'],
      ['ivs', 'ivs'],
      ['svs', 'svs'],
      ['x0213', 'x0213'],
      ['x0213_unification_serial', 'x0213UnificationSerial'],
      ['x0213_unification_class', 'x0213UnificationClass'],
      ['x0212', 'x0212'],
      ['jis_level', 'jisLevel'],
      ['total_strokes', 'totalStrokes'],
      ['readings', 'readings'],
    ],
    characters,
    500,
  );

  console.log('Inserting mji_shrink_candidates ...');
  await bulkInsert(
    db,
    'mji_shrink_candidates',
    [
      ['id', 'id'],
      ['mj_id', 'mjId'],
      ['criterion', 'criterion'],
      ['priority', 'priority'],
      ['target_x0213', 'targetX0213'],
      ['target_ucs', 'targetUcs'],
      ['meta', 'meta'],
    ],
    candidates,
    500,
  );

  await verify(db);
  console.log('\nDone.');
}

async function verify(db) {
  console.log('\nVerifying ...');
  const q = async (sql, args = []) => (await db.execute({ sql, args })).rows;
  const total = (await q('SELECT COUNT(*) c FROM mji_characters'))[0].c;
  const withX0213 = (await q('SELECT COUNT(*) c FROM mji_characters WHERE x0213 IS NOT NULL'))[0].c;
  const cand = (await q('SELECT COUNT(*) c FROM mji_shrink_candidates'))[0].c;
  console.log(`  mji_characters total = ${total} (expect ~58862)`);
  console.log(`  with X0213 = ${withX0213} (expect ~13707)`);
  console.log(`  shrink candidates = ${cand}`);

  // 面2 は全て第4水準 / 面1区1〜13 は水準なし、を抜き取り確認
  const plane2bad = (await q(
    "SELECT COUNT(*) c FROM mji_characters WHERE x0213 LIKE '2-%' AND (jis_level IS NULL OR jis_level <> 4)",
  ))[0].c;
  console.log(`  plane2 rows not level4 = ${plane2bad} (expect 0)`);

  // サンプル: 髙(IVS無し U+9AD9) / 齊󠄃(9F4A_E0103) / 斉(U+6589)
  for (const [label, sql, args] of [
    ['髙 (impl U+9AD9)', 'SELECT mj_id,x0213,jis_level FROM mji_characters WHERE implemented_ucs=?', ['U+9AD9']],
    ['齊󠄃 (ivs 9F4A_E0103)', 'SELECT mj_id,x0213,jis_level FROM mji_characters WHERE ivs=?', ['9F4A_E0103']],
    ['齊 同符号位置で0213にある異体字', "SELECT mj_id,ivs,x0213 FROM mji_characters WHERE corresponding_ucs='U+9F4A' AND x0213 IS NOT NULL", []],
    ['斉 MJ013044 の縮退候補', 'SELECT criterion,priority,target_ucs,target_x0213 FROM mji_shrink_candidates WHERE mj_id=? ORDER BY priority', ['MJ013044']],
  ]) {
    console.log(`  [${label}] ->`, JSON.stringify(await q(sql, args)));
  }
}

main().catch((err) => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
