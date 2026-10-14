// ═══════════════════════════════════════════════════════════════
// /api/omni-knowledge-base/[uuid]/verify — 驗證知識庫 API
//
// GET: 驗證知識庫是否保持不可篡改（Hash Lock 重算）
// 5T Trustworthy: 偵測 tampering
// ═══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import {
  knowledgeBaseRegistry,
  sealKnowledgeBase,
  verifyKnowledgeBase,
  type SealedKnowledgeBase,
} from '@/lib/omni-core/index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/omni-knowledge-base/[uuid]/verify
export async function GET(
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

    // 若尚未封存，先封存再驗證
    const sealed = kb.locked
      ? (kb as unknown as SealedKnowledgeBase)
      : sealKnowledgeBase(kb);

    const valid = verifyKnowledgeBase(sealed);

    return jsonResponse({
      uuid: sealed.uuid,
      name: sealed.name,
      locked: sealed.locked,
      verified: valid,
      hashLock: sealed.hashLock,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KB-API] GET verify error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
