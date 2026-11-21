/**
 * ==========================================
 * 完全代主自行 - 委派事件指標 API（監控/分析消費者）
 * ==========================================
 *
 * 暴露委派事件觀測器的聚合指標（對齊「全域・全量」不變量）：
 * - 全域聚合（無 delegationId）：僅回傳計數，不含 delegation 識別碼（最小暴露）。
 * - 單一 delegation（?delegationId=）：須具備 monitor / full 權限，
 *   回傳該 delegation 的事件聚合。
 *
 * 路由:
 * - GET /api/delegation/metrics[?delegationId=xxx]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDelegationManager } from '../../../../agents/complete-delegation';
import { getDelegationMetrics } from '../../../../agents/complete-delegation/metrics';
import { ERROR_CODES } from '@esggo/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const delegationId = searchParams.get('delegationId');
    const manager = getDelegationManager();
    const metrics = getDelegationMetrics();

    // 單一 delegation：須 monitor / full 權限（與 audit / stream 端點一致）
    if (delegationId) {
      const delegation = await manager.getDelegation(delegationId);
      if (!delegation) {
        return NextResponse.json({ error: 'Delegation not found' }, { status: 404 });
      }

      const canMonitor = await manager.validateDelegation(delegationId, 'monitor');
      if (!canMonitor) {
        return NextResponse.json(
          {
            error:
              'Insufficient permissions: metrics requires monitor (or full) permission',
          },
          { status: 403 }
        );
      }

      const snap = metrics.getDelegationSnapshot(delegationId);
      return NextResponse.json({
        success: true,
        delegationId,
        total: snap.total,
        byType: snap.byType,
        lastSeenAt: snap.lastSeenAt,
        alerts: snap.alerts,
      });
    }

    // 全域聚合：僅計數，不含 delegation 識別碼（對齊 monitor 不變量之最小暴露）
    const snap = metrics.getSnapshot();
    return NextResponse.json({
      success: true,
      startedAt: snap.startedAt,
      lastSeenAt: snap.lastSeenAt,
      total: snap.total,
      byType: snap.byType,
      activeDelegations: snap.activeDelegations,
      alerts: snap.alerts,
    });
  } catch (error) {
    console.error('[Delegation Metrics API] 取得指標失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}
