// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Learning Center API — NCBDB 模式 (GCP Firebase 已停用, 力度 1, 2026-08-25)
 *
 * 2026-08-25 用戶指示「改用 NCBDB」: 資料層改接 NoCodeBackend (ncbQuery),
 * 移除 Firebase/Firestore 依賴。NCBDB 無 API Key 時優雅回傳空陣列 (模擬模式)。
 */

import { NextResponse } from 'next/server';
import { ncbQuery } from '@lib/ncb-utils';

export async function GET() {
  try {
    const courses = await ncbQuery<Array<Record<string, unknown>>>({
      table: 'OmniData',
      method: 'GET',
      params: { type: 'course', status: 'published' },
    });

    const cleaned = (Array.isArray(courses) ? courses : []).map((doc) => {
      const plain = { ...doc };
      delete (plain as { __METHOD__?: unknown }).__METHOD__;
      delete (plain as { __CALLBACKS__?: unknown }).__CALLBACKS__;
      return plain;
    });

    return NextResponse.json({ ok: true, data: cleaned }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/learning-center GET error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to load learning center data' }, { status: 500 });
  }
}
