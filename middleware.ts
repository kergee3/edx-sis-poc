export { auth as middleware } from '@/server/auth/config';

export const config = {
  matcher: [
    /**
     * middleware はログイン要否の判定に限定する。
     * 具体的な権限チェックは Server Action / Route Handler / service 層で行う。
     */
    '/account/:path*',
    '/env/:path*',
    '/login-history/:path*',
  ],
};
