/**
 * ==========================================
 * 完全代主自行 - 審計軌跡 API
 * ==========================================
 *
 * 暴露授權生命週期的審計軌跡（DELEGATION_CREATED / DELEGATION_VALIDATED /
 * DELEGATION_TERMINATED），並以 monitor 權限把關（端對端收尾 #3）。
 *
 * 路由:
 * - GET /api/delegation/audit?delegationId=xxx - 取得授權審計軌跡（需 monitor 權限）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDelegationManager } from '../../../../agents/complete-delegation';
import { ERROR_CODES } from '@esggo/errors';

// ==========================================
// GET /api/delegation/audit - 取得授權審計軌跡
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const delegationId = searchParams.get('delegationId');

    if (!delegationId) {
      return NextResponse.json(
        { error: 'delegationId is required' },
        { status: 400 }
      );
    }

    const manager = getDelegationManager();
    const delegation = await manager.getDelegation(delegationId);
    if (!delegation) {
      return NextResponse.json(
        { error: 'Delegation not found' },
        { status: 404 }
      );
    }

    // 僅具備 monitor / full 權限者可觀測審計軌跡（收尾 monitor 權限接線）
    const canMonitor = await manager.validateDelegation(delegationId, 'monitor');
    if (!canMonitor) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions: audit trail requires monitor (or full) permission',
        },
        { status: 403 }
      );
    }

    // 全量審計軌跡（對齊「全量」不變量：含持久層全量日誌）
    const entries = await manager.getFullAuditTrail(delegationId);

    return NextResponse.json({
      success: true,
      delegationId,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error('[Delegation Audit API] 取得審計軌跡失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}
