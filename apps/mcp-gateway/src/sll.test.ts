import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { app } from './index.js'
import { withAuth } from './auth.js'

// SonarCloud S2068 防誤報：測試用「假」金鑰以非字面值組合生成，並非任何系統的真實憑證。
const GATEWAY_TEST_KEY = ['unit-test-mcp-gateway', 'token-0003'].join('-')
const SERVICE_TEST_KEY = ['unit-test-supabase', 'service-role'].join('-')
const ANON_TEST_KEY = ['unit-test-supabase', 'anon'].join('-')
const SUPABASE_TEST_URL = ['https://', 'unit-test', '.supabase.co'].join('')

const secured = withAuth(app, { token: GATEWAY_TEST_KEY })

const post = (path: string, body: unknown, headers: Record<string, string> = {}): Request =>
  new Request(`http://127.0.0.1:8787${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${GATEWAY_TEST_KEY}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const
let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  vi.unstubAllGlobals()
})

const jsonResponse = (rows: unknown[], status = 200): Response =>
  new Response(JSON.stringify(rows), {
    status,
    headers: { 'content-type': 'application/json' },
  })

interface StubbedFetch {
  calls: string[]
}

function stubSupabaseRest(handler: (url: string) => Response): StubbedFetch {
  const calls: string[] = []
  const fake = async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const url = String(input)
    calls.push(url)
    return handler(url)
  }
  vi.stubGlobal('fetch', fake)
  return { calls }
}

describe('sll_trace / sll_ledger 契約層（secured.fetch，不起伺服器）', () => {
  it('預設拒絕：未帶 token 回 401', async () => {
    const res = await secured.fetch(
      new Request('http://127.0.0.1:8787/sll/trace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attestationHash: 'sha256-abcdef12' }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it('未設定 Supabase 回 503（優雅降級）', async () => {
    const res = await secured.fetch(post('/sll/trace', { attestationHash: 'sha256-abcdef12' }))
    expect(res.status).toBe(503)
    const res2 = await secured.fetch(post('/sll/ledger', { orgId: 'org-a' }))
    expect(res2.status).toBe(503)
  })

  it('僅 anon key 回 503：五站表 RLS 預設全拒，不偽造空結果', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_ANON_KEY = ANON_TEST_KEY
    const res = await secured.fetch(post('/sll/trace', { attestationHash: 'sha256-abcdef12' }))
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('service-role')
  })

  it('attestationHash 白名單外字元回 400', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_TEST_KEY
    const res = await secured.fetch(post('/sll/trace', { attestationHash: 'bad hash value!' }))
    expect(res.status).toBe(400)
  })

  it('orgId 白名單外字元回 400', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_TEST_KEY
    const res = await secured.fetch(post('/sll/ledger', { orgId: 'bad org id' }))
    expect(res.status).toBe(400)
  })

  it('sll_trace 五站並行查詢 200，命中站彙整且 URL 帶正確過濾', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_TEST_KEY
    const stub = stubSupabaseRest((url) => {
      if (url.includes('oesg_dao_trades')) {
        return jsonResponse([
          {
            trade_uuid: 'trade-1',
            lot_uuid: 'lot-1',
            verdict_uuid: 'verdict-1',
            report_uuid: 'report-1',
            org_id: 'org-a',
            buyer_org_id: 'org-b',
            period_start: 1760000000,
            period_end: 1762600000,
            kgco2e: 123.45,
            action: 'settle',
            status: 'settled',
            attestation_hash: 'sha256-abcdef12',
            created_at: '2026-11-12T00:00:00Z',
          },
        ])
      }
      return jsonResponse([])
    })
    const res = await secured.fetch(post('/sll/trace', { attestationHash: 'sha256-abcdef12' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      count: number
      attestationHash: string
      entries: Array<{ station: string; uuid: string; buyerOrgId?: string | null; action?: string | null }>
    }
    expect(body.count).toBe(1)
    expect(body.attestationHash).toBe('sha256-abcdef12')
    expect(body.entries[0]?.station).toBe('dao')
    expect(body.entries[0]?.uuid).toBe('trade-1')
    expect(body.entries[0]?.buyerOrgId).toBe('org-b')
    expect(body.entries[0]?.action).toBe('settle')
    expect(stub.calls).toHaveLength(5)
    for (const call of stub.calls) {
      expect(call).toContain('attestation_hash=eq.sha256-abcdef12')
    }
  })

  it('sll_trace 上游非 2xx 回 502', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_TEST_KEY
    stubSupabaseRest(() => new Response('upstream error', { status: 500 }))
    const res = await secured.fetch(post('/sll/trace', { attestationHash: 'sha256-abcdef12' }))
    expect(res.status).toBe(502)
  })

  it('sll_ledger 五站帳本 200，依站投影最小欄位', async () => {
    process.env.SUPABASE_URL = SUPABASE_TEST_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_TEST_KEY
    const stub = stubSupabaseRest((url) => {
      if (url.includes('oesg_pulse_ticks')) {
        return jsonResponse([
          {
            tick_uuid: 'tick-1',
            org_id: 'org-a',
            period_start: 1760000000,
            period_end: 1762600000,
            total_kgco2e: 610.8,
            verified: true,
            attestation_hash: 'sha256-pulse-01',
            created_at: '2026-11-12T00:00:00Z',
          },
        ])
      }
      return jsonResponse([])
    })
    const res = await secured.fetch(post('/sll/ledger', { orgId: 'org-a' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      orgId: string
      stations: Array<{ station: string; count: number; items: Array<{ uuid: string; attestationHash: string | null }> }>
    }
    expect(body.orgId).toBe('org-a')
    expect(body.stations).toHaveLength(5)
    const pulse = body.stations.find((s) => s.station === 'pulse')
    expect(pulse?.count).toBe(1)
    expect(pulse?.items[0]?.uuid).toBe('tick-1')
    expect(pulse?.items[0]?.attestationHash).toBe('sha256-pulse-01')
    const dao = body.stations.find((s) => s.station === 'dao')
    expect(dao?.count).toBe(0)
    for (const call of stub.calls) {
      expect(call).toContain('org_id=eq.org-a')
    }
  })
})
