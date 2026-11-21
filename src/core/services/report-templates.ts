/**
 * C版專業永續報告範本與章節定義
 * 自動生成自 OmniCore C版 Excel 資料庫
 * 包含12章節定義、GRI對應、報告段落範本與組合函式
 */

import { Answer as V5Answer, getAnswersByCompany } from '../repositories/sustain-write-answer-database';
import { COMPANIES } from '../repositories/company-profiles';

export interface ChapterDefinition {
  code: string;
  name: string;
  title: string;
  griMapping: string[];
  description: string;
}

export interface ReportSectionTemplate {
  chapterCode: string;
  sectionTitle: string;
  template: string;
  requiredFields: string[];
}

export interface AssembledReport {
  companyName: string;
  companyType: string;
  title: string;
  generatedAt: string;
  sections: ReportSection[];
  dataMaturitySummary: Record<string, number>;
  dataGaps: string[];
}

export interface ReportSection {
  chapterCode: string;
  sectionTitle: string;
  content: string;
  griReferences: string[];
  evidenceRequired: string[];
}

/**
 * C版專業永續報告 12章節定義
 * 對應 GRI Standards 與 IFRS S1/S2 要求
 */
export const CHAPTER_DEFINITIONS: ChapterDefinition[] = [
  {
    code: 'C1',
    name: '組織與報告邊界',
    title: '第一章：組織與報告邊界',
    griMapping: ['GRI 2-1', 'GRI 2-3', 'GRI 2-6'],
    description: '公司組織識別、法律結構、報告邊界與聯絡窗口之完整揭露',
  },
  {
    code: 'C2',
    name: '治理與永續管理',
    title: '第二章：治理與永續管理',
    griMapping: ['GRI 2-9', 'GRI 2-10', 'GRI 2-11', 'GRI 2-12', 'GRI 2-15', 'GRI 2-16', 'GRI 2-17', 'GRI 2-18', 'GRI 2-19', 'GRI 2-20', 'GRI 2-21'],
    description: '治理架構、永續策略、風險管理、薪酬與績效連結',
  },
  {
    code: 'C3',
    name: '重大性與利害關係人',
    title: '第三章：重大性與利害關係人',
    griMapping: ['GRI 2-25', 'GRI 2-26', 'GRI 2-29', 'GRI 3-1', 'GRI 3-2', 'GRI 3-3'],
    description: '利害關係人辨識、重大性分析流程與結果、ESG議題優先順序',
  },
  {
    code: 'C4',
    name: '經濟與誠信經營',
    title: '第四章：經濟與誠信經營',
    griMapping: ['GRI 2-27', 'GRI 201-1', 'GRI 201-2', 'GRI 201-3', 'GRI 201-4', 'GRI 203-1', 'GRI 203-2', 'GRI 205-1', 'GRI 205-2', 'GRI 205-3', 'GRI 206-1', 'GRI 207-1', 'GRI 207-2', 'GRI 207-3', 'GRI 207-4'],
    description: '經濟績效、市場佔有率、間接經濟衝擊、反貪腐與公平競爭',
  },
  {
    code: 'C5',
    name: '能源、碳與氣候',
    title: '第五章：能源、碳與氣候',
    griMapping: ['GRI 302-1', 'GRI 302-2', 'GRI 302-3', 'GRI 302-4', 'GRI 302-5', 'GRI 305-1', 'GRI 305-2', 'GRI 305-3', 'GRI 305-4', 'GRI 305-5', 'GRI 305-6', 'GRI 305-7'],
    description: '能源使用效率、溫室氣體排放、氣候風險與減碳目標',
  },
  {
    code: 'C6',
    name: '水資源與廢棄物',
    title: '第六章：水資源與廢棄物',
    griMapping: ['GRI 303-1', 'GRI 303-2', 'GRI 303-3', 'GRI 303-4', 'GRI 303-5', 'GRI 306-1', 'GRI 306-2', 'GRI 306-3', 'GRI 306-4', 'GRI 306-5'],
    description: '水資源管理、用水效率、廢棄物產生與處理、循環經濟作為',
  },
  {
    code: 'C7',
    name: '生物多樣性與環境衝擊',
    title: '第七章：生物多樣性與環境衝擊',
    griMapping: ['GRI 304-1', 'GRI 304-2', 'GRI 304-3', 'GRI 304-4'],
    description: '生物多樣性保護、生態系統影響評估、自然相關財務揭露',
  },
  {
    code: 'C8',
    name: '員工與人才發展',
    title: '第八章：員工與人才發展',
    griMapping: ['GRI 2-7', 'GRI 2-8', 'GRI 2-30', 'GRI 401-1', 'GRI 401-2', 'GRI 401-3', 'GRI 404-1', 'GRI 404-2', 'GRI 404-3', 'GRI 405-1', 'GRI 405-2'],
    description: '人力結構、薪酬福利、人才招募與留任、訓練發展',
  },
  {
    code: 'C9',
    name: '職安、人權與社會責任',
    title: '第九章：職安、人權與社會責任',
    griMapping: ['GRI 403-1', 'GRI 403-2', 'GRI 403-3', 'GRI 403-4', 'GRI 403-5', 'GRI 403-6', 'GRI 403-7', 'GRI 403-8', 'GRI 403-9', 'GRI 403-10', 'GRI 406-1', 'GRI 407-1', 'GRI 408-1', 'GRI 409-1', 'GRI 410-1', 'GRI 413-1', 'GRI 413-2'],
    description: '職業安全衛生、人權盡職調查、勞動實踐、社區參與',
  },
  {
    code: 'C10',
    name: '供應鏈與產品責任',
    title: '第十章：供應鏈與產品責任',
    griMapping: ['GRI 2-6', 'GRI 204-1', 'GRI 308-1', 'GRI 308-2', 'GRI 414-1', 'GRI 414-2', 'GRI 416-1', 'GRI 416-2', 'GRI 417-1', 'GRI 417-2', 'GRI 417-3', 'GRI 418-1'],
    description: '供應鏈管理、產品安全與品質、客戶隱私與行銷溝通',
  },
  {
    code: 'C11',
    name: 'Impact與投資人敘事',
    title: '第十一章：Impact與投資人敘事',
    griMapping: ['GRI 201-1', 'GRI 203-1', 'GRI 203-2', 'Impact: 財務重大性', 'Impact: 社會影響評估'],
    description: '影響力評估、投資人關注議題、ESG績效與財務連結',
  },
  {
    code: 'C12',
    name: '查覈、佐證與資料治理',
    title: '第十二章：查覈、佐證與資料治理',
    griMapping: ['GRI 1', 'GRI 2', 'ISAE 3000', 'AA1000'],
    description: '資料治理架構、確信範圍與結果、佐證文件管理與外部查證',
  },
];

/**
 * 報告段落範本 (使用 {{placeholder}} 語法)
 * 每章節對應一個範本，實際報告由 AI 根據填答內容填充
 */
export const REPORT_SECTION_TEMPLATES: ReportSectionTemplate[] = [
  {
    chapterCode: 'C1',
    sectionTitle: '組織與報告邊界',
    template: `## 組織與報告邊界\n\n本章節依據 GRI 2-1、GRI 2-3 之要求，完整揭露公司組織識別、法律結構及報告邊界。\n\n### 公司識別\n{{companyName}}（{{companyType}}）設立於{{foundingYear}}，總部位於{{headquartersAddress}}，統編{{registrationNumber}}。主要營運據點包括{{operatingLocations}}。\n\n### 報告邊界\n本次永續報告涵蓋{{reportingPeriod}}，發布日期為{{publishDate}}，報告週期為{{reportingCycle}}。\n\n### 聯絡窗口\n報告聯絡人為{{contactPerson}}，所屬部門{{contactDepartment}}，聯絡方式：{{contactEmail}}、{{contactPhone}}。`,
    requiredFields: ['C1-01', 'C1-02', 'C1-03', 'C1-04'],
  },
  {
    chapterCode: 'C2',
    sectionTitle: '治理與永續管理',
    template: `## 治理與永續管理\n\n本章節依據 GRI 2-9 至 GRI 2-21 之要求，揭露公司治理架構、永續管理策略與績效連結機制。\n\n### 治理架構\n{{governanceStructure}}\n\n### 永續管理策略\n{{sustainabilityStrategy}}\n\n### 風險管理\n{{riskManagement}}\n\n### 薪酬與績效連結\n{{compensationLinkage}}`,
    requiredFields: ['C2-01', 'C2-02', 'C2-03', 'C2-04', 'C2-05'],
  },
  {
    chapterCode: 'C3',
    sectionTitle: '重大性與利害關係人',
    template: `## 重大性與利害關係人\n\n本章節依據 GRI 2-25、GRI 2-26、GRI 2-29、GRI 3-1 至 GRI 3-3 之要求，說明利害關係人辨識與重大性分析。\n\n### 利害關係人辨識\n{{stakeholderIdentification}}\n\n### 重大性分析\n{{materialityAnalysis}}\n\n### 重大議題\n{{materialTopics}}`,
    requiredFields: ['C3-01', 'C3-02', 'C3-03', 'C3-04', 'C3-05', 'C3-06'],
  },
  {
    chapterCode: 'C4',
    sectionTitle: '經濟與誠信經營',
    template: `## 經濟與誠信經營\n\n本章節依據 GRI 201、GRI 203、GRI 205、GRI 206、GRI 207 之要求，揭露公司經濟績效與誠信經營作為。\n\n### 經濟績效\n{{economicPerformance}}\n\n### 市場佔有率\n{{marketPresence}}\n\n### 間接經濟衝擊\n{{indirectEconomicImpacts}}\n\n### 反貪腐與公平競爭\n{{antiCorruption}}`,
    requiredFields: ['C4-01', 'C4-02', 'C4-03', 'C4-04', 'C4-05'],
  },
  {
    chapterCode: 'C5',
    sectionTitle: '能源、碳與氣候',
    template: `## 能源、碳與氣候\n\n本章節依據 GRI 302、GRI 305 之要求，揭露公司能源使用、溫室氣體排放與氣候風險管理。\n\n### 能源使用\n{{energyConsumption}}\n\n### 溫室氣體排放\n{{ghgEmissions}}\n\n### 減碳目標\n{{carbonReductionTargets}}\n\n### 氣候風險\n{{climateRisks}}`,
    requiredFields: ['C5-01', 'C5-02', 'C5-03', 'C5-04', 'C5-05', 'C5-06', 'C5-07', 'C5-08'],
  },
  {
    chapterCode: 'C6',
    sectionTitle: '水資源與廢棄物',
    template: `## 水資源與廢棄物\n\n本章節依據 GRI 303、GRI 306 之要求，揭露公司水資源管理與廢棄物處理。\n\n### 水資源管理\n{{waterManagement}}\n\n### 用水效率\n{{waterEfficiency}}\n\n### 廢棄物管理\n{{wasteManagement}}\n\n### 循環經濟\n{{circularEconomy}}`,
    requiredFields: ['C6-01', 'C6-02', 'C6-03', 'C6-04', 'C6-05'],
  },
  {
    chapterCode: 'C7',
    sectionTitle: '生物多樣性與環境衝擊',
    template: `## 生物多樣性與環境衝擊\n\n本章節依據 GRI 304 之要求，揭露公司對生物多樣性之影響與保護作為。\n\n### 生物多樣性評估\n{{biodiversityAssessment}}\n\n### 保護措施\n{{conservationMeasures}}\n\n### 環境影響評估\n{{environmentalImpact}}`,
    requiredFields: ['C7-01', 'C7-02', 'C7-03', 'C7-04'],
  },
  {
    chapterCode: 'C8',
    sectionTitle: '員工與人才發展',
    template: `## 員工與人才發展\n\n本章節依據 GRI 2-7、GRI 401、GRI 404、GRI 405 之要求，揭露公司人力結構與人才發展策略。\n\n### 人力結構\n{{workforceStructure}}\n\n### 薪酬福利\n{{compensationBenefits}}\n\n### 人才招募與留任\n{{talentRecruitment}}\n\n### 訓練發展\n{{trainingDevelopment}}`,
    requiredFields: ['C8-01', 'C8-02', 'C8-03', 'C8-04', 'C8-05', 'C8-06', 'C8-07'],
  },
  {
    chapterCode: 'C9',
    sectionTitle: '職安、人權與社會責任',
    template: `## 職安、人權與社會責任\n\n本章節依據 GRI 403、GRI 406 至 GRI 413 之要求，揭露公司職業安全、人權與社會責任作為。\n\n### 職業安全衛生\n{{occupationalSafety}}\n\n### 人權盡職調查\n{{humanRightsDueDiligence}}\n\n### 勞動實踐\n{{laborPractices}}\n\n### 社區參與\n{{communityEngagement}}`,
    requiredFields: ['C9-01', 'C9-02', 'C9-03', 'C9-04', 'C9-05', 'C9-06'],
  },
  {
    chapterCode: 'C10',
    sectionTitle: '供應鏈與產品責任',
    template: `## 供應鏈與產品責任\n\n本章節依據 GRI 204、GRI 308、GRI 414、GRI 416 至 GRI 418 之要求，揭露公司供應鏈管理與產品責任。\n\n### 供應鏈管理\n{{supplyChainManagement}}\n\n### 供應商永續評估\n{{supplierSustainability}}\n\n### 產品安全與品質\n{{productSafety}}\n\n### 客戶隱私\n{{customerPrivacy}}`,
    requiredFields: ['C10-01', 'C10-02', 'C10-03', 'C10-04', 'C10-05'],
  },
  {
    chapterCode: 'C11',
    sectionTitle: 'Impact與投資人敘事',
    template: `## Impact與投資人敘事\n\n本章節整合 GRI 201、GRI 203 與 Impact 評估框架，說明公司ESG績效對投資人之意義。\n\n### 影響力評估\n{{impactAssessment}}\n\n### 投資人關注議題\n{{investorTopics}}\n\n### ESG績效與財務連結\n{{esgFinancialLinkage}}`,
    requiredFields: ['C11-01', 'C11-02', 'C11-03'],
  },
  {
    chapterCode: 'C12',
    sectionTitle: '查覈、佐證與資料治理',
    template: `## 查覈、佐證與資料治理\n\n本章節依據 GRI 1、GRI 2 與 ISAE 3000 之要求，說明公司資料治理與外部查證機制。\n\n### 資料治理架構\n{{dataGovernance}}\n\n### 確信範圍與結果\n{{assuranceScope}}\n\n### 佐證文件管理\n{{evidenceManagement}}\n\n### 外部查證\n{{externalVerification}}`,
    requiredFields: ['C12-01', 'C12-02', 'C12-03', 'C12-04'],
  },
];

/**
 * 組合完整永續報告
 * @param companyName - 公司名稱
 * @returns 組合後的報告物件
 */
export function assembleReport(companyName: string): AssembledReport {
  const company: (typeof COMPANIES)[number] | undefined = COMPANIES.find(c => c.companyName === companyName);
  if (!company) return { companyName, companyType: '', title: companyName, generatedAt: new Date().toISOString(), sections: [], dataMaturitySummary: {}, dataGaps: ['Company not found'] };
  const answers = getAnswersByCompany(company.instanceId);
  const answersByChapter: Record<string, V5Answer[]> = {};
  for (const a of answers) {
    if (!answersByChapter[a.chapter]) answersByChapter[a.chapter] = [];
    answersByChapter[a.chapter].push(a);
  }

  const sections: ReportSection[] = [];
  const dataGaps: string[] = [];

  for (const template of REPORT_SECTION_TEMPLATES) {
    const chapterAnswers = answersByChapter[template.chapterCode] || [];
    const answerMap = new Map<string, V5Answer>();
    for (const a of chapterAnswers) {
      answerMap.set(a.questionId, a);
    }

    // Build content from answers
    let content = template.template;
    const griRefs: string[] = [];
    const evidenceReq: string[] = [];

    for (const answer of chapterAnswers) {
      if (answer.griImpact) {
        for (const gri of answer.griImpact.split(/[,、]/)) {
          const trimmed = gri.trim();
          if (trimmed && !griRefs.includes(trimmed)) griRefs.push(trimmed);
        }
      }
      if (answer.evidence) {
        for (const ev of answer.evidence.split(/[;；]/)) {
          const trimmed = ev.trim();
          if (trimmed && !evidenceReq.includes(trimmed)) evidenceReq.push(trimmed);
        }
      }
      if (answer.dataGap) {
        dataGaps.push(`[${answer.questionId}] ${answer.dataGap}`);
      }
    }

    // Replace {{companyName}} and {{companyType}}
    content = content.replace(/\{\{companyName\}\}/g, company.companyName);
    content = content.replace(/\{\{companyType\}\}/g, company.industryType);

    // Replace {{answer:questionId}} with actual answer
    content = content.replace(/\{\{answer:([^}]+)\}\}/g, (_, qId: string) => {
      const a = answerMap.get(qId);
      return a ? a.answer : `[待填充: ${qId}]`;
    });

    // Replace {{field:questionId}} with first line of answer
    content = content.replace(/\{\{field:([^}]+)\}\}/g, (_, qId: string) => {
      const a = answerMap.get(qId);
      if (!a) return `[待填充: ${qId}]`;
      return a.answer.split(/[。\n]/)[0] || a.answer.substring(0, 100);
    });

    sections.push({
      chapterCode: template.chapterCode,
      sectionTitle: template.sectionTitle,
      content,
      griReferences: griRefs,
      evidenceRequired: evidenceReq,
    });
  }

  // Build data maturity summary
  const maturitySummary: Record<string, number> = {};
  for (const a of answers) {
    const maturity = a.dataMaturity || 'C版專業可查覈';
    maturitySummary[maturity] = (maturitySummary[maturity] || 0) + 1;
  }

  return {
    companyName: company.companyName,
    companyType: company.industryType,
    title: `${company.companyName} 永續報告 (C版專業揭露)`,
    generatedAt: new Date().toISOString(),
    sections,
    dataMaturitySummary: maturitySummary,
    dataGaps,
  };
}

/**
 * 將組合後的報告轉為 Markdown 字串
 */
export function reportToMarkdown(report: AssembledReport): string {
  const parts: string[] = [];

  parts.push(`# ${report.title}`);
  parts.push(`\n> 報告類型：${report.companyType}`);
  parts.push(`> 產生時間：${report.generatedAt}\n`);

  // Table of contents
  parts.push(`## 目錄\n`);
  for (const section of report.sections) {
    parts.push(`- ${section.chapterCode} ${section.sectionTitle}`);
  }
  parts.push('\n---\n');

  // Sections
  for (const section of report.sections) {
    parts.push(section.content);
    parts.push('\n\n### GRI 參考\n');
    parts.push(section.griReferences.map(g => `  - ${g}`).join('\n'));
    parts.push('\n\n### 需要佐證\n');
    parts.push(section.evidenceRequired.map(e => `  - ${e}`).join('\n'));
    parts.push('\n---\n');
  }

  // Data maturity summary
  parts.push(`## 資料成熟度統計\n`);
  for (const [level, count] of Object.entries(report.dataMaturitySummary)) {
    parts.push(`- ${level}: ${count} 題`);
  }
  parts.push('\n');

  // Data gaps
  if (report.dataGaps.length > 0) {
    parts.push('## 資料缺口\n');
    for (const gap of report.dataGaps) {
      parts.push(`- ${gap}`);
    }
  }

  return parts.join('\n');
}

/**
 * 匯出報告為 JSON 格式
 */
export function reportToJSON(report: AssembledReport): string {
  return JSON.stringify(report, null, 2);
}

/** 取得所有章節定義 */
export function getChapterDefinitions(): ChapterDefinition[] {
  return CHAPTER_DEFINITIONS;
}

/** 取得特定章節的報告範本 */
export function getChapterTemplate(chapterCode: string): ReportSectionTemplate | undefined {
  return REPORT_SECTION_TEMPLATES.find(t => t.chapterCode === chapterCode);
}
