/**
 * apps/mcp-gateway/src/rag.ts — RAG 唯讀檢索工具（issue #91 後續候選：rag_search）
 *
 * 邊界（沿襲 mcp-gateway 評估決議，勿越界）：
 *   1. 唯讀：僅暴露檢索（embed → Weaviate nearVector），不提供寫入端點。
 *   2. 不匯入根 src/lib/rag（app 層自持最小檢索邏輯，避免跨 rootDir 匯入）。
 *   3. 強制 ownerId 過濾（與 Supabase RLS / document_chunks owner_id 語義一致）。
 *   4. 僅私有網路部署；對外一律經 withAuth 預設拒絕。
 *   5. 零新依賴：原生 fetch；環境變數與 VPS .env.secrets 同名
 *      （WEAVIATE_API_KEY 走 OTS 交接，密文永不入 repo）。
 */
import { t, contract, impl, HttpError } from '@carlos-tzin/tzin'

// ── 設定解析（缺 WEAVIATE_API_KEY 時回 undefined → 端點 503 優雅降級）──
export interface RagGatewayConfig {
  weaviateUrl: string
  weaviateApiKey: string
  ollamaUrl: string
  embeddingModel: string
  className: string
  timeoutMs: number
}

type RagEnv = Record<string, string | undefined>

export function resolveRagConfig(env: RagEnv): RagGatewayConfig | undefined {
  const weaviateApiKey = env.WEAVIATE_API_KEY
  if (!weaviateApiKey || weaviateApiKey.length === 0) {
    return undefined
  }
  return {
    weaviateUrl: env.WEAVIATE_URL ?? 'http://127.0.0.1:8080',
    weaviateApiKey,
    ollamaUrl: env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
    embeddingModel: env.RAG_EMBEDDING_MODEL ?? 'nomic-embed-text',
    className: env.RAG_WEAVIATE_CLASS ?? 'OmniChunk',
    timeoutMs: Number(env.RAG_TIMEOUT_MS ?? 8000),
  }
}

export interface RagHit {
  docId: string
  chunkIndex: number
  content: string
  distance: number
}

// GraphQL 字串值防注入（ownerId 來自私網呼叫端，仍一律轉義雙引號）
function escapeGraphQLString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * 兩段式檢索：Ollama 嵌入 → Weaviate GraphQL 近鄰查詢。
 * ownerId 為強制過濾條件（where Equal），絕不回傳跨 owner 資料。
 */
export async function ragSearch(
  config: RagGatewayConfig,
  query: string,
  ownerId: string,
  limit: number,
): Promise<RagHit[]> {
  // 1) Ollama 嵌入（De-Google：自架 nomic-embed-text）
  const embedRes = await fetch(`${config.ollamaUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.embeddingModel, prompt: query }),
    signal: AbortSignal.timeout(config.timeoutMs),
  })
  if (!embedRes.ok) {
    throw new HttpError(502, `ollama embed failed: HTTP ${embedRes.status}`)
  }
  const embedded = (await embedRes.json()) as { embedding?: number[] }
  if (!Array.isArray(embedded.embedding) || embedded.embedding.length === 0) {
    throw new HttpError(502, 'ollama embed failed: empty embedding')
  }

  // 2) Weaviate 近鄰查詢（ownerId Equal 過濾）
  const gqlBody = JSON.stringify({
    query: `{
      Get {
        ${config.className}(
          nearVector: { vector: [${embedded.embedding.join(',')}] }
          limit: ${limit}
          where: { path: ["ownerId"], operator: Equal, valueString: "${escapeGraphQLString(ownerId)}" }
        ) {
          content docId chunkIndex _additional { id distance }
        }
      }
    }`,
  })
  const searchRes = await fetch(`${config.weaviateUrl}/v1/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.weaviateApiKey}`,
      'Content-Type': 'application/json',
    },
    body: gqlBody,
    signal: AbortSignal.timeout(config.timeoutMs),
  })
  if (!searchRes.ok) {
    throw new HttpError(502, `weaviate search failed: HTTP ${searchRes.status}`)
  }
  const payload = (await searchRes.json()) as {
    data?: { Get?: Record<string, Array<{ content: string; docId: string; chunkIndex: number; _additional: { distance: string | number } }>> }
    errors?: unknown
  }
  if (payload.errors) {
    throw new HttpError(502, 'weaviate search failed: graphql errors')
  }
  const rows = payload.data?.Get?.[config.className] ?? []
  return rows.map((row) => ({
    docId: row.docId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    distance: Number(row._additional.distance),
  }))
}

// ── 契約：RAG 語義檢索（唯讀）────────────────────────────────
const ragSearchContract = contract({
  method: 'POST',
  path: '/rag/search',
  name: 'rag_search',
  description: 'RAG 語義檢索（唯讀）：Ollama 嵌入 → Weaviate 近鄰查詢，強制 ownerId 過濾',
  body: t.Object({
    query: t.String({ minLength: 1, maxLength: 2000 }),
    ownerId: t.String({ minLength: 1, maxLength: 128 }),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })),
  }),
  responses: {
    200: t.Object({
      count: t.Integer(),
      model: t.String(),
      items: t.Array(
        t.Object({
          docId: t.String(),
          chunkIndex: t.Integer(),
          content: t.String(),
          distance: t.Number(),
        }),
      ),
    }),
    400: t.Object({ error: t.String() }),
    502: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

export const ragSearchRoute = impl(ragSearchContract, async ({ body }) => {
  const payload = body ?? { query: '', ownerId: '' }
  if (!payload.query || !payload.ownerId) {
    throw new HttpError(400, 'query and ownerId are required')
  }
  const config = resolveRagConfig(process.env)
  if (!config) {
    throw new HttpError(503, 'rag not configured (WEAVIATE_API_KEY missing)')
  }
  const hits = await ragSearch(config, payload.query, payload.ownerId, payload.limit ?? 10)
  return {
    status: 200 as const,
    body: {
      count: hits.length,
      model: config.embeddingModel,
      items: hits,
    },
  }
})
