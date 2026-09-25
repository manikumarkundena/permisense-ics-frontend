import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Unsupported backend capability',
      detail: 'The frontend no longer resets a local virtual cell. Reset must be driven by the authoritative industrial lab/backend.',
    },
    { status: 501 }
  );
}
