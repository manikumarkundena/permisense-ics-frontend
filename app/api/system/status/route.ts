import { NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = virtualCell.getSystemStatus();
  return NextResponse.json(status);
}
