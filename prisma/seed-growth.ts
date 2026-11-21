/**
 * User Growth Seed Data — Achievements & Daily Tasks
 * Run once to populate initial growth system data
 */

import { createPrismaCompatClient } from '@lib/db/prisma-compat';

const prisma = createPrismaCompatClient();

const ACHIEVEMENTS = [
  // ─── Milestone ───
  { slug: 'first_login', title: '初次登入', description: '第一次踏入 ESGGO', icon: '🚀', category: 'milestone', tierRequired: 'seed', xpReward: 10 },
  { slug: 'first_report_view', title: '初探永續', description: '第一次閱讀永續報告', icon: '📄', category: 'milestone', tierRequired: 'seed', xpReward: 20 },
  { slug: 'first_subscription', title: '關注世界', description: '訂閱第一個資訊源', icon: '🔔', category: 'milestone', tierRequired: 'seed', xpReward: 15 },
  { slug: 'first_share', title: '知識分享者', description: '第一次分享報告', icon: '🔗', category: 'milestone', tierRequired: 'seed', xpReward: 15 },
  { slug: 'profile_complete', title: '永續實踐者', description: '完成個人檔案設置', icon: '✅', category: 'milestone', tierRequired: 'seed', xpReward: 50 },

  // ─── Engagement ───
  { slug: 'streak_7', title: '一週堅持', description: '連續登入 7 天', icon: '🔥', category: 'engagement', tierRequired: 'sprout', xpReward: 50 },
  { slug: 'streak_30', title: '月度冠軍', description: '連續登入 30 天', icon: '🏆', category: 'engagement', tierRequired: 'bloom', xpReward: 200 },
  { slug: 'streak_100', title: '百日淬鍊', description: '連續登入 100 天', icon: '💎', category: 'engagement', tierRequired: 'forest', xpReward: 500 },
  { slug: 'daily_master', title: '日常達人', description: '連續完成所有每日任務 7 天', icon: '🌟', category: 'engagement', tierRequired: 'bloom', xpReward: 100 },

  // ─── Knowledge ───
  { slug: 'wiki_reader', title: '知識海綿', description: '閱讀 10 篇 Wiki 文章', icon: '📚', category: 'knowledge', tierRequired: 'seed', xpReward: 30 },
  { slug: 'wiki_scholar', title: '永續學者', description: '閱讀 50 篇 Wiki 文章', icon: '🎓', category: 'knowledge', tierRequired: 'sprout', xpReward: 100 },
  { slug: 'wiki_master', title: '知識守護者', description: '閱讀 200 篇 Wiki 文章', icon: '📖', category: 'knowledge', tierRequired: 'bloom', xpReward: 300 },
  { slug: 'report_analyst', title: '報告分析師', description: '閱讀 5 份完整報告', icon: '📊', category: 'knowledge', tierRequired: 'sprout', xpReward: 80 },
  { slug: 'gri_expert', title: 'GRI 專家', description: '精通所有 GRI 指標知識', icon: '📊', category: 'knowledge', tierRequired: 'forest', xpReward: 500 },

  // ─── Community ───
  { slug: 'first_comment', title: '發聲者', description: '發表第一則評論', icon: '💬', category: 'community', tierRequired: 'seed', xpReward: 10 },
  { slug: 'community_contributor', title: '社羣貢獻者', description: '獲得 10 個讚', icon: '👍', category: 'community', tierRequired: 'sprout', xpReward: 50 },
  { slug: 'esg_advocate', title: 'ESG 倡議者', description: '獲得 50 個讚', icon: '📣', category: 'community', tierRequired: 'bloom', xpReward: 200 },

  // ─── Tier Achievements ───
  { slug: 'tier_sprout', title: '萌發新芽', description: '達到「發芽」等級', icon: '🌱', category: 'milestone', tierRequired: 'sprout', xpReward: 100 },
  { slug: 'tier_bloom', title: '百花綻放', description: '達到「綻放」等級', icon: '🌸', category: 'milestone', tierRequired: 'bloom', xpReward: 300 },
  { slug: 'tier_forest', title: '森林守護', description: '達到「森林」等級', icon: '🌳', category: 'milestone', tierRequired: 'forest', xpReward: 800 },
  { slug: 'tier_guardian', title: '永續守護者', description: '達到「守護者」等級', icon: '🛡️', category: 'milestone', tierRequired: 'guardian', xpReward: 2000 },
];

const DAILY_TASKS = [
  { slug: 'daily_login', title: '每日簽到', description: '登入 ESGGO 簽到', xpReward: 5, streakBonus: 2 },
  { slug: 'daily_report', title: '報告探索', description: '閱讀一份永續報告', xpReward: 15, streakBonus: 5 },
  { slug: 'daily_wiki', title: '知識學習', description: '閱讀一篇 Wiki 文章', xpReward: 10, streakBonus: 3 },
  { slug: 'daily_alert', title: '即時關注', description: '查看最新快訊', xpReward: 5, streakBonus: 2 },
  { slug: 'daily_share', title: '分享知識', description: '分享一則永續資訊', xpReward: 15, streakBonus: 5 },
];

const WEEKLY_TASKS = [
  { slug: 'weekly_reports_3', title: '週報讀者', description: '閱讀 3 份報告', xpReward: 50, streakBonus: 20 },
  { slug: 'weekly_comments_5', title: '社羣互動', description: '發表 5 則評論', xpReward: 40, streakBonus: 15 },
  { slug: 'weekly_subscribe_new', title: '拓展視野', description: '新增 1 個訂閱', xpReward: 30, streakBonus: 10 },
];

async function seed() {
  console.log('Seeding achievements...');
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: a,
      create: { ...a, category: a.category, icon: a.icon },
    });
  }
  console.log(`  ✓ ${ACHIEVEMENTS.length} achievements seeded`);

  console.log('Seeding daily tasks...');
  for (const t of DAILY_TASKS) {
    await prisma.growthTask.upsert({
      where: { slug: t.slug },
      update: t,
      create: { ...t, category: 'daily' },
    });
  }
  console.log(`  ✓ ${DAILY_TASKS.length} daily tasks seeded`);

  console.log('Seeding weekly tasks...');
  for (const t of WEEKLY_TASKS) {
    await prisma.growthTask.upsert({
      where: { slug: t.slug },
      update: t,
      create: { ...t, category: 'weekly' },
    });
  }
  console.log(`  ✓ ${WEEKLY_TASKS.length} weekly tasks seeded`);

  console.log('\nSeed complete!');
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
