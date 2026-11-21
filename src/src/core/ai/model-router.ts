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
export function inferTaskType(message: string): ESGTaskType {
  const lowerMsg = message.toLowerCase();

  // JunAiKey 萬能元鑰（語意治理 / 超覺醒奧義）
  if (lowerMsg.match(/junaikey|萬能元鑰|元鑰|超覺醒|sovereign|觀覺練印|語意治理/)) {
    return 'junaikey_sovereign';
  }

  // 碳排計算關鍵詞
  if (lowerMsg.match(/碳排|carbon|ghg|排放量|iso.?14064| Scope/)) {
    return 'carbon_calculation';
  }

  // 合規審查關鍵詞
  if (lowerMsg.match(/合規|compliance|csrd|gri.?報告|法規|審查/)) {
    return 'compliance_review';
  }

  // TCFD 氣候風險
  if (lowerMsg.match(/tcfd|氣候|climate|風險分析|淨零|net.?zero/)) {
    return 'tcfd_analysis';
  }

  // SDG 目標
  if (lowerMsg.match(/sdg|永續發展目標|聯合國/)) {
    return 'sdg_mapping';
  }

  // 重大性矩陣
  if (lowerMsg.match(/重大性|materiality|矩陣|priority/)) {
    return 'materiality_matrix';
  }

  // OCR 提取
  if (lowerMsg.match(/ocr|帳單|收據|發票|提取|extract/)) {
    return 'evidence_ocr';
  }

  // 問卷分析
  if (lowerMsg.match(/問卷|survey|利害關係人|stakeholder|分析/)) {
    return 'stakeholder_analysis';
  }

  // 報告相關
  if (lowerMsg.match(/報告|report|draft|草稿|撰寫/)) {
    return 'gri_report_draft';
  }

  // 修復相關
  if (lowerMsg.match(/修復|fix|bug|debug|error|錯誤/)) {
    return 'omni_jules_heal';
  }

  // 郵件歸檔
  if (lowerMsg.match(/郵件|email|歸檔|archive/)) {
    return 'email_archival';
  }

  // 蜂羣調度
  if (lowerMsg.match(/蜂羣|swarm|orchestrat|調度|協調/)) {
    return 'swarm_orchestration';
  }

  return 'general';
}

/**
 * 獲取所有可用模型列表
 */
export function getAvailableModels(): Record<string, ModelConfig> {
  return { ...MODELS };
}

/**
 * 獲取路由表（用於調試）
 */
export function getRoutingTable(): Record<string, RoutingResult> {
  return { ...ROUTING_TABLE };
}

/**
 * 格式化路由結果為可讀字串
 */
export function formatRoutingResult(result: RoutingResult): string {
  return `[${result.taskType}] Strategy: ${result.strategy} | Primary: ${result.primary.provider}/${result.primary.model} | Fallback1: ${result.fallback1.provider}/${result.fallback1.model} | Fallback2: ${result.fallback2.provider}/${result.fallback2.model}`;
}

// ── Cloudflare AI Workers API ─────────────────────────────────

export interface CloudflareAIResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: string[];
}

/**
 * 呼叫 Cloudflare AI Workers API
 */
export async function callCloudflareAI(
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<CloudflareAIResponse> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: options.maxTokens || 256,
          temperature: options.temperature || 0.7,
          stream: options.stream || false,
        }),
      }
    );
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Cloudflare AI 逾時 (${options.timeoutMs || 15000}ms)`);
    }
    throw e;
  }
  clearTimeout(timer);

  const data = await response.json() as CloudflareAIResponse;

  if (!data.success) {
    throw new Error(`Cloudflare AI error: ${JSON.stringify(data.errors)}`);
  }

  return data;
}

/**
 * 呼叫本地 Ollama API (100% 免費，零算力成本)
 * 使用 Ollama /api/chat 端點
 */
async function callLocalOllama(
  model: string,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; timeoutMs?: number; endpoint?: string } = {}
): Promise<string> {
  // 更新為使用者要求的本地 Ollama 對接端點
  const endpoint = options.endpoint || 'http://127.0.0.1:11434/api/chat';
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 120000;  // 本地模型預設 2 分鐘超時
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // 可選 Basic Auth（Nginx 代理端點需要）。僅當 VPS_OLLAMA_USER / VPS_OLLAMA_PASS 都設定時才帶。
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const vpsUser = process.env.VPS_OLLAMA_USER;
  const vpsPass = process.env.VPS_OLLAMA_PASS;
  if (vpsUser && vpsPass) {
    const token = Buffer.from(`${vpsUser}:${vpsPass}`).toString('base64');
    headers['Authorization'] = `Basic ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          num_predict: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
        },
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Local Ollama/${model} 逾時 (${timeoutMs}ms)`);
    }
    throw e;
  }
  clearTimeout(timer);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Local Ollama/${model} HTTP ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    message?: { content?: string };
    error?: string;
  };

  if (data.error) throw new Error(`Local Ollama/${model}: ${data.error}`);
  const content = data.message?.content;
  if (!content) throw new Error(`Local Ollama/${model}: empty response`);
  return content;
}

/**
 * 驗證 Cloudflare API Token
 */
export async function validateCloudflareToken(): Promise<boolean> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) return false;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );
    const data = await response.json() as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

/**
 * 後處理 AI 回應（套用技能特定的後處理）
 */
// ── Free Provider 代理層（統一免費模型池 + 自動故障轉移）─────────
// 將所有免費層（Groq / OpenRouter :free / Cloudflare / Together / Mistral free tier）
// 聚合為統一代理，並依路由表提供 primary → fallback1 → fallback2 自動轉移。
// 對外提供：getFreeModelPool / getFreeTierModels / callFreeProvider / selectFreeModel，
// 供 Hermes Agent 與 OmniGateway 以 $0 成本取得 ESG 推理能力。

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
