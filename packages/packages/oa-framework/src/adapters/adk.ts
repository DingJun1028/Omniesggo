/**
 * ADK Adapter — Google Agent Development Kit (TypeScript)
 * npm: @google/adk | LlmAgent + GOOGLE_SEARCH
 * 真實連結: 動態 import @google/adk, 構建 LlmAgent 並 run()
 * 未安裝/無 API key 時 graceful 降級為 scaffold
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

export class ADKAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'adk';
  readonly label = 'Google ADK (TS)';
  readonly runtime = 'ts' as const;
  private model: string;

  constructor(config: OAFrameConfig) {
    this.model = config.llmModel ?? 'gemini-2.5-flash';
  }

  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      await import('@google/adk');
      return { ok: true };
    } catch {
      return { ok: false, error: '@google/adk 未安裝 (npm i @google/adk) — scaffold 模式' };
    }
  }

  async dispatch(task: OATask): Promise<{ output: string }> {
    try {
      const adk = await import('@google/adk');
      const LlmAgent = (adk as any).LlmAgent ?? (adk as any).Agent;
      if (!LlmAgent) return { output: `[ADK] ${task.prompt} (scaffold: LlmAgent export 未找到)` };
      const agent = new LlmAgent({
        name: 'oa_adk_agent',
        model: this.model,
        instruction: 'You are OA-Team agent. Answer concisely using tools when needed.',
        tools: [],
      });
      const run = (agent as any).run ?? (agent as any).invoke;
      if (!run) return { output: `[ADK] ${task.prompt} (scaffold: run() 未找到)` };
      const res = await run.call(agent, { prompt: task.prompt });
      const text = typeof res === 'string' ? res : (res?.text ?? res?.output ?? JSON.stringify(res));
      return { output: `[ADK] ${text}` };
    } catch (e: any) {
      return { output: `[ADK] ${task.prompt} (scaffold: ${e?.message ?? 'sdk error'})` };
    }
  }

  async health() {
    try {
      await import('@google/adk');
      return { status: 'ok' as const, detail: `model=${this.model}` };
    } catch {
      return { status: 'down' as const, detail: 'scaffold (npm i @google/adk)' };
    }
  }
}
