import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/session';

const ALLOW_ALL_ORIGINS = true;

function isAllowedOrigin(origin: string | null): boolean {
  if (ALLOW_ALL_ORIGINS) return true;
  if (!origin) return false;
  if (origin.startsWith('http://localhost:')) return true;
  return false;
}

function getCorsHeaders(origin: string | null) {
  if (ALLOW_ALL_ORIGINS) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  const allowedOrigin = isAllowedOrigin(origin) ? origin : null;
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: getCorsHeaders(request.headers.get('origin')) },
    );
  }

  const headers = request.headers;
  const origin = headers.get('origin');

  return NextResponse.json(
    {
      userAgent: headers.get('user-agent') || '',
      ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || '',
      referer: headers.get('referer') || '',
      acceptLanguage: headers.get('accept-language') || '',
      acceptEncoding: headers.get('accept-encoding') || '',
      host: headers.get('host') || '',
      xForwardedProto: headers.get('x-forwarded-proto') || '',
      xVercelDeploymentUrl: headers.get('x-vercel-deployment-url') || '',
      xVercelIpTimezone: headers.get('x-vercel-ip-timezone') || '',
      geo: {
        country: headers.get('x-vercel-ip-country') || '',
        city: headers.get('x-vercel-ip-city') || '',
        region: headers.get('x-vercel-ip-country-region') || '',
        latitude: headers.get('x-vercel-ip-latitude') || '',
        longitude: headers.get('x-vercel-ip-longitude') || '',
      },
    },
    { headers: getCorsHeaders(origin) },
  );
}
