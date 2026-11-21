/**
 * OneRingAI Adapter — 統一多供應商 agent 庫 (@everworker/oneringai)
 * 透過 connector-first API 把 OA 任務轉 OneRingAI Agent.run()
 * 真實連結: 動態 import @everworker/oneringai, 構建 Connector + Agent 並 run()
 * 未安裝/未配 Node22+ 時 graceful 降級為 scaffold (沿用 OA 既有慣例)
 *
 * 設計要點:
 * - 產出回傳純文字, 由 Orchestrator 統一經 forgeT5 鑄造 5T (5T 守門不漏)
 * - 預設走 OpenAI-compatible 端點 (llmBaseUrl), 含本地 Ollama (免費) 路徑
 * - 啟用前需: pnpm add @everworker/oneringai + 升 Node 至 22+ (見 docs 分析)
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

export class OneRingAIAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'oneringai';
  readonly label = 'OneRingAI (multi-vendor unified)';
  readonly runtime = 'ts' as const;
  private config: OAFrameConfig;

  constructor(config: OAFrameConfig) {
    this.config = config;
  }

  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      // @ts-ignore - @everworker/oneringai 為可選依賴, 未安裝時 scaffold 降級 (與其他 adapter 一致)
      await import('@everworker/oneringai');
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: '@everworker/oneringai 未安裝 (pnpm add -w @everworker/oneringai) 或 Node<22 — scaffold 模式',
      };
    }
  }

  async dispatch(task: OATask): Promise<{ output: string }> {
    try {
      // @ts-ignore - 可選依賴, 未安裝時走 catch 降級
      const ora = (await import('@everworker/oneringai')) as any;
      const { Connector, Agent, Vendor } = ora;

      const baseURL = this.config.llmBaseUrl ?? 'http://localhost:11434/v1'; // 本地 Ollama 免費預設
      const isOllama = !baseURL.includes('openai') && !baseURL.includes('anthropic') && !baseURL.includes('google');
      const vendor = isOllama ? Vendor.Ollama : Vendor.OpenAI;
      const apiKey = this.config.llmApiKey ?? (isOllama ? 'ollama' : '');

      Connector.create({
        name: 'oa-oneringai',
        vendor,
        auth: { type: 'api_key', apiKey },
        baseURL,
      });

      const agent = Agent.create({
        connector: 'oa-oneringai',
        model: this.config.llmModel ?? (isOllama ? 'qwen2.5:3b-instruct-q4_K_M' : 'gpt-4.1'),
      });

      const res = await agent.run(task.prompt);
      const text = res?.output_text ?? res?.output ?? JSON.stringify(res);
      return { output: `[OneRingAI] ${text}` };
    } catch (e: any) {
      return { output: `[OneRingAI] ${task.prompt} (scaffold: ${e?.message ?? 'sdk error'})` };
    }
  }

  async health() {
    try {
      // @ts-ignore - 可選依賴, 未安裝時走 catch 降級
      await import('@everworker/oneringai');
      return { status: 'ok' as const, detail: `model=${this.config.llmModel ?? 'default'}` };
    } catch {
      return { status: 'down' as const, detail: 'scaffold (pnpm add @everworker/oneringai)' };
    }
  }
}
