import { NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = virtualCell.triggerSpeedScenario();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Scenario Trigger Failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
