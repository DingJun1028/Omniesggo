// ============================================================
// OpenRouter AI Report Generator
// src/core/ai/report-generator.ts
//
// Generates ESG analysis reports using OpenRouter :free models
// Free-tier: 200 requests/day, round-robin model selection
// ============================================================

import { callFreeProvider, type ChatMessage, type FreeProviderOptions } from './model-router';

// --- Types --------------------------------------------------------

export interface ReportRequest {
  companyName: string;
  industry: string;
  year: string;
  sections?: ReportSection[];
  language?: 'zh-TW' | 'en';
  data?: ReportDataSource;
}

export type ReportSection =
  | 'executive_summary'
  | 'climate_strategy'
  | 'carbon_roadmap'
  | 'social_impact'
  | 'governance'
  | 'risk_assessment'
  | 'opportunities'
  | 'kpi_dashboard'
  | 'stakeholder_engagement'
  | 'supply_chain';

export interface ReportMetric {
  name: string;
  value: string | number;
  unit: string;
}

export interface ReportDataSource {
  regulations?: Record<string, unknown>[];
  metrics?: ReportMetric[];
  benchmarks?: Record<string, unknown>[];
  pdfExtract?: unknown;
}

export interface ReportResult {
  success: boolean;
  error?: string;
  sections: GeneratedSection[];
  metadata: ReportMetadata;
}

export interface GeneratedSection {
  id: ReportSection;
  title: string;
  content: string;
  wordCount: number;
  model: string;
  tokensUsed: number;
  duration: number;
}

export interface ReportMetadata {
  totalWords: number;
  totalTokens: number;
  totalDuration: number;
  modelsUsed: string[];
  generatedAt: string;
  language: string;
}

// --- OpenRouter :free Models (round-robin) ------------------------
// ⚠️ 所有模型必須帶 :free 後綴，才能使用 200 req/day 免費額度

const FREE_MODELS: string[] = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.2-90b-vision:free',
  'meta-llama/llama-3.2-90b-vision:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-vl-8b:free',
  'google/gemma-2-27b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

let modelIndex = 0;

function getNextModel(): string {
  const model = FREE_MODELS[modelIndex % FREE_MODELS.length];
  modelIndex++;
  return model;
}

// --- Prompts ------------------------------------------------------

const SECTION_PROMPTS: Record<ReportSection, { title: string; titleEn: string; prompt: string }> = {
  executive_summary: {
    title: '執行摘要',
    titleEn: 'Executive Summary',
    prompt: `以專業 ESG 分析師角色，為 {company}（{industry}）撰寫 2024 年度永續報告書的執行摘要（300-500 字）。
涵蓋：公司永續策略亮點、年度重大進展、外部挑戰回應、未來展望。
語氣：專業、數據驅動、避免空泛形容詞。
{dataContext}`,
  },
  climate_strategy: {
    title: '氣候策略與轉型計畫',
    titleEn: 'Climate Strategy & Transition Plan',
    prompt: `為 {company} 撰寫氣候策略章節（400-600 字），包含：
1. 氣候治理架構（董事會/TCFD 落實）
2. 範疇一/二/三排放盤查現況
3. 科學基礎減量目標（SBTi）承諾
4. 轉型路徑與資本支出規劃
5. 碳定價內部機制
引用具體數字，若數據不足請標註「待揭露」。
{dataContext}`,
  },
  carbon_roadmap: {
    title: '碳排路徑與淨零路線圖',
    titleEn: 'Carbon Roadmap & Net Zero Pathway',
    prompt: `為 {company} 撰寫淨零路徑章節（350-500 字），包含：
1. 基準年排放與減量軌跡
2. 2030/2050 階段性目標
3. 減量措施（再生能源、製程改善、碳抵換）
4. CBAM 與碳費影響評估
5. 內部碳定價機制
以繁體中文撰寫，數據需標註年度。
{dataContext}`,
  },
  social_impact: {
    title: '社會影響與人力資本',
    titleEn: 'Social Impact & Human Capital',
    prompt: `為 {company} 撰寫社會面向章節（400-600 字），包含：
1. 人力結構與多元包容（DEI 指標）
2. 職業安全與健康（零工傷願景）
3. 人才培育與發展
4. 供應鏈勞動人權盡職調查
5. 社區參與與社會投資
引用 GRI 400 系列指標框架。
{dataContext}`,
  },
  governance: {
    title: '公司治理與誠信經營',
    titleEn: 'Corporate Governance & Integrity',
    prompt: `為 {company} 撰寫治理章節（350-500 字），包含：
1. 董事會組成與獨立性
2. 薪酬與 ESG 績效連結
3. 誠信經營與反貪腐機制
4. 資訊安全與個資保護
5. 吹哨者保護制度
引用 TWSE 上市櫃公司公司治理評鑑指標。
{dataContext}`,
  },
  risk_assessment: {
    title: '風險評估與韌性分析',
    titleEn: 'Risk Assessment & Resilience',
    prompt: `為 {company} 撰寫 ESG 風險評估章節（300-450 字），包含：
1. 重大 ESG 風險辨識（實體+轉型風險）
2. 風險矩陣（機率×衝擊）
3. 氣候情境分析（1.5°C / 2°C / 3°C）
4. 供應鏈中斷風險
5. 風險緩解策略與應急計畫
以 TCFD 框架為基礎。
{dataContext}`,
  },
  opportunities: {
    title: '永續機會與創新佈局',
    titleEn: 'Sustainability Opportunities & Innovation',
    prompt: `為 {company} 撰寫永續機會章節（300-450 字），包含：
1. 綠色產品/服務營收佔比目標
2. 循環經濟商業模式
3. 清潔技術投資佈局
4. 永續金融工具（綠色債券/連結貸款）
5. 市場擴張與品牌溢價機會
量化機會規模（若可行）。
{dataContext}`,
  },
  kpi_dashboard: {
    title: '關鍵績效指標儀錶板',
    titleEn: 'KPI Dashboard',
    prompt: `為 {company} 整理 ESG KPI 儀錶板（表格格式），包含：
環境面：碳排放強度、能源使用效率、廢棄物回收率、水資源使用
社會面：員工流動率、訓練時數、職災率、多元性指標
治理面：獨立董事比例、女性董事比例、薪酬透明度、吹哨案數
提供 2022/2023/2024 三年數據，若無數據標註「—」。
以 Markdown 表格呈現。
{dataContext}`,
  },
  stakeholder_engagement: {
    title: '利害關係人溝通與重大性分析',
    titleEn: 'Stakeholder Engagement & Materiality',
    prompt: `為 {company} 撰寫利害關係人章節（300-450 字），包含：
1. 利害關係人辨識（6 類：員工、客戶、投資人、供應商、社區、監管）
2. 溝通管道與頻率
3. 重大性分析流程與結果
4. 雙重重大性評估（影響+財務）
5. 回應與改善行動
引用 GRI 3 重大性主題框架。
{dataContext}`,
  },
  supply_chain: {
    title: '供應鏈管理與永續採購',
    titleEn: 'Supply Chain & Sustainable Procurement',
    prompt: `為 {company} 撰寫供應鏈章節（300-450 字），包含：
1. 供應商分級與風險評估
2. 供應商行為準則簽署率
3. 現場稽覈覆蓋率與結果
4. 關鍵供應商 ESG 風險（SPOF 分析）
5. 在地採購與中小企業支持
引用 RBA/Responsible Business Alliance 框架。
{dataContext}`,
  },
};

// --- OpenRouter API Client ----------------------------------------

interface OpenRouterChoice {
  message: { content: string };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  usage?: { total_tokens: number };
}

async function callOpenRouter(
  prompt: string,
  model: string,
  maxTokens: number = 1500,
  send?: FreeProviderOptions['send']
): Promise<{ content: string; tokens: number; duration: number; model: string }> {
  const startTime = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://esggo.app',
          'X-Title': 'ESGGO Report Generator',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是一位資深 ESG 分析師，專精於企業永續報告書撰寫。使用繁體中文，數據驅動，引用 GRI/SASB/TCFD/IFRS 標準。避免漂綠語言，保持專業客觀。',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || 0;

      return { content, tokens, duration: Date.now() - startTime, model };
    } catch (err) {
      // 主路徑失敗 → 免費代理層兜底（加性，不改既有成功路徑）
      const fb = await tryFreeProviderFallback(prompt, maxTokens, startTime, send);
      if (fb) return fb;
      throw err;
    }
  }

  // 未配置 OpenRouter Key：先試免費代理層，再回退範本
  const fb = await tryFreeProviderFallback(prompt, maxTokens, startTime, send);
  if (fb) return fb;

  return {
    content: generateFallbackContent(prompt),
    tokens: 0,
    duration: Date.now() - startTime,
    model: 'template-fallback',
  };
}

/**
 * 免費代理層兜底：以報告組裝任務呼叫 FreeProvider，
 * 沿用 OpenRouter 既有的 system 提示。僅在全部免費模型失敗時回傳 null。
 */
async function tryFreeProviderFallback(
  prompt: string,
  maxTokens: number,
  startTime: number,
  send?: FreeProviderOptions['send']
): Promise<{ content: string; tokens: number; duration: number; model: string } | null> {
  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是一位資深 ESG 分析師，專精於企業永續報告書撰寫。使用繁體中文，數據驅動，引用 GRI/SASB/TCFD/IFRS 標準。避免漂綠語言，保持專業客觀。',
      },
      { role: 'user', content: prompt },
    ];
    const result = await callFreeProvider('report_assembly', messages, { maxTokens, send });
    return {
      content: result.content,
      tokens: 0,
      duration: Date.now() - startTime,
      model: result.used.model,
    };
  } catch {
    return null;
  }
}

// --- Fallback (no API key) ----------------------------------------

function generateFallbackContent(prompt: string): string {
  // Extract section type from prompt
  const sectionMatch = prompt.match(/^為.*?撰寫.*?章節/);
  const sectionName = sectionMatch ? sectionMatch[0] : '本章節';

  return `[AI 生成內容 — 需要 OPENROUTER_API_KEY 環境變數]

${sectionName}

本章節將包含以下內容：
1. 數據驅動的分析與發現
2. 國際標準對照（GRI/SASB/TCFD）
3. 同業標竿比較
4. 改善建議與行動計畫

請設定 OPENROUTER_API_KEY 以啟用 AI 報告生成功能。
免費申請：https://openrouter.ai/keys
建議使用 :free 模型（每日 200 次免費額度）。`;
}

// --- Main Generator Class -----------------------------------------

export class AIReportGenerator {
  private language: 'zh-TW' | 'en' = 'zh-TW';
  /** 注入的 FreeProvider 發送器（預設 callFreeProvider 實際網路）；用於測試。 */
  private freeProviderSend?: FreeProviderOptions['send'];

  constructor(opts?: { freeProviderSend?: FreeProviderOptions['send'] }) {
    this.freeProviderSend = opts?.freeProviderSend;
  }

  async generateReport(request: ReportRequest): Promise<ReportResult> {
    const startTime = Date.now();
    this.language = request.language || 'zh-TW';

    const sections = request.sections || [
      'executive_summary',
      'climate_strategy',
      'carbon_roadmap',
      'social_impact',
      'governance',
      'risk_assessment',
      'opportunities',
      'kpi_dashboard',
    ];

    const dataContext = this.buildDataContext(request.data);
    const results: GeneratedSection[] = [];
    const modelsUsed = new Set<string>();
    let totalTokens = 0;

    // Generate sections sequentially (respect rate limits)
    for (const sectionId of sections) {
      try {
        const section = await this.generateSection(
          sectionId,
          request.companyName,
          request.industry,
          dataContext,
          this.freeProviderSend
        );
        results.push(section);
        modelsUsed.add(section.model);
        totalTokens += section.tokensUsed;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[AI Report] Section ${sectionId} failed:`, message);
        // Add error section
        results.push({
          id: sectionId,
          title: SECTION_PROMPTS[sectionId]?.title || sectionId,
          content: `[生成失敗: ${message}]`,
          wordCount: 0,
          model: 'error',
          tokensUsed: 0,
          duration: 0,
        });
      }
    }

    const totalWords = results.reduce((sum, s) => sum + s.wordCount, 0);

    return {
      success: true,
      sections: results,
      metadata: {
        totalWords,
        totalTokens,
        totalDuration: Date.now() - startTime,
        modelsUsed: Array.from(modelsUsed),
        generatedAt: new Date().toISOString(),
        language: this.language,
      },
    };
  }

  private async generateSection(
    sectionId: ReportSection,
    company: string,
    industry: string,
    dataContext: string,
    send?: FreeProviderOptions['send']
  ): Promise<GeneratedSection> {
    const template = SECTION_PROMPTS[sectionId];
    if (!template) {
      throw new Error(`Unknown section: ${sectionId}`);
    }

    const prompt = template.prompt
      .replace(/\{company\}/g, company)
      .replace(/\{industry\}/g, industry)
      .replace(/\{dataContext\}/g, dataContext);

    const requestedModel = getNextModel();
    const { content, tokens, duration, model } = await callOpenRouter(prompt, requestedModel, undefined, send);

    return {
      id: sectionId,
      title: this.language === 'zh-TW' ? template.title : template.titleEn,
      content,
      wordCount: content.length,
      model,
      tokensUsed: tokens,
      duration,
    };
  }

  private buildDataContext(data?: ReportDataSource): string {
    if (!data) return '';

    const parts: string[] = [];

    if (data.regulations && data.regulations.length > 0) {
      parts.push(`相關法規更新：${data.regulations.length} 筆`);
    }

    if (data.metrics && data.metrics.length > 0) {
      const metricSummary = data.metrics
        .slice(0, 5)
        .map((m: ReportMetric) => `${m.name}: ${m.value} ${m.unit}`)
        .join(', ');
      parts.push(`關鍵指標：${metricSummary}`);
    }

    if (data.pdfExtract) {
      parts.push(`PDF 報告解析數據已匯入`);
    }

    if (parts.length === 0) return '';

    return `\n\n[參考數據]\n${parts.join('\n')}`;
  }
}

// --- Singleton ----------------------------------------------------

let generatorInstance: AIReportGenerator | null = null;

export function getAIReportGenerator(): AIReportGenerator {
  if (!generatorInstance) {
    generatorInstance = new AIReportGenerator();
  }
  return generatorInstance;
}

// --- Convenience --------------------------------------------------

export async function generateAIReport(request: ReportRequest): Promise<ReportResult> {
  return getAIReportGenerator().generateReport(request);
}
