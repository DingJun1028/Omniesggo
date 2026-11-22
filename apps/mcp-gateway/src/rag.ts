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
 *   6. 檢索走 REST Search API（POST /v1/search/{class}/near-vector）：
 *      GraphQL 已於 2026-10-26 棄用（WCD 閒置叢集 2026-12-01 關閉、
 *      全體 2027-05-01 EOL）；ownerId 以 JSON where 過濾器傳遞，
 *      無 GraphQL 字串注入面（原 escapeGraphQLString 隨遷移移除）。
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

/**
 * 兩段式檢索：Ollama 嵌入 → Weaviate REST Search API nearVector。
 * ownerId 為強制過濾條件（where Equal，JSON 傳遞），絕不回傳跨 owner 資料。
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

  // 2) Weaviate 近鄰查詢（REST Search API：ownerId Equal 過濾、顯式 limit）
  const searchRes = await fetch(
    `${config.weaviateUrl}/v1/search/${config.className}/near-vector`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.weaviateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: embedded.embedding,
        limit,
        where: { path: ['ownerId'], operator: 'Equal', valueString: ownerId },
        returnProperties: ['content', 'docId', 'chunkIndex'],
        returnMetadata: ['distance'],
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  )
  if (!searchRes.ok) {
    // REST Search API 以真實 HTTP 狀態碼回報錯誤（401/403/404/422/429/500/503）
    throw new HttpError(502, `weaviate search failed: HTTP ${searchRes.status}`)
  }
  const payload = (await searchRes.json()) as {
    results?: Array<{
      id?: string
      properties: { content: string; docId: string; chunkIndex: number }
      metadata?: { distance?: string | number }
    }>
  }
  const rows = payload.results ?? []
  return rows.map((row) => ({
    docId: row.properties.docId,
    chunkIndex: row.properties.chunkIndex,
    content: row.properties.content,
    distance: Number(row.metadata?.distance ?? Number.NaN),
  }))
}

// ── 契約：RAG 語義檢索（唯讀）────────────────────────────────
const ragSearchContract = contract({
  method: 'POST',
  path: '/rag/search',
  name: 'rag_search',
  description: 'RAG 語義檢索（唯讀）：Ollama 嵌入 → Weaviate REST Search nearVector，強制 ownerId 過濾',
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
