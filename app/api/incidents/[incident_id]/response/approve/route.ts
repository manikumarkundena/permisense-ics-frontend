import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  try {
    const body = await req.json();
    const { action, approved_by } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action', detail: 'An explicit allowlisted response action is required.' },
        { status: 400 }
      );
    }

    if (!approved_by) {
      return NextResponse.json(
        { error: 'Missing approver', detail: 'Explicit human operator identification is required.' },
        { status: 400 }
      );
    }

    const result = virtualCell.approveResponse(incident_id, action, approved_by);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Approval Failed', detail: (err as Error).message },
      { status: 400 }
    );
  }
}
