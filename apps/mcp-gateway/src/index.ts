/**
 * @esggo/mcp-gateway — tzin 試點（2026-10-28 評估決議；issue #91 第 5 項加認證骨架）
 *
 * 定位：獨立唯讀服務，將平台資料以 MCP / OpenAPI 暴露給自架 Ollama agent 群。
 * 邊界（評估結論，勿越界）：
 *   1. 不取代 Next.js 主應用（app/api/** 不動）。
 *   2. 不使用 tzin/db（Supabase 資料層以 REST 唯讀存取，避免在 Supabase
 *      相容層之上再疊 ORM，違反 PR #80 遷移決策）。
 *   3. 不使用 tzin 即時模組（channels/presence），避免與 Supabase Realtime
 *      形成雙軌基礎設施。
 *   4. 僅部署於私有網路（VPC / 內網）；對外路徑一律經 withAuth 預設拒絕。
 */
import { t, contract, impl, createApp, listen, HttpError } from '@carlos-tzin/tzin'
import { withAuth } from './auth.js'
import { ragSearchRoute } from './rag.js'

const SERVICE = 'mcp-gateway'

// ── Supabase 最小權限唯讀金鑰路徑 ─────────────────────────────
// 優先 anon key（受限 RLS、唯讀語意）；service role 僅為回退，
// 於私有網路部署時才允許（見 README 安全注意事項）。
export interface SupabaseKeyResolution {
  key: string | undefined
  scope: 'anon' | 'service-role' | 'none'
}

export function resolveSupabaseKey(env: {
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}): SupabaseKeyResolution {
  if (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.length > 0) {
    return { key: env.SUPABASE_ANON_KEY, scope: 'anon' }
  }
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.length > 0) {
    return { key: env.SUPABASE_SERVICE_ROLE_KEY, scope: 'service-role' }
  }
  return { key: undefined, scope: 'none' }
}

// ── 契約：健康檢查（唯一免認證端點）────────────────────────────
const health = contract({
  method: 'GET',
  path: '/health',
  responses: {
    200: t.Object({
      status: t.String(),
      service: t.String(),
      timestamp: t.String(),
    }),
  },
})

export const healthRoute = impl(health, async () => ({
  status: 200 as const,
  body: {
    status: 'ok',
    service: SERVICE,
    timestamp: new Date().toISOString(),
  },
}))

// ── 契約：法規清單（Supabase REST 唯讀）───────────────────────
const listRegulations = contract({
  method: 'GET',
  path: '/regulations',
  query: t.Object({
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  }),
  responses: {
    200: t.Object({
      count: t.Integer(),
      items: t.Array(
        t.Object({
          id: t.String(),
          title: t.String(),
          summary: t.String(),
        }),
      ),
    }),
    502: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

type RegulationRow = { id: string; title: string | null; summary: string | null }

export const listRegulationsRoute = impl(listRegulations, async ({ query }) => {
  const limit = query?.limit ?? 20
  const url = process.env.SUPABASE_URL
  const { key } = resolveSupabaseKey(process.env)
  if (!url || !key) {
    throw new HttpError(503, 'supabase not configured')
  }
  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/Regulation?select=id,title,summary&limit=${limit}&order=id.asc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    },
  )
  if (!res.ok) {
    throw new HttpError(502, `supabase rest error: ${res.status}`)
  }
  const rows = (await res.json()) as RegulationRow[]
  return {
    status: 200 as const,
    body: {
      count: rows.length,
      items: rows.map((r) => ({
        id: r.id,
        title: r.title ?? '',
        summary: r.summary ?? '',
      })),
    },
  }
})

// ── App：契約即 OpenAPI 3.1 與 MCP，零轉換層 ───────────────────
export const app = createApp([healthRoute, listRegulationsRoute, ragSearchRoute], {
  openapi: true,
  mcp: true,
  meta: {
    title: 'Omniesggo MCP Gateway',
    version: '0.3.0',
    description: 'tzin contract-first 唯讀試點：平台資料之 MCP / OpenAPI 暴露層（default-deny auth；rag_search 唯讀檢索工具）',
  },
})

/** 對外（含 /mcp、/openapi.json）一律經 withAuth 預設拒絕；/health 免認證。 */
export const securedApp = withAuth(app, { token: process.env.MCP_GATEWAY_TOKEN })

// 直接執行（node/tsx）時啟動伺服器；作為模組匯入（契約測試）時不監聽。
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  listen(securedApp, Number(process.env.PORT ?? 8787))
}
