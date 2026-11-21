/**
 * Daily Observer Report Service — 永續觀察者日報
 *
 * Generates daily ESG digest from crawled data
 * Auto-generates reports from Alert + Regulation + CompanyReport tables
 */

import { prisma } from '@/lib/storage-service';

// ─── Types ──────────────────────────────────────────────────

export interface DailyReportItemDTO {
  id: string;
  itemType: string;
  title: string;
  summary: string;
  sourceName: string | null;
  sourceUrl: string | null;
  severity: string;
  esgPillar: string;
  orderIndex: number;
}

export interface DailyReportDTO {
  id: string;
  reportDate: string;
  title: string;
  summary: string;
  highlights: string[];
  tagStats: Record<string, number>;
  sourceCount: number;
  alertCount: number;
  topSources: string[];
  status: string;
  publishedAt: string | null;
  editorNote: string | null;
  items: DailyReportItemDTO[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Service ───────────────────────────────────────────────

export class DailyReportService {

  /**
   * Generate a daily report from crawled data
   */
  async generateReport(date: Date = new Date()): Promise<DailyReportDTO> {
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);
    const dateStr = formatDate(date);

    // Gather data from the last 24h
    const [recentRegulations, recentReports, recentAlerts, recentCrawlItems] = await Promise.all([
      prisma.regulation.findMany({
        where: { crawledAt: { gte: start, lte: end } },
        select: { title: true, sourceName: true, url: true },
        take: 20,
      }),
      prisma.companyReport.findMany({
        where: { crawledAt: { gte: start, lte: end } },
        select: { companyName: true, reportType: true, url: true },
        take: 20,
      }),
      prisma.alert.findMany({
        where: { createdAt: { gte: start, lte: end } },
        take: 20,
      }),
      prisma.crawlHistory.findMany({
        where: { timestamp: { gte: start, lte: end } },
        include: { regulation: true },
        take: 20,
      }),
    ]);

    // Build report title
    const title = `永續觀察日報 — ${dateStr} ESG 動態`;

    // Generate summary
    const total = recentRegulations.length + recentReports.length + recentAlerts.length;
    const summary = `本日共監測到 ${total} 則 ESG 動態，包含 ${recentRegulations.length} 項法規更新、${recentReports.length} 份企業報告、${recentAlerts.length} 則快訊。資料來源涵蓋 ${new Set([...recentRegulations.map(r => r.sourceName), ...recentCrawlItems.map(c => c.regulation?.sourceName)].filter(Boolean)).size} 個權威機構。`;

    // Build highlights (top 5)
    const highlightPool = [
      ...recentRegulations.slice(0, 3).map(r => `${r.sourceName}: ${r.title}`),
      ...recentReports.slice(0, 2).map(r => `${r.companyName} 發布 ${r.reportType}`),
    ];
    const highlights = highlightPool.slice(0, 5);

    // Tag stats
    const tagStats: Record<string, number> = {};
    for (const reg of recentRegulations) {
      const tag = reg.sourceName || 'other';
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    }

    // Top sources
    const sourceFreq: Record<string, number> = {};
    for (const reg of recentRegulations) {
      sourceFreq[reg.sourceName] = (sourceFreq[reg.sourceName] || 0) + 1;
    }
    const topSources = Object.entries(sourceFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Build report items
    let orderIndex = 0;
    const items: Omit<DailyReportItemDTO, 'id'>[] = [];

    for (const r of recentRegulations) {
      items.push({
        itemType: 'regulation',
        title: r.title,
        summary: `[${r.sourceName}] ESG 法規/準則更新通知`,
        sourceName: r.sourceName,
        sourceUrl: r.url,
        severity: 'medium',
        esgPillar: '',
        orderIndex: orderIndex++,
      });
    }

    for (const r of recentReports) {
      items.push({
        itemType: 'report',
        title: `${r.companyName} 永續報告書`,
        summary: `${r.reportType} 報告已更新或發布`,
        sourceName: r.companyName,
        sourceUrl: r.url || null,
        severity: 'low',
        esgPillar: '',
        orderIndex: orderIndex++,
      });
    }

    for (const a of recentAlerts) {
      items.push({
        itemType: 'topic',
        title: a.title,
        summary: a.summary,
        sourceName: a.sourceName,
        sourceUrl: a.url || null,
        severity: a.severity,
        esgPillar: a.esgPillar,
        orderIndex: orderIndex++,
      });
    }

    // Upsert the daily report
    const report = await prisma.dailyReport.upsert({
      where: { reportDate: start },
      update: {
        title,
        summary,
        highlights: JSON.stringify(highlights),
        tagStats: JSON.stringify(tagStats),
        sourceCount: recentCrawlItems.length,
        alertCount: recentAlerts.length,
        topSources: JSON.stringify(topSources),
        updatedAt: new Date(),
      },
      create: {
        reportDate: start,
        title,
        summary,
        highlights: JSON.stringify(highlights),
        tagStats: JSON.stringify(tagStats),
        sourceCount: recentCrawlItems.length,
        alertCount: recentAlerts.length,
        topSources: JSON.stringify(topSources),
      },
    });

    // Delete old items and recreate
    await prisma.dailyReportItem.deleteMany({ where: { reportId: report.id } });
    for (const item of items) {
      await prisma.dailyReportItem.create({
        data: { ...item, reportId: report.id },
      });
    }

    return this.getReportById(report.id) as Promise<DailyReportDTO>;
  }

  /**
   * Get a daily report by ID with all items
   */
  async getReportById(id: string): Promise<DailyReportDTO | null> {
    const report = await prisma.dailyReport.findUnique({ where: { id } });
    if (!report) return null;

    const items = await prisma.dailyReportItem.findMany({
      where: { reportId: id },
      orderBy: { orderIndex: 'asc' },
    });

    return {
      id: report.id,
      reportDate: formatDate(new Date(report.reportDate)),
      title: report.title,
      summary: report.summary,
      highlights: JSON.parse(report.highlights || '[]'),
      tagStats: JSON.parse(report.tagStats || '{}'),
      sourceCount: report.sourceCount,
      alertCount: report.alertCount,
      topSources: JSON.parse(report.topSources || '[]'),
      status: report.status,
      publishedAt: report.publishedAt?.toISOString() || null,
      editorNote: report.editorNote,
      items: items.map(i => ({
        id: i.id,
        itemType: i.itemType,
        title: i.title,
        summary: i.summary,
        sourceName: i.sourceName,
        sourceUrl: i.sourceUrl,
        severity: i.severity,
        esgPillar: i.esgPillar,
        orderIndex: i.orderIndex,
      })),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  /**
   * Get (or generate if missing) today's report
   */
  async getTodayReport(): Promise<DailyReportDTO> {
    const today = getStartOfDay(new Date());
    const existing = await prisma.dailyReport.findUnique({ where: { reportDate: today } });
    if (existing) return this.getReportById(existing.id) as Promise<DailyReportDTO>;
    return this.generateReport(new Date());
  }

  /**
   * List recent published reports
   */
  async listReports(limit = 30, status = 'published'): Promise<DailyReportDTO[]> {
    const reports = await prisma.dailyReport.findMany({
      where: { status },
      orderBy: { reportDate: 'desc' },
      take: limit,
    });

    return Promise.all(reports.map(r => this.getReportById(r.id) as Promise<DailyReportDTO>));
  }

  /**
   * Publish a draft report
   */
  async publishReport(id: string, editorNote?: string): Promise<DailyReportDTO | null> {
    await prisma.dailyReport.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date(), ...(editorNote ? { editorNote } : {}) },
    });
    return this.getReportById(id);
  }

  /**
   * Get report archive (calendar view data)
   */
  async getArchive(months = 12): Promise<Array<{ date: string; hasReport: boolean; alertCount: number }>> {
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const reports = await prisma.dailyReport.findMany({
      where: { reportDate: { gte: start } },
      orderBy: { reportDate: 'desc' },
      select: { reportDate: true, alertCount: true, status: true },
    });

    return reports.map(r => ({
      date: formatDate(new Date(r.reportDate)),
      hasReport: r.status === 'published',
      alertCount: r.alertCount,
    }));
  }
}

// Singleton
let instance: DailyReportService | null = null;

export function getDailyReportService(): DailyReportService {
  if (!instance) {
    instance = new DailyReportService();
  }
  return instance;
}

export default DailyReportService;
