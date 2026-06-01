import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: packageJson.version,
    BUILD_YEAR: new Date().getFullYear().toString(),
    BUILD_MONTH: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  },
  turbopack: {},

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
