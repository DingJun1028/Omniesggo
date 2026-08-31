// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * C-Version Report API Helpers
 * Stub implementations for c-version/route.ts
 */

import { COMPANIES, type CompanyProfile } from '../../core/repositories/company-profiles';

export function getAvailableCompanies() {
  return COMPANIES.map((c: CompanyProfile) => ({
    id: c.instanceId,
    name: c.companyName,
    shortName: c.shortName,
    industry: c.industryType,
  }));
}

export function assembleCVersionReport(companyId: string): Record<string, unknown> | null {
  const company = COMPANIES.find((c: CompanyProfile) => c.instanceId === companyId);
  if (!company) return null;
  return {
    companyId,
    companyName: company.companyName,
    version: 'C版 v3.7',
    chapters: [],
    totalWords: 0,
    generatedAt: new Date().toISOString(),
  };
}

export function reportToHtml(report: { companyName: string; version: string }): string {
  if (!report) return '<p>報告產生中...</p>';
  return `<html><head><title>${report.companyName} 永續報告</title></head>
<body><h1>${report.companyName}</h1><p>版本: ${report.version}</p></body></html>`;
}

export function reportToMarkdown(report: { companyName: string; version: string; generatedAt: string }): string {
  if (!report) return '# 報告產生中...';
  return `# ${report.companyName} 永續報告\n\n版本: ${report.version}\n\n產生時間: ${report.generatedAt}\n`;
}
