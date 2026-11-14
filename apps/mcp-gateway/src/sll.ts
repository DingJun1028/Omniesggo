/**
 * apps/mcp-gateway/src/sll.ts — SLL 第三方追溯介面（唯讀工具）
 *
 * SLL（Soul Lineage Ledger）稽核軌跡之唯讀查詢：
 *   1. sll_trace：以 attestationHash 反查 OESG 五站（Pulse→Report→Audit→Exchange→DAO）
 *      結晶之 Supabase 留存紀錄，回傳站別、量測、期間與雜湊，供第三方追溯。
 *   2. sll_ledger：以 orgId 檢視組織之五站留存帳本（各站最近紀錄投影）。
 *
 * 邊界（沿襲 mcp-gateway 評估決議，勿越界）：
 *   1. 唯讀：僅暴露查詢（sll_trace / sll_ledger），不提供任何寫入端點。
 *   2. Supabase REST 唯讀存取（不疊 ORM）；五站表 RLS 對 anon 預設全拒
 *      （policy 僅 service_role INSERT），故本介面僅接受 service-role scope，
 *      anon 或未設定一律 503 優雅降級（與 rag.ts 慣例一致，不偽造空結果）。
 *   3. 上游非 2xx 回 502；查詢值以白名單字元集驗證並 encodeURIComponent。
 *   4. 僅私有網路部署；對外一律經 withAuth 預設拒絕。
 */
import { t, contract, impl, HttpError } from '@carlos-tzin/tzin'

// ── 金鑰解析（本地最小實作；避免與 index.ts 循環匯入）─────────
// 僅接受 service-role scope：五站表對 anon 為 RLS 預設全拒，
// 以 anon key 查詢只會得到空結果，屬「偽造空結果」，必須拒絕。
function resolveServiceRoleKey(env: {
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}): { key: string | undefined; scope: 'service-role' | 'anon' | 'none' } {
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.length > 0) {
    return { key: env.SUPABASE_SERVICE_ROLE_KEY, scope: 'service-role' }
  }
  if (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.length > 0) {
    return { key: env.SUPABASE_ANON_KEY, scope: 'anon' }
  }
  return { key: undefined, scope: 'none' }
}

// ── 五站站冊（表名與投影欄位對齊 main 之 Supabase migrations）──
export type SllStation = 'pulse' | 'report' | 'audit' | 'exchange' | 'dao'

interface StationSpec {
  readonly station: SllStation
  readonly table: string
  readonly select: string
  readonly uuidColumn: string
}

const STATIONS: readonly StationSpec[] = [
  {
    station: 'pulse',
    table: 'oesg_pulse_ticks',
    select: 'tick_uuid,org_id,period_start,period_end,total_kgco2e,verified,attestation_hash,created_at',
    uuidColumn: 'tick_uuid',
  },
  {
    station: 'report',
    table: 'oesg_reports',
    select: 'report_uuid,org_id,period_start,period_end,tick_count,total_kgco2e,verified,attestation_hash,created_at',
    uuidColumn: 'report_uuid',
  },
  {
    station: 'audit',
    table: 'oesg_audit_verdicts',
    select: 'verdict_uuid,report_uuid,org_id,period_start,period_end,verdict,attestation_hash,created_at',
    uuidColumn: 'verdict_uuid',
  },
  {
    station: 'exchange',
    table: 'oesg_exchange_lots',
    select: 'lot_uuid,verdict_uuid,report_uuid,org_id,period_start,period_end,kgco2e,status,attestation_hash,created_at',
    uuidColumn: 'lot_uuid',
  },
  {
    station: 'dao',
    table: 'oesg_dao_trades',
    select: 'trade_uuid,lot_uuid,verdict_uuid,report_uuid,org_id,buyer_org_id,period_start,period_end,kgco2e,action,status,attestation_hash,created_at',
    uuidColumn: 'trade_uuid',
  },
] as const

// 查詢值白名單字元集：雜湊（8–128）與組織 ID（1–128）僅允許安全字元。
const HASH_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/
const ORG_PATTERN = /^[A-Za-z0-9._:@-]{1,128}$/

type Row = Record<string, unknown>

interface QueryConfig {
  readonly url: string
  readonly key: string
}

async function queryStation(
  config: QueryConfig,
  spec: StationSpec,
  filter: string,
  limit: number,
): Promise<Row[]> {
  const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/${spec.table}?select=${spec.select}&${filter}&limit=${limit}&order=created_at.desc`
  const res = await fetch(endpoint, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new HttpError(502, `supabase rest error (${spec.station}): ${res.status}`)
  }
  return (await res.json()) as Row[]
}

function requireConfig(): QueryConfig {
  const url = process.env.SUPABASE_URL
  const { key, scope } = resolveServiceRoleKey(process.env)
  if (!url || !key) {
    throw new HttpError(503, 'supabase not configured')
  }
  if (scope !== 'service-role') {
    throw new HttpError(503, 'sll endpoints require service-role scope (五站表 RLS 對 anon 預設全拒)')
  }
  return { url, key }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

// ── 契約：attestationHash 反查五站留存（唯讀）─────────────────
const sllTraceContract = contract({
  method: 'POST',
  path: '/sll/trace',
  name: 'sll_trace',
  description: 'SLL 稽核軌跡追溯（唯讀）：以 attestationHash 反查 OESG 五站留存紀錄',
  body: t.Object({
    attestationHash: t.String({ minLength: 8, maxLength: 128 }),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })),
  }),
  responses: {
    200: t.Object({
      count: t.Integer(),
      attestationHash: t.String(),
      entries: t.Array(
        t.Object({
          station: t.String(),
          uuid: t.String(),
          orgId: t.Union([t.String(), t.Null()]),
          periodStart: t.Union([t.Integer(), t.Null()]),
          periodEnd: t.Union([t.Integer(), t.Null()]),
          attestationHash: t.Union([t.String(), t.Null()]),
          createdAt: t.Union([t.String(), t.Null()]),
          totalKgco2e: t.Optional(t.Union([t.Number(), t.Null()])),
          tickCount: t.Optional(t.Union([t.Integer(), t.Null()])),
          verified: t.Optional(t.Union([t.Boolean(), t.Null()])),
          verdict: t.Optional(t.Union([t.String(), t.Null()])),
          verdictUuid: t.Optional(t.Union([t.String(), t.Null()])),
          reportUuid: t.Optional(t.Union([t.String(), t.Null()])),
          lotUuid: t.Optional(t.Union([t.String(), t.Null()])),
          kgco2e: t.Optional(t.Union([t.Number(), t.Null()])),
          status: t.Optional(t.Union([t.String(), t.Null()])),
          action: t.Optional(t.Union([t.String(), t.Null()])),
          buyerOrgId: t.Optional(t.Union([t.String(), t.Null()])),
        }),
      ),
    }),
    400: t.Object({ error: t.String() }),
    502: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

export const sllTraceRoute = impl(sllTraceContract, async ({ body }) => {
  const request = body ?? { attestationHash: '' }
  const attestationHash = request.attestationHash ?? ''
  if (!HASH_PATTERN.test(attestationHash)) {
    throw new HttpError(400, 'attestationHash 字元集不合法（白名單 [A-Za-z0-9._:-]）')
  }
  const limit = request.limit ?? 20
  const config = requireConfig()
  const results = await Promise.all(
    STATIONS.map(async (spec) => ({
      spec,
      rows: await queryStation(config, spec, `attestation_hash=eq.${encodeURIComponent(attestationHash)}`, limit),
    })),
  )
  const entries = results.flatMap(({ spec, rows }) =>
    rows.map((row) => {
      const entry: Record<string, unknown> = {
        station: spec.station,
        uuid: asString(row[spec.uuidColumn]) ?? '',
        orgId: asString(row.org_id),
        periodStart: asInteger(row.period_start),
        periodEnd: asInteger(row.period_end),
        attestationHash: asString(row.attestation_hash),
        createdAt: asString(row.created_at),
      }
      if (spec.station === 'pulse') {
        entry.totalKgco2e = asNumber(row.total_kgco2e)
        entry.verified = asBoolean(row.verified)
      } else if (spec.station === 'report') {
        entry.totalKgco2e = asNumber(row.total_kgco2e)
        entry.tickCount = asInteger(row.tick_count)
        entry.verified = asBoolean(row.verified)
      } else if (spec.station === 'audit') {
        entry.verdict = asString(row.verdict)
        entry.reportUuid = asString(row.report_uuid)
      } else if (spec.station === 'exchange') {
        entry.lotUuid = asString(row.lot_uuid)
        entry.verdictUuid = asString(row.verdict_uuid)
        entry.reportUuid = asString(row.report_uuid)
        entry.kgco2e = asNumber(row.kgco2e)
        entry.status = asString(row.status)
      } else {
        entry.lotUuid = asString(row.lot_uuid)
        entry.verdictUuid = asString(row.verdict_uuid)
        entry.reportUuid = asString(row.report_uuid)
        entry.kgco2e = asNumber(row.kgco2e)
        entry.action = asString(row.action)
        entry.status = asString(row.status)
        entry.buyerOrgId = asString(row.buyer_org_id)
      }
      return entry
    }),
  )
  return {
    status: 200 as const,
    body: {
      count: entries.length,
      attestationHash,
      entries,
    },
  }
})

// ── 契約：組織五站留存帳本（唯讀）────────────────────────────
const sllLedgerContract = contract({
  method: 'POST',
  path: '/sll/ledger',
  name: 'sll_ledger',
  description: 'SLL 組織帳本檢視（唯讀）：以 orgId 檢視 OESG 五站最近留存紀錄投影',
  body: t.Object({
    orgId: t.String({ minLength: 1, maxLength: 128 }),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })),
  }),
  responses: {
    200: t.Object({
      orgId: t.String(),
      stations: t.Array(
        t.Object({
          station: t.String(),
          count: t.Integer(),
          items: t.Array(
            t.Object({
              uuid: t.String(),
              attestationHash: t.Union([t.String(), t.Null()]),
              periodStart: t.Union([t.Integer(), t.Null()]),
              periodEnd: t.Union([t.Integer(), t.Null()]),
              createdAt: t.Union([t.String(), t.Null()]),
            }),
          ),
        }),
      ),
    }),
    400: t.Object({ error: t.String() }),
    502: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

export const sllLedgerRoute = impl(sllLedgerContract, async ({ body }) => {
  const request = body ?? { orgId: '' }
  const orgId = request.orgId ?? ''
  if (!ORG_PATTERN.test(orgId)) {
    throw new HttpError(400, 'orgId 字元集不合法（白名單 [A-Za-z0-9._:@-]）')
  }
  const limit = request.limit ?? 20
  const config = requireConfig()
  const results = await Promise.all(
    STATIONS.map(async (spec) => ({
      spec,
      rows: await queryStation(config, spec, `org_id=eq.${encodeURIComponent(orgId)}`, limit),
    })),
  )
  const stations = results.map(({ spec, rows }) => ({
    station: spec.station,
    count: rows.length,
    items: rows.map((row) => ({
      uuid: asString(row[spec.uuidColumn]) ?? '',
      attestationHash: asString(row.attestation_hash),
      periodStart: asInteger(row.period_start),
      periodEnd: asInteger(row.period_end),
      createdAt: asString(row.created_at),
    })),
  }))
  return {
    status: 200 as const,
    body: {
      orgId,
      stations,
    },
  }
})
