// ============================================================
// Omni Tag API — 萬能標籤配對合成層
// app/api/tags/omni/route.ts
// ============================================================
import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { prisma } from '@lib/prisma';
import { syncEsgTags, getEntityTags } from '@/core/tags/omni-tag-service';

// GET /api/tags/omni?entityType=&entityId= -> 查詢實體標籤配對
// GET /api/tags/omni (no params)            -> 列出所有 OmniTag
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (entityType && entityId) {
      const tags = await getEntityTags(entityType, entityId);
      return jsonResponse(tags);
    }

    const tags = await prisma.OmniTag.findMany({ orderBy: { createdAt: 'desc' } });
    return jsonResponse(tags);
  } catch (e) {
    console.error('[omni-tag] GET error:', e);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch omni tags', 500);
  }
}

// POST /api/tags/omni  body: { action: 'sync-esg' } -> 同步 ESGTag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.action === 'sync-esg') {
      const synced = await syncEsgTags();
      return jsonResponse({ synced }, 200);
    }
    return jsonError('INVALID_PARAMS', 'Unknown action', 400);
  } catch (e) {
    console.error('[omni-tag] POST error:', e);
    return jsonError('INTERNAL_ERROR', 'Failed to sync tags', 500);
  }
}
