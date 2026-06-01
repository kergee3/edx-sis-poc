import holidayJp from '@holiday-jp/holiday_jp';
import { addDaysToIso, weekdayOfIso } from '@/lib/date';

export function isHoliday(iso: string): boolean {
  // ISO 文字列を直接渡す。Date を渡すとライブラリ内部でサーバ TZ 依存の変換が起きうるため。
  return holidayJp.isHoliday(iso);
}

export function isBusinessDay(iso: string): boolean {
  const dow = weekdayOfIso(iso);
  if (dow === 0 || dow === 6) return false;
  return !holidayJp.isHoliday(iso);
}

export function shiftToBusinessDayWithinMonth(
  iso: string,
  direction: 'before' | 'after',
): string | null {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  let cur = iso;
  for (let i = 0; i < 31; i++) {
    if (isBusinessDay(cur)) return cur;
    const next = addDaysToIso(cur, direction === 'before' ? -1 : 1);
    const ny = Number(next.slice(0, 4));
    const nm = Number(next.slice(5, 7));
    if (ny !== year || nm !== month) return null;
    cur = next;
  }
  return null;
}
