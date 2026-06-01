interface UserAgentData {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
  }>;
}

function getUserAgentData(): UserAgentData | undefined {
  return (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
}

/**
 * WebGL レンダラー情報から Apple Silicon を検出
 */
function detectGPUInfo(): { isAppleSilicon: boolean; renderer: string } | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;

    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const rendererStr = String(renderer).toLowerCase();

    const isAppleSilicon =
      rendererStr.includes('apple m1') ||
      rendererStr.includes('apple m2') ||
      rendererStr.includes('apple m3') ||
      rendererStr.includes('apple m4') ||
      rendererStr.includes('apple gpu');

    return { isAppleSilicon, renderer: String(renderer) };
  } catch {
    return null;
  }
}

/**
 * User Agent から CPU アーキテクチャを推測する（フォールバック）
 */
function detectArchitectureFromUA(): string {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('arm64') || ua.includes('aarch64')) return 'ARM (64-bit)';
  if (ua.includes('arm')) return 'ARM (32-bit)';
  if (
    ua.includes('x64') ||
    ua.includes('x86_64') ||
    ua.includes('amd64') ||
    ua.includes('win64') ||
    ua.includes('wow64')
  ) {
    return 'x86 (64-bit)';
  }
  if (ua.includes('x86') || ua.includes('i686') || ua.includes('i386')) return 'x86 (32-bit)';

  if (ua.includes('android')) return 'ARM (64-bit推定)';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ARM (64-bit推定)';

  if (ua.includes('mac os x') || ua.includes('macos')) {
    const gpuInfo = detectGPUInfo();
    if (gpuInfo?.isAppleSilicon) return 'ARM (64-bit)';

    const cores = navigator.hardwareConcurrency;
    if (cores >= 8) return 'ARM (64-bit推定)';
    return 'x86 (64-bit推定)';
  }

  return '不明';
}

/**
 * CPU アーキテクチャを検出する。
 * 1. User Agent Client Hints API を試す
 * 2. 失敗時は User Agent から推測
 */
export async function detectArchitecture(): Promise<string> {
  if (typeof window === 'undefined') return '不明';

  try {
    const uaData = getUserAgentData();

    if (uaData && typeof uaData.getHighEntropyValues === 'function') {
      const timeoutPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve(detectArchitectureFromUA()), 2000);
      });

      const hintsPromise = uaData
        .getHighEntropyValues(['architecture', 'bitness'])
        .then((hints) => {
          const arch = hints.architecture;
          const bitness = hints.bitness;
          const archName = arch === 'x86' ? 'x86' : arch === 'arm' ? 'ARM' : arch;

          if (archName && bitness) {
            return `${archName} (${bitness}-bit)`;
          }
          return detectArchitectureFromUA();
        })
        .catch(() => detectArchitectureFromUA());

      return await Promise.race([hintsPromise, timeoutPromise]);
    }

    return detectArchitectureFromUA();
  } catch {
    return detectArchitectureFromUA();
  }
}
