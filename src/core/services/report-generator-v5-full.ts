/**
 * ESGGO v5.0 — Report Generator v5 (完整資料版)
 * 整合 8 分頁 Excel 資料：Profiles + Questions + Answers + Outlines + Evidence + Dashboard + GRI
 */

import {
  getAnswersByCompany, getCompanyById,
  getEvidenceGuide, getGRIImpact,
  type Answer, type EvidenceGuide,
} from '../repositories/sustain-write-answer-database';
import { V5_CHAPTERS } from './report-assembly-v5';
import type { V5GeneratedReport, V5ReportChapter } from './report-assembly-v5';

const C_TO_V5: Record<string, number[]> = {
  'C1': [1], 'C2': [2, 15], 'C3': [3], 'C4': [4, 25],
  'C5': [5, 6, 16, 17], 'C6': [7], 'C7': [8],
  'C8': [10, 24], 'C9': [11, 24], 'C10': [12, 13, 14, 22],
  'C11': [19, 23, 27], 'C12': [14, 26, 28],
};

export interface CompanyDocumentEvidence { id: string; companyId: string; fileName: string; reportingYear: number | null; uploadedAt: string; mimeType: string; text: string; hashLock: string; }

export interface ExtendedChapterData extends V5ReportChapter {
  questionDetails: ReadonlyArray<{
    questionId: string;
    question: string;
    whatToFill: string;
    griMapping: string;
    evidenceReq: string;
    dataAtoms: string;
  }>;
  evidenceGuide: ReadonlyArray<EvidenceGuide>;
  griMapping: string;
  investorMapping: string;
}

export interface ExtendedV5Report extends V5GeneratedReport {
  totalQuestions: number;
  totalEvidenceItems: number;
  targetWords: number;
  wordTargetMet: boolean;
  completionRate: number;
  outline: {
    summary: string;
    envHighlight: string;
    socialHighlight: string;
    govHighlight: string;
    impactHighlight: string;
    upgradeAdvice: string;
  } | null;
  brandTone?: string;
  chartConfigs?: Array<Record<string, unknown>>; // Rich chart configuration payload
  swarmTrace?: string[];
}

function zkp(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function countChars(text: string): number {
  const clean = text.replace(/<[^>]+>/g, ' ');
  const chinese = (clean.match(/[一-鿿]/g) || []).length;
  const english = (clean.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function generateFullV5Report(companyId: string, brandTone: string = 'professional', reportingYear = new Date().getFullYear() - 1, documents: readonly CompanyDocumentEvidence[] = []): Promise<ExtendedV5Report | null> {
  const profile = getCompanyById(companyId);
  if (!profile) return null;
  const allAnswers = getAnswersByCompany(companyId);
  if (!allAnswers.length) return null;
  // Legacy outline records are shared demo/sample data and are not reliably tied to submitted company documents.
  // Do not mix them into an individualized report as company facts.
  const outline = null;
  const currentYear = new Date().getFullYear();
  const safeYear = Number.isInteger(reportingYear) && reportingYear >= 2000 && reportingYear <= currentYear ? reportingYear : currentYear - 1;

  const yearDocuments = documents.filter(document => document.companyId === companyId && (document.reportingYear === null || document.reportingYear === safeYear));
  const chapters: ExtendedChapterData[] = [];
  let totalWords = 0;

  for (const ch of V5_CHAPTERS) {
    const chAnswers = allAnswers.filter((a: Answer) => {
      const prefix = a.chapter.split(' ')[0];
      return (C_TO_V5[prefix] || []).includes(ch.num);
    });

    // Build question details
    const questionDetails: ExtendedChapterData['questionDetails'] = chAnswers.map((a: Answer) => ({
      questionId: String(a.questionId || ''),
      question: String(a.question || ''),
      whatToFill: '',
      griMapping: String(a.gri || ''),
      evidenceReq: String(a.evidence || ''),
      dataAtoms: String(a.dataAtoms || ''),
    }));

    // Get evidence guides for this chapter
    const evidenceGuide = ['公司治理', '環境', '社會', '治理']
      .map(cat => getEvidenceGuide(cat))
      .filter(Boolean) as EvidenceGuide[];

    // Get GRI mapping
    const griImpact = getGRIImpact(ch.title);

    let content = '';
    content += `<h2>第${ch.num}章 ${escapeHtml(ch.title)}</h2>`;
    content += `<p>${escapeHtml(profile.companyName)}（以下簡稱${escapeHtml(profile.shortName)}），報導期間：${safeYear}年度。題庫填答來源狀態：試算示範資料（模擬填答，非該公司實際提交）；僅下列明確列名附件屬於此公司上傳的文件，其文字仍須權責人覆核。未引用示範 profile 指標。5T面向「${escapeHtml(ch.fiveTGate)}」為章節分類，不表示已通過確信。</p>`;

    if (chAnswers.length > 0) {
      for (let i = 0; i < chAnswers.length; i++) {
        const a = chAnswers[i];
        const finalAnswer = a.answer;

        content += `<h3>${ch.num}.${i+1} 題目：${escapeHtml(a.question)}</h3>`;
        content += `<div class="answer-block">${escapeHtml(finalAnswer)}</div>`;
        if (a.gri) content += `<p class="gri-tag">GRI對應: ${escapeHtml(a.gri)}</p>`;
        if (a.evidence) {
          content += `<div class="service-teaching-block">`;
          content += `<h4>[教學即服務] 證據要求解析</h4>`;
          content += `<p><strong>建議佐證：</strong> ${escapeHtml(a.evidence)}</p>`;
          content += `<p>此欄位為題庫要求的佐證種類，非代表公司已提交或已核驗該附件。</p>`;
          content += `</div>`;
        }
        if (a.dataAtoms) content += `<p class="atom-tag">資料項目：${escapeHtml(a.dataAtoms)}</p>`;
        if (a.dataGap) content += `<p class="data-gap">待補資料：${escapeHtml(a.dataGap)}</p>`;
        if (!a.answer?.trim()) content += '<p class="data-gap">資料狀態：尚未提供本題回答。</p>';
      }
    }

    content += `<h3>量化指標與資料完整性</h3>`;
    const answeredMetrics = chAnswers.filter(answer => answer.answer?.trim() && answer.dataAtoms?.trim());
    if (answeredMetrics.length) {
      content += '<ul>';
      for (const metric of answeredMetrics) {
        content += `<li>${escapeHtml(metric.dataAtoms)}：${escapeHtml(metric.answer)}（資料為公司填答，尚未獨立驗證）</li>`;
      }
      content += '</ul>';
    } else {
      content += '<p class="data-gap">目前沒有本章可直接引用的量化填答；未提供指標、基準年、計算邊界或目標值均不推測。</p>';
    }
    const missingAnswers = chAnswers.filter(answer => !answer.answer?.trim());
    const declaredGaps = chAnswers.filter(answer => Boolean(answer.dataGap?.trim()));
    content += `<p>本章關聯題數：${chAnswers.length}；有填答：${chAnswers.length - missingAnswers.length}；未填答：${missingAnswers.length}；已登錄缺口：${declaredGaps.length}。</p>`;
    if (chAnswers.length === 0) content += '<p class="data-gap">本章目前沒有公司填答，請補齊適用性說明與相關單據；不代表公司沒有相關影響或風險。</p>';
    if (missingAnswers.length || declaredGaps.length) content += '<p class="data-gap">待辦：補充缺漏回答、報導期間、組織/營運邊界、計算方法及可追溯原始附件，再由權責人覆核。</p>';

    if (outline && ch.num <= 5) {
      const highlights = [outline.envHighlight, outline.socialHighlight, outline.govHighlight, outline.impactHighlight];
      const highlight = highlights[ch.num - 1];
      if (highlight?.trim()) content += `<h3>報告雛形重點（待公司確認）</h3><p>${escapeHtml(highlight)}</p>`;
    }

    // Until OCR results carry reviewed topic mappings, attach each uploaded document once to the evidence register chapter.
    // Other chapters point to the register rather than duplicating or guessing the document's subject.
    const chapterDocuments = ch.num === 1 ? yearDocuments : [];
    content += '<h3>公司上傳單據與來源追溯</h3>';
    if (chapterDocuments.length) {
      for (const document of chapterDocuments) {
        content += `<article class="uploaded-evidence"><h4>上傳文件：${escapeHtml(document.fileName)}</h4><p>文件 ID：${escapeHtml(document.id)}；年度：${document.reportingYear ?? '未標記'}；上傳時間：${escapeHtml(document.uploadedAt)}；來源指紋：${escapeHtml(document.hashLock)}</p><blockquote>${escapeHtml(document.text.slice(0, 4000))}</blockquote><p>OCR 擷取文字，尚未人工覆核；不得視為已查證揭露。</p></article>`;
      }
    } else {
      content += '<p class="data-gap">本章尚無符合此公司的已保存上傳附件；題庫佐證要求只是建議文件類別，非已提交單據。</p>';
    }
    content += `<p>本章匹配附件數：${chapterDocuments.length}。上傳附件不等同第三方查證或已核准數據。</p>`;
    content += `<p>5T面向：${escapeHtml(ch.fiveTGate)}（分類標籤，非確信結論）。報告內容雜湊：${zkp(content)}。此雜湊僅用於偵測本次輸出是否變動，不代表資料真實性或第三方驗證。</p>`;

    const words = countChars(content);
    totalWords += words;

    chapters.push({
      id: ch.id,
      num: ch.num,
      title: ch.title,
      griCodes: ch.gri,
      fiveTGate: ch.fiveTGate,
      content,
      wordCount: words,
      zkpHash: zkp(content),
      omniTagUuid: `OTG-${String(ch.num).padStart(2,'0')}-${safeYear}-${ch.fiveTGate.toUpperCase()}`,
      evidenceCount: chapterDocuments.length,
      questionDetails: questionDetails,
      evidenceGuide,
      griMapping: griImpact?.griMapping || '',
      investorMapping: griImpact?.investorMapping || '',
    });
  }

  const companyQuestionCount = allAnswers.length;
  const answeredQuestionCount = allAnswers.filter(answer => Boolean(answer.answer?.trim())).length;
  const completionRate = companyQuestionCount ? answeredQuestionCount / companyQuestionCount : 0;

  return {
    companyId,
    companyName: profile.companyName,
    industry: profile.industryType,
    chapters,
    totalWords,
    totalParagraphs: chapters.reduce((s, c) => s + c.content.split('<p>').length, 0),
    totalOmniTags: chapters.length,
    totalEvidence: yearDocuments.length,
    fiveTStatus: { traceable: false, transparent: false, tangible: false, trustworthy: false, trackable: false },
    trinityHash: zkp(String(totalWords) + companyId),
    generatedAt: new Date().toISOString(),
    reportingYear: safeYear,
    reportVersion: '5.1',
    totalQuestions: companyQuestionCount,
    totalEvidenceItems: yearDocuments.length,
    targetWords: 280000,
    wordTargetMet: totalWords >= 280000,
    completionRate,
    outline: outline ? {
      summary: String(outline.summary || ''),
      envHighlight: String(outline.envHighlight || ''),
      socialHighlight: String(outline.socialHighlight || ''),
      govHighlight: String(outline.govHighlight || ''),
      impactHighlight: String(outline.impactHighlight || ''),
      upgradeAdvice: String(outline.upgradeAdvice || ''),
    } : null,
    brandTone,
    chartConfigs: [],
    swarmTrace: []
  };
}

export function fullReportToHtml(report: ExtendedV5Report): string {
  const year = report.reportingYear;
  let html = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(report.companyName)} ${year}年永續報告書 — ESGGO v${escapeHtml(report.reportVersion)}</title>`;
  html += `<style>`;
  html += `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`;
  html += `:root{--teal:#009EB0;--gold:#D4AF37;--blue:#3B82F6;--purple:#8B5CF6;--lethal:#FF4D6D;--bg:#0a0a0f;--card:rgba(20,20,24,0.85);--border:rgba(0,158,176,0.2);--text:#e8e8e8;--text2:#9ca3af;--surface:#1a1a1f;--surface2:#252530}`;
  html += `body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;max-width:1200px;margin:0 auto;padding:20px;line-height:1.8;color:var(--text);background:var(--bg)}`;
  html += `h1{color:var(--teal);border-bottom:3px solid var(--teal);padding-bottom:12px;font-size:clamp(1.5rem,4vw,2.2rem)}`;
  html += `h2{color:var(--teal);margin-top:50px;border-left:4px solid var(--gold);padding-left:12px;font-size:clamp(1.2rem,3vw,1.6rem)}`;
  html += `h3{color:var(--text2);margin-top:30px;font-size:clamp(1rem,2.5vw,1.2rem)}`;
  html += `p{margin:12px 0;text-align:justify;word-break:break-word}`;
  html += `table{border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;display:block;overflow-x:auto}`;
  html += `th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left;white-space:nowrap}`;
  html += `th{background:var(--surface);font-weight:600}`;
  html += `tr:nth-child(even){background:var(--card)}`;
  html += `.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:15px;margin:30px 0}`;
  html += `.stat{background:var(--surface);padding:18px;border-radius:12px;text-align:center}`;
  html += `.stat-value{font-size:clamp(1.5rem,4vw,2rem);font-weight:700;color:var(--teal)}`;
  html += `.stat-label{font-size:12px;color:var(--text2);margin-top:4px}`;
  html += `.answer-block{background:var(--card);padding:20px;border-radius:12px;margin:20px 0;border-left:4px solid var(--teal)}`;
  html += `.service-teaching-block{background:rgba(212,175,55,0.05);padding:15px;border-radius:8px;margin:15px 0;border:1px dashed var(--gold);}`;
  html += `.service-teaching-block h4{color:var(--gold);margin-top:0;font-size:14px;}`;
  html += `.gri-tag{font-size:12px;color:var(--blue);font-family:monospace}`;
  html += `.evid-tag{font-size:12px;color:var(--gold)}`;
  html += `.atom-tag{font-size:11px;color:var(--text2)}`;
  html += `.zkp-seal{font-size:11px;font-family:monospace;color:var(--blue);background:rgba(59,130,246,0.1);padding:4px 8px;border-radius:4px;margin:30px 0}`;
  html += `.outline-box{background:var(--surface);padding:20px;border-radius:12px;margin:20px 0;border:1px solid var(--border)}`;
  html += `@media(max-width:640px){body{padding:10px}.stats{grid-template-columns:repeat(2,1fr)}h2{margin-top:30px}}`;
  html += `</style></head><body>`;

  html += `<h1>${escapeHtml(report.companyName)}</h1>`;
  html += `<h2 style="border:none;color:var(--text2);font-size:16px;margin-top:5px">${year}年永續報告書 — ESGGO v${report.reportVersion} 公司填答整理版</h2>`;

  html += `<div class="stats">`;
  html += `<div class="stat"><div class="stat-value">${report.chapters.length}</div><div class="stat-label">章節數</div></div>`;
  html += `<div class="stat"><div class="stat-value">${report.totalWords.toLocaleString()}</div><div class="stat-label">實際生成字數（目標 ${report.targetWords.toLocaleString()}）</div></div>`;
  if (!report.wordTargetMet) html += `<div class="outline-box"><strong>字數目標未達：</strong>目前依可用公司填答生成 ${report.totalWords.toLocaleString()} 字，尚缺 ${Math.max(0, report.targetWords - report.totalWords).toLocaleString()} 字。系統不會以重複或虛構內容補足；請補充經公司確認的單據、數據、政策與說明後重新生成。</div>`;
  html += `<div class="stat"><div class="stat-value">待覆核</div><div class="stat-label">確信狀態</div></div>`;
  html += `<div class="stat"><div class="stat-value">0</div><div class="stat-label">已連結實際附件</div></div>`;
  html += `<div class="stat"><div class="stat-value">${(report.completionRate * 100).toFixed(0)}%</div><div class="stat-label">完成率</div></div>`;
  html += `</div>`;

  if (report.outline) {
    html += `<div class="outline-box"><h3>報告摘要（待公司確認）</h3><p>${escapeHtml(report.outline.summary)}</p></div>`;
  }
  html += `<div class="outline-box"><h3>資料來源與限制</h3><p>本稿引用的公司/填答資料來自模擬示範題庫，並非公司實際提交，僅供流程展示；正式揭露前必須以企業確認的原始資料逐項替換並覆核。本報告依${year}年度選項編排。當前系統尚無可按公司識別的已上傳附件/核驗記錄，故已連結實際附件為0；題庫中的建議佐證僅是待提交清單，不是公司收據。未有來源支持的指標不推估，亦不宣稱外部確信。</p></div>`;

  for (const ch of report.chapters) {
    html += ch.content;
  }

  if (report.swarmTrace && report.swarmTrace.length > 0) {
    html += `<div class="service-teaching-block" style="border-color: var(--teal); background: rgba(0,158,176,0.05);">`;
    html += `<h3 style="color: var(--teal); margin-top: 0;">L-Hub 代理集羣協作軌跡 (Swarm Trace)</h3><ul>`;
    for (const trace of report.swarmTrace) {
      html += `<li style="font-size: 13px;">${escapeHtml(trace)}</li>`;
    }
    html += `</ul></div>`;
  }

  html += `<hr><p style="text-align:center;color:var(--text2);font-size:12px">ESGGO v${report.reportVersion} | 本報告依目前可用公司填答整理，非第三方確信文件 | 實際生成 ${report.totalWords.toLocaleString()} 字 | 內容指紋：${report.trinityHash}</p>`;
  html += `</body></html>`;
  return html;
}

export { generateFullV5Report as generateV5Report };
