// apps/gateway/sync/gateway-client.ts
// 對接 VPS 生產 OmniAgent 網關 (port 8642, omnigateway.service)。
// 認證：X-Omni-Token header（v3 協定，requireAuth）。
// 契約（與 /root/gateway/omni-server.mjs 相容）：
//   GET  /status   (無 token = 公開健康；有 token = 含 agents 拓撲)
//   GET  /agents   (requireAuth) -> { agents: AgentState[] }
//   POST /agent/register|heartbeat|command|result (requireAuth)
//   WS   /         (OmniAgentBus 廣播頻道)
import { strict as assert } from 'node:assert';
import { WebSocket } from 'ws';

export interface GatewayClientOpts {
  baseUrl?: string;                       // 預設 http://127.0.0.1:8642
  token: string;                           // OMNI_KEY / GATEWAY_API_KEY
  wsUrl?: string;                         // 預設 ws://127.0.0.1:8642
  timeoutMs?: number;
}

export type GatewayStatus = {
  status: string;
  version: string;
  platform: string;
  vps_ip: string;
  providers: Record<string, boolean>;
  websocket: { enabled: boolean; clients: number };
  skills: { total: number; transcended: number };
  agents?: Array<Record<string, unknown>>;
};

/**
 * GatewayClient — 雙向同步的「萬能系統」側適配器。
 * 同時持有 HTTP（輪詢/指令）與 WS（即時廣播）兩條通道。
 */
export class GatewayClient {
  private readonly base: string;
  private readonly wsUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private ws: WebSocket | null = null;
  private wsReady = false;
  private readonly listeners = new Set<(raw: string) => void>();

  constructor(opts: GatewayClientOpts) {
    assert.ok(opts.token, 'GatewayClient: token is required (OMNI_KEY)');
    this.base = (opts.baseUrl ?? 'http://127.0.0.1:8642').replace(/\/+$/, '');
    this.wsUrl = opts.wsUrl ?? 'ws://127.0.0.1:8642';
    this.token = opts.token;
    this.timeoutMs = opts.timeoutMs ?? 8000;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Omni-Token': this.token,
    };
  }

  async status(withTopology = true): Promise<GatewayStatus | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const r = await fetch(`${this.base}/status`, {
        headers: withTopology ? this.headers() : {},
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      return (await r.json()) as GatewayStatus;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  async agents(): Promise<Array<Record<string, unknown>> | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const r = await fetch(`${this.base}/agents`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({}),
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      const j = (await r.json()) as { agents?: Array<Record<string, unknown>> };
      return j.agents ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  /** 開啟 WS 廣播頻道（OmniAgentBus bridge） */
  connectWs(onMessage?: (raw: string) => void): void {
    if (this.ws) return;
    const ws = new WebSocket(this.wsUrl, { headers: { 'X-Omni-Token': this.token } });
    this.ws = ws;
    ws.on('open', () => { this.wsReady = true; });
    ws.on('message', (data) => {
      const raw = data.toString();
      this.listeners.forEach((fn) => fn(raw));
      onMessage?.(raw);
    });
    ws.on('close', () => { this.wsReady = false; this.ws = null; });
    ws.on('error', () => { this.wsReady = false; });
  }

  get isWsReady(): boolean { return this.wsReady; }

  onMessage(fn: (raw: string) => void): void { this.listeners.add(fn); }
  offMessage(fn: (raw: string) => void): void { this.listeners.delete(fn); }

  /** 經 WS 廣播一則同步封包（文字） */
  broadcast(raw: string): boolean {
    if (!this.ws || !this.wsReady) return false;
    this.ws.send(raw);
    return true;
  }

  close(): void { this.ws?.close(); this.ws = null; this.wsReady = false; }
}
