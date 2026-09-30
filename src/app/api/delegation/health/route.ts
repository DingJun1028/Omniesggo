/**
 * ==========================================
 * 完全代主自行 - 委派系統健康檢查 API
 * ==========================================
 *
 * GET /api/delegation/health
 *   → 委派系統健康狀態（journal + metrics + 事件流活性 + 告警）
 *   → 回傳 HTTP 200 (healthy/degraded) 或 503 (unhealthy)
 *   → 無需認證（Kubernetes readiness probe / 外部監控使用）
 */

import { NextResponse } from 'next/server';
import { checkDelegationHealth } from '../../../../../agents/complete-delegation/health';
import { ERROR_CODES } from '@esggo/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const report = await checkDelegationHealth();
    const statusCode = report.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(report, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[API/delegation/health] Error:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
        checks: [],
      },
      { status: 503 }
    );
  }
}
