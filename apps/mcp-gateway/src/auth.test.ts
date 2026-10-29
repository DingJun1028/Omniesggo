import { describe, it, expect } from 'vitest'
import { authorize, extractToken, pathnameOf, tokensEqual, withAuth } from './auth.js'
import { app, resolveSupabaseKey } from './index.js'

const TOKEN = 'unit-test-mcp-gateway-token-0001'
const secured = withAuth(app, { token: TOKEN })
const failClosed = withAuth(app, {})

const req = (path: string, init: RequestInit = {}): Request =>
  new Request(`http://127.0.0.1:8787${path}`, init)

describe('mcp-gateway auth — 純函式單元', () => {
  it('pathnameOf 解析路徑並剝離 query/fragment', () => {
    expect(pathnameOf('http://host:1/health')).toBe('/health')
    expect(pathnameOf('http://host:1/regulations?limit=5')).toBe('/regulations')
  })

  it('extractToken 支援 Bearer 與 X-Omni-Token，拒絕空值', () => {
    expect(extractToken(req('/x', { headers: { authorization: 'Bearer abc' } }))).toBe('abc')
    expect(extractToken(req('/x', { headers: { 'x-omni-token': 'omni' } }))).toBe('omni')
    expect(extractToken(req('/x', { headers: { authorization: 'Basic abc' } }))).toBeNull()
    expect(extractToken(req('/x'))).toBeNull()
    expect(extractToken(req('/x', { headers: { 'x-omni-token': '' } }))).toBeNull()
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
    expect(authorize(req('/regulations'), { token: TOKEN })).toEqual({
      ok: false,
      status: 401,
      reason: 'missing token (Authorization: Bearer or X-Omni-Token)',
    })
    expect(authorize(req('/regulations', { headers: { authorization: 'Bearer wrong' } }), { token: TOKEN })).toEqual({
      ok: false,
      status: 401,
      reason: 'invalid token',
    })
    expect(authorize(req('/regulations', { headers: { 'x-omni-token': TOKEN } }), { token: TOKEN })).toEqual({ ok: true })
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
    const res = await secured.fetch(req('/regulations', { headers: { authorization: 'Bearer wrong' } }))
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
    const res = await secured.fetch(req('/openapi.json', { headers: { authorization: `Bearer ${TOKEN}` } }))
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { openapi?: string }
    expect(doc.openapi).toBeDefined()
  })

  it('正確 token 之下 POST /mcp 進入 MCP 層（格式錯誤回 400，而非 401）', async () => {
    const res = await secured.fetch(
      req('/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-omni-token': TOKEN },
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
