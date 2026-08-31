/**
 * GET /api/esg-sonnar — ESGSonnar 查詢 API
 */

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { ESGSonnarService } from '@/lib/esg-sonnar';

export const dynamic = 'force-dynamic';

// ── GET Handler ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;
    const keyword = searchParams.get('keyword') || undefined;
    const category = searchParams.get('category') as 'environment' | 'social' | 'governance' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const results = ESGSonnarService.query({
      companyId,
      keyword,
      category,
      limit,
    });

    const stats = ESGSonnarService.getStats(companyId);

    return jsonResponse({
      results,
      stats,
    });
  } catch (error) {
    return jsonErrorInternal(error);
  }
}
