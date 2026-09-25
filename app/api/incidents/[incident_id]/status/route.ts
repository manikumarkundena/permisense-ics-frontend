import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RECOVERED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status', detail: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = virtualCell.updateIncidentStatus(incident_id, status);
    if (!updated) {
      return NextResponse.json(
        { error: 'Not found', detail: `Incident ${incident_id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: 'Bad Request', detail: (err as Error).message },
      { status: 400 }
    );
  }
}
