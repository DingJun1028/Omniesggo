import { NextResponse } from 'next/server';
import { getJunaikeyTelemetry } from '../../../../sdks/omni-one/src/junaikey-gate';

// 雷達的授權與密鑰層: 只回傳狀態 (是否存在、來源名稱)，不回傳任何 secret 值。
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getJunaikeyTelemetry(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
