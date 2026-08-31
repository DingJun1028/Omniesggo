/**
 * POST /api/user/growth/xp
 * Body: { userId, action, amount?, metadata? }
 * Awards XP, updates tier/level, returns new state
 */

import { NextRequest } from 'next/server';
import { getUserGrowthService, XP_REWARDS } from '@/core/services/user-growth-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, action, amount } = await req.json();
    if (!userId || !action) {
      return jsonError('INVALID_PARAMS', 'userId and action required', 400);
    }

    const service = getUserGrowthService();

    // Ensure user exists
    await service.getOrCreateUser(userId);

    // Calculate XP amount
    const xpAmount = amount ?? XP_REWARDS[action] ?? 5;

    // Update streak for daily login
    if (action === 'login_daily') {
      await service.updateStreak(userId);
    }

    const result = await service.addXP(userId, xpAmount, action);

    // Check tier-based achievements
    if (result.tierChanged) {
      const tierAchievementMap: Record<string, string> = {
        sprout: 'tier_sprout',
        bloom: 'tier_bloom',
        forest: 'tier_forest',
        guardian: 'tier_guardian',
      };
      const achievementSlug = tierAchievementMap[result.newTier];
      if (achievementSlug) {
        await service.unlockAchievement(userId, achievementSlug);
      }
    }

    return jsonResponse({ success: true, ...result });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR', undefined, 500);
  }
}
