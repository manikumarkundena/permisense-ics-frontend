import { NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function POST() {
  const state = virtualCell.resetDemo();
  return NextResponse.json({
    success: true,
    message: 'Virtual industrial cell reset to safe nominal baseline.',
    state,
  });
}
