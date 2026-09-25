import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.4.0',
    mode: 'VIRTUAL_ICS_CELL_MODBUS_TCP',
  });
}
