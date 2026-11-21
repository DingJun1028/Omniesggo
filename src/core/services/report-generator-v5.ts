/**
 * ESGGO v5.0 — Report Generator v5
 * Generates 28-chapter sustainability reports using Excel high-fidelity answers.
 */

import { getAnswersByCompany, type Answer } from '../repositories/sustain-write-answer-database';
import { COMPANIES } from '../repositories/company-profiles';
import { V5_CHAPTERS, type V5GeneratedReport, type V5ReportChapter } from './report-assembly-v5';

export interface GenerationProgress {
  phase: 'loading' | 'assembling' | 'filling' | 'done' | 'error';
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  wordCount: number;
  totalWords: number;
  error?: string;
}

const C_TO_V5: Record<string, number[]> = {
  'C1': [1], 'C2': [2, 15], 'C3': [3], 'C4': [4, 25],
  'C5': [5, 6, 16, 17], 'C6': [7], 'C7': [8],
  'C8': [10, 24], 'C9': [11, 24], 'C10': [12, 13, 14, 22],
  'C11': [19, 23, 27], 'C12': [14, 26, 28],
};

function countChars(text: string): number {
  const clean = text.replace(/<[^>]+>/g, ' ');
  const chinese = (clean.match(/[一-鿿]/g) || []).length;
  const english = (clean.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

function zkp(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

type AnswerRecord = Answer;

interface CompanyProfile {
  companyName: string;
  shortName: string;
  employees: number;
  annualRevenue: string;
  operatingLocations: string;
  mainBusiness: string;
  electricityKwh: number;
  waterTons: number;
  industryType: string;
  instanceId: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildChapterContent(chNum: number, answers: AnswerRecord[], profile: CompanyProfile, year: number): string {
  const ch = V5_CHAPTERS.find(c => c.num === chNum)!;
  const company = escapeHtml(profile.companyName);
  const short = escapeHtml(profile.shortName);
  const gates: Record<string, string> = { traceable: '溯源', transparent: '透明', tangible: '實證', trustworthy: '可信', trackable: '可追蹤' };
  let html = `<h2>第${chNum}章 ${escapeHtml(ch.title)}</h2>`;
  html += `<p>本章揭露主體為${company}（${short}），報導年度為${year}。本章依據目前可取得的公司資料與填答編製；以下區分公司提供之陳述、資料缺口及尚未提供的佐證，不將未提供資料推定為已達標或已受外部確信。</p>`;
  html += `<p>5T揭露面向：${gates[ch.fiveTGate] || escapeHtml(ch.fiveTGate)}。此標示代表報告編排面向，不代表通過稽核或第三方確信。</p>`;

  if (answers.length) {
    for (const [index, answer] of answers.entries()) {
      const question = answer.question?.trim();
      const body = answer.answer?.trim();
      html += `<h3>${chNum}.${index + 1} ${escapeHtml(question || answer.gri || '公司填答')}</h3>`;
      if (body) html += `<p>公司填答：${escapeHtml(body)}</p>`;
      else html += '<p>資料狀態：尚未提供本題回答。</p>';
      if (answer.dataAtoms?.trim()) html += `<p>資料項目：${escapeHtml(answer.dataAtoms)}</p>`;
      if (answer.gri?.trim()) html += `<p>對應揭露：${escapeHtml(answer.gri)}</p>`;
      if (answer.dataMaturity?.trim()) html += `<p>資料成熟度（公司填報）：${escapeHtml(answer.dataMaturity)}</p>`;
      if (answer.evidence?.trim()) html += `<p>佐證狀態（填答紀錄）：${escapeHtml(answer.evidence)}</p>`;
      else html += '<p>佐證附件：目前資料來源未附可核對的實際附件。</p>';
      if (answer.dataGap?.trim()) html += `<p>待補資料：${escapeHtml(answer.dataGap)}</p>`;
    }
  } else {
    html += '<h3>本章資料狀態</h3><p>目前沒有與本章對應的公司填答或上傳證據，故不推定公司政策、績效或法規遵循狀況。</p>';
  }

  const supplied = answers.filter(answer => Boolean(answer.answer?.trim())).length;
  const gaps = answers.filter(answer => Boolean(answer.dataGap?.trim()) || !answer.answer?.trim()).length;
  html += '<h3>資料完整性與待辦</h3>';
  html += `<p>本章載入${answers.length}筆相關填答，其中${supplied}筆有回答、${gaps}筆標記或呈現待補。填答筆數不等同已核實的證據數。</p>`;
  if (gaps) html += '<p>建議由資料負責人補齊缺漏、報導期間、計算邊界及可追溯原始文件；完成內部覆核前，不應將資料表述為確信結果。</p>';
  html += `<p>資料與章節對應雜湊：${zkp(html)}</p>`;
  return html;
}

export function generateV5Report(companyId: string, reportingYear = new Date().getFullYear() - 1): V5GeneratedReport | null {
  const profile = COMPANIES.find(company => company.instanceId === companyId);
  if (!profile) return null;
  const allAnswers = getAnswersByCompany(companyId);
  if (!allAnswers.length) return null;

  const currentYear = new Date().getFullYear();
  const safeYear = Number.isInteger(reportingYear) && reportingYear >= 2000 && reportingYear <= currentYear
    ? reportingYear
    : currentYear - 1;
  const chapters: V5ReportChapter[] = [];
  let totalWords = 0;

  for (const chapter of V5_CHAPTERS) {
    const chapterAnswers = allAnswers.filter(answer => {
      const sourceChapter = answer.chapter.trim().split(/\s+/)[0];
      return (C_TO_V5[sourceChapter] || []).includes(chapter.num);
    });

    const content = buildChapterContent(chapter.num, chapterAnswers, profile, safeYear);
    const wordCount = countChars(content);
    totalWords += wordCount;
    chapters.push({
      id: chapter.id,
      num: chapter.num,
      title: chapter.title,
      griCodes: chapter.gri,
      fiveTGate: chapter.fiveTGate,
      content,
      wordCount,
      zkpHash: zkp(content),
      omniTagUuid: `OTG-${String(chapter.num).padStart(2, '0')}-${safeYear}-${chapter.fiveTGate.toUpperCase()}`,
      evidenceCount: chapterAnswers.filter(answer => Boolean(answer.evidence?.trim())).length,
    });
  }

  return {
    companyId,
    companyName: profile.companyName,
    industry: profile.industryType,
    chapters,
    totalWords,
    totalParagraphs: chapters.reduce((sum, chapter) => sum + (chapter.content.match(/<p>/g)?.length || 0), 0),
    totalOmniTags: chapters.length,
    totalEvidence: chapters.reduce((sum, chapter) => sum + chapter.evidenceCount, 0),
    fiveTStatus: { traceable: false, transparent: false, tangible: false, trustworthy: false, trackable: false },
    trinityHash: zkp(chapters.map(chapter => chapter.zkpHash).join(':')),
    generatedAt: new Date().toISOString(),
    reportVersion: '5.1',
  };
}

export interface RenderOptions {
  charts?: boolean;
  imagery?: boolean;
}

export function renderOptionsFromQuery(query: URLSearchParams | string): { charts: boolean; imagery: boolean } {
  const params = typeof query === 'string' ? new URLSearchParams(query) : query;
  const c = params.get('charts');
  const i = params.get('imagery');
  return {
    charts: c !== '0' && c !== 'false',
    imagery: i !== '0' && i !== 'false',
  };
}

export function reportV5ToHtml(report: V5GeneratedReport, options?: RenderOptions): string {
  const year = new Date(report.generatedAt).getFullYear() - 1;
  const showCharts = options?.charts !== false;
  const showImagery = options?.imagery !== false;
  let html = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>${report.companyName} ${year}年永續報告書 — ESGGO v${report.reportVersion}</title>`;
  html += `<style>body{font-family:"Noto Sans TC",sans-serif;max-width:1200px;margin:0 auto;padding:20px;line-height:1.8;color:#1e293b}`;
  html += `h1{color:#009EB0;border-bottom:3px solid #009EB0;padding-bottom:12px}`;
  html += `h2{color:#009EB0;margin-top:50px;border-left:4px solid #D4AF37;padding-left:12px}`;
  html += `h3{color:#475569;margin-top:30px}p{margin:12px 0;text-align:justify}`;
  html += `table{border-collapse:collapse;width:100%;margin:20px 0;font-size:14px}`;
  html += `th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left}`;
  html += `th{background:#f1f5f9}tr:nth-child(even){background:#f8fafc}`;
  html += `.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:30px 0}`;
  html += `.stat{background:#f1f5f9;padding:18px;border-radius:12px;text-align:center}`;
  html += `.stat-value{font-size:28px;font-weight:700;color:#009EB0}</style></head><body>`;
  html += `<h1>${report.companyName}</h1>`;
  html += `<h2 style="border:none;color:#475569;font-size:16px;margin-top:5px">${year}年永續報告書 — 公司填答整理版</h2>`;
  html += `<div class="stats"><div class="stat" data-stat="chapters" data-value="${report.chapters?.length || 0}"><div class="stat-value">${report.chapters?.length || 0}</div><div style="font-size:12px;color:#64748b">章節數</div></div>`;
  html += `<div class="stat"><div class="stat-value">${report.totalWords.toLocaleString()}</div><div style="font-size:12px;color:#64748b">實際字數</div></div>`;
  html += `<div class="stat"><div class="stat-value">待覆核</div><div style="font-size:12px;color:#64748b">確信狀態</div></div>`;
  html += `<div class="stat"><div class="stat-value">HASH</div><div style="font-size:12px;color:#64748b">輸出內容指紋（非確信）</div></div></div>`;

  if (showCharts) {
    html += `<div data-viz="chapter-wordcount"><svg width="100%" height="200" viewBox="0 0 800 200">`;
    for (let idx = 0; idx < report.chapters.length; idx++) {
      const ch = report.chapters[idx];
      html += `<rect data-chapter="${ch.num}" x="${idx * 60}" y="${200 - Math.min(180, ch.wordCount / 10)}" width="40" height="${Math.min(180, ch.wordCount / 10)}" fill="#009EB0" />`;
    }
    html += `</svg></div>`;
  }

  for (const ch of report.chapters) {
    if (showImagery) {
      html += `<figure data-figure="ch-${ch.num}"></figure>`;
    }
    html += ch.content;
  }

  html += `<hr><p style="text-align:center;color:#64748b;font-size:12px">ESGGO v${report.reportVersion} | 填答整理，非第三方確信 | 實際生成 ${report.totalWords.toLocaleString()} 字 | 內容指紋：${report.trinityHash}</p>`;
  html += `</body></html>`;
  return html;
}

export function reportV5ToMarkdown(report: V5GeneratedReport, _options?: RenderOptions): string {
  let md = `# ${report.companyName} ${report.reportVersion} 永续报告\n\n`;
  md += `> 總字数：${report.totalWords.toLocaleString()} | Trinity Hash: ${report.trinityHash}\n\n---\n\n`;
  for (const ch of report.chapters) {
    md += `## 第${ch.num}章 ${ch.title}\n\n`;
    md += ch.content.replace(/<[^>]+>/g, '') + '\n\n---\n\n';
  }
  return md;
}

// Re-exports for backward compatibility — prefer importing from source modules
export { V5_CHAPTERS } from './report-assembly-v5';
export { getAnswersByCompany } from '../repositories/sustain-write-answer-database';

export function getV5Companies() {
  return COMPANIES.map((c) => ({
    id: c.instanceId,
    name: c.companyName,
    shortName: c.shortName,
    industry: c.industryType,
  }));
}
