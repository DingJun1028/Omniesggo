// =====================================================================
// src/lib/rag/client.ts — 設定載入、Ollama 嵌入、Weaviate 寫入與查詢
// 零新依賴（原生 fetch + node:crypto）；僅內網呼叫（VPS 127.0.0.1）
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
// Weaviate：schema 確保、寫入、查詢
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

interface WeaviateRow {
  content: string;
  docId: string;
  chunkIndex: number;
  _additional: { id: string; distance: string | number };
}

export async function searchSimilar(
  config: RagClientConfig,
  queryVector: number[],
  ownerId: string,
  limit = 10
): Promise<RagSearchResult[]> {
  const res = await fetch(`${config.weaviateUrl}/v1/graphql`, {
    method: "POST",
    headers: { ...authHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        Get {
          ${config.className}(
            nearVector: { vector: [${queryVector.join(",")}] }
            limit: ${limit}
            where: { path: ["ownerId"], operator: Equal, valueString: "${ownerId}" }
          ) {
            content docId chunkIndex _additional { id distance }
          }
        }
      }`,
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`WEAVIATE_SEARCH_FAILED: HTTP ${res.status}`);
  }
  const body = (await res.json()) as {
    data?: { Get?: Record<string, WeaviateRow[]> };
    errors?: unknown;
  };
  if (body.errors) {
    throw new Error("WEAVIATE_GRAPHQL_ERRORS");
  }
  const rows = body.data?.Get?.[config.className] ?? [];
  return rows.map((r) => ({
    docId: r.docId,
    chunkIndex: r.chunkIndex,
    content: r.content,
    distance: Number(r._additional.distance),
  }));
}
