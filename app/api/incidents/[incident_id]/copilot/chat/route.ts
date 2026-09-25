import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Unsupported backend capability',
      detail: 'The authoritative PermiSense backend currently exposes grounded incident copilot at /api/incidents/{incident_id}/copilot, but no copilot chat endpoint.',
    },
    { status: 501 }
  );
}
