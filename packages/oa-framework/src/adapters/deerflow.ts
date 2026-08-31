/**
 * DeerFlow Adapter — 研究流程框架 (本機 esggo-deerflow, nginx :2026 / gateway :8001)
 * 真連: health 探活 nginx :2026/health (無認證); dispatch 使用 POST /api/runs/wait (Stateless, 免 CSRF)
 * 認證: DeerFlow 2.5 開發模式設定 DEER_FLOW_AUTH_DISABLED=1 → 無需 session/CSRF
 *   若回 not_authenticated 則 graceful 降級 (標註 "gateway 需 auth"，不假造研究產出)
 * 對齊 OA 框架 graceful 哲學 + 5T 鑄造
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

export class DeerFlowAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'deerflow';
  readonly label = 'DeerFlow Research';
  readonly runtime = 'python' as const;
  private endpoint = 'http://127.0.0.1:2026'; // nginx 入口
  private runsUrl = 'http://127.0.0.1:2026/api/runs/wait'; // Stateless Wait (no CSRF/auth)
  private gwHealth = 'http://127.0.0.1:2026/health';

  constructor(private config: OAFrameConfig) {}

  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      const res = await fetch(this.endpoint, { method: 'GET' });
      const ok = res.status === 200;
      return { ok, endpoint: this.endpoint };
    } catch (e: any) {
      return { ok: false, endpoint: this.endpoint, error: e.message };
    }
  }

  async dispatch(task: OATask): Promise<{ output: string }> {
    // 真連: POST /api/runs/wait (Stateless, no auth/CSRF when DEER_FLOW_AUTH_DISABLED=1)
    // RunCreateRequest schema (from DeerFlow OpenAPI):
    //   assistant_id?: string   — Agent / assistant to use (null = default researcher)
    //   input: { messages: [...] } — Graph input (LangGraph messages format)
    //   command?: object         — LangGraph Command (for interruption control)
    //   metadata?: object
    try {
      const res = await fetch(this.runsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: 'researcher', // default DeerFlow researcher agent
          input: {
            messages: [{ role: 'user', content: task.prompt }],
          },
        }),
      });
      const text = await res.text();

      // Auth/CSRF 降級標註 (not fabricated output)
      if (res.status === 403 && text.includes('CSRF')) {
        return {
          output: `[DeerFlow] gateway 運行中 (${this.endpoint}) 但需 CSRF 認證 — DEER_FLOW_AUTH_DISABLED=1 未生效。任務: ${task.prompt}`,
        };
      }
      if (res.status === 401) {
        return {
          output: `[DeerFlow] gateway 運行中 (${this.endpoint}) 但需登入認證 — 請啟用 DEER_FLOW_AUTH_DISABLED=1。任務: ${task.prompt}`,
        };
      }
      if (!res.ok) {
        return {
          output: `[DeerFlow] gateway 回傳 HTTP ${res.status}: ${text.slice(0, 300)}。任務: ${task.prompt}`,
        };
      }

      // 成功路徑: 解析真實研究產出
      try {
        const j = JSON.parse(text);
        // /api/runs/wait 返回格式: {"messages":[...],"output":"..."} 或 {"output":"..."}
        const content =
          j?.output ??
          j?.response ??
          j?.messages?.[0]?.content ??
          j?.result?.output ??
          text;
        return { output: `[DeerFlow] ${typeof content === 'string' ? content : JSON.stringify(content)}` };
      } catch {
        return { output: `[DeerFlow] ${text.slice(0, 500)}` };
      }
    } catch (e: any) {
      // 連線失敗 → graceful 標註
      return { output: `[DeerFlow] 連線失敗 (${e.message}) — gateway 可能未啟動或 DEER_FLOW_AUTH_DISABLED 未生效。任務: ${task.prompt}` };
    }
  }

  async health() {
    try {
      const res = await fetch(this.gwHealth, { method: 'GET' });
      if (res.status === 200) return { status: 'ok' as const, detail: `connected ${this.endpoint}` };
      return { status: 'down' as const, detail: `HTTP ${res.status}` };
    } catch (e: any) {
      return { status: 'down' as const, detail: e.message };
    }
  }
}