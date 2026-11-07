/**
 * apps/mcp-gateway/src/bus.ts — OmniBus 黑板鏡像 + 蜂巢得標軌跡（唯讀工具）
 *
 * 邊界（沿襲 mcp-gateway 評估決議，勿越界）：
 *   1. 唯讀：僅暴露查詢（bus_events / hive_awards），不提供寫入或競標端點。
 *   2. 鴨子型別橋接：不依賴 @esggo/omni-arch（app 層不匯入 packages，
 *      避免 rootDir 與耦合問題），橋接僅要求 subscribe / tenderHistory
 *      之最小結構契約。
 *   3. 有界鏡像：環形緩衝（預設 256 筆），uuid MECE 去重，記憶體上限可預期；
 *      鏡像僅覆蓋 attach 之後的事件流（總線 journal 不含事件本體）。
 *   4. 未接線時 503 優雅降級（與 rag.ts 慣例一致），不偽造空結果。
 *   5. 僅私有網路部署；對外一律經 withAuth 預設拒絕。
 */
import { t, contract, impl, HttpError } from '@carlos-tzin/tzin'

// ── 檢視模型（與 @esggo/omni-arch BusEvent / HiveAwardRecord 形狀對齊，零匯入）──
export interface BusEventView {
  readonly uuid: string
  readonly version: string
  readonly timestamp: number
  readonly source_origin: string
  readonly topic: string
  payload: unknown
}

export interface HiveAwardBidView {
  readonly workerId: string
  readonly score: number | null
  readonly note?: string
}

export interface HiveAwardView {
  readonly taskUuid: string
  readonly topic: string
  readonly winnerId: string
  readonly winningScore: number
  readonly rounds: number
  readonly bids: readonly HiveAwardBidView[]
}

export interface BusEventsQuery {
  topic?: string
  since?: number
  limit?: number
}

export interface HiveAwardsQuery {
  workerId?: string
  limit?: number
}

// ── 有界鏡像（環形緩衝 + uuid MECE 去重）──────────────────────
export class OmniBusMirror {
  private readonly events: BusEventView[] = []
  private readonly seen = new Set<string>()
  private readonly capacity: number
  private attached = false
  private awardSource: HiveAwardSource | undefined

  constructor(capacity = 256) {
    this.capacity = Math.max(1, capacity)
  }

  markAttached(): void {
    this.attached = true
  }

  isAttached(): boolean {
    return this.attached
  }

  setAwardSource(source: HiveAwardSource | undefined): void {
    this.awardSource = source
  }

  hasAwardSource(): boolean {
    return this.awardSource !== undefined
  }

  /** 測試與手動餵送用：清空鏡像並回到未接線狀態。 */
  reset(): void {
    this.events.length = 0
    this.seen.clear()
    this.attached = false
    this.awardSource = undefined
  }

  /** 事件入鏡：uuid 重複拒絕（MECE），滿載時淘汰最舊。 */
  record(event: BusEventView): boolean {
    if (this.seen.has(event.uuid)) {
      return false
    }
    this.seen.add(event.uuid)
    if (this.events.length >= this.capacity) {
      const dropped = this.events.shift()
      if (dropped) {
        this.seen.delete(dropped.uuid)
      }
    }
    this.events.push({ ...event })
    return true
  }

  /** 事件查詢：topic 精確過濾、since 之後（含）、limit 取最新尾段（時間升序）。 */
  busEvents(query: BusEventsQuery = {}): BusEventView[] {
    let filtered = this.events
    if (query.topic) {
      filtered = filtered.filter((event) => event.topic === query.topic)
    }
    if (query.since !== undefined) {
      filtered = filtered.filter((event) => event.timestamp >= (query.since ?? 0))
    }
    return filtered.slice(-clampLimit(query.limit ?? 20))
  }

  /** 得標軌跡查詢：優先活水源（tenderHistory 即時讀取），可依得標者過濾。 */
  hiveAwards(query: HiveAwardsQuery = {}): HiveAwardView[] {
    const source = this.awardSource
    if (!source) {
      return []
    }
    let filtered = [...source.tenderHistory()]
    if (query.workerId) {
      filtered = filtered.filter((record) => record.winnerId === query.workerId)
    }
    return filtered.slice(-clampLimit(query.limit ?? 20))
  }
}

function clampLimit(limit: number): number {
  return Math.min(Math.max(1, limit), 100)
}

// ── 橋接（鴨子型別，零新依賴）────────────────────────────────
export interface BusObservable {
  subscribe(
    topic: string,
    handler: (event: Readonly<BusEventView>) => void | Promise<void>,
  ): () => void
}

export interface HiveAwardSource {
  tenderHistory(): readonly HiveAwardView[]
}

export const DEFAULT_BUS_TOPICS = [
  'sys.martial_law',
  'hive.awarded',
  'oesg.pulse.tick',
  'oesg.report.draft',
] as const

/** 閘道單例鏡像（契約端點的資料來源）。 */
export const gatewayBusMirror = new OmniBusMirror()

export interface AttachOptions {
  /** 要訂閱的總線主題；預設 DEFAULT_BUS_TOPICS。 */
  topics?: readonly string[]
  /** 可選：注入獨立鏡像（預設單例）。 */
  mirror?: OmniBusMirror
}

/**
 * 把宿主行程的 OmniBus / OmniHive 以唯讀鏡像接入閘道：
 * - bus.subscribe(topic, handler)：事件流入環形緩衝（僅 attach 之後的事件）。
 * - hive.tenderHistory()：得標軌跡活水源（即時讀取，含 attach 前歷史）。
 * 回傳 detach()；卸除後 bus_events / hive_awards 回 503。
 *
 * @example
 * ```typescript
 * const arch = OmniArch.germinate()
 * const detach = attachArchBus({ bus: arch.wire.bus, hive: arch.wire.hive })
 * ```
 */
export function attachArchBus(
  source: { bus: BusObservable; hive?: HiveAwardSource },
  options: AttachOptions = {},
): () => void {
  const mirror = options.mirror ?? gatewayBusMirror
  const topics = options.topics ?? DEFAULT_BUS_TOPICS
  const unsubscribers = topics.map((topic) =>
    source.bus.subscribe(topic, (event) => {
      mirror.record(event)
    }),
  )
  mirror.setAwardSource(source.hive)
  mirror.markAttached()
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe()
    }
    mirror.setAwardSource(undefined)
  }
}

// ── 契約：黑板事件鏡像查詢（唯讀）────────────────────────────
const busEventsContract = contract({
  method: 'POST',
  path: '/bus/events',
  name: 'bus_events',
  description: 'OmniBus 黑板事件鏡像查詢（唯讀）：可依 topic / since 過濾，limit 上限 100',
  body: t.Object({
    topic: t.Optional(t.String({ minLength: 1, maxLength: 128 })),
    since: t.Optional(t.Integer({ minimum: 0 })),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  }),
  responses: {
    200: t.Object({
      count: t.Integer(),
      items: t.Array(
        t.Object({
          uuid: t.String(),
          version: t.String(),
          timestamp: t.Integer(),
          source_origin: t.String(),
          topic: t.String(),
          payload: t.Unknown(),
        }),
      ),
    }),
    400: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

export const busEventsRoute = impl(busEventsContract, async ({ body }) => {
  if (!gatewayBusMirror.isAttached()) {
    throw new HttpError(503, 'bus bridge not attached (宿主尚未呼叫 attachArchBus)')
  }
  const items = gatewayBusMirror.busEvents(body ?? {})
  return {
    status: 200 as const,
    body: {
      count: items.length,
      items,
    },
  }
})

// ── 契約：蜂巢得標軌跡查詢（唯讀）────────────────────────────
const hiveAwardsContract = contract({
  method: 'POST',
  path: '/hive/awards',
  name: 'hive_awards',
  description: 'OmniHive 蜂巢得標軌跡查詢（唯讀）：可依得標者 workerId 過濾，全程公開可追溯',
  body: t.Object({
    workerId: t.Optional(t.String({ minLength: 1, maxLength: 128 })),
    limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
  }),
  responses: {
    200: t.Object({
      count: t.Integer(),
      items: t.Array(
        t.Object({
          taskUuid: t.String(),
          topic: t.String(),
          winnerId: t.String(),
          winningScore: t.Number(),
          rounds: t.Integer(),
          bids: t.Array(
            t.Object({
              workerId: t.String(),
              score: t.Union([t.Number(), t.Null()]),
              note: t.Optional(t.String()),
            }),
          ),
        }),
      ),
    }),
    400: t.Object({ error: t.String() }),
    503: t.Object({ error: t.String() }),
  },
})

export const hiveAwardsRoute = impl(hiveAwardsContract, async ({ body }) => {
  if (!gatewayBusMirror.hasAwardSource()) {
    throw new HttpError(503, 'hive bridge not attached (宿主未提供 tenderHistory 活水源)')
  }
  const items = gatewayBusMirror.hiveAwards(body ?? {})
  return {
    status: 200 as const,
    body: {
      count: items.length,
      items,
    },
  }
})
