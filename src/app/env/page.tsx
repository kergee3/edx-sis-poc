'use client';

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Box,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import { useState, useEffect } from 'react';
import { getCoreInfo } from '@/lib/utils/core-info';
import { fetchServerInfo, type ServerInfo } from '@/lib/utils/server-info';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import AppFooter from '@/components/layout/AppFooter';

interface UserAgentData {
  brands: { brand: string; version: string }[];
  mobile: boolean;
  platform: string;
}

interface ApiSupport {
  permissions: boolean;
  geolocation: boolean;
  mediaDevices: boolean;
  clipboard: boolean;
  serviceWorker: boolean;
  storage: boolean;
}

interface EnvInfo {
  os: string;
  browser: string;
  architecture: string;
  physicalResolution: string;
  logicalResolution: string;
  userAgent: string;
  devicePixelRatio: number;
  language: string;
  languages: string;
  onLine: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  maxTouchPoints: number;
  userAgentData: UserAgentData | undefined;
  apiSupport: ApiSupport;
}

type ExtendedNavigator = Navigator & {
  userAgentData?: {
    brands?: { brand: string; version: string }[];
    mobile?: boolean;
    platform?: string;
  };
  deviceMemory?: number;
};

interface DetailRow {
  label: string;
  value: React.ReactNode;
}

const EMPTY_VALUE = '(なし)';
const UNAVAILABLE = '取得不可';

function formatUaBrands(brands: { brand: string; version: string }[] | undefined): string {
  if (!brands || brands.length === 0) return UNAVAILABLE;
  return brands.map((b) => `${b.brand} ${b.version}`).join(', ');
}

function formatApiSupport(api: ApiSupport): string {
  return Object.entries(api)
    .map(([key, ok]) => `${key}: ${ok ? 'Yes' : 'No'}`)
    .join(', ');
}

function buildClientRows(env: EnvInfo): DetailRow[] {
  return [
    { label: 'OS', value: env.os },
    { label: 'ブラウザ', value: env.browser },
    { label: 'アーキテクチャ', value: env.architecture },
    { label: '物理解像度', value: env.physicalResolution },
    { label: '論理解像度', value: env.logicalResolution },
    { label: 'CPU 論理コア数', value: env.hardwareConcurrency },
    {
      label: 'デバイスメモリ',
      value: env.deviceMemory ? `${env.deviceMemory} GB` : UNAVAILABLE,
    },
    { label: 'タッチポイント', value: env.maxTouchPoints },
    { label: 'User Agent', value: env.userAgent },
    { label: 'UA Platform', value: env.userAgentData?.platform || UNAVAILABLE },
    {
      label: 'UA Mobile',
      value: env.userAgentData ? (env.userAgentData.mobile ? 'Yes' : 'No') : UNAVAILABLE,
    },
    { label: 'UA Brands', value: formatUaBrands(env.userAgentData?.brands) },
    { label: 'デバイスピクセル比', value: env.devicePixelRatio },
    { label: '言語', value: env.language },
    { label: '対応言語', value: env.languages },
    { label: 'オンライン', value: env.onLine ? 'Yes' : 'No' },
    { label: 'API 対応', value: formatApiSupport(env.apiSupport) },
  ];
}

function buildServerRows(server: ServerInfo | null, clientUserAgent: string): DetailRow[] {
  const geo = server?.geo;
  const latLng =
    geo?.latitude && geo?.longitude ? `${geo.latitude}, ${geo.longitude}` : EMPTY_VALUE;
  const serverUa = server?.userAgent
    ? server.userAgent === clientUserAgent
      ? 'User Agent と同じ'
      : server.userAgent
    : EMPTY_VALUE;
  return [
    { label: 'IP アドレス', value: server?.ip || EMPTY_VALUE },
    { label: '国 (Geo)', value: geo?.country || EMPTY_VALUE },
    { label: '都市 (Geo)', value: geo?.city || EMPTY_VALUE },
    { label: '地域 (Geo)', value: geo?.region || EMPTY_VALUE },
    { label: '緯度/経度 (Geo)', value: latLng },
    { label: 'Referer', value: server?.referer || EMPTY_VALUE },
    { label: 'User Agent\n(Server)', value: serverUa },
  ];
}

function ChipRow<T extends string>({
  options,
  current,
}: {
  options: readonly T[];
  current: T | null;
}) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {options.map((opt) => {
        const active = opt === current;
        return (
          <Chip
            key={opt}
            label={opt}
            size="small"
            color={active ? 'primary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
          />
        );
      })}
    </Stack>
  );
}

function DetailSection({ title, rows }: { title: string; rows: DetailRow[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    whiteSpace: 'pre',
                    width: '1px',
                    pr: 1,
                  }}
                >
                  {row.label}
                </TableCell>
                <TableCell sx={{ wordBreak: 'break-word', pl: 1 }}>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function EnvPage() {
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const deviceInfo = useDeviceDetection();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  useEffect(() => {
    const loadServerInfo = async () => {
      const data = await fetchServerInfo();
      setServerInfo(data);
    };
    loadServerInfo();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadEnvInfo = async () => {
      const coreInfo = await getCoreInfo();
      if (!isMounted) return;

      const nav = navigator as ExtendedNavigator;
      const ua = nav.userAgent;
      const uaData = nav.userAgentData;

      const physicalWidth = Math.round(window.screen.width * window.devicePixelRatio);
      const physicalHeight = Math.round(window.screen.height * window.devicePixelRatio);
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;

      setEnvInfo({
        os: coreInfo.os,
        browser: coreInfo.browser,
        architecture: coreInfo.architecture,
        physicalResolution: `${physicalWidth} × ${physicalHeight}`,
        logicalResolution: `${logicalWidth} × ${logicalHeight}`,
        userAgent: ua,
        devicePixelRatio: window.devicePixelRatio,
        language: nav.language,
        languages: nav.languages.join(', '),
        onLine: nav.onLine,
        hardwareConcurrency: nav.hardwareConcurrency,
        deviceMemory: nav.deviceMemory,
        maxTouchPoints: nav.maxTouchPoints,
        userAgentData: uaData
          ? {
              brands: uaData.brands ?? [],
              mobile: uaData.mobile ?? false,
              platform: uaData.platform ?? '',
            }
          : undefined,
        apiSupport: {
          permissions: 'permissions' in nav,
          geolocation: 'geolocation' in nav,
          mediaDevices: 'mediaDevices' in nav,
          clipboard: 'clipboard' in nav,
          serviceWorker: 'serviceWorker' in nav,
          storage: 'storage' in nav,
        },
      });
    };

    loadEnvInfo();

    const handleResize = () => {
      const physicalWidth = Math.round(window.screen.width * window.devicePixelRatio);
      const physicalHeight = Math.round(window.screen.height * window.devicePixelRatio);
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;

      setEnvInfo((prev) =>
        prev
          ? {
              ...prev,
              physicalResolution: `${physicalWidth} × ${physicalHeight}`,
              logicalResolution: `${logicalWidth} × ${logicalHeight}`,
            }
          : null,
      );
    };

    window.addEventListener('resize', handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!envInfo) return null;

  const currentDevice: 'mobile' | 'tablet' | 'desktop' = deviceInfo.isMobile
    ? 'mobile'
    : deviceInfo.isTablet
      ? 'tablet'
      : 'desktop';
  const currentOrientation: 'portrait' | 'landscape' = deviceInfo.isPortrait
    ? 'portrait'
    : 'landscape';
  const currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null = isXs
    ? 'xs'
    : isSm
      ? 'sm'
      : isMd
        ? 'md'
        : isLg
          ? 'lg'
          : isXl
            ? 'xl'
            : null;

  const summaryRows: DetailRow[] = [
    {
      label: 'デバイスタイプ',
      value: (
        <ChipRow options={['mobile', 'tablet', 'desktop'] as const} current={currentDevice} />
      ),
    },
    {
      label: '画面の向き',
      value: (
        <ChipRow options={['portrait', 'landscape'] as const} current={currentOrientation} />
      ),
    },
    {
      label: 'MUI breakpoint',
      value: (
        <ChipRow
          options={['xs', 'sm', 'md', 'lg', 'xl'] as const}
          current={currentBreakpoint}
        />
      ),
    },
  ];

  const clientRows = buildClientRows(envInfo);
  const serverRows = buildServerRows(serverInfo, envInfo.userAgent);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ComputerIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ mb: 0 }}>
            実行環境
          </Typography>
        </Box>

        <DetailSection title="デバイスと画面の概要" rows={summaryRows} />
        <Box sx={{ mt: 3 }}>
          <DetailSection title="クライアントで取得した情報" rows={clientRows} />
        </Box>
        <Box sx={{ mt: 3 }}>
          <DetailSection title="サーバーで取得した情報" rows={serverRows} />
        </Box>

        <AppFooter />
      </CardContent>
    </Card>
  );
}
