import { NextResponse } from 'next/server';
import { syncEngine } from '@/lib/supabase-sync-engine';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplier, year } = body;

    // 1. 生成 5T Hash Lock
    const timestamp = Date.now();
    const payloadString = JSON.stringify({ supplier, year, timestamp });
    const hashLock = '0x' + crypto.createHash('sha256').update(payloadString).digest('hex');

    // 2. 準備寫入資料庫的 Payload
    const payload = {
      uuid: crypto.randomUUID(),
      supplier_name: supplier.name,
      tier: supplier.tier,
      rating: supplier.rating,
      risk_level: supplier.riskLevel,
      env_score: supplier.envScore,
      social_score: supplier.socialScore,
      gov_score: supplier.govScore,
      strengths: JSON.stringify(supplier.strengths),
      weaknesses: JSON.stringify(supplier.weaknesses),
      hash_lock: hashLock,
      status: 'sealed',
      source_origin: 'A05_SUPPLY_CHAIN',
      timestamp: timestamp,
    };

    // 3. 透過 SyncEngine 將任務推入佇列
    syncEngine.pushTask('SupplyChainVendors', 'INSERT', payload);

    // 4. 同步寫入 OmniTrace 日誌
    syncEngine.pushTask('OmniTraceLogs', 'INSERT', {
      uuid: crypto.randomUUID(),
      timestamp: new Date(timestamp).toISOString(),
      originCause: `A05 供應商封印: ${supplier.name} (${supplier.rating})`,
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
    console.error('Supply chain seal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
