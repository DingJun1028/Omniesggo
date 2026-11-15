import { supabase } from '@/lib/supabase-omni';
import { plantOmniSeed, IOmniSeed } from '../sonnar/omni-seed';
import { trinityHash } from '../sonnar/hash-lock';

// ─── Tier Thresholds ──────────────────────────────────────────
export const TIER_THRESHOLDS: Record<string, number> = {
  seed: 0,
  sprout: 1000,
  bloom: 5000,
  forest: 20000,
  guardian: 100000,
};
export const TIER_ORDER = ['seed', 'sprout', 'bloom', 'forest', 'guardian'];
export const TIER_LABELS: Record<string, string> = {
  seed: '種子', sprout: '發芽', bloom: '綻放', forest: '森林', guardian: '守護者',
};
export const TIER_ICONS: Record<string, string> = {
  seed: '🌱', sprout: '🌿', bloom: '🌸', forest: '🌳', guardian: '🛡️',
};

// ─── XP Rewards ──────────────────────────────────────────────
export const XP_REWARDS: Record<string, number> = {
  login_daily: 5,
  first_report_view: 20,
  complete_profile: 50,
  subscribe_source: 10,
  share_report: 15,
  alert_acknowledge: 5,
  daily_task_complete: 10,
  weekly_task_complete: 30,
  streak_7_bonus: 50,
  streak_30_bonus: 200,
  report_generate: 25,
  pdf_upload: 30,
  wiki_read: 5,
  comment_post: 10,
};

// ─── Service ──────────────────────────────────────────────────
class UserGrowthService {
  private supabase = supabase;

  /** Get or create user growth profile */
  async getOrCreateUser(userId: string, email?: string, displayName?: string) {
    const [existing] = await supabase.from('UserGrowth').select('*').eq('userId', userId).limit(1);
    if (existing) return existing;

    // Genesis OmniSeed for the new user
    const genesisEvidence = {
      originCause: 'User Registration',
      processTrace: ['Create User Profile'],
      finalEffect: 'User Profile Created',
      email: email || 'anonymous@esggo.org',
      displayName: displayName || '永續觀察者',
      role: '永續觀察者',
      origin: 'USER_GROWTH_SYSTEM',
    };
    const hashLock = trinityHash(userId, JSON.stringify(genesisEvidence), String(Date.now()));
    const dormantSeed: IOmniSeed = {
      uuid: userId,
      version: '1.0.0-genesis',
      timestamp: Date.now(),
      evidence: genesisEvidence,
      hashLock,
      entropyControl: 0.1,
      status: 'dormant',
    };
    const genesisSeed = plantOmniSeed(dormantSeed, '#同心圓中心');
    console.log(`[UserGrowth] Planted Genesis OmniSeed for user: ${userId}, HashLock: ${genesisSeed.hashLock}`);

    return supabase.from('UserGrowth').insert({
      userId, email, displayName: displayName || '永續觀察者',
    }).select().single();
  }

  /** Add XP and check for tier upgrade */
  async addXP(userId: string, amount: number, _reason?: string) {
    const [user] = await supabase.from('UserGrowth').select('*').eq('userId', userId).limit(1);
    if (!user) throw new Error('User not found');
    const newXP = (user.xp as number) + amount;
    const newTotal = (user.totalPoints as number) + amount;
    const newTier = this.calculateTier(newTotal);
    const tierChanged = newTier !== (user.tier as string);
    await supabase.from('UserGrowth').update({ xp: newXP, totalPoints: newTotal, tier: newTier, updatedAt: new Date() }).eq('userId', userId);
    const newLevel = Math.min(99, Math.floor(newXP / 500) + 1);
    const [lv] = await supabase.from('UserGrowth').select('*').eq('userId', userId).limit(1);
    if (lv && newLevel > (lv.level as number)) {
      await supabase.from('UserGrowth').update({ level: newLevel }).eq('userId', userId);
    }
    return { newXP, newTotal, newTier, newLevel, tierChanged };
  }

  /** Calculate tier from total points */
  calculateTier(totalPoints: number): string {
    let tier = 'seed';
    for (const t of TIER_ORDER) {
      if (totalPoints >= TIER_THRESHOLDS[t]) tier = t;
      else break;
    }
    return tier;
  }

  /** Get leaderboard (top users by total points) */
  async getLeaderboard(limit = 20) {
    const { data } = await supabase
      .from('UserGrowth')
      .select('userId, displayName, tier, level, totalPoints, streakDays')
      .order('totalPoints', { ascending: false })
      .limit(limit);
    return (data as { userId: string; displayName: string; tier: string; level: number; totalPoints: number; streakDays: number; }[]) ?? [];
  }

  /** Get user achievements */
  async getUserAchievements(userId: string) {
    const rows = await supabase.from('UserAchievement').select('*').eq('userId', userId).order('unlockedAt', { ascending: false });
    const list = (rows as unknown as { userId: string; achievementId: string; unlockedAt: string; }[]) ?? [];
    const out = [];
    for (const r of list) {
      const [ach] = await supabase.from('Achievement').select('*').eq('id', r.achievementId).limit(1);
      out.push({ ...r, achievement: ach || null });
    }
    return out;
  }

  /** Unlock an achievement for user */
  async unlockAchievement(userId: string, achievementSlug: string) {
    const [ach] = await supabase.from('Achievement').select('*').eq('slug', achievementSlug).limit(1);
    if (!ach) throw new Error('Achievement not found');
    const [existing] = await supabase.from('UserAchievement').select('*').eq('userId', userId).eq('achievementId', ach.id).limit(1);
    if (existing) return existing;
    const result = await supabase.from('UserAchievement').insert({ userId, achievementId: ach.id }).select().single();
    if (ach.xpReward > 0) {
      await this.addXP(userId, ach.xpReward, `achievement:${achievementSlug}`);
    }
    return result;
  }
  /** Get daily tasks */
  async getDailyTasks(userId: string) {
    const tasks = await supabase.from('GrowthTask').select('*').eq('isActive', true).eq('category', 'daily').order('xpReward', { ascending: false });
    const { data: userTasks } = await supabase.from('UserTask').select('*').eq('userId', userId);
    const map = new Map<string, { taskId: string; progress: number; status: string; completedAt?: string | null }>();
    for (const ut of (userTasks as { taskId: string; status: string; progress: number; completedAt?: string | null }[]) ?? []) {
      map.set(ut.taskId, ut);
    }
    return (tasks as unknown as { id: string; slug: string; xpReward: number }[]).map((t) => {
      const progress = map.get(t.id) ?? null;
      return {
        ...t,
        userStatus: progress?.status || 'pending',
        userProgress: progress?.progress ?? 0,
        completedAt: progress?.completedAt ?? null,
      };
    });
  }

  /** Update task progress */
  async updateTaskProgress(userId: string, taskId: string, progress: number) {
    const [task] = await supabase.from('GrowthTask').select('*').eq('id', taskId).limit(1);
    if (!task) throw new Error('Task not found');
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    const completedAt = progress >= 100 ? new Date() : null;
    const [existing] = await supabase.from('UserTask').select('*').eq('userId', userId).eq('taskId', taskId).limit(1);
    if (existing) {
      await supabase.from('UserTask').update({ progress, status, completedAt }).eq('userId', userId).eq('taskId', taskId);
    } else {
      await supabase.from('UserTask').insert({ userId, taskId, progress, status, completedAt }).select().single();
    }
    if (progress >= 100 && status === 'completed') {
      await this.addXP(userId, (task as { xpReward: number }).xpReward, `task:${task.slug}`);
    }
    return { progress, status, completedAt };
  }

  /** Claim task reward */
  async claimTaskReward(userId: string, taskId: string) {
    const [ut] = await supabase.from('UserTask').select('*').eq('userId', userId).eq('taskId', taskId).eq('status', 'completed').limit(1);
    if (!ut) throw new Error('Task not completed or not found');
    await supabase.from('UserTask').update({ status: 'claimed', claimedAt: new Date() }).eq('id', ut.id);
    return { claimed: true };
  }

  /** Update login streak */
  async updateStreak(userId: string) {
    const [user] = await supabase.from('UserGrowth').select('*').eq('userId', userId).limit(1);
    if (!user) throw new Error('User not found');
    const now = new Date();
    const lastActive = new Date((user as { lastActiveAt: string }).lastActiveAt);
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    let streakDays = (user as { streakDays: number }).streakDays;
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }
    let bonusXP = 0;
    if (streakDays === 7) bonusXP = XP_REWARDS.streak_7_bonus;
    if (streakDays === 30) bonusXP = XP_REWARDS.streak_30_bonus;
    await supabase.from('UserGrowth').update({ streakDays, lastActiveAt: now }).eq('userId', userId);
    if (bonusXP > 0) {
      await this.addXP(userId, bonusXP, `streak:${streakDays}`);
    }
    return { streakDays, bonusXP };
  }

  /** Get user subscription list */
  async getSubscriptions(userId: string) {
    const { data } = await supabase.from('Subscription').select('*').eq('userId', userId).eq('isActive', true).order('createdAt', { ascending: false });
    return (data as { userId: string; subType: string; targetId: string; isActive: boolean; }[]) ?? [];
  }

  /** Toggle subscription */
  async toggleSubscription(userId: string, subType: string, targetId: string) {
    const [existing] = await supabase.from('Subscription').select('*').eq('userId', userId).eq('subType', subType).eq('targetId', targetId).limit(1);
    if (existing) {
      const { data } = await supabase.from('Subscription').update({ isActive: !(existing as { isActive: boolean }).isActive }).eq('id', (existing as { id: string }).id).select().single();
      return { subscribed: !(existing as { isActive: boolean }).isActive };
    }
    await supabase.from('Subscription').insert({ userId, subType, targetId });
    await this.addXP(userId, XP_REWARDS.subscribe_source, `subscribe:${subType}`);
    return { subscribed: true };
  }

  /** Get full user profile with all growth data */
  async getFullProfile(userId: string) {
    const [user] = await supabase.from('UserGrowth').select('*').eq('userId', userId).limit(1);
    if (!user) return null;
    const [ach] = (await supabase.from('UserAchievement').select('*').eq('userId', userId).order('unlockedAt', { ascending: false }).limit(20)) as unknown as { userId: string; achievementId: string; unlockedAt: string; }[];
    const tasks = (await supabase.from('UserTask').select('*').eq('userId', userId).in('status', ['pending', 'in_progress']).order('createdAt', { ascending: false }).limit(10)) as unknown as { userId: string; taskId: string; status: string; progress: number; completedAt?: string | null; }[];
    const subs = (await supabase.from('Subscription').select('*').eq('userId', userId).eq('isActive', true).order('createdAt', { ascending: false }).limit(50)) as unknown as { userId: string; subType: string; targetId: string; isActive: boolean; }[];
    const currentTierIdx = TIER_ORDER.indexOf((user as { tier: string }).tier);
    const nextTier = currentTierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIdx + 1] : null;
    const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
    const progressToNext = nextTierThreshold ? Math.min(100, Math.round(((user as { totalPoints: number }).totalPoints / nextTierThreshold) * 100)) : 100;
    return {
      ...user,
      tierLabel: TIER_LABELS[(user as { tier: string }).tier] || (user as { tier: string }).tier,
      tierIcon: TIER_ICONS[(user as { tier: string }).tier] || '❓',
      nextTier,
      nextTierLabel: nextTier ? TIER_LABELS[nextTier] : null,
      nextTierThreshold,
      progressToNext,
    };
  }

  async disconnect() {
    // Supabase client is stateless; no explicit disconnect needed.
  }
}

let instance: UserGrowthService | null = null;
export function getUserGrowthService(): UserGrowthService {
  if (!instance) {
    instance = new UserGrowthService();
  }
  return instance;
}
export default UserGrowthService;
