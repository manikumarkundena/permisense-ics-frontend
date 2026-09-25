import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API_URL) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });

  const [health, system] = await Promise.all([
    fetch(`${API_URL.replace(/\/$/, '')}/api/health`, { cache: 'no-store' }),
    fetch(`${API_URL.replace(/\/$/, '')}/api/system/status`, { cache: 'no-store' }),
  ]);

  return NextResponse.json({
    source: 'real-backend',
    health: await health.json(),
    system: await system.json(),
  }, { status: health.ok && system.ok ? 200 : 502 });
}
