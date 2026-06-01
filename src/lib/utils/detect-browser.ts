/**
 * ブラウザの種類とバージョンを判定する
 */
export function detectBrowser(): { browser: string; version: string } {
  if (typeof window === 'undefined') {
    return { browser: 'Unknown', version: '' };
  }

  const ua = navigator.userAgent;

  let browser = 'Unknown';
  let version = '';

  if (/CriOS\/(\d+)/i.test(ua)) {
    browser = 'Chrome iOS';
    version = ua.match(/CriOS\/(\d+)/i)?.[1] ?? '';
  } else if (/EdgiOS\/(\d+)/i.test(ua)) {
    browser = 'Edge iOS';
    version = ua.match(/EdgiOS\/(\d+)/i)?.[1] ?? '';
  } else if (/FxiOS\/(\d+)/i.test(ua)) {
    browser = 'Firefox iOS';
    version = ua.match(/FxiOS\/(\d+)/i)?.[1] ?? '';
  } else if (/SamsungBrowser\/(\d+)/i.test(ua)) {
    browser = 'Samsung Internet';
    version = ua.match(/SamsungBrowser\/(\d+)/i)?.[1] ?? '';
  } else if (/Edg\/(\d+)/i.test(ua)) {
    browser = 'Edge';
    version = ua.match(/Edg\/(\d+)/i)?.[1] ?? '';
  } else if (/OPR\/(\d+)/i.test(ua)) {
    browser = 'Opera';
    version = ua.match(/OPR\/(\d+)/i)?.[1] ?? '';
  } else if (/Chrome\/(\d+)/i.test(ua) && !/Edg/i.test(ua)) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/i)?.[1] ?? '';
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/i)?.[1] ?? '';
  } else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua)) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/i)?.[1] ?? '';
  } else if (/; wv\)/i.test(ua) || (/Version\/\d+\.\d+/i.test(ua) && /Chrome/i.test(ua))) {
    browser = 'Android WebView';
  } else {
    browser = 'Others';
  }

  return { browser, version };
}
