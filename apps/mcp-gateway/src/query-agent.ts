/**
 * apps/mcp-gateway/src/query-agent.ts — Weaviate Query Agent 唯讀代理工具
 *
 * 背景（2026-11-07 評估）：Weaviate 官方提供遠端 MCP 伺服器
 * https://api.agents.weaviate.io/mcp（Streamable HTTP），暴露兩個唯讀工具：
 *   query_agent_ask（自然語言問答）與 query_agent_search（語意搜尋）。
 * 本模組以最小 JSON-RPC 客戶端將其接入 tzin 閘道，供內網 agent 群呼叫。
 *
 * 邊界（沿襲 rag.ts 與 mcp-gateway 評估決議，勿越界）：
 *   1. 唯讀：Query Agent 兩工具僅搜尋、過濾、彙總，不修改資料；本閘道亦不另開寫入路徑。
 *   2. 零新依賴：原生 fetch 實作 MCP Streamable HTTP（initialize → tools/call）。
 *   3. 如實標示（與 rag_search 之關鍵差異）：Query Agent 以叢集層級運作，
 *      無法強制 ownerId 過濾；資料可見範圍完全由 WEAVIATE_API_KEY 之角色
 *      權限界定。呼叫端須使用受角色限制之金鑰，此限制記載於 README。
 *   4. 缺 WEAVIATE_API_KEY 或 WEAVIATE_URL 時回 undefined → 端點 503 優雅降級。
 *   5. 僅私有網路部署；對外一律經 withAuth 預設拒絕。
 */
import { t, contract, impl, HttpError } from '@carlos-tzin/tzin'

// ── 設定解析 ──────────────────────────────────────────────
export interface QueryAgentConfig {
  agentMcpUrl: string
  weaviateUrl: string
  weaviateApiKey: string
  timeoutMs: number
}

type AgentEnv = Record<string, string | undefined>

export function resolveQueryAgentConfig(env: AgentEnv): QueryAgentConfig | undefined {
  const weaviateApiKey = env.WEAVIATE_API_KEY
  const weaviateUrl = env.WEAVIATE_URL
  // 叢集 URL 為 MCP 必要標頭（X-Weaviate-Cluster-Url）；WCD 沙箱必為 https，缺一即降級。
  if (!weaviateApiKey || weaviateApiKey.length === 0 || !weaviateUrl || weaviateUrl.length === 0) {
    return undefined
  }
  return {
    agentMcpUrl: env.QUERY_AGENT_MCP_URL ?? 'https://api.agents.weaviate.io/mcp',
    weaviateUrl,
    weaviateApiKey,
    timeoutMs: Number(env.QUERY_AGENT_TIMEOUT_MS ?? 30000),
  }
}

// ── 最小 MCP Streamable HTTP 客戶端 ────────────────────────
interface JsonRpcResponse {
  jsonrpc?: string
  id?: number | string | null
  result?: unknown
  error?: { code?: number; message?: string }
}

/** Streamable HTTP 回應體可能為 JSON 或 SSE（data: 行）；兩者皆解析為 JsonRpcResponse 陣列。 */
export function parseMcpResponseBody(contentType: string, text: string): JsonRpcResponse[] {
  if (contentType.includes('text/event-stream')) {
    const messages: JsonRpcResponse[] = []
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload.length === 0) continue
      try {
        messages.push(JSON.parse(payload) as JsonRpcResponse)
      } catch {
        // 異常行略過（如註解行或心跳），不以單行畸形拒絕整體回應。
      }
    }
    return messages
  }
  try {
    return [JSON.parse(text) as JsonRpcResponse]
  } catch {
    return []
  }
}

export interface McpCallResult {
  /** tools/call 之結構化內容（優先）；無則為 undefined。 */
  structured?: unknown
  /** content[0].text 原文（Query Agent 兩工具皆以 JSON 文字承載結果）。 */
  text?: string
}

/**
 * 執行一次 MCP 工具呼叫：initialize（取得 session）→ tools/call。
 * session 每次呼叫後即棄（無狀態使用）；notifications/initialized 以 202 容忍。
 */
export async function callMcpTool(
  config: QueryAgentConfig,
  toolName: string,
  args: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<McpCallResult> {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${config.weaviateApiKey}`,
    'X-Weaviate-Cluster-Url': config.weaviateUrl,
  }

  // 1) initialize
  const initRes = await fetchImpl(config.agentMcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'esggo-mcp-gateway', version: '0.4.0' },
      },
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  })
  if (!initRes.ok) {
    throw new HttpError(502, `query agent initialize failed: HTTP ${initRes.status}`)
  }
  const sessionId = initRes.headers.get('mcp-session-id') ?? undefined

  // 2) notifications/initialized（202 Expected；非 ok 不阻斷，交由 tools/call 揭露實況）
  if (sessionId) {
    await fetchImpl(config.agentMcpUrl, {
      method: 'POST',
      headers: { ...headers, 'Mcp-Session-Id': sessionId },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      signal: AbortSignal.timeout(config.timeoutMs),
    }).catch(() => undefined)
  }

  // 3) tools/call
  const callRes = await fetchImpl(config.agentMcpUrl, {
    method: 'POST',
    headers: sessionId ? { ...headers, 'Mcp-Session-Id': sessionId } : headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  })
  if (!callRes.ok) {
    throw new HttpError(502, `query agent call failed: HTTP ${callRes.status}`)
  }
  const contentType = callRes.headers.get('content-type') ?? 'application/json'
  const messages = parseMcpResponseBody(contentType, await callRes.text())
  const rpcError = messages.find((m) => m.error)
  if (rpcError) {
    throw new HttpError(502, `query agent rpc error: ${rpcError.error?.message ?? 'unknown'}`)
  }
  const result = messages.find((m) => m.result !== undefined)?.result as
    | { content?: Array<{ type?: string; text?: string }>; structuredContent?: unknown }
    | undefined
  if (!result) {
    throw new HttpError(502, 'query agent call returned no result')
  }
  const text = result.content?.find((c) => c.type === 'text')?.text
  return { structured: result.structuredContent, text }
}

/** 取得工具結果之 JSON 販載：優先 structuredContent，回退解析 content[0].text。 */
export function extractAgentPayload(call: McpCallResult): Record<string, unknown> {
  if (call.structured && typeof call.structured === 'object') {
    return call.structured as Record<string, unknown>
  }
  if (call.text) {
    try {
      const parsed = JSON.parse(call.text)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    } catch {
      // text 非 JSON 時落入下方錯誤路徑
    }
  }
  throw new HttpError(502, 'query agent result is not a JSON payload')
}

// ── 共用契約回應形狀 ────────────────────────────────────────
const errorResponses = {
  400: t.Object({ error: t.String() }),
  502: t.Object({ error: t.String() }),
  503: t.Object({ error: t.String() }),
}

function requireConfig(): QueryAgentConfig {
  const config = resolveQueryAgentConfig(process.env)
  if (!config) {
    throw new HttpError(503, 'query agent not configured (WEAVIATE_API_KEY or WEAVIATE_URL missing)')
  }
  return config
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

// ── 契約：Ask Mode（自然語言問答，唯讀）───────────────────────
const agentAskContract = contract({
  method: 'POST',
  path: '/agent/ask',
  name: 'query_agent_ask',
  description:
    'Weaviate Query Agent Ask Mode（唯讀）：自然語言問答；資料可見範圍由 WEAVIATE_API_KEY 角色界定，無 ownerId 強制過濾',
  body: t.Object({
    query: t.String({ minLength: 1, maxLength: 2000 }),
    collections: t.Array(t.String({ minLength: 1 }), { minItems: 1, maxItems: 20 }),
    resultEvaluation: t.Optional(t.Union([t.Literal('none'), t.Literal('llm')])),
  }),
  responses: {
    200: t.Object({
      mode: t.Literal('ask'),
      finalAnswer: t.String(),
      isPartialAnswer: t.Optional(t.Boolean()),
      missingInformation: t.Optional(t.Array(t.String())),
      sources: t.Optional(
        t.Array(t.Object({ object_id: t.String(), collection: t.String() })),
      ),
    }),
    ...errorResponses,
  },
})

export const agentAskRoute = impl(agentAskContract, async ({ body }) => {
  const payload = body ?? { query: '', collections: [] }
  if (!payload.query || payload.collections.length === 0) {
    throw new HttpError(400, 'query and collections are required')
  }
  const config = requireConfig()
  const call = await callMcpTool(config, 'query_agent_ask', {
    query: payload.query,
    collections: payload.collections,
    ...(payload.resultEvaluation ? { result_evaluation: payload.resultEvaluation } : {}),
  })
  const agent = extractAgentPayload(call)
  return {
    status: 200 as const,
    body: {
      mode: 'ask' as const,
      finalAnswer: typeof agent.final_answer === 'string' ? agent.final_answer : '',
      ...(typeof agent.is_partial_answer === 'boolean'
        ? { isPartialAnswer: agent.is_partial_answer }
        : {}),
      ...(Array.isArray(agent.missing_information)
        ? { missingInformation: stringArray(agent.missing_information) }
        : {}),
      ...(Array.isArray(agent.sources)
        ? {
            sources: agent.sources
              .map((s) =>
                s && typeof s === 'object'
                  ? {
                      object_id: String((s as Record<string, unknown>).object_id ?? ''),
                      collection: String((s as Record<string, unknown>).collection ?? ''),
                    }
                  : undefined,
              )
              .filter((s): s is { object_id: string; collection: string } => s !== undefined),
          }
        : {}),
    },
  }
})

// ── 契約：Search Mode（語意搜尋，唯讀）────────────────────────
const agentSearchContract = contract({
  method: 'POST',
  path: '/agent/search',
  name: 'query_agent_search',
  description:
    'Weaviate Query Agent Search Mode（唯讀）：語意搜尋回傳排序物件；資料可見範圍由 WEAVIATE_API_KEY 角色界定，無 ownerId 強制過濾',
  body: t.Object({
    query: t.String({ minLength: 1, maxLength: 2000 }),
    collections: t.Array(t.String({ minLength: 1 }), { minItems: 1, maxItems: 20 }),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
    offset: t.Optional(t.Integer({ minimum: 0 })),
    effort: t.Optional(t.Union([t.Literal('medium'), t.Literal('high'), t.Literal('ultrahigh')])),
    filtering: t.Optional(t.Union([t.Literal('recall'), t.Literal('precision')])),
    diversityWeight: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
  }),
  responses: {
    200: t.Object({
      mode: t.Literal('search'),
      count: t.Integer(),
      items: t.Array(t.Unknown()),
    }),
    ...errorResponses,
  },
})

export const agentSearchRoute = impl(agentSearchContract, async ({ body }) => {
  const payload = body ?? { query: '', collections: [] }
  if (!payload.query || payload.collections.length === 0) {
    throw new HttpError(400, 'query and collections are required')
  }
  const config = requireConfig()
  const call = await callMcpTool(config, 'query_agent_search', {
    query: payload.query,
    collections: payload.collections,
    ...(payload.limit !== undefined ? { limit: payload.limit } : {}),
    ...(payload.offset !== undefined ? { offset: payload.offset } : {}),
    ...(payload.effort ? { effort: payload.effort } : {}),
    ...(payload.filtering ? { filtering: payload.filtering } : {}),
    ...(payload.diversityWeight !== undefined
      ? { diversity_weight: payload.diversityWeight }
      : {}),
  })
  const agent = extractAgentPayload(call)
  const results = Array.isArray(agent.results)
    ? agent.results.filter((r) => r !== null && typeof r === 'object')
    : []
  return {
    status: 200 as const,
    body: {
      mode: 'search' as const,
      count: results.length,
      items: results as Record<string, unknown>[],
    },
  }
})
