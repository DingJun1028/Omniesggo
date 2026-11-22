// ═══════════════════════════════════════════════════════════════
// /api/omni-knowledge-base/[uuid]/seal — 封存知識庫 API
//
// POST: 封存知識庫（Hash Lock + Object.freeze()）
// 5T Trustworthy: 封存後不可篡改
// ═══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import {
  knowledgeBaseRegistry,
  sealKnowledgeBase,
  type SealedKnowledgeBase,
} from '@/lib/omni-core/index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/omni-knowledge-base/[uuid]/seal
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return jsonError('INVALID_PARAMS', '缺少必要參數: uuid', 400);
    }

    const kb = knowledgeBaseRegistry.get(uuid);
    if (!kb) {
      return jsonError('NOT_FOUND', `知識庫不存在: ${uuid}`, 404);
    }

    if (kb.locked) {
      return jsonError('CONFLICT', `知識庫已封存: ${uuid}`, 409);
    }

    const sealed = sealKnowledgeBase(kb) as SealedKnowledgeBase;

    return jsonResponse({
      uuid: sealed.uuid,
      name: sealed.name,
      status: sealed.status,
      locked: sealed.locked,
      sealedAt: sealed.sealedAt,
      hashLock: sealed.hashLock,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KB-API] POST seal error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
