/**
 * OmniRoute Adapter — 統一 AI 閘道 (237+ providers, 單一端點 localhost:20128/v1)
 *
 * ⚠️ UNVERIFIED: 用戶提供的官方 repo `diegosouzapw/OmniRoute` 經瀏覽器/Browser 實測逾時、
 *   web_extract 額度耗盡 (Payment Required)，本輪無法上網核實 repo 真實性。
 *   本 adapter 依用戶貼出的 README 結構建立 scaffold + 預埋 OpenAI-compatible /v1 呼叫,
 *   待確認後升級為真實閘道整合。
 *
 * 設計定位 (與其他子框架不同): OmniRoute 是 AI 閘道, 不是生產框架。
 *   它對齊 OAFrameConfig 的 llmBaseUrl/llmApiKey/llmModel — OA 框架的 LLM 流量可經此統一出去。
 *   預設端點 localhost:20128 (npm install -g omniroute 後啟動)。
 *
 * 依賴: openai SDK (未裝), streamlit (未裝), omniroute gateway (未啟動)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ISubFrameAdapter, OAFrameConfig, OATask } from '../core/types.js';

const execFileP = promisify(execFile);

export class OmniRouteAdapter implements ISubFrameAdapter {
  readonly id = 'omniroute' as const;
  readonly label = 'OmniRoute (AI Gateway 237+ providers)';
  readonly runtime = 'docker' as const; // gateway 常駐服務 (localhost:20128)

  /** OmniRoute 預設端點 */
  private get baseUrl(): string {
    return process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
  }

  constructor(private config: OAFrameConfig) {}

  /** 啟動: 探測 gateway 是否活 (localhost:20128/health 或 /v1/models) */
  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/v1$/, '')}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return { ok: true, endpoint: this.baseUrl };
    } catch { /* gateway 未啟動 */ }
    return { ok: false, endpoint: this.baseUrl, error: 'OmniRoute gateway 未啟動 (npm install -g omniroute 後啟動) — scaffold 模式' };
  }

  /** 分派: 經 OmniRoute /v1/chat/completions 呼叫 (預埋結構, UNVERIFIED 時回 scaffold) */
  async dispatch(task: OATask): Promise<{ output: string }> {
    // 真實流程 (待 repo 確認後啟用):
    //   POST {baseUrl}/chat/completions
    //   { model: config.llmModel || 'auto', messages: [{role:'user', content: task.prompt}] }
    //   OmniRoute 4-tier fallback + Caveman compression (省 95% token)
    const scaffold = [
      `【OmniRoute 閘道 scaffold】`,
      `endpoint: ${this.baseUrl}`,
      `model: ${this.config.llmModel || 'auto'} (OmniRoute auto-routing 237+ providers)`,
      `task: ${task.prompt}`,
      `特性: 4-tier fallback / Caveman compression (省 95% token) / OpenAI-compatible /v1`,
      `狀態: UNVERIFIED (repo diegosouzapw/OmniRoute 本輪無法上網核實, 待確認)`,
    ].join('\n');
    return { output: scaffold };
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/v1$/, '')}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return { status: 'ok' as const, detail: `gateway ${this.baseUrl} reachable` };
      return { status: 'down' as const, detail: `gateway 回 ${res.status}` };
    } catch {
      return { status: 'down' as const, detail: 'scaffold (gateway 未啟動) — UNVERIFIED repo' };
    }
  }
}
