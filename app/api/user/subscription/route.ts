/**
 * POST /api/user/subscription
 * Body: { userId, subType, targetId, action: 'subscribe' | 'unsubscribe' | 'toggle' }
 * Toggles user subscription to a data source, company, or keyword
 */

import { NextRequest } from 'next/server';
import { getUserGrowthService } from '@/core/services/user-growth-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, subType, targetId } = await req.json();
    if (!userId || !subType || !targetId) {
      return jsonError('INVALID_PARAMS', 'userId, subType, targetId required');
    }

    const service = getUserGrowthService();
    await service.getOrCreateUser(userId);

    const result = await service.toggleSubscription(userId, subType, targetId);

    return jsonResponse({ success: true, ...result });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
