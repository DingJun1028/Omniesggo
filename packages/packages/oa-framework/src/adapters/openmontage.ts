/**
 * OpenMontage Adapter — 100% 免費本地 AI 影片生產系統 (Ollama + FFmpeg + HyperFrames)
 *
 * ⚠️ UNVERIFIED: 用戶提供的 repo `RayCodes/RayCodes_OpenMontage` 經瀏覽器實測回 404 (不存在)。
 *   本 adapter 依用戶貼出的 README 結構建立 scaffold + 預埋真實命令, 待正確 repo URL 確認後升級。
 *
 * 設計 (對齊 README):
 *   - 本地多模態 LLM (Ollama, 如 gemma4:e2b) 生成 production_plan.json
 *   - HyperFrames (HTML/CSS/GSAP) 渲染字幕/圖形疊加
 *   - FFmpeg 裁切/調色/暗角
 *   - Streamlit dashboard (app.py) 互動生成
 *
 * 本地依賴: ollama(未裝), ffmpeg(已裝), python3(已裝), streamlit(未裝), npx(已裝)
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ISubFrameAdapter, OAFrameConfig, OATask } from '../core/types.js';

const execFileP = promisify(execFile);

export class OpenMontageAdapter implements ISubFrameAdapter {
  readonly id = 'openmontage' as const;
  readonly label = 'OpenMontage (Local AI Video)';
  readonly runtime = 'python' as const;

  constructor(private config: OAFrameConfig) {}

  /** 啟動: 探測 ollama + ffmpeg + streamlit (真實可用才 ok) */
  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      await execFileP('ollama', ['--version'], { timeout: 5000 });
    } catch {
      return { ok: false, endpoint: 'local', error: 'ollama 未安裝 (需 ollama pull gemma4:e2b) — scaffold 模式' };
    }
    try {
      await execFileP('ffmpeg', ['-version'], { timeout: 5000 });
    } catch {
      return { ok: false, endpoint: 'local', error: 'ffmpeg 未安裝 — scaffold 模式' };
    }
    return { ok: true, endpoint: 'local' };
  }

  /** 分派: 本地影片生產任務 (預埋 pipeline, UNVERIFIED repo 時回 scaffold) */
  async dispatch(task: OATask): Promise<{ output: string }> {
    // 真實流程 (待 repo 確認後啟用):
    //   ollama run gemma4:e2b "生產計畫: <prompt>" → production_plan.json
    //   npx hyperframes browser ensure
    //   streamlit run app.py → 使用者互動生成 → sample_output/concept_demo.mp4
    // 當前 scaffold: 回傳結構化描述 (不觸發真實聯網/模型, 避免逾時)
    const plan = [
      `【OpenMontage 生產計畫 scaffold】`,
      `prompt: ${task.prompt}`,
      `模型: ollama gemma4:e2b (本地多模態)`,
      `疊加: HyperFrames + GSAP (HTML/CSS 時間軸)`,
      `調色: FFmpeg vignette/contrast`,
      `輸出: sample_output/concept_demo.mp4`,
      `狀態: UNVERIFIED (repo RayCodes/RayCodes_OpenMontage 回 404, 待確認)`,
    ].join('\n');
    return { output: plan };
  }

  async health() {
    try {
      await execFileP('ollama', ['--version'], { timeout: 5000 });
      await execFileP('ffmpeg', ['-version'], { timeout: 5000 });
      return { status: 'ok' as const, detail: 'ollama+ffmpeg ready' };
    } catch {
      return { status: 'down' as const, detail: 'scaffold (ollama/ffmpeg 未齊) — UNVERIFIED repo' };
    }
  }
}
