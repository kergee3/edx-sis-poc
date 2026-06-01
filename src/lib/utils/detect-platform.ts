interface UserAgentData {
  platform?: string;
}

/**
 * @deprecated detect-architecture を優先して使用する。
 */
export function detectPlatform(): string {
  if (typeof window === 'undefined') return 'Unknown Platform';

  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  if (uaData?.platform) return uaData.platform;

  const navPlatform = navigator.platform;
  if (navPlatform === 'MacIntel') return 'macOS';
  if (navPlatform.startsWith('Win')) return 'Windows';
  if (navPlatform.startsWith('Linux')) return 'Linux';
  if (navPlatform === 'iPhone') return 'iOS';
  if (navPlatform === 'iPad') return 'iPadOS';
  return navPlatform;
}
