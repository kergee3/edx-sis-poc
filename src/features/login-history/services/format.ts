import type {
  LoginHistoryRow,
  UserAgentBrand,
} from '@/server/db/turso/schema/login-history';
import type {
  LoginHistoryDetail,
  LoginHistoryDetailRow,
  LoginHistoryView,
} from '../types';

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  dateStyle: 'medium',
});

const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  timeStyle: 'medium',
});

const EMPTY_PLACEHOLDER = '(不明)';
const EMPTY_VALUE = '(なし)';

function formatLocationIpParts(row: LoginHistoryRow): {
  locationLabel: string;
  ipLabel: string;
} {
  const { ip, geoCountry, geoCity } = row;
  if (!ip) return { locationLabel: EMPTY_PLACEHOLDER, ipLabel: '' };
  if (ip === '::1') return { locationLabel: 'localhost', ipLabel: '(::1)' };

  const parts = [geoCountry, geoCity].filter((v): v is string => Boolean(v));
  if (parts.length === 0) return { locationLabel: ip, ipLabel: '' };
  return { locationLabel: parts.join(' '), ipLabel: `(${ip})` };
}

function formatOsBrowserParts(row: LoginHistoryRow): {
  osLabel: string;
  browserLabel: string;
} {
  const { os, browser } = row;
  if (!os && !browser) return { osLabel: EMPTY_PLACEHOLDER, browserLabel: '' };
  return {
    osLabel: os ?? '',
    browserLabel: browser ? `(${browser})` : '',
  };
}

function formatString(value: string | null): string {
  return value && value.length > 0 ? value : EMPTY_VALUE;
}

function formatNumber(value: number | null): string {
  return value !== null ? String(value) : EMPTY_VALUE;
}

function formatBoolean(value: boolean | null): string {
  if (value === null) return EMPTY_VALUE;
  return value ? 'Yes' : 'No';
}

function formatResolution(width: number | null, height: number | null): string {
  if (width === null || height === null) return EMPTY_VALUE;
  return `${width} × ${height}`;
}

function formatDeviceMemory(value: number | null): string {
  if (value === null) return EMPTY_VALUE;
  return `${value} GB`;
}

function formatGeoLatLng(row: LoginHistoryRow): string {
  const { geoLatitude, geoLongitude } = row;
  if (!geoLatitude || !geoLongitude) return EMPTY_VALUE;
  return `${geoLatitude}, ${geoLongitude}`;
}

function formatUaBrands(brands: UserAgentBrand[] | null): string {
  if (!brands || brands.length === 0) return EMPTY_VALUE;
  return brands.map((b) => `${b.brand} ${b.version}`).join(', ');
}

function buildServerDetail(row: LoginHistoryRow): LoginHistoryDetailRow[] {
  return [
    { label: 'IP アドレス', value: formatString(row.ip) },
    { label: '国 (Geo)', value: formatString(row.geoCountry) },
    { label: '都市 (Geo)', value: formatString(row.geoCity) },
    { label: '地域 (Geo)', value: formatString(row.geoRegion) },
    { label: '緯度/経度 (Geo)', value: formatGeoLatLng(row) },
    { label: 'Referer', value: formatString(row.referer) },
  ];
}

function buildClientDetail(row: LoginHistoryRow): LoginHistoryDetailRow[] {
  return [
    { label: 'OS', value: formatString(row.os) },
    { label: 'ブラウザ', value: formatString(row.browser) },
    { label: 'アーキテクチャ', value: formatString(row.architecture) },
    { label: '物理解像度', value: formatResolution(row.physicalWidth, row.physicalHeight) },
    { label: '論理解像度', value: formatResolution(row.logicalWidth, row.logicalHeight) },
    { label: 'CPU 論理コア数', value: formatNumber(row.hardwareConcurrency) },
    { label: 'デバイスメモリ', value: formatDeviceMemory(row.deviceMemoryGb) },
    { label: 'タッチポイント', value: formatNumber(row.maxTouchPoints) },
    { label: 'User Agent', value: formatString(row.userAgent) },
    { label: 'UA Platform', value: formatString(row.uaPlatform) },
    { label: 'UA Mobile', value: formatBoolean(row.uaMobile) },
    { label: 'UA Brands', value: formatUaBrands(row.uaBrands) },
  ];
}

function buildDetail(row: LoginHistoryRow): LoginHistoryDetail {
  return {
    server: buildServerDetail(row),
    client: buildClientDetail(row),
  };
}

export function toView(row: LoginHistoryRow): LoginHistoryView {
  const { osLabel, browserLabel } = formatOsBrowserParts(row);
  const { locationLabel, ipLabel } = formatLocationIpParts(row);
  return {
    id: row.id,
    loggedInAtDate: dateFormatter.format(row.loggedInAt),
    loggedInAtTime: timeFormatter.format(row.loggedInAt),
    locationLabel,
    ipLabel,
    osLabel,
    browserLabel,
    detail: buildDetail(row),
  };
}
