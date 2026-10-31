import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveRagConfig, ragSearch, type RagGatewayConfig } from './rag.js'
import { ragSearchRoute } from './rag.js'
import { app } from './index.js'
import { withAuth } from './auth.js'

// SonarCloud S2068 防誤報：測試用「假」金鑰以非字面值組合生成，並非任何系統的真實憑證。
const RAG_TEST_KEY = ['unit-test-rag', 'key-0002'].join('-')
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
  setEnv('WEAVIATE_API_KEY', RAG_TEST_KEY)
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const [name, value] of envBackup) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

function stubFetch(calls: Array<{ ok: boolean; status: number; json: unknown }>) {
  const fn = vi.fn()
  for (const c of calls) fn.mockResolvedValueOnce({ ok: c.ok, status: c.status, json: async () => c.json })
  vi.stubGlobal('fetch', fn)
  return fn
}

const config: RagGatewayConfig = {
  weaviateUrl: 'http://127.0.0.1:8080',
  weaviateApiKey: RAG_TEST_KEY,
  ollamaUrl: 'http://127.0.0.1:11434',
  embeddingModel: 'nomic-embed-text',
  className: 'OmniChunk',
  timeoutMs: 1000,
}

const weaviatePayload = {
  data: {
    Get: {
      OmniChunk: [
        { content: '碳排放範疇一', docId: 'doc-1', chunkIndex: 0, _additional: { id: 'a', distance: '0.12' } },
      ],
    },
  },
}

describe('resolveRagConfig — 缺金鑰優雅降級', () => {
  it('WEAVIATE_API_KEY 未設定時回 undefined', () => {
    expect(resolveRagConfig({})).toBeUndefined()
  })

  it('僅設金鑰時其餘為內網預設值', () => {
    expect(resolveRagConfig({ WEAVIATE_API_KEY: RAG_TEST_KEY })).toEqual({
      weaviateUrl: 'http://127.0.0.1:8080',
      weaviateApiKey: RAG_TEST_KEY,
      ollamaUrl: 'http://127.0.0.1:11434',
      embeddingModel: 'nomic-embed-text',
      className: 'OmniChunk',
      timeoutMs: 8000,
    })
  })
})

describe('ragSearch — 兩段式檢索（stub fetch）', () => {
  it('Ollama 嵌入後 Weaviate 查詢，ownerId 進入 where Equal 過濾', async () => {
    const fn = stubFetch([
      { ok: true, status: 200, json: { embedding: [0.1, 0.2] } },
      { ok: true, status: 200, json: weaviatePayload },
    ])
    const hits = await ragSearch(config, '碳盤查', 'user-7', 5)
    expect(hits).toEqual([
      { docId: 'doc-1', chunkIndex: 0, content: '碳排放範疇一', distance: 0.12 },
    ])
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn.mock.calls[1][0]).toContain('/v1/graphql')
    const gql = JSON.parse(fn.mock.calls[1][1].body).query
    expect(gql).toContain('valueString: "user-7"')
    expect(gql).toContain('limit: 5')
  })

  it('ownerId 含雙引號時被轉義（防 GraphQL 注入）', async () => {
    const fn = stubFetch([
      { ok: true, status: 200, json: { embedding: [0.5] } },
      { ok: true, status: 200, json: weaviatePayload },
    ])
    await ragSearch(config, 'q', 'own"er', 5)
    const gql = JSON.parse(fn.mock.calls[1][1].body).query
    expect(gql).toContain('own\\"er')
  })

  it('Ollama 非 2xx 回 502', async () => {
    stubFetch([{ ok: false, status: 500, json: {} }])
    await expect(ragSearch(config, 'q', 'u', 5)).rejects.toThrow(/ollama embed failed/)
  })

  it('Ollama 回應缺 embedding 回 502', async () => {
    stubFetch([{ ok: true, status: 200, json: {} }])
    await expect(ragSearch(config, 'q', 'u', 5)).rejects.toThrow(/empty embedding/)
  })

  it('Weaviate 非 2xx 回 502', async () => {
    stubFetch([
      { ok: true, status: 200, json: { embedding: [0.5] } },
      { ok: false, status: 401, json: {} },
    ])
    await expect(ragSearch(config, 'q', 'u', 5)).rejects.toThrow(/weaviate search failed/)
  })

  it('GraphQL errors 回 502', async () => {
    stubFetch([
      { ok: true, status: 200, json: { embedding: [0.5] } },
      { ok: true, status: 200, json: { errors: [{ message: 'x' }] } },
    ])
    await expect(ragSearch(config, 'q', 'u', 5)).rejects.toThrow(/graphql errors/)
  })
})

describe('rag_search 契約層（secured.fetch，不起伺服器）', () => {
  const req = (body: unknown, headers: Record<string, string> = {}): Request =>
    new Request('http://127.0.0.1:8787/rag/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  it('預設拒絕：未帶 token 回 401', async () => {
    setEnv('WEAVIATE_API_KEY', RAG_TEST_KEY)
    const res = await secured.fetch(req({ query: 'q', ownerId: 'u' }))
    expect(res.status).toBe(401)
  })

  it('未設 WEAVIATE_API_KEY 時回 503（優雅降級）', async () => {
    setEnv('WEAVIATE_API_KEY', undefined)
    const res = await secured.fetch(
      req({ query: 'q', ownerId: 'u' }, authHeader('Bearer', GATEWAY_TEST_KEY)),
    )
    expect(res.status).toBe(503)
  })

  it('缺 ownerId 回 400', async () => {
    setEnv('WEAVIATE_API_KEY', RAG_TEST_KEY)
    stubFetch([])
    const res = await secured.fetch(
      req({ query: 'q' }, authHeader('Bearer', GATEWAY_TEST_KEY)),
    )
    expect(res.status).toBe(400)
  })

  it('正確 token + 已設金鑰：端到端 200 並回傳檢索結果', async () => {
    setEnv('WEAVIATE_API_KEY', RAG_TEST_KEY)
    stubFetch([
      { ok: true, status: 200, json: { embedding: [0.1, 0.2] } },
      { ok: true, status: 200, json: weaviatePayload },
    ])
    const res = await secured.fetch(
      req({ query: '碳盤查', ownerId: 'user-7', limit: 5 }, authHeader('Bearer', GATEWAY_TEST_KEY)),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { count: number; model: string; items: Array<{ docId: string }> }
    expect(body.count).toBe(1)
    expect(body.model).toBe('nomic-embed-text')
    expect(body.items[0]?.docId).toBe('doc-1')
  })

  it('後端失敗（Ollama 500）回 502', async () => {
    setEnv('WEAVIATE_API_KEY', RAG_TEST_KEY)
    stubFetch([{ ok: false, status: 500, json: {} }])
    const res = await secured.fetch(
      req({ query: 'q', ownerId: 'u' }, authHeader('Bearer', GATEWAY_TEST_KEY)),
    )
    expect(res.status).toBe(502)
  })
})
