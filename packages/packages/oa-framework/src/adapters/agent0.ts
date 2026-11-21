/**
 * Agent0 Adapter — Agent Zero organic framework (Docker)
 * image: agent0ai/agent-zero | port 50001
 * 真實連結: POST {endpoint}/api/chat (或 A2A protocol v0.9.4+)
 * 未啟動 docker 時 graceful 降級為 scaffold
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

export class Agent0Adapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'agent0';
  readonly label = 'Agent Zero';
  readonly runtime = 'docker' as const;
  private endpoint: string;

  constructor(config: OAFrameConfig) {
    this.endpoint = config.agent0Endpoint ?? 'http://127.0.0.1:50001';
  }

  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return { ok: true, endpoint: this.endpoint };
      return { ok: false, endpoint: this.endpoint, error: `HTTP ${res.status}` };
    } catch {
      return { ok: false, endpoint: this.endpoint, error: 'Agent0 docker 未啟動 (docker run -p 50001:80 agent0ai/agent-zero) — scaffold 模式' };
    }
  }

  async dispatch(task: OATask): Promise<{ output: string }> {
    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: task.prompt, stream: false }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return { output: `[Agent0] ${task.prompt} (HTTP ${res.status})` };
      const data = (await res.json().catch(() => null)) as any;
      const text = data?.response ?? data?.text ?? data?.message ?? JSON.stringify(data);
      return { output: `[Agent0] ${text}` };
    } catch (e: any) {
      return { output: `[Agent0] ${task.prompt} (scaffold: ${e?.message ?? 'endpoint unreachable'})` };
    }
  }

  async health() {
    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/api/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok ? { status: 'ok' as const, detail: this.endpoint } : { status: 'down' as const, detail: `HTTP ${res.status}` };
    } catch {
      return { status: 'down' as const, detail: `unreachable @${this.endpoint}` };
    }
  }
}
