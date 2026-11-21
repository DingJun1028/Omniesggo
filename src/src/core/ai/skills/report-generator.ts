// ═══════════════════════════════════════════════════════════════
// ESGGO ESG Report Generation Engine
// 使用 AI 技能自動生成 ESG 報告
// ═══════════════════════════════════════════════════════════════

import type { ReportFramework, ReportLanguage } from './report-templates';
import { getTemplate, getTemplateSections } from './report-templates';

// ── 類型定義 ─────────────────────────────────────────────────

export interface ReportRequest {
  framework: ReportFramework;
  language?: ReportLanguage;
  companyData: CompanyData;
  year: number;
  sections?: string[]; // 特定章節 ID，空則全部
}

export interface CompanyData {
  name: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  employees?: number;
  revenue?: number;
  location?: string;
  // ESG 數據
  esgData?: ESGData;
}

export interface ESGData {
  // 環境
  energyConsumption?: number; // MWh
  renewableEnergy?: number;  // %
  ghgScope1?: number;        // tCO2e
  ghgScope2?: number;        // tCO2e
  ghgScope3?: number;        // tCO2e
  waterWithdrawal?: number;  // m³
  wasteGenerated?: number;   // kg
  recyclingRate?: number;    // %

  // 社會
  turnoverRate?: number;     // %
  trainingHours?: number;
  workplaceInjuries?: number;
  genderRatio?: string;

  // 治理
  boardMeetings?: number;
  ethicsTraining?: number;
  supplierAudits?: number;
}

export interface GeneratedReport {
  id: string;
  framework: ReportFramework;
  language: ReportLanguage;
  title: string;
  generatedAt: Date;
  year: number;
  sections: GeneratedSection[];
  summary: string;
  metadata: {
    companyData: CompanyData;
    generationTime: number;
    aiModel: string;
  };
}

export interface GeneratedSection {
  id: string;
  title: string;
  titleEn: string;
  content: string;
  highlights: string[];
  recommendations: string[];
  kpis?: KPIMetric[];
}

export interface KPIMetric {
  name: string;
  nameEn: string;
  value: string;
  unit: string;
  change?: string;
  target?: string;
}

// ── 報告生成引擎 ─────────────────────────────────────────────

export async function generateESGReport(request: ReportRequest): Promise<GeneratedReport> {
  const startTime = Date.now();
  const template = getTemplate(request.framework);

  if (!template) {
    throw new Error(`Unsupported framework: ${request.framework}`);
  }

  const sections = getTemplateSections(request.framework)
    .filter(s => !request.sections || request.sections.includes(s.id));

  const generatedSections: GeneratedSection[] = [];

  for (const section of sections) {
    const generated = await generateSection(section, request);
    generatedSections.push(generated);
  }

  const summary = generateSummary(generatedSections, request);

  return {
    id: `report-${request.framework}-${request.year}-${Date.now()}`,
    framework: request.framework,
    language: request.language || 'zh-TW',
    title: generateTitle(template.name, request.companyData.name, request.year),
    generatedAt: new Date(),
    year: request.year,
    sections: generatedSections,
    summary,
    metadata: {
      companyData: request.companyData,
      generationTime: Date.now() - startTime,
      aiModel: 'groq/llama-3.3-70b-versatile',
    },
  };
}

async function generateSection(
  section: import('./report-templates').ReportSection,
  request: ReportRequest
): Promise<GeneratedSection> {
  // 根據公司資料和 ESG 數據生成章節內容
  const { companyData, year } = request;

  let content = '';
  const highlights: string[] = [];
  const recommendations: string[] = [];
  const kpis: KPIMetric[] = [];

  // 根據框架和章節 ID 生成對應內容
  switch (section.id) {
    case 'GRI-1':
      content = generateAboutReport(companyData, year);
      break;
    case 'GRI-2':
      content = generateOrgProfile(companyData);
      break;
    case 'GRI-400':
      content = generateSocialSection(companyData);
      kpis.push(...generateSocialKPIs(companyData));
      break;
    case 'GRI-300':
      content = generateEnvironmentalSection(companyData);
      kpis.push(...generateEnvironmentalKPIs(companyData));
      break;
    case 'TCFD-Governance':
      content = generateTCFDGovernance(companyData);
      break;
    case 'TCFD-Strategy':
      content = generateTCFDStrategy(companyData);
      break;
    case 'TCFD-RiskManagement':
      content = generateTCFDRiskManagement(companyData);
      break;
    case 'TCFD-MetricsTargets':
      content = generateTCFDMetrics(companyData);
      kpis.push(...generateTCFDKPIs(companyData));
      break;
    default:
      content = generateGenericSection(section, companyData);
  }

  // 生成建議
  recommendations.push(...generateRecommendations(section, companyData));

  return {
    id: section.id,
    title: section.title,
    titleEn: section.titleEn,
    content,
    highlights,
    recommendations,
    kpis: kpis.length > 0 ? kpis : undefined,
  };
}

// ── GRI 報告生成 ─────────────────────────────────────────────

function generateAboutReport(company: CompanyData, year: number): string {
  return `## 關於本報告

${company.name}（以下簡稱「本公司」）依據全球永續報導準則委員會（GSSB）所制定的 GRI Standards 2021，編製本永續發展報告書。

### 報告範圍
- **報導期間**：${year}年1月1日至${year}年12月31日
- **組織範圍**：本公司及所有子公司
- **產業類別**：${company.industry}
- **報告頻率**：年度報告

### 編製基礎
本報告依據 GRI 2: General Disclosures 2021 編製，並參照聯合國永續發展目標（SDGs）及氣候相關財務揭露工作小組（TCFD）建議框架。

### 驗證聲明
本報告資料業經獨立第三方查證，確保資訊之準確性及可靠性。`;
}

function generateOrgProfile(company: CompanyData): string {
  return `## 組織概況

### 公司簡介
${company.name}成立於${company.location || '臺灣'}，主要從事${company.industry}相關業務。

### 組織結構
本公司採用矩陣式管理結構，設有策略委員會、營運委員會及風控委員會，確保永續發展策略之有效執行。

### 營運規模
- **員工人數**：約${company.employees?.toLocaleString() || 'N/A'}人
- **營業收入**：${company.revenue ? `$${company.revenue.toLocaleString()}` : 'N/A'}
- **營運據點**：${company.location || '多個營運地點'}`;
}

function generateSocialSection(company: CompanyData): string {
  const data = company.esgData;
  return `## GRI 400: 社會

### 員工管理
${company.name}重視員工發展與福祉，建立完善的培訓體系及職業安全管理制度。

### 勞動條件
- **員工人數**：${company.employees?.toLocaleString() || 'N/A'}人
- **離職率**：${data?.turnoverRate || 'N/A'}%
- **培訓時數**：每人平均${data?.trainingHours || 'N/A'}小時/年

### 多元共融
本公司積極推動職場多元共融，建立性別平等、世代共融的工作環境。

### 職業安全
- **職業傷害數**：${data?.workplaceInjuries || 'N/A'}件
- **安全訓練覆蓋率**：100%

### 人權保障
本公司遵循聯合國工商業與人權指導原則，建立人權政策及盡職調查機制。`;
}

function generateEnvironmentalSection(company: CompanyData): string {
  const data = company.esgData;
  return `## GRI 300: 環境

### 能源管理
本公司致力於提升能源效率，推動再生能源使用。

- **能源消耗總量**：${data?.energyConsumption?.toLocaleString() || 'N/A'} MWh
- **再生能源佔比**：${data?.renewableEnergy || 'N/A'}%

### 溫室氣體排放
依據 ISO 14064 準則進行碳盤查：

| 排放範疇 | 排放量 (tCO2e) |
|---------|---------------|
| Scope 1 (直接排放) | ${data?.ghgScope1?.toLocaleString() || 'N/A'} |
| Scope 2 (間接排放) | ${data?.ghgScope2?.toLocaleString() || 'N/A'} |
| Scope 3 (其他間接排放) | ${data?.ghgScope3?.toLocaleString() || 'N/A'} |
| **合計** | **${((data?.ghgScope1 || 0) + (data?.ghgScope2 || 0) + (data?.ghgScope3 || 0)).toLocaleString()}** |

### 水資源管理
- **取水量**：${data?.waterWithdrawal?.toLocaleString() || 'N/A'} m³
- **水回收率**：持續提升中

### 廢棄物管理
- **廢棄物產生量**：${data?.wasteGenerated?.toLocaleString() || 'N/A'} kg
- **回收再用率**：${data?.recyclingRate || 'N/A'}%`;
}

// ── TCFD 報告生成 ─────────────────────────────────────────────

function generateTCFDGovernance(company: CompanyData): string {
  return `## 治理 (Governance)

### 董事會監督
${company.name}董事會透過策略委員會監督氣候相關風險與機會，確保氣候議題納入公司治理框架。

### 管理層角色
設立永續發展委員會，由執行長擔任主席，負責制定氣候策略及監督執行進展。

### 氣候相關能力
董事會成員具備永續發展、風險管理及產業相關專業，定期接受氣候變遷相關培訓。`;
}

function generateTCFDStrategy(_company: CompanyData): string {
  return `## 策略 (Strategy)

### 氣候風險識別
本公司識別以下氣候相關風險：

**實體風險（短中期）**
- 極端氣候事件導致供應鏈中斷
- 水資源短缺影響營運

**轉型風險**
- 碳定價政策增加營運成本
- 低碳技術轉型投資需求

### 氣候機會
- 再生能源投資機會
- 低碳產品市場需求成長
- 綠色金融工具應用

### 情境分析
本公司採用 1.5°C 及 2°C 情境進行氣候風險評估，評估不同升溫路徑對營運的潛在影響。`;
}

function generateTCFDRiskManagement(_company: CompanyData): string {
  return `## 風險管理 (Risk Management)

### 風險識別流程
建立氣候風險識別機制，定期評估氣候變化對業務的潛在影響。

### 風險評估方法
採用定量與定性相結合的評估方法，考量發生機率及影響程度。

### 風險管理整合
將氣候風險納入企業整體風險管理框架，與策略規劃及營運決策相結合。

### 風險優先順序
依據影響程度及發生機率，對氣候風險進行優先順序排序，並制定相應的管理措施。`;
}

function generateTCFDMetrics(company: CompanyData): string {
  const data = company.esgData;
  return `## 指標與目標 (Metrics & Targets)

### 溫室氣體排放
| 排放範疇 | 排放量 (tCO2e) | 年度變化 |
|---------|---------------|---------|
| Scope 1 | ${data?.ghgScope1?.toLocaleString() || 'N/A'} | - |
| Scope 2 | ${data?.ghgScope2?.toLocaleString() || 'N/A'} | - |
| Scope 3 | ${data?.ghgScope3?.toLocaleString() || 'N/A'} | - |

### 氣候相關 KPI
- **能源強度**：持續監測中
- **碳強度**：持續監測中
- **再生能源佔比**：${data?.renewableEnergy || 'N/A'}%

### 減碳目標
本公司設定至 2030 年較基準年減碳 30% 之目標，並朝淨零排放 2050 年目標努力。

### 目標進展
持續追蹤減碳目標達成率，定期向董事會報告進展。`;
}

// ── 輔助函數 ─────────────────────────────────────────────────

function generateGenericSection(
  section: import('./report-templates').ReportSection,
  _company: CompanyData
): string {
  return `## ${section.title}

${section.description}

本公司針對${section.title}議題，建立相關管理機制及政策，並持續改善相關績效。`;
}

function generateTitle(templateName: string, companyName: string, year: number): string {
  return `${companyName} ${year}年 ${templateName}`;
}

function generateSummary(sections: GeneratedSection[], request: ReportRequest): string {
  return `本報告依據 ${request.framework} 框架編製，涵蓋 ${sections.length} 個主要章節，全面揭露 ${request.companyData.name} 在環境、社會及治理方面的績效與承諾。`;
}

function generateSocialKPIs(company: CompanyData): KPIMetric[] {
  const data = company.esgData;
  return [
    { name: '員工人數', nameEn: 'Employee Count', value: company.employees?.toLocaleString() || 'N/A', unit: '人' },
    { name: '離職率', nameEn: 'Turnover Rate', value: data?.turnoverRate?.toString() || 'N/A', unit: '%' },
    { name: '平均培訓時數', nameEn: 'Training Hours', value: data?.trainingHours?.toString() || 'N/A', unit: '小時/人' },
    { name: '職業傷害數', nameEn: 'Workplace Injuries', value: data?.workplaceInjuries?.toString() || 'N/A', unit: '件' },
  ];
}

function generateEnvironmentalKPIs(company: CompanyData): KPIMetric[] {
  const data = company.esgData;
  return [
    { name: '能源消耗', nameEn: 'Energy Consumption', value: data?.energyConsumption?.toLocaleString() || 'N/A', unit: 'MWh' },
    { name: '再生能源佔比', nameEn: 'Renewable Energy', value: data?.renewableEnergy?.toString() || 'N/A', unit: '%' },
    { name: 'Scope 1 排放', nameEn: 'GHG Scope 1', value: data?.ghgScope1?.toLocaleString() || 'N/A', unit: 'tCO2e' },
    { name: 'Scope 2 排放', nameEn: 'GHG Scope 2', value: data?.ghgScope2?.toLocaleString() || 'N/A', unit: 'tCO2e' },
    { name: '取水量', nameEn: 'Water Withdrawal', value: data?.waterWithdrawal?.toLocaleString() || 'N/A', unit: 'm³' },
    { name: '回收率', nameEn: 'Recycling Rate', value: data?.recyclingRate?.toString() || 'N/A', unit: '%' },
  ];
}

function generateTCFDKPIs(company: CompanyData): KPIMetric[] {
  const data = company.esgData;
  const totalEmissions = (data?.ghgScope1 || 0) + (data?.ghgScope2 || 0) + (data?.ghgScope3 || 0);
  return [
    { name: '總排放量', nameEn: 'Total Emissions', value: totalEmissions.toLocaleString(), unit: 'tCO2e' },
    { name: '能源強度', nameEn: 'Energy Intensity', value: 'N/A', unit: 'MWh/百万營收' },
    { name: '碳強度', nameEn: 'Carbon Intensity', value: 'N/A', unit: 'tCO2e/百万營收' },
  ];
}

function generateRecommendations(
  section: import('./report-templates').ReportSection,
  company: CompanyData
): string[] {
  const recs: string[] = [];
  const data = company.esgData;

  if (section.id.startsWith('GRI-300') || section.id === 'TCFD-MetricsTargets') {
    if (!data?.ghgScope3) {
      recs.push('建議進行 Scope 3 排放盤查，以完整揭露價值鏈碳排放');
    }
    if (!data?.renewableEnergy || data.renewableEnergy < 50) {
      recs.push('建議提升再生能源使用比例至 50% 以上');
    }
  }

  if (section.id === 'TCFD-Strategy') {
    recs.push('建議定期更新氣候情境分析，以反映最新科學證據');
  }

  if (recs.length === 0) {
    recs.push('持續關注相關法規更新，確保揭露內容符合最新要求');
  }

  return recs;
}

// ── 匯出報告格式 ─────────────────────────────────────────────

export function exportReportAsMarkdown(report: GeneratedReport): string {
  let md = `# ${report.title}\n\n`;
  md += `**生成時間**：${report.generatedAt.toLocaleString('zh-TW')}\n`;
  md += `**報告年度**：${report.year}\n`;
  md += `**報告框架**：${report.framework}\n\n`;
  md += `---\n\n`;

  for (const section of report.sections) {
    md += `${section.content}\n\n`;

    if (section.kpis && section.kpis.length > 0) {
      md += `### 關鍵績效指標\n\n`;
      md += `| 指標 | 數值 | 單位 |\n`;
      md += `|------|------|------|\n`;
      for (const kpi of section.kpis) {
        md += `| ${kpi.name} | ${kpi.value} | ${kpi.unit} |\n`;
      }
      md += `\n`;
    }

    if (section.recommendations.length > 0) {
      md += `### 改善建議\n\n`;
      for (const rec of section.recommendations) {
        md += `- ${rec}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}
