/**
 * GET /api/user/leaderboard?limit=20
 * Returns top users by total points
 */

import { NextRequest } from 'next/server';
import { getUserGrowthService, TIER_ICONS, TIER_LABELS } from '@/core/services/user-growth-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    const service = getUserGrowthService();
    const topUsers = await service.getLeaderboard(limit);

    const ranked = topUsers.map((u, i) => ({
      rank: i + 1,
      displayName: u.displayName,
      tier: u.tier,
      tierLabel: TIER_LABELS[u.tier] || u.tier,
      tierIcon: TIER_ICONS[u.tier] || '?',
      level: u.level,
      totalPoints: u.totalPoints,
      streakDays: u.streakDays,
    }));

    return jsonResponse({ success: true, leaderboard: ranked });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
