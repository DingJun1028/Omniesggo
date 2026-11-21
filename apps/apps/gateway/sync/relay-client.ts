// apps/gateway/sync/relay-client.ts
// 對接 ESGGO Relay (port 9999) — 全域同步的對外中繼通道。
// 認證：X-Auth-Token header（relay-server.py 協定，非 Bearer）。
// 端點：/status (GET) /cmd (POST, 排隊) /result (POST, 回傳)
import { strict as assert } from 'node:assert';

export interface RelayClientOpts {
  baseUrl?: string;              // 預設 http://127.0.0.1:9999
  token: string;                 // ESGGO_RELAY_TOKEN
  timeoutMs?: number;
}

/**
 * RelayClient — 經 relay 對 VPS 外部節點雙向轉發 cmd/result。
 * 設計原則（SECURITY-CHECKLIST）：
 *   - token 永不記錄、永不寫入 repo
 *   - 僅透過 X-Auth-Token 傳輸
 */
export class RelayClient {
  private readonly base: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(opts: RelayClientOpts) {
    assert.ok(opts.token, 'RelayClient: token is required (ESGGO_RELAY_TOKEN)');
    this.base = (opts.baseUrl ?? 'http://127.0.0.1:9999').replace(/\/+$/, '');
    this.token = opts.token;
    this.timeoutMs = opts.timeoutMs ?? 8000;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Auth-Token': this.token,
    };
  }

  async status(): Promise<Record<string, unknown> | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const r = await fetch(`${this.base}/status`, {
        headers: this.headers(),
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      return (await r.json()) as Record<string, unknown>;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  /** 排隊一條指令到 relay（轉發給 VPS 外部代理） */
  async sendCmd(command: { id?: string; command: string; description?: string }): Promise<{ status: string; id: string } | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const r = await fetch(`${this.base}/cmd`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(command),
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      return (await r.json()) as { status: string; id: string };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  /** 回傳指令結果 */
  async sendResult(id: string, result: unknown): Promise<boolean> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const r = await fetch(`${this.base}/result`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ id, result }),
        signal: ctrl.signal,
      });
      return r.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  }
}
