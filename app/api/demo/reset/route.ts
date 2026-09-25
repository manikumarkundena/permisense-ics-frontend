import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Reset is not exposed by the authoritative backend API.',
      detail: 'Use the virtual PLC/industrial lab baseline controls directly; the frontend will not fabricate a reset operation.',
    },
    { status: 501 }
  );
}
