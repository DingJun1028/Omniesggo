// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Learning Center Support API — NCBDB 模式 (GCP Firebase 已停用, 力度 1, 2026-08-25)
 *
 * 2026-08-25 用戶指示「改用 NCBDB」: 資料層改接 ncbQuery, 移除 firebase-admin 依賴。
 */

import { NextResponse } from 'next/server';
import { ncbQuery } from '@/lib/ncb-utils';

function isNcbdbConfigured(): boolean {
  return !!process.env.NCB_API_KEY;
}

export async function GET() {
  try {
    if (isNcbdbConfigured()) {
      const rows = await ncbQuery<Array<Record<string, unknown>>>({
        table: 'OmniData',
        method: 'GET',
        params: { type: 'support_ticket', orderBy: 'createdAt', order: 'desc', limit: '200' },
      });
      return NextResponse.json({ ok: true, rows: Array.isArray(rows) ? rows : [] }, { status: 200 });
    }
    // 未設定 NCBDB → 空陣列 (模擬模式)
    return NextResponse.json({ ok: true, rows: [] }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/learning-center/support GET error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to load support tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const row = {
      type: 'support_ticket',
      ...payload,
      status: payload.status || 'open',
      priority: payload.priority || 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNcbdbConfigured()) {
      const result = await ncbQuery<{ id?: string }>({
        table: 'OmniData',
        method: 'POST',
        body: row,
      });
      return NextResponse.json({ ok: true, id: result?.id ?? 'unknown' }, { status: 201 });
    }

    // 未設定 NCBDB → 模擬回應
    return NextResponse.json({ ok: true, id: 'mock_' + Date.now() }, { status: 201 });
  } catch (error) {
    console.error('[API] /api/learning-center/support POST error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to create support ticket' }, { status: 500 });
  }
}
