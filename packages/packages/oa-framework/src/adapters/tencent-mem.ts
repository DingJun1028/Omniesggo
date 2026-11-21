/**
 * TencentDB Agent Memory Adapter — Team Memory 適配器
 * 官方: TencentCloud/TencentDB-Agent-Memory (global-images 一鍵部署)
 *   memory-core(:8420) + memory-hub(:8125) + proxy(:8096)
 * API: Knowledge OpenAPI /v3/tools/list + /v3/tools/call
 * 對齊 OA-Team 30 蜂群: 每個 soul.md Agent 可綁定不同記憶資產 (Agent Loadout)
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';
import type { MemoryAsset, TeamMemoryConfig } from '../core/memory.js';

export class TencentMemAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'tencent-mem';
  readonly label = 'TencentDB Agent Memory (Team Memory)';
  readonly runtime = 'ts' as const;
  private cfg: TeamMemoryConfig;

  constructor(oa: OAFrameConfig) {
    this.cfg = {
      coreUrl: oa.memoryGateway ?? process.env.TDAI_GATEWAY_URL ?? 'http://127.0.0.1:8420',
      hubUrl: process.env.TDAI_HUB_URL ?? 'http://127.0.0.1:8125',
      proxyUrl: process.env.TDAI_PROXY_URL ?? 'http://127.0.0.1:8096',
      apiKey: process.env.TDAI_GATEWAY_API_KEY ?? '',
      serviceId: process.env.TDAI_SERVICE_ID ?? 'oa-team-swarm',
    };
  }

  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    // 部署: git clone ... && cd deploy/global-images && cp .env.example .env && ./start-all.sh
    // 啟動後 MemoryCore/Hub/Proxy 一併起, 印出可貼入 Claude 的一行設定
    return { ok: true, endpoint: this.cfg.coreUrl };
  }

  /** Knowledge OpenAPI: 列出 Memory Hub 暴露的工具 (recall/wiki_read/codegraph_impact...) */
  async listTools(): Promise<Array<{ name: string; description?: string }>> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/v3/tools/list`, this.auth());
      if (!res.ok) return [];
      const data = (await res.json()) as { tools?: Array<{ name: string; description?: string }> };
      return data.tools ?? [];
    } catch {
      return [];
    }
  }

  /** 寫入對話到 MemoryCore (L0) — 實測路由 POST /v3/conversation/add */
  async captureConversation(sessionId: string, messages: Array<{ role: string; content: string }>): Promise<{ ok: boolean; ids?: string[] }> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/v3/conversation/add`, {
        ...this.auth(),
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, messages }),
      });
      if (!res.ok) return { ok: false };
      const data = (await res.json()) as { data?: { accepted_ids?: string[] } };
      return { ok: true, ids: data.data?.accepted_ids };
    } catch {
      return { ok: false };
    }
  }

  /** 從 MemoryCore 召回對話 (L0) — 實測路由 POST /v3/conversation/search */
  async recallConversation(sessionId: string, query: string): Promise<Array<{ role: string; content: string; score: number }>> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/v3/conversation/search`, {
        ...this.auth(),
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, query }),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: { messages?: Array<{ role: string; content: string; score: number }> } };
      return data.data?.messages ?? [];
    } catch {
      return [];
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/v3/tools/call`, {
        ...this.auth(),
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ name, arguments: args }),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  /** 存入記憶資產 (Chat Memory / Skill / Wiki / CodeGraph) — Memory Hub 資產庫 */
  async saveAsset(asset: MemoryAsset): Promise<{ ok: boolean; id?: string }> {
    try {
      const res = await fetch(`${this.cfg.hubUrl}/api/assets`, {
        ...this.auth(),
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify(asset),
      });
      if (!res.ok) return { ok: false };
      const data = (await res.json()) as { id?: string };
      return { ok: true, id: data.id };
    } catch {
      return { ok: false };
    }
  }

  /** OA 任務 → 寫入本次對話 (L0) + 召回團隊記憶作為上下文, 再交給其他框架 (Agent Loadout 語意)
   *  使用 TDAI Gateway 實測真連路由: POST /capture (body: user_content/assistant_content/session_key)
   *  + POST /search/memories (body: query/maxResults) */
  async dispatch(task: OATask): Promise<{ output: string }> {
    const sessionKey = `oa-${task.id ?? 'task'}`;
    // 寫入本次任務上下文 (L0) — 真連 /capture
    const saved = await this.capture(sessionKey, task.prompt, `[OATeam dispatch] task=${task.prompt}`);
    // 召回相關歷史記憶 — 真連 /search/memories
    const recall = (await this.search(task.prompt, 5)) as { results?: string } | null;
    const recalled = recall?.results ? `recalled=yes` : 'recalled=no';
    return {
      output: `[TencentMem] ${task.prompt} | saved=${saved.ok ? 'yes' : 'no'} ${recalled} @${this.cfg.coreUrl}`,
    };
  }

  async health(): Promise<{ status: 'ok' | 'down'; detail?: string }> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/health`);
      const data = (await res.json().catch(() => null)) as { status?: string } | null;
      return {
        status: data?.status === 'ok' ? 'ok' : 'down',
        detail: `core=${this.cfg.coreUrl} hub=${this.cfg.hubUrl}`,
      };
    } catch {
      return { status: 'down', detail: `core=${this.cfg.coreUrl} unreachable` };
    }
  }

  /** 寫入對話記憶 (TDAI POST /capture) — 真連本機 :8420
   *  body: { user_content, assistant_content, session_key } */
  async capture(sessionKey: string, userContent: string, assistantContent: string): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/capture`, {
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({
          user_content: userContent,
          assistant_content: assistantContent,
          session_key: sessionKey,
        }),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }

  /** 召回記憶 (TDAI POST /search/memories) */
  async search(query: string, maxResults = 5): Promise<unknown> {
    try {
      const res = await fetch(`${this.cfg.coreUrl}/search/memories`, {
        method: 'POST',
        headers: { ...this.authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ query, maxResults }),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  private authHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    if (this.cfg.apiKey) h['authorization'] = `Bearer ${this.cfg.apiKey}`;
    if (this.cfg.serviceId) h['x-tdai-service-id'] = this.cfg.serviceId;
    return h;
  }
  private auth(): RequestInit {
    return { headers: this.authHeaders() };
  }
}
