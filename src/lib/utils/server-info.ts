interface GeoInfo {
  country: string;
  city: string;
  region: string;
  latitude: string;
  longitude: string;
}

export interface ServerInfo {
  userAgent: string;
  ip: string;
  referer: string;
  acceptLanguage: string;
  acceptEncoding: string;
  host: string;
  xForwardedProto: string;
  xVercelDeploymentUrl: string;
  xVercelIpTimezone: string;
  geo: GeoInfo;
}

const API_URL = '/api/env';
const SESSION_STORAGE_KEY = 'serverInfo';

export async function fetchServerInfo(): Promise<ServerInfo | null> {
  try {
    const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (cached) return JSON.parse(cached) as ServerInfo;

    const res = await fetch(API_URL);
    const data = (await res.json()) as ServerInfo;

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('Failed to fetch server info:', e);
    return null;
  }
}

export function clearServerInfoCache(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
