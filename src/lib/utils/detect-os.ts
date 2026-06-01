/**
 * ブラウザのユーザーエージェントから OS を判定する
 */
export function detectOS(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  const nav = navigator as Navigator & { vendor?: string };
  const ua = nav.userAgent || nav.vendor || '';
  const platform = navigator.platform;

  const isIpadOS =
    /Macintosh/.test(ua) &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1;

  if (/Windows NT/i.test(ua)) return 'Windows';
  if (isIpadOS) return 'iPadOS';
  if (/iPhone|iPod/i.test(ua)) return 'iOS';
  if (/iPad/i.test(ua)) return 'iPadOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Mac OS X/i.test(ua) || /Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(platform)) return 'Linux';
  return 'Others';
}
