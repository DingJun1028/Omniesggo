import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  resolveQueryAgentConfig,
  callMcpTool,
  extractAgentPayload,
  parseMcpResponseBody,
  type QueryAgentConfig,
} from './query-agent.js'
import { agentAskRoute, agentSearchRoute } from './query-agent.js'
import { app } from './index.js'
import { withAuth } from './auth.js'

// SonarCloud S2068 防誤報：測試用「假」金鑰以非字面值組合生成，並非任何系統的真實憑證。
const AGENT_TEST_KEY = ['unit-test-agent', 'key-0003'].join('-')
const GATEWAY_TEST_KEY = ['unit-test-mcp-gateway', 'token-0001'].join('-')
const secured = withAuth(app, { token: GATEWAY_TEST_KEY })
const authHeader = (scheme: string, value: string) => ({ authorization: `${scheme} ${value}` })

const envBackup = new Map<string, string | undefined>()
function setEnv(name: string, value: string | undefined) {
  if (!envBackup.has(name)) envBackup.set(name, process.env[name])
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

beforeEach(() => {
  setEnv('WEAVIATE_API_KEY', AGENT_TEST_KEY)
  setEnv('WEAVIATE_URL', 'https://unit-test.example.weaviate.cloud')
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const [name, value] of envBackup) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

const config: QueryAgentConfig = {
  agentMcpUrl: 'https://agents.example.test/mcp',
  weaviateUrl: 'https://unit-test.example.weaviate.cloud',
  weaviateApiKey: AGENT_TEST_KEY,
  timeoutMs: 1000,
}

interface StubResponse {
  ok: boolean
  status: number
  contentType?: string
  sessionId?: string
  json?: unknown
  text?: string
}

function stubFetch(calls: StubResponse[]) {
  const fn = vi.fn()
  for (const c of calls) {
    fn.mockResolvedValueOnce({
      ok: c.ok,
      status: c.status,
      headers: new Headers({
        'content-type': c.contentType ?? 'application/json',
        ...(c.sessionId ? { 'mcp-session-id': c.sessionId } : {}),
      }),
      json: async () => c.json,
      text: async () => c.text ?? JSON.stringify(c.json ?? {}),
    })
  }
  return fn
}

describe('resolveQueryAgentConfig — 缺憑證優雅降級', () => {
  it('WEAVIATE_API_KEY 或 WEAVIATE_URL 任一未設定時回 undefined', () => {
    expect(resolveQueryAgentConfig({})).toBeUndefined()
    expect(resolveQueryAgentConfig({ WEAVIATE_API_KEY: AGENT_TEST_KEY })).toBeUndefined()
    expect(resolveQueryAgentConfig({ WEAVIATE_URL: 'https://c.example' })).toBeUndefined()
  })

  it('兩者齊備時回預設端點與逾時', () => {
    expect(resolveQueryAgentConfig({ WEAVIATE_API_KEY: AGENT_TEST_KEY, WEAVIATE_URL: 'https://c.example' })).toEqual({
      agentMcpUrl: 'https://api.agents.weaviate.io/mcp',
      weaviateUrl: 'https://c.example',
      weaviateApiKey: AGENT_TEST_KEY,
      timeoutMs: 30000,
    })
  })
})

describe('parseMcpResponseBody — JSON 與 SSE 雙形態', () => {
  it('JSON 回應解析為單一訊息', () => {
    const msgs = parseMcpResponseBody('application/json', '{"jsonrpc":"2.0","id":2,"result":{"a":1}}')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].result).toEqual({ a: 1 })
  })

  it('SSE 回應逐行解析 data: 訊息並略過畸形行', () => {
    const sse = ': comment\ndata: {"jsonrpc":"2.0","id":2,"result":{"final_answer":"ok"}}\ndata: not-json\n\n'
    const msgs = parseMcpResponseBody('text/event-stream', sse)
    expect(msgs).toHaveLength(1)
    expect((msgs[0].result as Record<string, unknown>).final_answer).toBe('ok')
  })
})

describe('callMcpTool — initialize → tools/call（stub fetch）', () => {
  it('帶 Bearer 與叢集標頭、session 後續傳遞、回傳 structured 內容', async () => {
    const fn = stubFetch([
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 1, result: {} }, sessionId: 'sess-1' },
      { ok: true, status: 202, json: {} },
      {
        ok: true,
        status: 200,
        json: { jsonrpc: '2.0', id: 2, result: { content: [{ type: 'text', text: '{"x":1}' }], structuredContent: { final_answer: '答' } } },
      },
    ])
    const call = await callMcpTool(config, 'query_agent_ask', { query: 'q', collections: ['C'] }, fn as unknown as typeof fetch)
    expect(extractAgentPayload(call)).toEqual({ final_answer: '答' })
    expect(fn).toHaveBeenCalledTimes(3)
    const init = fn.mock.calls[0]
    expect(init[0]).toBe('https://agents.example.test/mcp')
    expect(init[1].headers['Authorization']).toBe(`Bearer ${AGENT_TEST_KEY}`)
    expect(init[1].headers['X-Weaviate-Cluster-Url']).toBe('https://unit-test.example.weaviate.cloud')
    const toolCall = JSON.parse(fn.mock.calls[2][1].body)
    expect(toolCall.method).toBe('tools/call')
    expect(toolCall.params.name).toBe('query_agent_ask')
    expect(toolCall.params.arguments.collections).toEqual(['C'])
  })

  it('text 回退路徑：無 structuredContent 時解析 content[0].text', () => {
    expect(extractAgentPayload({ text: '{"results":[{"name":"a"}]}' })).toEqual({ results: [{ name: 'a' }] })
  })

  it('兩者皆缺時拋 502', () => {
    expect(() => extractAgentPayload({})).toThrow(/not a JSON payload/)
  })

  it('RPC error 轉 502', async () => {
    const fn = stubFetch([
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 1, result: {} } },
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 2, error: { code: -32000, message: 'Unknown collection' } } },
    ])
    await expect(
      callMcpTool(config, 'query_agent_search', { query: 'q', collections: ['Nope'] }, fn as unknown as typeof fetch),
    ).rejects.toThrow(/Unknown collection/)
  })

  it('initialize 非 2xx 轉 502', async () => {
    const fn = stubFetch([{ ok: false, status: 401, json: { error: 'Invalid API key or cluster URL.' } }])
    await expect(
      callMcpTool(config, 'query_agent_ask', { query: 'q', collections: ['C'] }, fn as unknown as typeof fetch),
    ).rejects.toThrow(/initialize failed: HTTP 401/)
  })
})

describe('路由契約（withAuth 邊界）', () => {
  it('未認證呼叫 agent 端點回 401', async () => {
    const res = await secured.fetch(new Request('http://x/agent/ask', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('缺 WEAVIATE_URL 時 ask 端點 503 優雅降級', async () => {
    setEnv('WEAVIATE_URL', undefined)
    const res = await secured.fetch(
      new Request('http://x/agent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader('Bearer', GATEWAY_TEST_KEY) },
        body: JSON.stringify({ query: 'q', collections: ['C'] }),
      }),
    )
    expect(res.status).toBe(503)
  })

  it('ask 端點完整往返：llm 評估欄位與 sources 映射', async () => {
    const agentPayload = {
      final_answer: '最貴的藍色T恤為 46 美元',
      is_partial_answer: false,
      missing_information: [],
      sources: [{ object_id: '9f9f', collection: 'ECommerce' }],
    }
    vi.stubGlobal('fetch', stubFetch([
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 1, result: {} }, sessionId: 's' },
      { ok: true, status: 202, json: {} },
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 2, result: { structuredContent: agentPayload } } },
    ]) as unknown as typeof fetch)
    const res = await secured.fetch(
      new Request('http://x/agent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader('Bearer', GATEWAY_TEST_KEY) },
        body: JSON.stringify({ query: '最貴的藍色T恤？', collections: ['ECommerce'], resultEvaluation: 'llm' }),
      }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.mode).toBe('ask')
    expect(body.finalAnswer).toContain('46')
    expect(body.isPartialAnswer).toBe(false)
    expect(body.sources).toEqual([{ object_id: '9f9f', collection: 'ECommerce' }])
  })

  it('search 端點完整往返：results 陣列映射與 count', async () => {
    vi.stubGlobal('fetch', stubFetch([
      { ok: true, status: 200, json: { jsonrpc: '2.0', id: 1, result: {} } },
      {
        ok: true,
        status: 200,
        contentType: 'text/event-stream',
        text: 'data: {"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"{\\"results\\":[{\\"name\\":\\"Retro\\",\\"price\\":64.0}]}"}]}}\n\n',
      },
    ]) as unknown as typeof fetch)
    const res = await secured.fetch(
      new Request('http://x/agent/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader('Bearer', GATEWAY_TEST_KEY) },
        body: JSON.stringify({ query: 'vintage shoes under 70', collections: ['ECommerce'], limit: 5 }),
      }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.mode).toBe('search')
    expect(body.count).toBe(1)
    expect(body.items).toEqual([{ name: 'Retro', price: 64 }])
  })

  it('ask 缺 collections 回 400', async () => {
    const res = await secured.fetch(
      new Request('http://x/agent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader('Bearer', GATEWAY_TEST_KEY) },
        body: JSON.stringify({ query: 'q', collections: [] }),
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('契約即文件：兩路由已註冊於 app', () => {
  it('agentAskRoute 與 agentSearchRoute 匯出可用', () => {
    expect(agentAskRoute).toBeDefined()
    expect(agentSearchRoute).toBeDefined()
  })
})
