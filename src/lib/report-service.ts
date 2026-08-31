// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * src/lib/report-service.ts — 報告生成服務
 *
 * 整合 5T 協議和 ZKP 驗證的報告生成服務。
 */

import { createHash } from 'crypto';
import { FiveTTraceable, FiveTTrackable } from './five-t-protocol';
import { ZKPService } from './zkp-service';

// ── Types ─────────────────────────────────────────────────────

export interface ReportConfig {
  companyId: string;
  year: number;
  format: 'html' | 'markdown' | 'pdf';
  includeEvidence: boolean;
  includeZKP: boolean;
  language: 'zh-TW' | 'en';
}

export interface ReportMetadata {
  reportId: string;
  companyId: string;
  generatedAt: number;
  wordCount: number;
  chapterCount: number;
  fiveT: {
    traceable: boolean;
    transparent: boolean;
    tangible: boolean;
    trustworthy: boolean;
    trackable: boolean;
  };
  zkp?: {
    sealed: boolean;
    hashLock: string;
    proof: string;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  fiveTGate: string;
  wordCount: number;
}

// ── Report Service ────────────────────────────────────────────

export class ReportService {
  /**
   * 生成報告 ID
   */
  static generateReportId(companyId: string, year: number): string {
    const ts = Date.now();
    const data = `${companyId}:${year}:${ts}`;
    const hash = createHash('sha256').update(data).digest('hex').substring(0, 12);
    return `RPT-${year}-${companyId}-${hash}`;
  }

  /**
   * 計算報告摘要
   */
  static calculateSummary(sections: ReportSection[]): {
    totalWords: number;
    fiveTStats: Record<string, number>;
  } {
    let totalWords = 0;
    const fiveTStats: Record<string, number> = {
      traceable: 0,
      transparent: 0,
      tangible: 0,
      trustworthy: 0,
      trackable: 0,
    };

    for (const section of sections) {
      totalWords += section.wordCount;
      if (fiveTStats[section.fiveTGate] !== undefined) {
        fiveTStats[section.fiveTGate]++;
      }
    }

    return { totalWords, fiveTStats };
  }

  /**
   * 建立報告元資料
   */
  static createMetadata(
    companyId: string,
    sections: ReportSection[],
    includeZKP: boolean = false
  ): ReportMetadata {
    const { totalWords, fiveTStats } = this.calculateSummary(sections);
    const reportId = this.generateReportId(companyId, 2025);

    const metadata: ReportMetadata = {
      reportId,
      companyId,
      generatedAt: Date.now(),
      wordCount: totalWords,
      chapterCount: sections.length,
      fiveT: {
        traceable: fiveTStats.traceable > 0,
        transparent: fiveTStats.transparent > 0,
        tangible: fiveTStats.tangible > 0,
        trustworthy: fiveTStats.trustworthy > 0,
        trackable: fiveTStats.trackable > 0,
      },
    };

    if (includeZKP) {
      const sealResult = ZKPService.seal(reportId);
      metadata.zkp = {
        sealed: true,
        hashLock: sealResult.hashLock,
        proof: sealResult.proof,
      };
    }

    return metadata;
  }

  /**
   * 追蹤報告生命週期
   */
  static trackLifecycle(reportId: string, action: string): void {
    FiveTTrackable.recordEvent(reportId, 'report', { action });
  }

  /**
   * 記錄報告溯源
   */
  static recordProvenance(
    reportId: string,
    source: string,
    data: Record<string, unknown> = {}
  ): void {
    FiveTTraceable.recordSource(reportId, source, data);
  }

  /**
   * 生成報告下載資訊
   */
  static generateDownloadInfo(
    companyId: string,
    format: 'html' | 'markdown' | 'pdf'
  ): {
    filename: string;
    contentType: string;
    extension: string;
  } {
    const year = new Date().getFullYear();
    const baseName = `ESG_Report_${companyId}_${year}`;

    switch (format) {
      case 'markdown':
        return {
          filename: `${baseName}.md`,
          contentType: 'text/markdown; charset=utf-8',
          extension: 'md',
        };
      case 'pdf':
        return {
          filename: `${baseName}.pdf`,
          contentType: 'application/pdf',
          extension: 'pdf',
        };
      case 'html':
      default:
        return {
          filename: `${baseName}.html`,
          contentType: 'text/html; charset=utf-8',
          extension: 'html',
        };
    }
  }
}

// ── Convenience Functions ─────────────────────────────────────

/**
 * 快速生成報告元資料
 */
export function createReportMetadata(
  companyId: string,
  sections: ReportSection[],
  includeZKP?: boolean
): ReportMetadata {
  return ReportService.createMetadata(companyId, sections, includeZKP);
}

/**
 * 快速追蹤報告
 */
export function trackReportLifecycle(reportId: string, action: string): void {
  ReportService.trackLifecycle(reportId, action);
}
