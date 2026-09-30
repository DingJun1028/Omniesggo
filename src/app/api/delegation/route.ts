/**
 * ==========================================
 * 完全代主自行 - API 路由
 * ==========================================
 * 
 * REST API 端點 for 完全代主自行系統
 * 
 * 路由:
 * - POST /api/delegation - 創建授權
 * - GET /api/delegation - 獲取活躍授權列表
 * - GET /api/delegation/[id] - 獲取特定授權
 * - DELETE /api/delegation/[id] - 終止授權
 * - POST /api/delegation/[id]/execute - 執行任務
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCompleteDelegationAgent,
  getDelegationManager,
} from '../../../agents/complete-delegation';
import { DelegationPermission } from '../../../types/complete-delegation';
import { ERROR_CODES } from '@esggo/errors';

// ==========================================
// POST /api/delegation - 創建授權
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      principalId,
      agentId,
      permissions,
      validUntil,
      description,
    } = body;

    // 驗證必要參數
    if (!principalId) {
      return NextResponse.json(
        { error: 'principalId is required' },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: 'permissions array is required' },
        { status: 400 }
      );
    }

    // 驗證權限有效性
    const validPermissions: DelegationPermission[] = [
      'read', 'write', 'execute', 'decide', 'delegate', 'govern', 'audit', 'monitor', 'full',
    ];
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json(
          { error: `Invalid permission: ${perm}` },
          { status: 400 }
        );
      }
    }

    // 創建代理
    const agent = await createCompleteDelegationAgent({
      principalId,
      agentId,
      permissions,
      validUntil,
      description,
    });

    return NextResponse.json({
      success: true,
      delegation: {
        delegationId: agent.delegationScope.delegationId,
        agentId: agent.signature.uuid,
        principalId: agent.principal,
        permissions: agent.delegationScope.permissions,
        validFrom: agent.delegationScope.validFrom,
        validUntil: agent.delegationScope.validUntil,
        description: agent.delegationScope.description,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[Delegation API] 創建授權失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET /api/delegation - 獲取活躍授權列表
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const principalId = searchParams.get('principalId');

    const manager = getDelegationManager();
    const delegations = await manager.getActiveDelegations(principalId ?? undefined);

    return NextResponse.json({
      success: true,
      delegations: delegations.map((d) => ({
        delegationId: d.delegationId,
        agentId: d.agentId,
        principalId: d.principalId,
        permissions: d.permissions,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        description: d.description,
      })),
      count: delegations.length,
    });

  } catch (error) {
    console.error('[Delegation API] 獲取授權列表失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}
