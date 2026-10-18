// ═══════════════════════════════════════════════════════════════
// ESGGO Smart Model Router
// 根據 ESG 任務類型自動選擇最佳免費模型 + 技能整合
// ═══════════════════════════════════════════════════════════════

export type ESGTaskType =
  | 'carbon_calculation'    // ISO 14064 碳排計算
  | 'compliance_review'     // CSRD/GRI 合規審查
  | 'gri_report_draft'      // GRI 報告草稿
  | 'evidence_ocr'          // 帳單 OCR 提取
  | 'email_archival'        // 郵件自動歸檔
  | 'stakeholder_analysis'  // 問卷分析
  | 'omni_jules_heal'       // 自動修復
  | 'swarm_orchestration'   // 蜂羣調度
  | 'tcfd_analysis'         // TCFD 氣候風險分析
  | 'sdg_mapping'           // SDG 目標對應
  | 'materiality_matrix'    // 重大性矩陣
  | 'report_assembly'       // 報告組裝
  | 'junaikey_sovereign'    // JunAiKey 萬能元鑰超覺醒（語意治理）
  | 'general';              // 通用任務

export interface ModelConfig {
  provider: 'groq' | 'openrouter' | 'gemini' | 'cloudflare' | 'together' | 'mistral' | 'local_gemma';
  model: string;
  maxTokens: number;
  temperature: number;
  reasoning: string; // 選擇原因
}

export interface FreeProviderConfig {
  id: string;
  provider: ModelConfig['provider'];
  model: string;
  maxTokens: number;
  temperature: number;
  apiUrl: string;
  apiKeyEnv: string;
  isFreeTier: boolean; // model 以 :free 結尾者為真免費模型
}

export interface RoutingResult {
  primary: ModelConfig;
  fallback1: ModelConfig;
  fallback2: ModelConfig;
  taskType: ESGTaskType;
  strategy: string;
}

// ── 模型能力矩陣 ─────────────────────────────────────────────
// Groq: 速度最快 (3-5x), 30 req/min, 無每日上限
// OpenRouter :free: 模型最多 (11個), 200 req/day
// Gemini: 長上下文, 多模態

export const MODELS = {
  // Groq 模型 (速度王)
  groq_llama70b: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile',
    maxTokens: 256,
    temperature: 0.7,
    reasoning: 'Groq Llama 70B: 最快速度，適合即時回應',
  },
  groq_llama8b: {
    provider: 'groq' as const,
    model: 'llama-3.1-8b-instant',
    maxTokens: 256,
    temperature: 0.5,
    reasoning: 'Groq Llama 8B: 極速輕量，適合簡單分類',
  },
  groq_gemma: {
    provider: 'groq' as const,
    model: 'gemma2-9b-it',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Groq Gemma 9B: 均衡輕量',
  },
  groq_llama70b_instruct: {
    provider: 'groq' as const,
    model: 'llama-3.3-70b-versatile',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Groq Llama 70B Instruct: 長上下文處理',
  },

  // OpenRouter :free 模型 (品質王)
  or_qwen80b: {
    provider: 'openrouter' as const,
    model: 'qwen/qwen3-next-80b-a3b-instruct:free',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Qwen 80B: 中文最強，適合 ESG 報告',
  },
  or_llama90b: {
    provider: 'openrouter' as const,
    model: 'meta-llama/llama-3.2-90b-vision:free',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Llama 90B Vision: 多模態，適合圖表分析',
  },
  or_gemma31b: {
    provider: 'openrouter' as const,
    model: 'google/gemma-4-31b-it:free',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Gemma 31B: Google 品質',
  },
  or_llama70b: {
    provider: 'openrouter' as const,
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    maxTokens: 256,
    temperature: 0.7,
    reasoning: 'Llama 70B: 通用高品質',
  },
  or_deepseek_r1: {
    provider: 'openrouter' as const,
    model: 'deepseek/deepseek-r1:free',
    maxTokens: 512,
    temperature: 0.6,
    reasoning: 'DeepSeek R1: 深度推理，適合複雜分析',
  },
  or_phi4: {
    provider: 'openrouter' as const,
    model: 'microsoft/phi-4:free',
    maxTokens: 256,
    temperature: 0.5,
    reasoning: 'Phi-4: 微軟輕量高效',
  },
  or_gemini20_flash: {
    provider: 'openrouter' as const,
    model: 'google/gemini-2.0-flash-exp:free',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Gemini 2.0 Flash: 多模態，長上下文',
  },
  or_gemma212b: {
    provider: 'openrouter' as const,
    model: 'google/gemma-2-12b-it:free',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Gemma 2 12B: 輕量高效',
  },
  or_commandr_plus: {
    provider: 'openrouter' as const,
    model: 'cohere/command-r-plus-08-2024:free',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Command R Plus: 工具呼叫與搜尋',
  },
  or_mistral24b: {
    provider: 'openrouter' as const,
    model: 'mistralai/mistral-small-3.1-24b:free',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Mistral Small 3.1 24B: 輕量高效，免費層均衡選擇',
  },

  // Cloudflare AI Workers (免費 10K req/day)
  cf_llama70b: {
    provider: 'cloudflare' as const,
    model: '@cf/meta/llama-3.3-70b-instruct-fp16',
    maxTokens: 256,
    temperature: 0.7,
    reasoning: 'Cloudflare Llama 70B: 全球邊緣節點，低延遲',
  },
  cf_llama8b: {
    provider: 'cloudflare' as const,
    model: '@cf/meta/llama-3.1-8b-instruct-fp16',
    maxTokens: 256,
    temperature: 0.5,
    reasoning: 'Cloudflare Llama 8B: 輕量快速',
  },
  cf_mistral7b: {
    provider: 'cloudflare' as const,
    model: '@cf/mistralai/mistral-7b-instruct-v0.2',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Cloudflare Mistral 7B: 均衡輕量',
  },

  // Together.ai (免費 $25/月額度)
  tg_llama70b: {
    provider: 'together' as const,
    model: 'meta-llama/Llama-3-70b-chat-hf',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Together Llama 70B: 高品質推理',
  },
  tg_qwen72b: {
    provider: 'together' as const,
    model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Together Qwen 72B: 中文強',
  },

  // Mistral AI (免費 tier)
  mistral_mistral: {
    provider: 'mistral' as const,
    model: 'mistral-large-latest',
    maxTokens: 512,
    temperature: 0.7,
    reasoning: 'Mistral Large: 高品質通用',
  },
  mistral_mistral_small: {
    provider: 'mistral' as const,
    model: 'mistral-small-latest',
    maxTokens: 256,
    temperature: 0.6,
    reasoning: 'Mistral Small: 快速輕量',
  },
  // Local VPS Ollama Hosting (100% Free, Private, Zero Compute Cost)
  // 端點統一由 PROVIDER_ENDPOINTS.local_gemma.apiUrl 提供（尊重 VPS_OLLAMA_URL 環境變數）。
  // VPS Ollama 主力模型：Gemma 4（免費、私有的本地首選）
  local_esggo_gemma4: {
    provider: 'local_gemma' as const,
    model: 'qwen2.5:3b',
    maxTokens: 4096,
    temperature: 0.7,
    reasoning: 'VPS qwen2.5:3b (Ollama): 已驗證可正常回覆，優先承擔所有 ESG 任務',
  },
  // 仍保留本地較重備援與輕量備援
  local_gemma_e2b: {
    provider: 'local_gemma' as const,
    model: 'hf.co/unsloth/gemma-4-E2B-it-GGUF:Q4_0',
    maxTokens: 4096,
    temperature: 0.7,
    reasoning: 'VPS base Gemma 4 E2B (Ollama): 免費重試備援',
  },
  local_gemma4: {
    provider: 'local_gemma' as const,
    model: 'gemma3:4b',
    maxTokens: 4096,
    temperature: 0.7,
    reasoning: 'VPS Gemma 3 4B (Ollama): 輕量備援',
  },
  local_llama31: {
    provider: 'local_gemma' as const,
    model: 'llama3.1:8b',
    maxTokens: 4096,
    temperature: 0.7,
    reasoning: 'VPS Llama 3.1 8B (Ollama): 100% 免費，極速分類/決策',
  },
} as const;

// ── 任務類型 → 最佳模型路由表 ────────────────────────────────
// 策略: 本地 Gemma 為主 (100% 免費)，雲端模型備援
const ROUTING_TABLE: Record<ESGTaskType, RoutingResult> = {
  carbon_calculation: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'carbon_calculation',
    strategy: 'Gemma4 主力 + E2B 推理備援',
  },
  compliance_review: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'compliance_review',
    strategy: 'Gemma4 主力 + E2B 法規備援',
  },
  gri_report_draft: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'gri_report_draft',
    strategy: 'Gemma4 主力 + E2B 結構化備援',
  },
  evidence_ocr: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_llama31,
    fallback2: MODELS.cf_llama8b,
    taskType: 'evidence_ocr',
    strategy: 'Gemma4 主力 + Llama 極速備援',
  },
  email_archival: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_llama31,
    fallback2: MODELS.cf_llama8b,
    taskType: 'email_archival',
    strategy: 'Gemma4 主力 + Llama 極速備援',
  },
  stakeholder_analysis: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'stakeholder_analysis',
    strategy: 'Gemma4 主力 + E2B 分析備援',
  },
  omni_jules_heal: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'omni_jules_heal',
    strategy: 'Gemma4 主力 + E2B 推理備援',
  },
  swarm_orchestration: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_llama31,
    fallback2: MODELS.cf_llama8b,
    taskType: 'swarm_orchestration',
    strategy: 'Gemma4 主力 + Llama 極速備援',
  },
  tcfd_analysis: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'tcfd_analysis',
    strategy: 'Gemma4 主力 + E2B 氣候分析備援',
  },
  sdg_mapping: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_llama31,
    fallback2: MODELS.cf_llama8b,
    taskType: 'sdg_mapping',
    strategy: 'Gemma4 主力 + Llama 快速匹配備援',
  },
  materiality_matrix: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'materiality_matrix',
    strategy: 'Gemma4 主力 + E2B 排序備援',
  },
  report_assembly: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'report_assembly',
    strategy: 'Gemma4 主力 + 12B 結構化備援',
  },
  junaikey_sovereign: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_gemma_e2b,
    fallback2: MODELS.cf_llama8b,
    taskType: 'junaikey_sovereign',
    strategy: 'Gemma4 主力 + E2B 語意治理備援（本地零算力對齊）',
  },
  general: {
    primary: MODELS.local_esggo_gemma4,
    fallback1: MODELS.local_llama31,
    fallback2: MODELS.cf_llama8b,
    taskType: 'general',
    strategy: 'Gemma4 主力 + Llama 輕量備援',
  },
};

// ── 智慧路由函數 ─────────────────────────────────────────────
// ============================================================================
// TRIGGERS — 代理工具觸發機制增強
// ============================================================================
// 目標：加強代理工具觸發機率，使「消息 → 代理 → 執行」閉環更靈敏。
// 機制：
//   1. 訊息分類（inferTaskType）：關鍵詞+語意權重雙重判定
//   2. 觸發等級（TriggerLevel）：p0 急迫 / p1 高頻 / p2 普通 / p3 低頻
//   3. 觸發評分（triggerScore）：0-1，反映匹配置信度
//   4. 觸發註冊（TriggerRegistry）：代理可主動註冊觸發器
// ============================================================================

import { v4 as uuidv4 } from "uuid";

export enum TriggerLevel {
  P0 = "p0",   // 急迫：立即觸發，阻塞式
  P1 = "p1",   // 高頻：優先排隊
  P2 = "p2",   // 普通：標準排隊
  P3 = "p3",   // 低頻：延後處理
}

export interface TriggerConfidence {
  score: number;          // 0-1，匹配置信度
  level: TriggerLevel;    // 觸發等級
  matchedRules: string[]; // 命中的規則名稱
  confidence: "high" | "medium" | "low" | "unknown";
}

export interface RouteWithTrigger extends RoutingResult {
  trigger: TriggerConfidence;
}

export interface TriggerEntry {
  id: string;
  name: string;
  handler: (payload: unknown) => Promise<void>;
  level: TriggerLevel;
  priority: number;
  enabled: boolean;
}

export class TriggerRegistry {
  private entries = new Map<string, TriggerEntry>();
  private statistics = {
    triggered: 0,
    dropped: 0,
    p0Count: 0,
    p1Count: 0,
    p2Count: 0,
    p3Count: 0,
  };

  register(name: string, handler: (payload: unknown) => Promise<void>, level: TriggerLevel = TriggerLevel.P2): TriggerEntry {
    const entry: TriggerEntry = {
      id: uuidv4(),
      name,
      handler,
      level,
      priority: level === TriggerLevel.P0 ? 100 : level === TriggerLevel.P1 ? 70 : level === TriggerLevel.P2 ? 40 : 10,
      enabled: true,
    };
    this.entries.set(name, entry);
    return entry;
  }

  unregister(name: string): boolean {
    return this.entries.delete(name);
  }

  async dispatch(payload: unknown, level?: TriggerLevel): Promise<void> {
    const candidates = level
      ? Array.from(this.entries.values()).filter(e => e.level === level && e.enabled)
      : Array.from(this.entries.values()).filter(e => e.enabled);

    for (const entry of candidates.sort((a, b) => b.priority - a.priority)) {
      try {
        await entry.handler(payload);
        this.statistics.triggered++;
        this.statistics[`${entry.level}Count`]++;
        return;
      } catch (e) {
        console.warn(`[TriggerRegistry] ${entry.name} failed:`, e);
      }
    }
    this.statistics.dropped++;
  }

  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  listEntries(): TriggerEntry[] {
    return Array.from(this.entries.values());
  }
}

export const triggerRegistry = new TriggerRegistry();

const TRIGGER_LEVEL_WEIGHT: Record<TriggerLevel, number> = {
  [TriggerLevel.P0]: 1.0,
  [TriggerLevel.P1]: 0.8,
  [TriggerLevel.P2]: 0.5,
  [TriggerLevel.P3]: 0.2,
};

export function triggerScoreToLevel(score: number): TriggerLevel {
  if (score >= 0.8) return TriggerLevel.P0;
  if (score >= 0.6) return TriggerLevel.P1;
  if (score >= 0.4) return TriggerLevel.P2;
  return TriggerLevel.P3;
}

// 語意匹配權重（用於增強訊息分類）
export const SEMANTIC_WEIGHTS: Record<string, number> = {
  carbon: 0.8, emission: 0.8, climate: 0.8, energy: 0.8, water: 0.8,
  biodiversity: 0.8, community: 0.8, employee: 0.8, safety: 0.8,
  governance: 0.8, compliance: 0.8, ethics: 0.8, report: 0.8, disclosure: 0.8,
  audit: 0.8, net: 0.8, netzero: 0.8, zero: 0.8,
  deploy: 0.6, monitor: 0.6, backup: 0.6, health: 0.6, check: 0.6,
  rebuild: 0.6, sync: 0.6, verify: 0.6, validate: 0.6,
  constitution: 0.8, "5t": 0.8, traceable: 0.8, transparent: 0.8, trustworthy: 0.8,
  trackable: 0.8,
  junaikey: 0.9, 元鑰: 0.9, 萬能元鑰: 0.9, 超覺醒: 0.9, sovereign: 0.9,
  觀覺練印: 0.9, 語意治理: 0.9, 永恆: 0.9, 習得: 0.9, 閉環: 0.9,
  蜂羣: 0.9, swarm: 0.9, 代理: 0.9, agent: 0.9,
  碳排: 0.8, 碳足跡: 0.8, 排放: 0.8, 淨零: 0.8,
  年度: 0.8, 公司: 0.8, 企業: 0.8, 組織: 0.8,
  排放量: 0.7, 溫室氣體: 0.7, ghg: 0.7,
  標準: 0.7, 規範: 0.7, 披露: 0.7, 報告: 0.7,
  審計: 0.7, 核證: 0.7, 證明: 0.7,
  減排: 0.7, 抵消: 0.7, 碳中和: 0.7,
  永續發展: 0.7, ESG: 0.7, 重大性: 0.7, 風險: 0.7,
  戰略: 0.6, 治理: 0.6, 風險管理: 0.6, 文化: 0.6,
  教育: 0.6, 培訓: 0.6, 意識: 0.6,
  影響評估: 0.6, 績效: 0.6, 績效指標: 0.6, mtd: 0.6,
  長期: 0.6, 短期: 0.6, 行動: 0.6, 措施: 0.6,
  指導原則: 0.6, 原則: 0.6, 一貫: 0.6,

  合規: 0.7, csrd: 0.7, gri: 0.7,
  草稿: 0.7, draft: 0.7,
  tcfd: 0.7, 氣候: 0.7,
  sdg: 0.7, 永續: 0.7, 聯合國: 0.7,
  資訊: 0.5, 資料: 0.5, 數據: 0.5, 資料庫: 0.5, 管道: 0.5,
  ocr: 0.5, 帳單: 0.5, 收據: 0.5, 發票: 0.5, 提取: 0.5, extract: 0.5,
  問卷: 0.5, survey: 0.5, 利害關係人: 0.5, stakeholder: 0.5, 分析: 0.5,
  materiality: 0.5, 矩陣: 0.5, priority: 0.5,
  修復: 0.6, fix: 0.6, bug: 0.6, debug: 0.6, error: 0.6, 錯誤: 0.6,
  郵件: 0.7, email: 0.7, 歸檔: 0.7, archive: 0.7,
  awaken: 0.9, reflect: 0.9, grow: 0.9, remember: 0.9, learn: 0.9,
  萬靈永憶: 0.9, 萬能永憶: 0.9, 記憶: 0.9, 共享記憶: 0.9, 共用記憶: 0.9,
  知行合一: 0.9, 背誦: 0.9, 謹記: 0.9, 記住: 0.9,
  "closed-loop": 0.9, entropy: 0.9, 迴圈: 0.9,
  學習: 0.9, 成長: 0.9, 反省: 0.9,
  覺悟: 0.9, 轉化: 0.9, 吸收: 0.9, 消化: 0.9, 內化: 0.9, 外部化: 0.9,
  具體化: 0.9, 抽象化: 0.9, 淨化: 0.9,
};

// 字串轉正則表達式的逃避函數（用於關鍵詞匹配）
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── 智慧路由函數 ─────────────────────────────────────────────

/**
 * 根據任務類型選擇最佳模型路由
 */
export function routeModel(taskType: string): RoutingResult {
  const normalizedType = (taskType || 'general').toLowerCase() as ESGTaskType;
  return ROUTING_TABLE[normalizedType] || ROUTING_TABLE.general;
}

/**
 * 根據用戶訊息自動推斷任務類型
 */
export function inferTaskType(message: string): RouteWithTrigger {
  const lowerMsg = message.toLowerCase();
  const matchedRules: string[] = [];
  let totalWeight = 0;
  let maxWeight = 0;

  // 1. 語意權重匹配
  for (const [keyword, weight] of Object.entries(SEMANTIC_WEIGHTS)) {
    const pattern = new RegExp(escapeRegExp(keyword), 'i');
    if (pattern.test(lowerMsg)) {
      totalWeight += weight;
      maxWeight = Math.max(maxWeight, weight);
      matchedRules.push(keyword);
    }
  }

  // 2. 計算觸發分數
  const triggerScore = totalWeight > 0 ? Math.min(maxWeight * 1.2, 1.0) : 0.05;
  const matchedLevel = triggerScoreToLevel(triggerScore);
  const confidence: TriggerConfidence["confidence"] = triggerScore >= 0.7 ? 'high' : triggerScore >= 0.5 ? 'medium' : 'low';

  // 3. 保留原有關鍵詞匹配，作為補充
  const level = lowerMsg.match(/junaikey|萬能元鑰|元鑰|超覺醒|sovereign|觀覺練印|語意治理/) ? 'junaikey_sovereign' :
    lowerMsg.match(/碳排|carbon|ghg|排放量|iso.?14064| Scope/) ? 'carbon_calculation' :
    lowerMsg.match(/合規|compliance|csrd|gri.?報告|法規|審查/) ? 'compliance_review' :
    lowerMsg.match(/tcfd|氣候|climate|風險分析|淨零|net.?zero/) ? 'tcfd_analysis' :
    lowerMsg.match(/sdg|永續發展目標|聯合國/) ? 'sdg_mapping' :
    lowerMsg.match(/重大性|materiality|矩陣|priority/) ? 'materiality_matrix' :
    lowerMsg.match(/ocr|帳單|收據|發票|提取|extract/) ? 'evidence_ocr' :
    lowerMsg.match(/問卷|survey|利害關係人|stakeholder|分析/) ? 'stakeholder_analysis' :
    lowerMsg.match(/報告|report|draft|草稿|撰寫/) ? 'gri_report_draft' :
    lowerMsg.match(/修復|fix|bug|debug|error|錯誤/) ? 'omni_jules_heal' :
    lowerMsg.match(/郵件|email|歸檔|archive/) ? 'email_archival' :
    lowerMsg.match(/蜂羣|swarm|orchestrat|調度|協調/) ? 'swarm_orchestration' : 'general';

  // 4. 取得模型路由資訊
  const routing = routeModel(level);

  return {
    primary: routing.primary,
    fallback1: routing.fallback1,
    fallback2: routing.fallback2,
    taskType: level as ESGTaskType,
    strategy: routing.strategy,
    trigger: {
      score: triggerScore,
      level: matchedLevel,
      matchedRules,
      confidence,
    },
  };
}

export interface FreeProviderConfig {
  id: string;
  provider: ModelConfig['provider'];
  model: string;
  maxTokens: number;
  temperature: number;
  apiUrl: string;
  apiKeyEnv: string;
  isFreeTier: boolean; // model 以 :free 結尾者為真免費模型
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProviderEndpoint {
  apiUrl: string;
  apiKeyEnv: string;
}

const PROVIDER_ENDPOINTS: Record<ModelConfig['provider'], ProviderEndpoint> = {
  groq:       { apiUrl: 'https://api.groq.com/openai/v1/chat/completions',                                  apiKeyEnv: 'GROQ_API_KEY' },
  openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions',                                    apiKeyEnv: 'OPENROUTER_API_KEY' },
  together:   { apiUrl: 'https://api.together.xyz/v1/chat/completions',                                     apiKeyEnv: 'TOGETHER_API_KEY' },
  mistral:    { apiUrl: 'https://api.mistral.ai/v1/chat/completions',                                        apiKeyEnv: 'MISTRAL_API_KEY' },
  gemini:     { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',          apiKeyEnv: 'GEMINI_API_KEY' },
  cloudflare: { apiUrl: 'cloudflare',                                                                         apiKeyEnv: 'CLOUDFLARE_API_TOKEN' },
  local_gemma: { apiUrl: process.env.VPS_OLLAMA_URL || 'http://127.0.0.1:11434/api/chat', apiKeyEnv: '' },
};

/**
 * 所有免費層 provider 的統一池（由 MODELS 自動派生，新增模型即自動納入）。
 */
export const FREE_PROVIDER_POOL: FreeProviderConfig[] = (Object.values(MODELS) as ModelConfig[]).map(m => {
  const ep = PROVIDER_ENDPOINTS[m.provider];
  return {
    id: m.model,
    provider: m.provider,
    model: m.model,
    maxTokens: m.maxTokens,
    temperature: m.temperature,
    apiUrl: ep.apiUrl,
    apiKeyEnv: ep.apiKeyEnv,
    // 本地模型永遠是免費的，雲端模型以 :free 結尾纔算
    isFreeTier: m.provider === 'local_gemma' || m.model.endsWith(':free'),
  };
});

/** 取得完整免費模型池。 */
export function getFreeModelPool(): FreeProviderConfig[] {
  return FREE_PROVIDER_POOL;
}

/** 僅取得真正以 :free 結尾的真免費模型。 */
export function getFreeTierModels(): FreeProviderConfig[] {
  return FREE_PROVIDER_POOL.filter(m => m.isFreeTier);
}

function freeProviderByModel(modelId: string): FreeProviderConfig | undefined {
  return FREE_PROVIDER_POOL.find(p => p.model === modelId);
}

/**
 * 呼叫單一免費 provider。
 * - Cloudflare 走專用通道（callCloudflareAI）。
 * - 其餘 provider 皆為 OpenAI-compatible Chat Completions 介面。
 */
/** 呼叫 Cloudflare AI 端點（stub，待實作） */
async function callCloudflareAI(model: string, messages: ChatMessage[], options: { maxTokens?: number; temperature?: number }): Promise<{ result: { response: string } }> {
  throw new Error('[callCloudflareAI] 尚未實作：需要 Cloudflare AI 端點配置（API key 環境變數）');
}

/** 呼叫本地 Ollama 端點（stub，待實作） */
async function callLocalOllama(model: string, messages: ChatMessage[], options: { endpoint?: string; maxTokens?: number; temperature?: number; timeoutMs?: number }): Promise<string> {
  throw new Error('[callLocalOllama] 尚未實作：需要本地 Ollama 服務連線');
}

export async function callChatProvider(
  cfg: FreeProviderConfig,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  // Cloudflare 走專用通道
  if (cfg.provider === 'cloudflare') {
    const data = await callCloudflareAI(cfg.model, messages, {
      maxTokens: options.maxTokens ?? cfg.maxTokens,
      temperature: options.temperature ?? cfg.temperature,
    });
    return data.result.response;
  }

  // 本地 Ollama (local_gemma) 走 Ollama API
  if (cfg.provider === 'local_gemma') {
    return callLocalOllama(cfg.model, messages, {
      endpoint: cfg.apiUrl,  // 尊重 VPS_OLLAMA_URL 環境變數（PROVIDER_ENDPOINTS 已處理預設值）
      maxTokens: options.maxTokens ?? cfg.maxTokens,
      temperature: options.temperature ?? cfg.temperature,
      timeoutMs: options.timeoutMs ?? 120000,  // 本地模型可給更長超時
    });
  }

  // 雲端 provider: OpenAI-compatible Chat Completions
  const apiKey = process.env[cfg.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing API key env: ${cfg.apiKeyEnv}`);

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(cfg.apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(cfg.provider === 'openrouter'
          ? { 'HTTP-Referer': 'https://esggo.app', 'X-Title': 'OmniCore' }
          : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        max_tokens: options.maxTokens ?? cfg.maxTokens,
        temperature: options.temperature ?? cfg.temperature,
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Provider ${cfg.provider}/${cfg.model} 逾時 (${timeoutMs}ms)`);
    }
    throw e;
  }
  clearTimeout(timer);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider ${cfg.provider}/${cfg.model} HTTP ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message: { content: string } }>;
    error?: { message?: string };
  };

  if (data.error) throw new Error(`Provider ${cfg.provider}/${cfg.model}: ${data.error.message}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Provider ${cfg.provider}/${cfg.model}: empty response`);
  return content;
}

/**
 * 依任務類型呼叫免費代理層，自動沿 primary → fallback1 → fallback2 故障轉移。
 * 回傳實際採用的 provider，便於觀測與計費。
 */
// ── 模型健康追蹤（以「模型」為單位降級 + 自動恢復）──────────────
// 以模型 id 為鍵：單一模型限流/失敗只會讓該模型降級，
// 不會連累同 provider 的其他模型（例如 OpenRouter 某模型 429 不影響其他 OpenRouter 模型）。
interface ModelHealth { down: boolean; downSince: number; failures: number; }
const modelHealth: Record<string, ModelHealth> = {};
const MODEL_COOLDOWN_MS = 5 * 60 * 1000;

export function markModelDown(modelId: string): void {
  const h = modelHealth[modelId] ?? (modelHealth[modelId] = { down: false, downSince: 0, failures: 0 });
  h.down = true;
  h.downSince = Date.now();
  h.failures += 1;
}

export function isModelUp(modelId: string): boolean {
  const h = modelHealth[modelId];
  if (!h || !h.down) return true;
  if (Date.now() - h.downSince > MODEL_COOLDOWN_MS) {
    h.down = false;
    return true;
  }
  return false;
}

export function getProviderHealth(): Record<string, ModelHealth> {
  return { ...modelHealth };
}

/** 重設所有模型健康狀態（測試隔離 / 手動恢復用）。 */
export function resetProviderHealth(): void {
  for (const k of Object.keys(modelHealth)) delete modelHealth[k];
}

// 涉及真實 ESG 資料、需審計可信的敏感任務
const SENSITIVE_TASKS = new Set<ESGTaskType>([
  'carbon_calculation', 'compliance_review', 'tcfd_analysis', 'materiality_matrix', 'sdg_mapping',
  'junaikey_sovereign',
]);
// 所有外部公開免費 Provider（相對於自託管/已簽約端點）
const PUBLIC_FREE_PROVIDERS = new Set<ModelConfig['provider']>([
  'groq', 'openrouter', 'together', 'mistral', 'gemini', 'cloudflare',
]);

export interface FreeProviderOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** 敏感任務是否排除公開免費端點（預設 false，保持原有行為） */
  excludePublicFree?: boolean;
  /**
   * 可注入的發送器（預設 callChatProvider）。用於測試與未來接線，
   * 注入後不會觸發真實網路請求，層邏輯（轉移 / 降級 / 治理守門）完全不變。
   */
  send?: (
    cfg: FreeProviderConfig,
    messages: ChatMessage[],
    options: FreeProviderOptions,
  ) => Promise<string>;
}

/**
 * 依任務類型呼叫免費代理層：
 * 候選順序為 路由鏈（primary → fb1 → fb2）優先，其餘免費池依序補位；
 * 自動跳過「已降級」與「未配置 API Key」的 Provider，並於失敗時將其降級。
 * 敏感任務可透過 excludePublicFree 拒絕送往公開免費端點（5T 治理守門）。
 */
export async function callFreeProvider(
  taskType: string,
  messages: ChatMessage[],
  options: FreeProviderOptions = {}
): Promise<{ content: string; used: FreeProviderConfig }> {
  const key = (taskType || 'general').toLowerCase() as ESGTaskType;
  const routing = routeModel(key);
  const sensitive = SENSITIVE_TASKS.has(key);

  // 候選順序：路由鏈優先，其餘免費池補位，去重
  const chainIds = [routing.primary, routing.fallback1, routing.fallback2]
    .map(m => m.model)
    .filter(Boolean);
  const ordered: FreeProviderConfig[] = [
    ...chainIds.map(id => freeProviderByModel(id)).filter((c): c is FreeProviderConfig => !!c),
    ...FREE_PROVIDER_POOL.filter(p => !chainIds.includes(p.model)),
  ];

  let lastError: unknown;
  let skippedUnconfigured = 0;
  const send = options.send ?? callChatProvider;
  for (const cfg of ordered) {
    if (!isModelUp(cfg.model)) continue;                                    // 該模型已降級，跳過
    // 未配置 Key 才跳過；本地模型（local_gemma）apiKeyEnv 為空，視為「免 Key」不跳過
    if (cfg.apiKeyEnv && !process.env[cfg.apiKeyEnv]) { skippedUnconfigured += 1; continue; }
    if (sensitive && options.excludePublicFree && PUBLIC_FREE_PROVIDERS.has(cfg.provider)) continue; // 治理守門

    try {
      const content = await send(cfg, messages, options);
      return { content, used: cfg };
    } catch (e) {
      markModelDown(cfg.model);
      lastError = e;
    }
  }

  if (skippedUnconfigured > 0 && lastError === undefined) {
    throw new Error(`[FreeProvider] 無已配置 API Key 的免費 Provider 可用（${skippedUnconfigured} 個被跳過）。請設定對應環境變數。`);
  }
  throw new Error(`[FreeProvider] 所有免費模型皆失敗：${String(lastError)}`);
}

/**
 * 為 Hermes Agent 選擇指定任務的最佳免費模型 id，
 * 可直接用於 `hermes model set <id>`。
 */
export function selectFreeModel(taskType: string): string {
  const routing = routeModel(taskType);
  const preferred = [routing.primary, routing.fallback1].find(m => m.model.endsWith(':free'));
  return (preferred ?? routing.primary).model;
}

// ============================================================================
// 觸發監視器（TriggerMonitor）— 主動偵測與預先喚醒
// ============================================================================
export class TriggerMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheck = 0;
  private triggeredCount = 0;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 60000) { // 預設 60 秒掃描
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.intervalMs);
    console.log(`[TriggerMonitor] 已啟動，掃描間隔 ${this.intervalMs/1000}s`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[TriggerMonitor] 已停止`);
    }
  }

  private tick(): void {
    const now = Date.now();
    if (now - this.lastCheck < this.intervalMs) return;
    this.lastCheck = now;

    // 掃描 triggerRegistry，為低頻但有必要的觸發準備
    const entries = triggerRegistry.listEntries();
    let ready = 0;
    for (const entry of entries) {
      if (entry.enabled && entry.level === TriggerLevel.P3) {
        ready++;
      }
    }
    this.triggeredCount += ready;
    console.log(`[TriggerMonitor] 掃描完成: ${ready} 個低頻觸發待命, 累計 ${this.triggeredCount} 次`);
  }

  getStatistics(): { intervalMs: number; lastCheck: number; triggeredCount: number } {
    return {
      intervalMs: this.intervalMs,
      lastCheck: this.lastCheck,
      triggeredCount: this.triggeredCount,
    };
  }
}

// 全局觸發監視器實例
export const triggerMonitor = new TriggerMonitor();
