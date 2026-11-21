/**
 * TurboVec / PotatoRAG Adapter — 本地 RAG 檢索層 (4-bit 量化向量索引 + Ollama)
 *
 * ⚠️ UNVERIFIED: 用戶提供的 repo `github.com/google/turbovec` 經瀏覽器實測回 404
 *   (Google 未公開此 repo; TurboQuant 為內部演算法)。PotatoRAG 源 repo 亦未提供可核實連結。
 *   本 adapter 依用戶貼出的 README 結構建立 scaffold + 預埋本地 RAG 流程, 待確認後升級。
 *
 * 設計定位: OA 框架的本地 RAG 檢索層 (對齊 tencent-mem 的記憶定位, 但走本機向量索引而非 VPS gateway)。
 *   流程: 文本分塊 → nomic-embed-text 768d → turbovec.IdMapIndex 4-bit 量化 → SIMD 檢索 → llama3.2:1b 生成
 *
 * 依賴: ollama(未裝), numpy(未裝), streamlit(未裝), turbovec(未裝, 且 repo 404)
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

export class TurboVecAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'turbovec';
  readonly label = 'TurboVec/PotatoRAG (Local 4-bit RAG)';
  readonly runtime = 'python' as const;
  constructor(private config: OAFrameConfig) {}

  /** 啟動: 探測 ollama + turbovec (真實可用才 ok) */
  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      await import('node:child_process').then(({ execFile }) =>
        execFile('ollama', ['--version'], { timeout: 5000 }));
    } catch {
      return { ok: false, endpoint: 'local', error: 'ollama 未安裝 (需 nomic-embed-text + llama3.2:1b) — scaffold 模式' };
    }
    return { ok: true, endpoint: 'local' };
  }

  /** 分派: 本地 RAG 任務 (預埋 pipeline, UNVERIFIED 時回 scaffold) */
  async dispatch(task: OATask): Promise<{ output: string }> {
    // 真實流程 (待 repo 確認後啟用):
    //   1. chunk task.prompt (或外部文檔)
    //   2. ollama.embeddings('nomic-embed-text') → 768d float32
    //   3. turbovec.IdMapIndex quantize 4-bit (TurboQuant)
    //   4. query vector → SIMD cosine/L2 top-3
    //   5. context + prompt → ollama('llama3.2:1b') 流式生成 (bypass <think>)
    const plan = [
      `【TurboVec/PotatoRAG 本地 RAG scaffold】`,
      `query: ${task.prompt}`,
      `embed: nomic-embed-text (768d) → turbovec.IdMapIndex 4-bit (TurboQuant)`,
      `retrieve: SIMD cosine/L2 top-3`,
      `generate: ollama llama3.2:1b (stream, bypass <think>)`,
      `狀態: UNVERIFIED (github.com/google/turbovec 回 404, Google 未公開此 repo)`,
    ].join('\n');
    return { output: plan };
  }

  async health() {
    try {
      const { execFile } = await import('node:child_process');
      await execFile('ollama', ['--version'], { timeout: 5000 });
      return { status: 'ok' as const, detail: 'ollama ready' };
    } catch {
      return { status: 'down' as const, detail: 'scaffold (ollama/turbovec 未齊) — UNVERIFIED repo 404' };
    }
  }
}
