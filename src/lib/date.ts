// カレンダー日付（時刻を持たない日付）の演算を集約する。
// 入出力は ISO 8601 の 'YYYY-MM-DD' 文字列で統一し、サーバ TZ の影響を受けないよう
// 内部演算は @date-fns/utc の UTCDate（local-time メソッドが UTC で動く Date 派生）で行う。
// 表示整形は Intl.DateTimeFormat に任せ、本ファイルでは扱わない。
import { UTCDate } from '@date-fns/utc';
import { addDays, differenceInDays, getDay, getDaysInMonth } from 'date-fns';

const TOKYO_TZ = 'Asia/Tokyo';

const tokyoDatePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TOKYO_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayIsoInTokyo(): string {
  const parts = tokyoDatePartsFormatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function isoToUtcDate(iso: string): UTCDate {
  return new UTCDate(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8, 10)),
  );
}

function utcDateToIso(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIso(iso: string, days: number): string {
  return utcDateToIso(addDays(isoToUtcDate(iso), days));
}

export function daysBetweenIso(fromIso: string, toIso: string): number {
  return differenceInDays(isoToUtcDate(toIso), isoToUtcDate(fromIso));
}

export function weekdayOfIso(iso: string): number {
  return getDay(isoToUtcDate(iso));
}

export function daysInMonth(year: number, month1to12: number): number {
  return getDaysInMonth(new UTCDate(year, month1to12 - 1, 1));
}
