// =====================================================================
// src/lib/rag/client.ts — 設定載入、Ollama 嵌入、Weaviate 寫入與查詢
// 零新依賴（原生 fetch + node:crypto）；僅內網呼叫（VPS 127.0.0.1）
// 檢索走 REST Search API（POST /v1/search/{class}/near-vector）：
// Weaviate GraphQL 已於 2026-10-26 棄用，WCD 2026-12-01 起關閉閒置叢集
// 之 GraphQL、全體叢集 2027-05-01 EOL（docs/vault-canon/RAG-VECTOR-LAYER.md §7.2）。
// =====================================================================
import { createHash } from "node:crypto";
import type { RagClientConfig, RagChunk, RagSearchResult } from "./contracts";

// ---------------------------------------------------------------------
// 設定載入（fail-fast，不硬編碼；密鑰由 VPS .env.secrets 注入）
// ---------------------------------------------------------------------
export function loadRagConfigFromEnv(
  env: Record<string, string | undefined>
): RagClientConfig {
  const weaviateApiKey = env.WEAVIATE_API_KEY;
  if (!weaviateApiKey) {
    throw new Error("RAG_CONFIG_MISSING: WEAVIATE_API_KEY 未設定（.env.secrets 注入）");
  }
  return {
    weaviateUrl: env.WEAVIATE_URL ?? "http://127.0.0.1:8080",
    weaviateApiKey,
    ollamaUrl: env.OLLAMA_URL ?? "http://127.0.0.1:11434",
    embeddingModel: env.RAG_EMBEDDING_MODEL ?? "nomic-embed-text",
    className: env.RAG_WEAVIATE_CLASS ?? "OmniChunk",
    timeoutMs: Number(env.RAG_TIMEOUT_MS ?? 8000),
  };
}

// ---------------------------------------------------------------------
// 確定性 UUID（R4 冪等重放：同 chunk 重寫不產生重複 Weaviate 物件）
// ---------------------------------------------------------------------
export function deterministicId(chunk: Pick<RagChunk, "docId" | "chunkIndex">): string {
  const digest = createHash("sha256")
    .update(`${chunk.docId}:${chunk.chunkIndex}`)
    .digest("hex");
  const bytes = digest.slice(0, 32).replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    "$1-$2-$3-$4-$5"
  );
  return bytes;
}

// ---------------------------------------------------------------------
// Ollama 嵌入（nomic-embed-text）
// ---------------------------------------------------------------------
export async function embed(config: RagClientConfig, content: string): Promise<number[]> {
  const res = await fetch(`${config.ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.embeddingModel, prompt: content }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`OLLAMA_EMBED_FAILED: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { embedding?: number[] };
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error("OLLAMA_EMBED_EMPTY: 回應缺少 embedding");
  }
  return data.embedding;
}

// ---------------------------------------------------------------------
// Weaviate：schema 確保、寫入、查詢（REST Search API）
// ---------------------------------------------------------------------
function authHeaders(config: RagClientConfig): Record<string, string> {
  return { Authorization: `Bearer ${config.weaviateApiKey}` };
}

export async function ensureClass(config: RagClientConfig): Promise<void> {
  const res = await fetch(
    `${config.weaviateUrl}/v1/schema/${config.className}`,
    { headers: authHeaders(config), signal: AbortSignal.timeout(config.timeoutMs) }
  );
  if (res.status === 404) {
    const created = await fetch(`${config.weaviateUrl}/v1/schema`, {
      method: "POST",
      headers: { ...authHeaders(config), "Content-Type": "application/json" },
      body: JSON.stringify({
        class: config.className,
        vectorizer: "none",
        vectorIndexType: "hnsw",
        properties: [
          { name: "content", dataType: ["text"] },
          { name: "docId", dataType: ["string"], indexFilterable: true },
          { name: "ownerId", dataType: ["string"], indexFilterable: true },
          { name: "chunkIndex", dataType: ["int"] },
        ],
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!created.ok) {
      throw new Error(`WEAVIATE_SCHEMA_CREATE_FAILED: HTTP ${created.status}`);
    }
  }
}

export async function upsertChunk(
  config: RagClientConfig,
  chunk: RagChunk,
  vector: number[]
): Promise<string> {
  const id = deterministicId(chunk);
  const res = await fetch(`${config.weaviateUrl}/v1/objects`, {
    method: "POST",
    headers: { ...authHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify({
      class: config.className,
      id,
      vector,
      properties: {
        content: chunk.content,
        docId: chunk.docId,
        ownerId: chunk.ownerId,
        chunkIndex: chunk.chunkIndex,
      },
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`WEAVIATE_UPSERT_FAILED: HTTP ${res.status}`);
  }
  return id;
}

// REST Search API 回應形態：{ results: [{ id, properties, metadata }], tookMs }
interface WeaviateSearchRow {
  id?: string;
  properties: { content: string; docId: string; chunkIndex: number };
  metadata?: { distance?: string | number };
}

export async function searchSimilar(
  config: RagClientConfig,
  queryVector: number[],
  ownerId: string,
  limit = 10
): Promise<RagSearchResult[]> {
  const res = await fetch(
    `${config.weaviateUrl}/v1/search/${config.className}/near-vector`,
    {
      method: "POST",
      headers: { ...authHeaders(config), "Content-Type": "application/json" },
      // REST Search API（preview）：near-vector 端點接受明確查詢向量，
      // where 為與 GraphQL 相同之 JSON 過濾器（ownerId Equal），
      // limit 一律顯式指定（REST 預設 10，與 GraphQL 預設 100 不同）。
      body: JSON.stringify({
        vector: queryVector,
        limit,
        where: {
          path: ["ownerId"],
          operator: "Equal",
          valueString: ownerId,
        },
        returnProperties: ["content", "docId", "chunkIndex"],
        returnMetadata: ["distance"],
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    }
  );
  if (!res.ok) {
    // REST Search API 以真實 HTTP 狀態碼回報錯誤（非 GraphQL 之 200+errors[]）
    throw new Error(`WEAVIATE_SEARCH_FAILED: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { results?: WeaviateSearchRow[] };
  const rows = body.results ?? [];
  return rows.map((r) => ({
    docId: r.properties.docId,
    chunkIndex: r.properties.chunkIndex,
    content: r.properties.content,
    distance: Number(r.metadata?.distance ?? Number.NaN),
  }));
}
