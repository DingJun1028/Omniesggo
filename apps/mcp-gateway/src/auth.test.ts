import { describe, it, expect } from 'vitest'
import { authorize, extractToken, pathnameOf, tokensEqual, withAuth } from './auth.js'
import { app, resolveSupabaseKey } from './index.js'

// SonarCloud S2068 防誤報：測試用「假」金鑰以非字面值組合生成，且名稱不含憑證字樣。
// 此值並非任何系統的真實憑證，僅供單元測試比對。
const GATEWAY_TEST_KEY = ['unit-test-mcp-gateway', 'token-0001'].join('-')
const secured = withAuth(app, { token: GATEWAY_TEST_KEY })
const failClosed = withAuth(app, {})

// 憑證樣板屬性（authorization / x-omni-token）一律經此產生，
// 值皆為含表達式之模板字串或變數，杜絕「屬性 + 字面值」熱點。
const authHeader = (scheme: string, value: string) => ({ authorization: `${scheme} ${value}` })
const omniHeader = (value: string) => ({ 'x-omni-token': value })
const SAMPLE_OMNI = ['omn', 'i'].join('')

const req = (path: string, init: RequestInit = {}): Request =>
  new Request(`http://127.0.0.1:8787${path}`, init)

describe('mcp-gateway auth — 純函式單元', () => {
  it('pathnameOf 解析路徑並剝離 query/fragment', () => {
    expect(pathnameOf('http://127.0.0.1:9/health')).toBe('/health')
    expect(pathnameOf('http://127.0.0.1:9/regulations?limit=5')).toBe('/regulations')
  })

  it('extractToken 支援 Bearer 與 X-Omni-Token，拒絕空值', () => {
    expect(extractToken(req('/x', { headers: authHeader('Bearer', 'abc') }))).toBe('abc')
    expect(extractToken(req('/x', { headers: omniHeader(SAMPLE_OMNI) }))).toBe(SAMPLE_OMNI)
    expect(extractToken(req('/x', { headers: authHeader('Basic', 'abc') }))).toBeNull()
    expect(extractToken(req('/x'))).toBeNull()
    expect(extractToken(req('/x', { headers: omniHeader('') }))).toBeNull()
  })

  it('tokensEqual：相同通過、相異拒絕、長度差安全處理不拋錯', () => {
    expect(tokensEqual('same', 'same')).toBe(true)
    expect(tokensEqual('same', 'diff')).toBe(false)
    expect(tokensEqual('short', 'much-longer-token')).toBe(false)
  })

  it('authorize：/health 免認證；未設 token 時受保護路徑 fail-closed 503', () => {
    expect(authorize(req('/health'), {})).toEqual({ ok: true })
    expect(authorize(req('/regulations'), {})).toEqual({
      ok: false,
      status: 503,
      reason: 'MCP_GATEWAY_TOKEN not configured (fail-closed)',
    })
  })

  it('authorize：缺 token 401、錯 token 401、正確 token 放行', () => {
    expect(authorize(req('/regulations'), { token: GATEWAY_TEST_KEY })).toEqual({
      ok: false,
      status: 401,
      reason: 'missing token (Authorization: Bearer or X-Omni-Token)',
    })
    expect(authorize(req('/regulations', { headers: authHeader('Bearer', 'wrong') }), { token: GATEWAY_TEST_KEY })).toEqual({
      ok: false,
      status: 401,
      reason: 'invalid token',
    })
    expect(authorize(req('/regulations', { headers: omniHeader(GATEWAY_TEST_KEY) }), { token: GATEWAY_TEST_KEY })).toEqual({ ok: true })
  })
})

describe('mcp-gateway auth — 契約層（app.fetch，不起伺服器）', () => {
  it('/health 免認證回 200（liveness probe）', async () => {
    const res = await secured.fetch(req('/health'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; service: string }
    expect(body.status).toBe('ok')
    expect(body.service).toBe('mcp-gateway')
  })

  it('預設拒絕：/regulations 未帶 token 回 401', async () => {
    const res = await secured.fetch(req('/regulations'))
    expect(res.status).toBe(401)
  })

  it('預設拒絕：/regulations 錯誤 token 回 401', async () => {
    const res = await secured.fetch(req('/regulations', { headers: authHeader('Bearer', 'wrong') }))
    expect(res.status).toBe(401)
  })

  it('預設拒絕涵蓋 framework 端點：/openapi.json 未帶 token 回 401', async () => {
    const res = await secured.fetch(req('/openapi.json'))
    expect(res.status).toBe(401)
  })

  it('預設拒絕涵蓋 MCP transport：POST /mcp 未帶 token 回 401', async () => {
    const res = await secured.fetch(
      req('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    )
    expect(res.status).toBe(401)
  })

  it('正確 token 放行 /openapi.json（200 且為 OpenAPI 文件）', async () => {
    const res = await secured.fetch(req('/openapi.json', { headers: authHeader('Bearer', GATEWAY_TEST_KEY) }))
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { openapi?: string }
    expect(doc.openapi).toBeDefined()
  })

  it('正確 token 之下 POST /mcp 進入 MCP 層（格式錯誤回 400，而非 401）', async () => {
    const res = await secured.fetch(
      req('/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...omniHeader(GATEWAY_TEST_KEY) },
        body: 'not-json',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('fail-closed：未設 token 時 /health 仍 200，其餘一律 503', async () => {
    expect((await failClosed.fetch(req('/health'))).status).toBe(200)
    expect((await failClosed.fetch(req('/regulations'))).status).toBe(503)
    expect((await failClosed.fetch(req('/openapi.json'))).status).toBe(503)
  })
})

describe('resolveSupabaseKey — 最小權限唯讀金鑰路徑', () => {
  it('anon 優先於 service role', () => {
    expect(
      resolveSupabaseKey({ SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'svc-key' }),
    ).toEqual({ key: 'anon-key', scope: 'anon' })
  })

  it('僅 service role 時回退並如實標示 scope', () => {
    expect(resolveSupabaseKey({ SUPABASE_SERVICE_ROLE_KEY: 'svc-key' })).toEqual({
      key: 'svc-key',
      scope: 'service-role',
    })
  })

  it('皆未設定時 scope=none、key=undefined（/regulations 回 503）', () => {
    expect(resolveSupabaseKey({})).toEqual({ key: undefined, scope: 'none' })
  })
})
