import { describe, expect, it } from 'vitest';
import { generateFullV5Report, fullReportToHtml } from '@/core/services/report-generator-v5-full';

describe('individualized sustainability report data integrity', () => {
  it('uses selected-company answer data, a chosen reporting year, and honest evidence/word counts', async () => {
    const companies = ['DEMO-01', 'DEMO-02'];
    const generated = await Promise.all(companies.map(companyId => generateFullV5Report(companyId, 'professional', 2024)));

    for (const report of generated) {
      expect(report).not.toBeNull();
      expect(report?.reportingYear).toBe(2024);
      expect(report?.chapters).toHaveLength(28);
      expect(report?.totalEvidence).toBe(0);
      expect(report?.totalEvidenceItems).toBe(0);
      expect(report?.fiveTStatus).toEqual({ traceable: false, transparent: false, tangible: false, trustworthy: false, trackable: false });
      expect(report?.targetWords).toBe(280000);
      expect(report?.wordTargetMet).toBe(report!.totalWords >= 280000);
      expect(report?.totalWords).toBe(report?.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0));

      const html = fullReportToHtml(report!);
      expect(html).toContain('2024年永續報告書');
      expect(html).toContain('模擬示範題庫');
      expect(html).toContain('已連結實際附件為0');
      expect(html).toContain('字數目標未達');
      expect(html).not.toContain('92%');
      expect(html).not.toContain('A:verified');
      expect(html).not.toContain('第三方確信機構驗證在案');
    }

    expect(generated[0]?.companyId).toBe('DEMO-01');
    expect(generated[1]?.companyId).toBe('DEMO-02');
    expect(generated[0]?.chapters.map(chapter => chapter.content).join('')).not.toBe(
      generated[1]?.chapters.map(chapter => chapter.content).join(''),
    );
  });

  it('does not claim the 280K target is reached when the supplied report is short', async () => {
    const report = await generateFullV5Report('DEMO-01', 'professional', 2024);
    expect(report).not.toBeNull();
    if (report) {
      expect(report.totalWords).toBeLessThan(280000);
      expect(report.wordTargetMet).toBe(false);
      expect(fullReportToHtml(report)).toContain('系統不會以重複或虛構內容補足');
    }
  });
});
