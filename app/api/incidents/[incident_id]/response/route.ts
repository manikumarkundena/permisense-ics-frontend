import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  const plan = virtualCell.getResponsePlan(incident_id);

  if (!plan) {
    return NextResponse.json(
      { error: 'Not found', detail: `No response plan available for incident ${incident_id}.` },
      { status: 404 }
    );
  }

  return NextResponse.json(plan);
}
