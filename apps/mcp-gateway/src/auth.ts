/**
 * mcp-gateway 預設拒絕（default-deny）認證骨架 — issue #91 第 5 項
 *
 * 設計約束（對齊 2026-10-28 tzin 評估決議 + soul.md §六 最佳實踐覺）：
 *   1. tzin createApp 的 middleware 不涵蓋 /mcp、/openapi.json、/llms.txt
 *      等 framework 內建特殊路徑（src/server.ts dispatchRaw 先處理特殊路徑
 *      才進 compose(middleware, dispatch)），故認證必須在 App 邊界以
 *      包裝層實作，才能對全部端點（含 MCP transport）預設拒絕。
 *   2. 預設拒絕：僅 PUBLIC_PATHS（/health）免認證，其餘一律須帶 token。
 *   3. fail-closed：MCP_GATEWAY_TOKEN 未設定時，受保護路徑一律 503，
 *      絕不静默放行。
 *   4. 比對採 timingSafeEqual（先等長 padding，避免長度洩漏觸發 throw；
 *      長度本身仍以非恆定時間比較，僅洩漏 token 長度，可接受）。
 */
import { timingSafeEqual } from 'node:crypto'
import type { App } from '@carlos-tzin/tzin'

/** 免認證路徑（僅 liveness probe）。 */
export const PUBLIC_PATHS: ReadonlySet<string> = new Set(['/health'])

/** 從 URL 取 pathname（不含 query/fragment）。 */
export function pathnameOf(url: string): string {
  const authorityEnd = url.indexOf('//') + 2
  const path = url.slice(url.indexOf('/', authorityEnd))
  const end = path.search(/[?#]/)
  return end === -1 ? path : path.slice(0, end)
}

/** 擷取 token：Authorization: Bearer <token> 或 X-Omni-Token: <token>。 */
export function extractToken(req: Request): string | null {
  const bearer = req.headers.get('authorization')
  if (bearer) {
    const match = /^Bearer\s+(\S+)$/.exec(bearer)
    if (match?.[1]) return match[1]
  }
  const omni = req.headers.get('x-omni-token')
  return omni !== null && omni.length > 0 ? omni : null
}

/** 恆定時間比對（等長 padding 後 timingSafeEqual；長度差以長度比對收斂）。 */
export function tokensEqual(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) {
    // 仍走一次等長比較，避免以返回時序區分「長度錯」與「內容錯」。
    const pad = Buffer.alloc(Math.max(a.length, b.length))
    a.copy(pad)
    const pb = Buffer.alloc(pad.length)
    b.copy(pb)
    timingSafeEqual(pad, pb)
    return false
  }
  return timingSafeEqual(a, b)
}

export type AuthVerdict =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: string }

export interface AuthConfig {
  /** 閘道 token；未設定 = fail-closed（受保護路徑一律 503）。 */
  token?: string
  /** 免認證路徑覆寫（測試用）；預設 PUBLIC_PATHS。 */
  publicPaths?: ReadonlySet<string>
}

/** 單一請求授權判定（純函式，供契約測試直接驗證）。 */
export function authorize(req: Request, config: AuthConfig): AuthVerdict {
  const publicPaths = config.publicPaths ?? PUBLIC_PATHS
  if (publicPaths.has(pathnameOf(req.url))) return { ok: true }
  const token = config.token
  if (token === undefined || token.length === 0) {
    return { ok: false, status: 503, reason: 'MCP_GATEWAY_TOKEN not configured (fail-closed)' }
  }
  const presented = extractToken(req)
  if (presented === null) {
    return { ok: false, status: 401, reason: 'missing token (Authorization: Bearer or X-Omni-Token)' }
  }
  if (!tokensEqual(presented, token)) {
    return { ok: false, status: 401, reason: 'invalid token' }
  }
  return { ok: true }
}

function denied(verdict: Extract<AuthVerdict, { ok: false }>): Response {
  return new Response(JSON.stringify({ error: verdict.reason }), {
    status: verdict.status,
    headers: {
      'content-type': 'application/json',
      'www-authenticate': 'Bearer',
      'cache-control': 'no-store',
    },
  })
}

/**
 * 邊界認證包裝層：包住整個 App（含 tzin 內建的 /mcp、/openapi.json、
 * /llms* 特殊路徑與所有契約路由），預設拒絕未授權請求。
 *
 * 故意不轉發 dispatchRaw：對外包裝層只暴露 fetch，使所有請求都必經
 * authorize()，無法繞過。
 */
export function withAuth(app: App, config: AuthConfig): App {
  return {
    routes: app.routes,
    async fetch(req: Request): Promise<Response> {
      const verdict = authorize(req, config)
      if (!verdict.ok) return denied(verdict)
      return app.fetch(req)
    },
  }
}
