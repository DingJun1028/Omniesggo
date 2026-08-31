// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ESGGO Cron Jobs — 自動化任務調度器
 *
 * Jobs:
 * 1. daily-report-generator — 每日自動生成永續觀察者日報
 * 2. crawler-trigger — 每 6 小時執行 ESG 爬蟲
 * 3. achievement-check — 每小時檢查用戶成就升級
 */

import { prisma } from '@/lib/storage-service';

const HAS_DATABASE_URL = Boolean(process.env.DATABASE_URL?.trim());

if (!HAS_DATABASE_URL) {
  console.warn('[Cron] DATABASE_URL is not set; skipping Prisma-dependent background jobs until a Postgres datasource is configured.');
}

// 雙向 Oracle 同步協調器 (全域全端全量終始矩陣)
import { runBidirectionalSync, hydrateFromOracle } from '../core/tags/oracle-sync-matrix';

// ============================================================
// Job: Daily Report Generator
// ============================================================
async function generateDailyReportJob(): Promise<{
  success: boolean;
  message: string;
  reportDate: string;
}> {
  console.log('[Cron] Starting daily report generation...');
  const startTime = Date.now();

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Use start of day for unique date
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    // Check if already generated for today
    const existing = await prisma.dailyReport.findUnique({ where: { reportDate: todayStart } });
    if (existing) {
      return { success: true, message: 'Already generated for today', reportDate: todayStr };
    }

    // Count today's new alerts
    const newAlerts = await prisma.alert.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });

    // Count regulations (no createdAt on Regulation — use id count as proxy)
    const totalRegulations = await prisma.regulation.count();

    // Count company reports (no createdAt on CompanyReport)
    const totalReports = await prisma.companyReport.count();

    // Aggregate source distribution
    const recentAlerts = await prisma.alert.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { sourceName: true, alertType: true },
      take: 100,
    });

    const tagStats: Record<string, number> = {};
    for (const alert of recentAlerts) {
      const key = alert.alertType || 'general';
      tagStats[key] = (tagStats[key] || 0) + 1;
    }

    // Find highlight items (critical/high severity recent alerts)
    const highlightAlerts = await prisma.alert.findMany({
      where: { severity: 'critical' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, sourceName: true, severity: true, esgPillar: true },
    });

    const highlights = highlightAlerts.length > 0
      ? highlightAlerts.map((a: { title: string | null }) => a.title || '未命名警示')
      : ['過去 2重大警示事件'];

    const sourceNameSet = new Set<string>();    for (const a of recentAlerts) { if (a.sourceName) sourceNameSet.add(a.sourceName); }
    const topSources = Array.from(sourceNameSet).slice(0, 5);

    // Create daily report
    const report = await prisma.dailyReport.create({
      data: {
        reportDate: todayStart,
        title: `永續觀察者日報 — ${todayStr}`,
        summary: `${todayStr} 共收錄 ${newAlerts} 則警示（近 7 日累計 ${recentAlerts.length} 則）。目前法規資料庫 ${totalRegulations} 筆、企業報告 ${totalReports} 份。`,
        highlights: JSON.stringify(highlights),
        tagStats: JSON.stringify(tagStats),
        sourceCount: topSources.length,
        alertCount: newAlerts,
        topSources: JSON.stringify(topSources),
        status: 'published',
      },
    });

    // Create report items for critical alerts
    if (highlightAlerts.length > 0) {
      await prisma.dailyReportItem.createMany({
        data: highlightAlerts.map((item: { id: string; title: string | null; sourceName: string | null; severity: string | null; esgPillar: string | null }) => ({
          reportId: report.id,
          alertId: item.id,
          itemType: 'alert',
          title: item.title || '未命名警示',
          sourceName: item.sourceName || undefined,
          severity: item.severity || undefined,
          esgPillar: item.esgPillar || undefined,
        })),
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Daily report generated in ${duration}ms — ${todayStr}`);
    return { success: true, message: `Report generated (${duration}ms)`, reportDate: todayStr };
  } catch (error: unknown) {
    console.error('[Cron] Daily report generation failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message, reportDate: '' };
  }
}

// ============================================================
// Job: User Achievement Check (Tier upgrade)
// ============================================================
async function checkUserAchievements(): Promise<{ checked: number; upgrades: number }> {
  let upgrades = 0;
  try {
    const userGrowths = await prisma.userGrowth.findMany();

    for (const user of userGrowths) {
      const tiers = [
        { name: 'guardian', threshold: 100000 },
        { name: 'forest', threshold: 20000 },
        { name: 'bloom', threshold: 5000 },
        { name: 'sprout', threshold: 1000 },
        { name: 'seed', threshold: 0 },
      ];

      const currentTier = tiers.find((t) => user.totalPoints >= t.threshold);
      if (currentTier && currentTier.name !== user.tier) {
        await prisma.userGrowth.update({
          where: { id: user.id },
          data: { tier: currentTier.name, updatedAt: new Date() },
        });
        upgrades++;
        console.log(`[Cron] User ${user.userId} tier up: ${user.tier} → ${currentTier.name}`);
      }
    }
    return { checked: userGrowths.length, upgrades };
  } catch (error) {
    console.error('[Cron] Achievement check failed:', error);
    return { checked: 0, upgrades: 0 };
  }
}

// ============================================================
// Job: Crawler Trigger
// ============================================================
async function triggerCrawler(): Promise<{ success: boolean; items: number }> {
  try {
    const res = await fetch('http://localhost:3000/api/sonnar/crawl-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      return { success: true, items: data.itemsFetched || 0 };
    }
    return { success: false, items: 0 };
  } catch {
    return { success: false, items: 0 };
  }
}

// ============================================================
// Scheduler — Polling-based (no external dependencies)
// ============================================================
interface CronJob {
  name: string;
  schedule: number; // ms interval
  task: () => Promise<unknown>;
  lastRun: number;
  isRunning: boolean;
}

const jobs: CronJob[] = [
  {
    name: 'daily-report',
    schedule: 24 * 60 * 60 * 1000,
    task: generateDailyReportJob,
    lastRun: 0,
    isRunning: false,
  },
  {
    name: 'achievement-check',
    schedule: 60 * 60 * 1000,
    task: checkUserAchievements,
    lastRun: 0,
    isRunning: false,
  },
  {
    name: 'crawler-trigger',
    schedule: 6 * 60 * 60 * 1000,
    task: triggerCrawler,
    lastRun: 0,
    isRunning: false,
  },
  {
    // 全域全端全量雙向同步 — 終始矩陣對帳 (Oracle <-> app)
    name: 'oracle-bidirectional-sync',
    schedule: 10 * 60 * 1000, // 每 10 分鐘對帳一次
    task: async () => {
      const r = await runBidirectionalSync();
      if (r.ok) {
        console.log(
          `[Cron] Oracle 雙向同步: 對帳 ${r.reconciled.total} (一致 ${r.reconciled.synced}, ` +
          `app落後 ${r.reconciled.behindApp}, oracle落後 ${r.reconciled.behindOracle}) ` +
          `推送 ${r.pushed} / 回拉 ${r.pulled}`,
        );
      } else {
        console.warn(`[Cron] Oracle 雙向同步跳過: ${r.reason ?? 'unknown'}`);
      }
      return r;
    },
    lastRun: 0,
    isRunning: false,
  },
];

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function initCronJobs(): () => void {
  if (schedulerInterval) return () => stopCronJobs();

  schedulerInterval = setInterval(() => {
    const now = Date.now();
    for (const job of jobs) {
      if (job.isRunning) continue;
      if (now - job.lastRun >= job.schedule) {
        job.isRunning = true;
        job.lastRun = now;
        job
          .task()
          .catch((err) => console.error(`[Cron] Job "${job.name}" error:`, err))
          .finally(() => {
            job.isRunning = false;
          });
      }
    }
  }, 60 * 1000);

  // Generate on startup if missing today
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today + 'T00:00:00.000Z');
  prisma.dailyReport.findUnique({ where: { reportDate: todayStart } })
    .then((existing: { id: string } | null) => {
      if (!existing) {
        console.log('[Cron] No report for today, generating on startup...');
        generateDailyReportJob();
      }
    })
    .catch(() => {});

  // 啟動 hydration — 從 Oracle 全量回拉信任帳本 (oracle->app)
  hydrateFromOracle()
    .then((h) => {
      if (h.ok) console.log(`[Cron] Oracle hydration: 回拉 ${h.pulled} 筆, 標記 ${h.matched} 筆`);
      else console.warn(`[Cron] Oracle hydration 跳過: ${h.reason ?? 'unknown'}`);
    })
    .catch((e) => console.warn('[Cron] Oracle hydration error:', e));

  console.log(`[Cron] Initialized ${jobs.length} jobs`);
  return () => stopCronJobs();
}

export function stopCronJobs(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Cron] Stopped all jobs');
  }
}

// Re-exports for API routes
export { generateDailyReportJob, checkUserAchievements, triggerCrawler };
