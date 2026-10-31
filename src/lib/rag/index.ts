// =====================================================================
// src/lib/rag/index.ts — RAG 門面：indexDocument（寫入）與 search（檢索）
// =====================================================================
export * from "./contracts";
export {
  loadRagConfigFromEnv,
  embed,
  ensureClass,
  upsertChunk,
  searchSimilar,
  deterministicId,
} from "./client";
import { embed, ensureClass, upsertChunk, searchSimilar } from "./client";
import type { RagClientConfig, RagChunk, RagIndexedEvent, SupabaseChunkRepo } from "./contracts";

// rag.indexed 事件（冪等鍵 = docId，對接 OmniBus R4 冪等重放）
export function buildIndexedEvent(
  docId: string,
  chunkCount: number,
  model: string
): RagIndexedEvent {
  return {
    type: "rag.indexed",
    docId,
    chunkCount,
    model,
    at: new Date().toISOString(),
  };
}

// 端到端寫入：ensureClass → embed → upsert → saveVectorRef → 事件
export async function indexDocument(
  config: RagClientConfig,
  repo: SupabaseChunkRepo,
  chunks: RagChunk[]
): Promise<RaggedEventOrNever> {
  await ensureClass(config);
  for (const chunk of chunks) {
    const vector = await embed(config, chunk.content);
    const vectorRef = await upsertChunk(config, chunk, vector);
    await repo.saveVectorRef(chunk.docId, chunk.chunkIndex, vectorRef);
  }
  return buildIndexedEvent(
    chunks[0]?.docId ?? "",
    chunks.length,
    config.embeddingModel
  );
}

type RaggedEventOrNever = RagIndexedEvent;

// 端到端檢索：embed → searchSimilar（強制 ownerId 過濾，與 Supabase RLS 語義一致）
export async function search(
  config: RagClientConfig,
  query: string,
  ownerId: string,
  limit = 10
): Promise<import("./contracts").RagSearchResult[]> {
  const vector = await embed(config, query);
  return searchSimilar(config, vector, ownerId, limit);
}
