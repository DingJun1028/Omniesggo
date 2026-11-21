/**
 * 報告組裝引擎 — ESGGO C版專業永續報告
 * 
 * 5T 協議：真 → 善 → 美 → 信 → 通
 * OmniTag 萬能標籤：量子糾纏式雙向同步定位
 * UI Design: v3.7 固態極簡光學
 */

import { OmniTagFactory, FiveTReportEngine, GeneratedReport, ReportChapter } from '../../lib/sustain-write/omni-tag';
import { COMPANIES } from '../repositories/company-profiles';
import { getAnswersByCompany } from '../repositories/answer-database';
import { generateReportHTML } from '../../lib/sustain-write/ui-design';

// 重新匯出
export { OmniTagFactory, FiveTReportEngine, generateReportHTML };
export type { GeneratedReport, ReportChapter };

/**
 * 主要 API：組裝完整專業報告
 */
export function assembleCVersionReport(companyId: string): GeneratedReport | null {
  let profile: (typeof COMPANIES)[number] | null = null;
  for (const c of COMPANIES) {
    if (c.instanceId === companyId) { profile = c; break; }
  }
  if (!profile) return null;

  const answers = getAnswersByCompany(companyId);
  if (!answers.length) return null;

  const report = FiveTReportEngine.assemble(companyId, answers, profile);
  return report;
}

/**
 * 取得所有可用公司列表
 */
export function getAvailableCompanies() {
  return COMPANIES.map(c => ({
    id: c.instanceId,
    name: c.companyName,
    shortName: c.shortName,
    industry: c.industryType,
  }));
}

/**
 * 將報告轉為 HTML（使用 v3.7 設計系統）
 */
export function reportToHtml(report: GeneratedReport): string {
  return generateReportHTML(report);
}

/**
 * 將報告轉為 Markdown
 */
export function reportToMarkdown(report: GeneratedReport): string {
  const parts: string[] = [];
  parts.push('# ' + report.companyName + ' — C版專業永續報告\n');
  parts.push('> 本報告依據 5T 協議（真善美信通）生成\n');

  for (const chapter of report.chapters) {
    parts.push('## ' + chapter.title + '\n');
    const paragraphs = chapter.content.split('\n\n');
    for (const para of paragraphs) {
      if (para.indexOf('[OmniTag:') >= 0) {
        const text = para.replace(/\[OmniTag:[^\]]+\]\s*/, '');
        if (text.trim()) parts.push(text + '\n');
      } else if (para.trim()) {
        parts.push(para + '\n');
      }
    }
  }

  parts.push('---\n');
  parts.push('*報告生成時間：' + report.generatedAt + '*\n');
  parts.push('*總字數：' + report.totalWords.toLocaleString() + ' 字*\n');
  return parts.join('\n');
}
