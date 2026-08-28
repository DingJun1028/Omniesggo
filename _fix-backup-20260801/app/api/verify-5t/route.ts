// app/api/verify-5t/route.ts
// ============================================================================
// verify-5t — 5T 協議統一驗證端點 (Single Source of Truth)
//   供 OA-Team 30 蜂群所有子系統 (含 aistation Python 端) 呼叫,
//   確保 5T 判定邏輯只有一份 (esggo oa-framework / five-t-protocol).
//   aistation gate5t.verify_via_esggo() 改呼叫此端點, 取代本地重複實作.
//
//   認證: 無 (純計算服務, 不讀寫持久化; 與 /api/hashlock 同級)
//   POST { 5T 欄位 } -> { pass, status, score, hashLock }
//     欄位對齊 aistation gate5t.verify_5t 的 artifact 契約:
//       source_origin (str) | sources (str[] 多源, >=4 過 traceable 權威閘)
//       lifecycle_hooks (list) | ui_feedback (any)
//       transparent_audit (bool) | frozen (bool)
// ============================================================================
import { NextResponse } from 'next/server';
import { calculateFiveTScore, FiveTGatekeeper, FiveTHashLock } from '@/lib/five-t-protocol';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

export const dynamic = 'force-dynamic';

interface VerifyBody {
  source_origin?: string;
  sources?: unknown;
  lifecycle_hooks?: unknown[];
  ui_feedback?: unknown;
  transparent_audit?: boolean;
  frozen?: boolean;
}

export async function POST(request: Request) {
  try {
    const secret = process.env.VERIFY_5T_SECRET;
    if (secret) {
      const signature = request.headers.get('x-signature-256');
      const payload = await request.clone().text();
      if (!verifyWebhookSignature(payload, signature, secret)) {
        return NextResponse.json({ error: 'UNAUTHORIZED', pass: false }, { status: 401 });
      }
    }
    const body = (await request.json()) as VerifyBody;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'MISSING_BODY', pass: false }, { status: 400 });
    }

    // 映射 aistation 欄位 -> esggo FiveTScore (單一真相源計算)
    // sources: 多源陣列 (aistation 補 sources 欄位; 舊版僅 source_origin 單源)
    const srcList: string[] = Array.isArray(body.sources)
      ? (body.sources as unknown[]).filter((s): s is string => typeof s === "string")
      : body.source_origin
        ? [body.source_origin]
        : [];
    const score = calculateFiveTScore({
      sources: srcList,
      algorithmVerified: Boolean(body.transparent_audit),
      metricsProgress: body.ui_feedback ? 1.0 : 0.5,
      hashLocked: Boolean(body.frozen),
      eventsCount: Array.isArray(body.lifecycle_hooks) ? body.lifecycle_hooks.length : 0,
    });

    const status = FiveTGatekeeper.evaluate(score);
    const pass = FiveTGatekeeper.allPass(status);
    const hashLock = FiveTHashLock.generate('verify-5t', JSON.stringify(body));

    return NextResponse.json({
      pass,
      status,
      score,
      hashLock,
      source: 'esggo-five-t-protocol',
    });
  } catch (error: unknown) {
    console.error('[API/VERIFY-5T] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'INTERNAL', pass: false }, { status: 500 });
  }
}

// GET 僅回傳服務資訊, 不執行寫入
export async function GET() {
  return NextResponse.json({
    service: 'verify-5t',
    source: 'esggo-five-t-protocol',
    dimensions: ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'],
    note: 'POST 5T fields to verify gate; single source of truth for OA-Team 30 swarm',
  });
}
