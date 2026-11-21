/**
 * ==========================================
 * 完全代主自行 - 特定授權 API 路由
 * ==========================================
 * 
 * REST API 端點 for 特定授權操作
 * 
 * 路由:
 * - GET /api/delegation/[id] - 獲取特定授權
 * - DELETE /api/delegation/[id] - 終止授權
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDelegationManager } from '../../../../agents/complete-delegation';
import { ERROR_CODES } from '@esggo/errors';

// ==========================================
// GET /api/delegation/[id] - 獲取特定授權
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Delegation ID is required' },
        { status: 400 }
      );
    }

    const manager = getDelegationManager();
    const delegation = await manager.getDelegation(id);

    if (!delegation) {
      return NextResponse.json(
        { error: 'Delegation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      delegation: {
        delegationId: delegation.delegationId,
        agentId: delegation.agentId,
        principalId: delegation.principalId,
        permissions: delegation.permissions,
        restrictions: delegation.restrictions,
        validFrom: delegation.validFrom,
        validUntil: delegation.validUntil,
        description: delegation.description,
        metadata: delegation.metadata,
      },
    });

  } catch (error) {
    console.error('[Delegation API] 獲取授權失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/delegation/[id] - 終止授權
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Delegation ID is required' },
        { status: 400 }
      );
    }

    // 獲取終止原因
    let reason = 'User terminated';
    try {
      const body = await request.json();
      reason = body.reason ?? reason;
    } catch {
      // 如果沒有 body，使用預設原因
    }

    const manager = getDelegationManager();
    
    // 檢查授權是否存在
    const delegation = await manager.getDelegation(id);
    if (!delegation) {
      return NextResponse.json(
        { error: 'Delegation not found' },
        { status: 404 }
      );
    }

    // 終止授權
    await manager.terminateDelegation(id, reason);

    return NextResponse.json({
      success: true,
      message: 'Delegation terminated successfully',
      delegationId: id,
      reason,
    });

  } catch (error) {
    console.error('[Delegation API] 終止授權失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}
