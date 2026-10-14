// ═══════════════════════════════════════════════════════════════
// /api/omni-knowledge-base/[uuid] — 萬能知識庫單項 API
//
// GET: 取得知識庫完整註冊資訊（base + sources + targets + lifecycle）
// ═══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { knowledgeBaseRegistry } from '@/lib/omni-core/index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/omni-knowledge-base/[uuid]
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

    const registry = knowledgeBaseRegistry.getRegistry(uuid);

    return jsonResponse({
      base: kb,
      registry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KB-API] GET [uuid] error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
