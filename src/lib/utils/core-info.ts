import { detectOS } from './detect-os';
import { detectBrowser } from './detect-browser';
import { detectArchitecture } from './detect-architecture';

export interface CoreInfo {
  os: string;
  browser: string;
  architecture: string;
}

const STORAGE_KEY = 'core-info';

function loadFromSession(): CoreInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CoreInfo;
  } catch (error) {
    console.error('Failed to load core info from session storage:', error);
  }
  return null;
}

function saveToSession(info: CoreInfo): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Failed to save core info to session storage:', error);
  }
}

export async function getCoreInfo(): Promise<CoreInfo> {
  const cached = loadFromSession();
  if (cached) return cached;

  const { browser, version } = detectBrowser();
  const browserInfo = version ? `${browser} ${version}` : browser;

  const coreInfo: CoreInfo = {
    os: detectOS(),
    browser: browserInfo,
    architecture: await detectArchitecture(),
  };

  saveToSession(coreInfo);
  return coreInfo;
}
