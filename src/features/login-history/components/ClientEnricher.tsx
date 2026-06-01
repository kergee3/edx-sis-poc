'use client';

import { useEffect } from 'react';
import { getCoreInfo } from '@/lib/utils/core-info';
import type { UserAgentBrand } from '@/server/db/turso/schema/login-history';
import { enrichLatestLoginAction } from '../actions';
import type { ClientEnrichment } from '../schema/enrichment';

interface UserAgentDataLike {
  platform?: string;
  mobile?: boolean;
  brands?: UserAgentBrand[];
}

type ExtendedNavigator = Navigator & {
  userAgentData?: UserAgentDataLike;
  deviceMemory?: number;
};

async function collectEnrichment(): Promise<ClientEnrichment> {
  const core = await getCoreInfo();
  const nav = navigator as ExtendedNavigator;
  const uaData = nav.userAgentData;

  return {
    os: core.os,
    browser: core.browser,
    architecture: core.architecture,
    physicalWidth: Math.round(window.screen.width * window.devicePixelRatio),
    physicalHeight: Math.round(window.screen.height * window.devicePixelRatio),
    logicalWidth: window.innerWidth,
    logicalHeight: window.innerHeight,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemoryGb: nav.deviceMemory ?? null,
    maxTouchPoints: nav.maxTouchPoints,
    userAgent: nav.userAgent,
    uaPlatform: uaData?.platform ?? null,
    uaMobile: uaData?.mobile ?? null,
    uaBrands: uaData?.brands ?? null,
  };
}

export default function ClientEnricher() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await collectEnrichment();
        if (cancelled) return;
        await enrichLatestLoginAction(data);
      } catch (error) {
        console.error('Failed to enrich login history:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
