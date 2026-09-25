import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  try {
    const result = virtualCell.verifyRecovery(incident_id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Verification Failed', detail: (err as Error).message },
      { status: 400 }
    );
  }
}
