import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });

  const limit = req.nextUrl.searchParams.get('limit') || '50';
  const response = await fetch(`${base}/api/telemetry/events?limit=${encodeURIComponent(limit)}`, { cache: 'no-store' });
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
  });
}
