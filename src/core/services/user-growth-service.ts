/**
 * User Growth Service — Tier / XP / Achievements / Tasks
 * 
 * Tier system: seed → sprout → bloom → forest → guardian
 * XP thresholds: 0 / 1000 / 5000 / 20000 / 100000
 */

import { PrismaClient } from '@prisma/client';
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
  seed: '種子',
  sprout: '發芽',
  bloom: '綻放',
  forest: '森林',
  guardian: '守護者',
};

export const TIER_ICONS: Record<string, string> = {
  seed: '🌱',
  sprout: '🌿',
  bloom: '🌸',
  forest: '🌳',
  guardian: '🛡️',
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
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /** Get or create user growth profile */
  async getOrCreateUser(userId: string, email?: string, displayName?: string) {
    const existing = await this.prisma.userGrowth.findUnique({ where: { userId } });
    if (existing) return existing;

    // Create the genesis OmniSeed for the new user!
    const genesisEvidence = {
      originCause: 'User Registration',
      processTrace: ['Create User Profile'],
      finalEffect: 'User Profile Created',
      email: email || 'anonymous@esggo.org',
      displayName: displayName || '永續觀察者',
      role: '永續觀察者',
      origin: 'USER_GROWTH_SYSTEM',
    };
    
    // Generate Trinity Hash Lock for this user's genesis
    const hashLock = trinityHash(userId, JSON.stringify(genesisEvidence), String(Date.now()));
    
    // Assemble the dormant seed
    const dormantSeed: IOmniSeed = {
      uuid: userId,
      version: '1.0.0-genesis',
      timestamp: Date.now(),
      evidence: genesisEvidence,
      hashLock,
      entropyControl: 0.1,
      status: 'dormant'
    };
    
    // Plant and awaken the seed into the concentric core
    const genesisSeed = plantOmniSeed(dormantSeed, '#同心圓中心');
    console.log(`[UserGrowth] Planted Genesis OmniSeed for user: ${userId}, HashLock: ${genesisSeed.hashLock}`);

    return this.prisma.userGrowth.create({
      data: {
        userId,
        email,
        displayName: displayName || '永續觀察者',
      },
    });
  }

  /** Add XP and check for tier upgrade */
  async addXP(userId: string, amount: number, _reason?: string) {
    const user = await this.prisma.userGrowth.findUnique({ where: { userId } });
    if (!user) throw new Error('User not found');

    const newXP = user.xp + amount;
    const newTotal = user.totalPoints + amount;
    const newTier = this.calculateTier(newTotal);
    const tierChanged = newTier !== user.tier;

    await this.prisma.userGrowth.update({
      where: { userId },
      data: {
        xp: newXP,
        totalPoints: newTotal,
        tier: newTier,
        updatedAt: new Date(),
      },
    });

    // Check level up (every 500 XP = 1 level)
    const newLevel = Math.min(99, Math.floor(newXP / 500) + 1);
    if (newLevel > user.level) {
      await this.prisma.userGrowth.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    return { newXP, newTotal, newTier, newLevel, tierChanged };
  }

  /** Calculate tier from total points */
  calculateTier(totalPoints: number): string {
    let tier = 'seed';
    for (const t of TIER_ORDER) {
      if (totalPoints >= TIER_THRESHOLDS[t]) {
        tier = t;
      } else {
        break;
      }
    }
    return tier;
  }

  /** Get leaderboard (top users by total points) */
  async getLeaderboard(limit = 20) {
    return this.prisma.userGrowth.findMany({
      orderBy: { totalPoints: 'desc' },
      take: limit,
      select: {
        userId: true,
        displayName: true,
        tier: true,
        level: true,
        totalPoints: true,
        streakDays: true,
      },
    });
  }

  /** Get user achievements */
  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  /** Unlock an achievement for user */
  async unlockAchievement(userId: string, achievementSlug: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { slug: achievementSlug },
    });
    if (!achievement) throw new Error('Achievement not found');

    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId: achievement.id },
    });
    if (existing) return existing;

    const result = await this.prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    // Award XP
    if (achievement.xpReward > 0) {
      await this.addXP(userId, achievement.xpReward, `achievement:${achievementSlug}`);
    }

    return result;
  }

  /** Get daily tasks */
  async getDailyTasks(userId: string) {
    const tasks = await this.prisma.growthTask.findMany({
      where: { isActive: true, category: 'daily' },
      orderBy: { xpReward: 'desc' },
    });

    // Get user progress
    const userTasks = await this.prisma.userTask.findMany({
      where: { userId },
    });

    return tasks.map(t => {
      const progress = userTasks.find(ut => ut.taskId === t.id);
      return {
        ...t,
        userStatus: progress?.status || 'pending',
        userProgress: progress?.progress || 0,
        completedAt: progress?.completedAt || null,
      };
    });
  }

  /** Update task progress */
  async updateTaskProgress(userId: string, taskId: string, progress: number) {
    const task = await this.prisma.growthTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    const completedAt = progress >= 100 ? new Date() : null;

    await this.prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId } },
      update: { progress, status, completedAt },
      create: { userId, taskId, progress, status, completedAt },
    });

    // Award XP if newly completed
    if (progress >= 100 && status === 'completed') {
      await this.addXP(userId, task.xpReward, `task:${task.slug}`);
    }

    return { progress, status, completedAt };
  }

  /** Claim task reward (separate from completion for some UX flows) */
  async claimTaskReward(userId: string, taskId: string) {
    const userTask = await this.prisma.userTask.findFirst({
      where: { userId, taskId, status: 'completed' },
    });
    if (!userTask) throw new Error('Task not completed or not found');

    await this.prisma.userTask.update({
      where: { id: userTask.id },
      data: { status: 'claimed', claimedAt: new Date() },
    });

    return { claimed: true };
  }

  /** Update login streak */
  async updateStreak(userId: string) {
    const user = await this.prisma.userGrowth.findUnique({ where: { userId } });
    if (!user) throw new Error('User not found');

    const now = new Date();
    const lastActive = new Date(user.lastActiveAt);
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let streakDays = user.streakDays;
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1; // Reset streak
    }

    // Streak bonuses
    let bonusXP = 0;
    if (streakDays === 7) bonusXP = XP_REWARDS.streak_7_bonus;
    if (streakDays === 30) bonusXP = XP_REWARDS.streak_30_bonus;

    await this.prisma.userGrowth.update({
      where: { userId },
      data: { streakDays, lastActiveAt: now },
    });

    if (bonusXP > 0) {
      await this.addXP(userId, bonusXP, `streak:${streakDays}`);
    }

    return { streakDays, bonusXP };
  }

  /** Get user subscription list */
  async getSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Toggle subscription */
  async toggleSubscription(userId: string, subType: string, targetId: string) {
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, subType, targetId },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { isActive: !existing.isActive },
      });
      return { subscribed: !existing.isActive };
    }

    await this.prisma.subscription.create({
      data: { userId, subType, targetId },
    });

    await this.addXP(userId, XP_REWARDS.subscribe_source, `subscribe:${subType}`);
    return { subscribed: true };
  }

  /** Get full user profile with all growth data */
  async getFullProfile(userId: string) {
    const user = await this.prisma.userGrowth.findUnique({
      where: { userId },
      include: {
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
          take: 20,
        },
        tasks: {
          include: { task: true },
          where: { status: { in: ['pending', 'in_progress'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        subscriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) return null;

    // Calculate next tier info
    const currentTierIdx = TIER_ORDER.indexOf(user.tier);
    const nextTier = currentTierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIdx + 1] : null;
    const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
    const progressToNext = nextTierThreshold
      ? Math.min(100, Math.round((user.totalPoints / nextTierThreshold) * 100))
      : 100;

    return {
      ...user,
      tierLabel: TIER_LABELS[user.tier] || user.tier,
      tierIcon: TIER_ICONS[user.tier] || '❓',
      nextTier,
      nextTierLabel: nextTier ? TIER_LABELS[nextTier] : null,
      nextTierThreshold,
      progressToNext,
    };
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Singleton
let instance: UserGrowthService | null = null;

export function getUserGrowthService(): UserGrowthService {
  if (!instance) {
    instance = new UserGrowthService();
  }
  return instance;
}

export default UserGrowthService;
