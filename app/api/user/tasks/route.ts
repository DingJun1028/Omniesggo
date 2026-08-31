/**
 * GET /api/user/tasks?userId=xxx
 * Returns daily/weekly tasks with user progress
 *
 * POST /api/user/tasks/claim
 * Body: { userId, taskId }
 * Claims task reward
 */

import { NextRequest } from 'next/server';
import { getUserGrowthService } from '@/core/services/user-growth-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return jsonError('INVALID_PARAMS', 'userId required');
    }

    const service = getUserGrowthService();
    await service.getOrCreateUser(userId);

    const tasks = await service.getDailyTasks(userId);

    return jsonResponse({ success: true, tasks });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, taskId } = await req.json();
    if (!userId || !taskId) {
      return jsonError('INVALID_PARAMS', 'userId and taskId required');
    }

    const service = getUserGrowthService();
    const result = await service.claimTaskReward(userId, taskId);

    return jsonResponse({ ...result });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
