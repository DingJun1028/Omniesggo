/**
 * ============================================================================
 * SemanticVectorStore — Float32Array 量化快取 × Top-K 內積檢索（池化記憶體）
 * ============================================================================
 */
import { Float32ArrayPool } from "./perf.js";

export interface VectorEntry {
  readonly nodeUuid: string;
  readonly blockId?: string;
  readonly vector: Float32Array;
}

export class SemanticVectorStore {
  private readonly index = new Map<string, VectorEntry & { poolBuf?: Float32Array }>();
  private pool = new Float32ArrayPool(0, 0);

  registerVector(nodeUuid: string, blockId: string | undefined, rawEmbedding: number[]): void {
    if (this.pool.dim !== rawEmbedding.length) {
      this.index.forEach((e) => e.poolBuf && this.pool.release(e.poolBuf));
      this.index.clear();
      this.pool = new Float32ArrayPool(rawEmbedding.length, 64);
    }
    const key = blockId ? `${nodeUuid}#${blockId}` : nodeUuid;
    const norm = Math.sqrt(rawEmbedding.reduce((s, v) => s + v * v, 0));
    const buf = this.pool.acquire();
    for (let i = 0; i < rawEmbedding.length; i++) buf[i] = norm === 0 ? 0 : rawEmbedding[i]! / norm;
    const existing = this.index.get(key);
    if (existing?.poolBuf) this.pool.release(existing.poolBuf);
    const entry: VectorEntry & { poolBuf?: Float32Array } = {
      nodeUuid,
      ...(blockId !== undefined ? { blockId } : {}),
      vector: buf,
      poolBuf: buf,
    };
    this.index.set(key, entry);
  }

  /** Top-K 近似語意檢索：L2 歸一化後餘弦相似度簡化為純 CPU 點積 */
  queryTopK(queryEmbedding: number[], topK = 5, threshold = 0.72): Array<{ nodeUuid: string; blockId?: string; score: number }> {
    if (this.index.size === 0 || queryEmbedding.length === 0) return [];
    const qNorm = Math.sqrt(queryEmbedding.reduce((s, v) => s + v * v, 0));
    const q = this.pool.dim === queryEmbedding.length ? this.pool.acquire() : new Float32Array(queryEmbedding.length);
    for (let i = 0; i < queryEmbedding.length; i++) q[i] = qNorm === 0 ? 0 : queryEmbedding[i]! / qNorm;

    const results: Array<{ nodeUuid: string; blockId?: string; score: number }> = [];
    for (const entry of this.index.values()) {
      let dot = 0;
      const len = Math.min(entry.vector.length, q.length);
      for (let i = 0; i < len; i++) dot += entry.vector[i]! * q[i]!;
      if (dot >= threshold) {
        const hit: { nodeUuid: string; blockId?: string; score: number } = {
          nodeUuid: entry.nodeUuid,
          score: Number.parseFloat(dot.toFixed(4)),
        };
        if (entry.blockId !== undefined) hit.blockId = entry.blockId;
        results.push(hit);
      }
    }
    if (this.pool.dim === queryEmbedding.length) this.pool.release(q);
    return results.slice().sort((a, b) => b.score - a.score).slice(0, topK);
  }

  get size(): number { return this.index.size; }
  get poolStats(): { rented: number; reused: number } { return { rented: this.pool.rented, reused: this.pool.reused }; }
}
