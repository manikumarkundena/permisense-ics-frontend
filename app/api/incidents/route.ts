import { NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function GET() {
  const incidents = virtualCell.getIncidents();
  return NextResponse.json(incidents);
}
