/**
 * s2s 語音代理橋接層 (任務 B 整合)
 * oa-swarm 提供 /voice 端點: 語音代理轉錄 → 蜂群 /execute → 回傳 5T 產物
 * 對齊: s2s 實戰驗證 (Parakeet STT + qwen2.5:3b + pocket TTS, ws://0.0.0.0:8765)
 * 5T: Traceable (來源標註 voice) / Trustworthy (失敗降級)
 */
import { SwarmCore } from './swarm-core.js';

export interface VoiceBridgeConfig {
  s2sWsUrl?: string;  // 語音代理 WS 端點 (預設本機 8765)
  enabled?: boolean;
}

export class VoiceBridge {
  private core: SwarmCore;
  private s2sWsUrl: string;
  enabled: boolean;

  constructor(core: SwarmCore, cfg: VoiceBridgeConfig = {}) {
    this.core = core;
    this.s2sWsUrl = cfg.s2sWsUrl ?? process.env.S2S_WS_URL ?? 'ws://127.0.0.1:8765/v1/realtime';
    this.enabled = cfg.enabled ?? true;
  }

  /** 語音轉錄文字 → 蜂群執行 → 回傳 5T 凍結產物 */
  async handleTranscript(text: string): Promise<{
    ok: boolean;
    task: string;
    artifact?: unknown;
    s2s?: string;
    error?: string;
  }> {
    if (!this.enabled) return { ok: false, task: text, error: 'voice bridge disabled' };
    try {
      const artifact = await this.core.executeSwarmTask(text, 'voice');
      return { ok: true, task: text, artifact };
    } catch (e) {
      return { ok: false, task: text, error: String(e) };
    }
  }

  /** 健康檢查: 語音代理 WS 是否可連 */
  async probe(): Promise<{ connected: boolean; wsUrl: string }> {
    if (!this.enabled) return { connected: false, wsUrl: this.s2sWsUrl };
    try {
      const ws = new WebSocket(this.s2sWsUrl);
      const ok = await new Promise<boolean>((res) => {
        const t = setTimeout(() => res(false), 3000);
        ws.onopen = () => { clearTimeout(t); res(true); };
        ws.onerror = () => { clearTimeout(t); res(false); };
      });
      ws.close();
      return { connected: ok, wsUrl: this.s2sWsUrl };
    } catch {
      return { connected: false, wsUrl: this.s2sWsUrl };
    }
  }
}
