import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  const incident = virtualCell.getIncident(incident_id);

  if (!incident) {
    return NextResponse.json(
      { error: `Incident ${incident_id} not found`, detail: 'No correlated incident matching specified ID.' },
      { status: 404 }
    );
  }

  return NextResponse.json(incident);
}
