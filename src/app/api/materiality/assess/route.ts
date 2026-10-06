import { NextResponse } from 'next/server';
import { syncEngine } from '../../../../lib/supabase-sync-engine';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topics, threshold, year } = body;

    // 1. 生成 5T Hash Lock
    // 透過將輸入資料與時間戳雜湊，形成不可篡改的證據
    const timestamp = Date.now();
    const payloadString = JSON.stringify({ topics, threshold, year, timestamp });
    const hashLock = '0x' + crypto.createHash('sha256').update(payloadString).digest('hex');

    // 2. 準備寫入資料庫的 Payload
    const payload = {
      uuid: crypto.randomUUID(),
      year: year || new Date().getFullYear(),
      threshold: threshold,
      topics_snapshot: topics, // 凍結當下的議題評分
      hash_lock: hashLock,
      status: 'sealed',
      source_origin: 'A04_MATERIALITY_MATRIX',
      timestamp: timestamp,
    };

    // 3. 透過 SyncEngine 將任務推入佇列，確保必定寫入 Supabase (即使短暫斷線)
    // 對應的 Table 名稱為 MaterialityAssessments
    syncEngine.pushTask('MaterialityAssessments', 'INSERT', payload);

    // 4. 同步寫入 OmniTrace 日誌 (A01 全通中樞可見)
    syncEngine.pushTask('OmniTraceLogs', 'INSERT', {
      uuid: crypto.randomUUID(),
      timestamp: new Date(timestamp).toISOString(),
      originCause: `A04 雙重重大性封印 (Threshold: ${threshold})`,
      hashLock: hashLock,
      type: 'seal',
      agent: 'OmniNexus'
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
    console.error('Materiality assess error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
