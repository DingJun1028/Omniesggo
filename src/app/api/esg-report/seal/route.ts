import { NextResponse } from 'next/server';
import { syncEngine } from '../../../../lib/supabase-sync-engine';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chapterId, content, metadata } = body;

    // 1. 生成 5T Hash Lock
    // 將章節內容與中繼資料進行雜湊，達成不可竄改存證
    const timestamp = Date.now();
    const payloadString = JSON.stringify({ chapterId, content, metadata, timestamp });
    const hashLock = '0x' + crypto.createHash('sha256').update(payloadString).digest('hex');

    // 2. 寫入 Supabase (透過 SyncEngine 佇列)
    const payload = {
      uuid: crypto.randomUUID(),
      chapter_id: chapterId,
      content: content,
      metadata: metadata,
      hash_lock: hashLock,
      status: 'sealed',
      source_origin: 'A02_ESG_REPORT',
      timestamp: timestamp,
    };

    // 目標 Table：ESGReportSeals
    syncEngine.pushTask('ESGReportSeals', 'INSERT', payload);

    // 3. 觸發 OmniTrace 系統全域廣播
    syncEngine.pushTask('OmniTraceLogs', 'INSERT', {
      uuid: crypto.randomUUID(),
      timestamp: new Date(timestamp).toISOString(),
      originCause: `A02 報告封印 (章節: ${chapterId})`,
      hashLock: hashLock,
      type: 'seal',
      agent: 'Antigravity'
    });

    return NextResponse.json({
      success: true,
      data: {
        hashLock,
        timestamp,
        uuid: payload.uuid
      }
    });
  } catch (error: any) {
    console.error('ESG Report seal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
