/**
 * ============================================================================
 * ZeroComputeEmbedder — 零算力邊緣嵌入（本機 Ollama 端點）
 * 設計依據：127.0.0.1:11434 / nomic-embed-text；
 *   3.5s AbortController 道閘 → Graceful Fallback（回 null，呼叫端保留 raw_note、跳過向量註冊）。
 * 註入式 fetch：測試環境可替換以驗證道閘與 fallback，不依賴實體網路。
 * ============================================================================
 */
import type { UnifiedNode } from "./core-types.js";
import type { SemanticVectorStore } from "./vector-store.js";

export interface ZeroComputeEmbedderOptions {
  /** Ollama 端點（僅接受本機回環位址，零外流承諾） */
  readonly endpoint?: string;
  /** 嵌入模型名稱 */
  readonly model?: string;
  /** AbortController 道閘（毫秒）；依規格為 3500 */
  readonly timeoutMs?: number;
  /** 可注入之 fetch 實作（測試用） */
  readonly fetchImpl?: typeof fetch;
}

export class ZeroComputeEmbedder {
  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  /** 零外流審計計數：成功 / 道閘超時 / 端點錯誤 / 降級次數 */
  successful = 0;
  timedOut = 0;
  endpointErrors = 0;
  fallbacks = 0;

  constructor(options: ZeroComputeEmbedderOptions = {}) {
    const endpoint = options.endpoint ?? "http://127.0.0.1:11434";
    if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(endpoint)) {
      throw new Error("[ZeroComputeEmbedder] 僅接受本機回環端點（127.0.0.1/localhost），零外流承諾不可違反");
    }
    this.endpoint = endpoint;
    this.model = options.model ?? "nomic-embed-text";
    this.timeoutMs = options.timeoutMs ?? 3500;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * 嵌入單段文字。任何失敗（超時/連線拒絕/回應畸形）一律回 null，
   * 呼叫端以 raw_note 原樣保留並跳過向量註冊（Graceful Fallback，零幻覺）。
   */
  async embed(text: string): Promise<Float32Array | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.endpoint}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text }),
        signal: controller.signal,
      });
      if (!res.ok) { this.endpointErrors++; this.fallbacks++; return null; }
      const data: unknown = await res.json();
      const payload = (data ?? {}) as { embedding?: unknown; embeddings?: unknown };
      const emb = payload.embedding ?? (Array.isArray(payload.embeddings) ? payload.embeddings[0] : undefined);
      if (!Array.isArray(emb) || emb.length === 0 || emb.some((v) => typeof v !== "number")) {
        this.endpointErrors++;
        this.fallbacks++;
        return null;
      }
      this.successful++;
      return Float32Array.from(emb as number[]);
    } catch {
      // AbortError（道閘超時）與網路層錯誤同走降級：零幻覺道閘不拋出
      this.fallbacks++;
      if (controller.signal.aborted) this.timedOut++;
      else this.endpointErrors++;
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 將節點之可嵌入區塊註冊入向量儲存。
   * 任一區塊嵌入失敗 → 該區塊保留 raw（不註冊），不中斷整體流程。
   */
  async registerNodeBlocks(store: SemanticVectorStore, node: Readonly<UnifiedNode>): Promise<number> {
    // 向量圖層與已刪除區塊不做語意嵌入；其餘區塊並行嵌入（本機回環 Ollama 自行排隊）。
    const embeddable = node.blocks.filter((b) => !b.deleted && b.type !== "sketch_vector");
    const vectors = await Promise.all(embeddable.map((b) => this.embed(b.content)));
    let registered = 0;
    vectors.forEach((vec, i) => {
      if (vec === null) return; // Graceful Fallback：raw 保留
      store.registerVector(node.uuid, embeddable[i]!.block_id, Array.from(vec));
      registered++;
    });
    return registered;
  }
}
