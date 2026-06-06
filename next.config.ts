import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: packageJson.version,
    BUILD_YEAR: new Date().getFullYear().toString(),
    BUILD_MONTH: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  },
  turbopack: {},

  // 名簿シード/初期化はサーバ実行時に public/poc-data/master-student-roster.xlsx を読む。
  // public/ は既定では Function バンドルに含まれないため、該当ルートへ明示的に含める。
  outputFileTracingIncludes: {
    '/students': ['./public/poc-data/master-student-roster.xlsx'],
    '/settings': ['./public/poc-data/master-student-roster.xlsx'],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'ch-ua-arch=*, ch-ua-bitness=*, ch-ua-platform=*, ch-device-memory=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
