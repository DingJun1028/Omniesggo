/**
 * OMNiAgent — 萬能永撰（OmniAgent）· smart-ai-router 核心整合節點
 * ------------------------------------------------------------------
 * 正典對齊（soul.md §A OmniAgent + §4.4 意圖層 + §D OmniHive/OmniProphet）：
 *   意圖分類 → 任務路由 → 技能調用 → 結果彙整 → 動態回饋；執行即廣播留痕（5T Trackable）。
 *
 * 本檔重建自被 OpenCC 繁中化損毀的舊版（舊版為亂碼：\n 混入識別碼、無意義段落、重複方法）。
 * 現以 smart-ai-router 既有的乾淨模組為骨幹實作：
 *   - SmartAIRouter      ：免費雲端模型發現 + ESG 任務路由 + 3 級 fallback + 時空裂縫。
 *   - OmniAgentGateway   ：零幻覺驗算 + Hash Lock + 安全轉發（5T Trustworthy）。
 *   - OllamaFreeCompute  ：本機 Ollama 免算力（零 key）—— 離線 fallback + 隱私路徑。
 *   - OmniAgentRegistry  ：管理專區——多 agent 註冊 / 生命週期 / 意圖治理。
 *
 * 5T 對應：
 *   Traceable   → understand()/route() 每回合生成 traceId + source_origin
 *   Trackable   → 執行軌跡回呼 traceSink（可掛 OmniBus）
 *   Tangible    → route() 回傳 { model, provider, latencyMs, fallbacks }
 *   Transparent → zeroVisionVerify 決策鏈公開
 *   Trustworthy → OAG Hash Lock + Object.freeze
 */
import { SmartAIRouter, OAG } from './index';
import type { FreeModel } from './model-discovery/free-models';
import { SharedMemoryLayer } from './shared-memory';

// ============ 型別 ============
export type TaskType =
  | 'carbon_calculation' | 'compliance_review' | 'tcfd_analysis'
  | 'gri_report_draft' | 'sdg_mapping' | 'evidence_ocr'
  | 'email_archive' | 'general' | (string & {});

export type ModelProvider = 'groq' | 'openrouter' | 'huggingface' | 'gemini' | 'ollama';

export interface RouteResult {
  readonly traceId: string;
  readonly taskType: TaskType;
  readonly model: string;
  readonly provider: ModelProvider;
  readonly output: string;
  readonly fallbacks: string[];
  readonly latencyMs: number;
  readonly zeroVision: { verified: boolean; hashLock: string };
}

export interface ExecuteOptions {
  readonly useGateway?: boolean;   // 經 OAG 安全轉發 + 零幻覺驗算
  readonly preferLocal?: boolean;  // 優先走 Ollama 免算力（隱私 / 離線）
  readonly traceSink?: (event: AgentTraceEvent) => void; // Trackable 觀測匯出
}

export interface AgentTraceEvent {
  readonly traceId: string;
  readonly stage: 'route' | 'execute' | 'fallback' | 'verify' | 'complete';
  readonly model?: string;
  readonly provider?: string;
  readonly timestamp: number;
  readonly detail?: string;
}

// 保留向後相容的 FreeModel re-export（舊 import 端不壞）
export type { FreeModel };

// ============ Ollama 免算力（本機零 key）============
export interface OllamaConfig {
  readonly baseUrl?: string;   // 預設 http://127.0.0.1:11434
  readonly model?: string;     // 預設 qwen2.5:3b-64k
  readonly timeoutMs?: number;
}

export class OllamaFreeCompute {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private _ready: Promise<boolean> | null = null;

  constructor(cfg: OllamaConfig = {}) {
    // 沿用 repo 既有慣例：AGENTIC_TWIN_OLLAMA_URL / LOCAL_OLLAMA_URL
    this.baseUrl = (cfg.baseUrl
      ?? process.env.AGENTIC_TWIN_OLLAMA_URL
      ?? process.env.LOCAL_OLLAMA_URL
      ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
    this.model = cfg.model ?? process.env.AGENTIC_TWIN_OLLAMA_MODEL ?? 'qwen2.5:3b-64k';
    this.timeoutMs = cfg.timeoutMs ?? 60_000;
  }

  /** 探測本機 Ollama 是否就緒（/api/tags）——不可用即回 false，不拋錯（不阻塞主流程） */
  async probe(): Promise<boolean> {
    if (this._ready) return this._ready;
    this._ready = this._probe();
    return this._ready;
  }
  private async _probe(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4_000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** 本機推理（免算力、零 key、離線）。失敗回 null，由上層降級。 */
  async chat(system: string, prompt: string): Promise<string | null> {
    if (!(await this.probe())) return null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          stream: false,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) return null;
      const json = (await res.json()) as { message?: { content?: string } };
      return json.message?.content ?? null;
    } catch {
      return null;
    }
  }

  info(): { model: string; baseUrl: string; free: true } {
    return { model: this.model, baseUrl: this.baseUrl, free: true as const };
  }
}

// ============ 管理專區：OmniAgent 註冊表（生命週期 + 意圖治理）============
export type AgentLifecycle = 'init' | 'active' | 'suspended' | 'closed';

export interface OmniAgentRecord {
  readonly id: string;
  readonly role: string;
  readonly intents: readonly string[];
  readonly lifecycle: AgentLifecycle;
  readonly createdAt: number;
  readonly tags: readonly string[];
}

export class OmniAgentRegistry {
  private readonly agents = new Map<string, { record: OmniAgentRecord; instance: OmniAgent }>();

  register(id: string, instance: OmniAgent, meta: { role: string; intents: string[]; tags?: string[] }): OmniAgentRecord {
    const record: OmniAgentRecord = Object.freeze({
      id,
      role: meta.role,
      intents: [...meta.intents],
      lifecycle: 'active',
      createdAt: Date.now(),
      tags: meta.tags ? [...meta.tags] : ['omni-agent'],
    });
    this.agents.set(id, { record, instance });
    return record;
  }

  get(id: string): OmniAgent | undefined { return this.agents.get(id)?.instance; }
  record(id: string): OmniAgentRecord | undefined { return this.agents.get(id)?.record; }
  list(): readonly OmniAgentRecord[] { return [...this.agents.values()].map((a) => a.record); }

  suspend(id: string): boolean {
    const a = this.agents.get(id);
    if (!a) return false;
    (a.record as { lifecycle: AgentLifecycle }).lifecycle = 'suspended';
    return true;
  }
  close(id: string): boolean {
    return this.agents.delete(id);
  }
}

// ============ OmniAgent 本體 ============
export interface OmniAgentConfig {
  readonly id?: string;
  readonly role?: string;
  readonly router?: SmartAIRouter;        // 注入已初始化的 router；未給則自建
  readonly ollama?: OllamaFreeCompute;    // 注入免算力；未給則自建（探測即用）
  readonly registry?: OmniAgentRegistry;  // 注入管理專區；未給則自建
  readonly shared?: SharedMemoryLayer;    // 注入多代理共同記憶層；未給則自建
}

export class OmniAgent {
  readonly id: string;
  readonly role: string;
  private readonly router: SmartAIRouter;
  private readonly ollama: OllamaFreeCompute;
  private readonly registry: OmniAgentRegistry;
  private readonly shared: SharedMemoryLayer;
  private readonly handlers = new Map<string, (args: unknown) => Promise<unknown> | unknown>();
  private initialized = false;

  constructor(cfg: OmniAgentConfig = {}) {
    this.id = cfg.id ?? `omni-agent.${Math.random().toString(36).slice(2, 8)}`;
    this.role = cfg.role ?? 'general';
    this.router = cfg.router ?? new SmartAIRouter();
    this.ollama = cfg.ollama ?? new OllamaFreeCompute();
    this.registry = cfg.registry ?? new OmniAgentRegistry();
    this.shared = cfg.shared ?? new SharedMemoryLayer();
  }

  /** 初始化：router.initialize() + 註冊自身到管理專區 */
  async initialize(): Promise<this> {
    if (this.initialized) return this;
    await this.router.initialize();
    this.registry.register(this.id, this, {
      role: this.role,
      intents: [...this.handlers.keys()],
      tags: ['omni-agent', this.role],
    });
    this.initialized = true;
    return this;
  }

  // ---- 意圖層（正典：意圖分類 → 任務路由 → 技能調用）----
  onIntent(intent: string, handler: (args: unknown) => Promise<unknown> | unknown): void {
    if (this.handlers.has(intent)) {
      throw new Error(`意圖 ${intent} 已註冊, MECE 禁止重複`);
    }
    this.handlers.set(intent, handler);
  }

  /** 未註冊意圖 fail-fast（不猜測、不靜默吞掉，杜絕幻覺執行） */
  async understand(intent: string, args: unknown): Promise<unknown> {
    const handler = this.handlers.get(intent);
    if (!handler) throw new Error(`未知意圖 ${intent}, 拒絕猜測執行`);
    return handler(args);
  }
  intents(): readonly string[] { return [...this.handlers.keys()]; }

  // ---- 路由執行（免費雲端模型 + Ollama 免算力 + OAG 驗算）----
  private trace(sink: ((e: AgentTraceEvent) => void) | undefined, ev: Omit<AgentTraceEvent, 'timestamp'>): void {
    sink?.({ ...ev, timestamp: Date.now() });
  }

  async route(taskType: TaskType, prompt: string, opts: ExecuteOptions = {}): Promise<RouteResult> {
    const traceId = `omni.${this.id}.${Date.now().toString(36)}`;
    const t0 = Date.now();
    const fallbacks: string[] = [];

    // 1) 優先 Ollama 免算力（隱私 / 離線）
    if (opts.preferLocal) {
      const local = await this.ollama.chat(this.systemFor(taskType), prompt);
      if (local != null) {
        this.trace(opts.traceSink, { traceId, stage: 'execute', model: this.ollama.info().model, provider: 'ollama' });
        return this.finalize(traceId, taskType, this.ollama.info().model, 'ollama', local, fallbacks, t0, opts);
      }
      fallbacks.push('ollama-offline');
    }

    // 2) 否則走 SmartAIRouter 免費雲端模型路由（3 級 fallback）
    this.trace(opts.traceSink, { traceId, stage: 'route', detail: taskType });
    const result = await this.router.routeAndExecute(taskType, prompt, { useGateway: opts.useGateway });
    const r = result as { model?: string; provider?: string; output?: string; text?: string; fallbacks?: string[] };
    const model = r.model ?? 'router';
    const provider = (r.provider as ModelProvider) ?? 'groq';
    const output = r.output ?? r.text ?? String(result);
    fallbacks.push(...(r.fallbacks ?? []));
    this.trace(opts.traceSink, { traceId, stage: 'execute', model, provider });
    return this.finalize(traceId, taskType, model, provider, output, fallbacks, t0, opts);
  }

  private async finalize(
    traceId: string, taskType: TaskType, model: string, provider: ModelProvider,
    output: string, fallbacks: string[], t0: number, opts: ExecuteOptions,
  ): Promise<RouteResult> {
    let hashLock = '';
    if (opts.useGateway) {
      // 5T Trustworthy：零幻覺驗算 + Hash Lock（IComponentCore 契約）
      const v = await OAG.zeroVisionVerify({
        uuid: traceId,
        version: '1.0.0',
        timestamp: Date.now(),
        evidence: {
          originCause: `route:${taskType}`,
          processTrace: ['omni-agent', this.role, taskType],
          finalEffect: (typeof output === 'string' ? output : String(output)).slice(0, 500),
        },
      });
      hashLock = v.hashLock;
      this.trace(opts.traceSink, { traceId, stage: 'verify', detail: v.hashLock });
    }
    // 多代理共同記憶層：發佈本次執行結果，供其他 agent 召回協作（5T Trackable）
    this.shared.publish(this.id, {
      topic: `esg.${taskType}`,
      content: { model, provider, output },
      tags: ['route', taskType, provider],
      traceId,
    });
    return Object.freeze({
      traceId, taskType, model, provider, output, fallbacks,
      latencyMs: Date.now() - t0,
      zeroVision: { verified: Boolean(opts.useGateway), hashLock },
    });
  }

  private systemFor(taskType: TaskType): string {
    return `你是 ESG-GO 的萬能永撰（OmniAgent），任務類型：${taskType}。`
      + '遵循 5T 協定：可溯源、可追蹤、可感知、可透明、不可篡改。僅輸出事實，杜絕幻覺。';
  }

  // ---- 管理專區 + 共同記憶便捷方法 ----
  static newRegistry(): OmniAgentRegistry { return new OmniAgentRegistry(); }
  listSiblingAgents(): readonly OmniAgentRecord[] { return this.registry.list(); }
  ollamaInfo() { return this.ollama.info(); }
  /** 召回共同記憶（本 agent 的 topic 優先） */
  recall(topic: string, k = 5) { return this.shared.recall(topic, k, this.id); }
  /** 查詢共同記憶（跨 agent） */
  sharedQuery(filter: Parameters<SharedMemoryLayer['query']>[0] = {}) { return this.shared.query(filter); }
  sharedSnapshot() { return this.shared.snapshot(); }
}

// ============ 便捷工廠 ============
export async function createOmniAgent(cfg: OmniAgentConfig = {}): Promise<OmniAgent> {
  const agent = new OmniAgent(cfg);
  await agent.initialize();
  return agent;
}

export default OmniAgent;
