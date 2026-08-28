// ============================================================
// Universal Tag API — 萬能標籤配對合成層
// app/api/tags/universal/route.ts
// ============================================================
import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { prisma } from '@lib/prisma';
import { syncEsgTags, getEntityTags } from '@/core/tags/universal-tag-service';

// GET /api/tags/universal?entityType=&entityId= -> 查詢實體標籤配對
// GET /api/tags/universal (no params)            -> 列出所有 UniversalTag
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (entityType && entityId) {
      const tags = await getEntityTags(entityType, entityId);
      return jsonResponse(tags);
    }

    const tags = await prisma.universalTag.findMany({ orderBy: { createdAt: 'desc' } });
    return jsonResponse(tags);
  } catch (e) {
    console.error('[universal-tag] GET error:', e);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch universal tags', 500);
  }
}

// POST /api/tags/universal  body: { action: 'sync-esg' } -> 同步 ESGTag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.action === 'sync-esg') {
      const synced = await syncEsgTags();
      return jsonResponse({ synced }, 200);
    }
    return jsonError('INVALID_PARAMS', 'Unknown action', 400);
  } catch (e) {
    console.error('[universal-tag] POST error:', e);
    return jsonError('INTERNAL_ERROR', 'Failed to sync tags', 500);
  }
}
