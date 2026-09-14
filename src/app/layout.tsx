import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Analytics } from '@vercel/analytics/next';
import { theme } from '@/theme';
import { GYOSEI_FONT_CSS_URL, GYOSEI_FONT_ORIGINS } from '@/theme/fonts';
import { auth } from '@/server/auth/config';
import type { SessionUserView } from '@/features/auth/types';
import "./globals.css";
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: "SIS-PoC",
  description:
    "GyoseiHyojunMincho Web フォントを活かした校務支援システムの実証実験 (SIS-PoC / Student Information System - Proof of Concept)",
  keywords: ["SIS-PoC", "校務支援システム", "文字情報基盤", "GyoseiHyojunMincho", "行政事務標準文字", "Webフォント"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIS-PoC",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1976d2',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user: SessionUserView = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        isGuest: session.user.isGuest,
      }
    : null;

  return (
    <html lang="ja">
      <head>
        {/* 氏名表示用の GyoseiHyojunMincho Web フォント（CDN 配信の 2560 サブセット CSS）。
            CSS 自身と woff2 本体（MJ / GJ）でオリジンが分かれるため preconnect は複数出す。 */}
        {GYOSEI_FONT_ORIGINS.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
        ))}
        <link rel="stylesheet" href={GYOSEI_FONT_CSS_URL} />
        {/* 表示名（JIS文字）用の Noto Web フォント（Google Fonts 配信）。
            ゴシック（Sans）／明朝（Serif）をユーザ設定で切り替えるため両方読み込む。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ClientLayout user={user}>{children}</ClientLayout>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <Analytics />
      </body>
    </html>
  );
}
