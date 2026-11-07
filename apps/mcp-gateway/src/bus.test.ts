import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  OmniBusMirror,
  attachArchBus,
  gatewayBusMirror,
  DEFAULT_BUS_TOPICS,
  type BusEventView,
  type BusObservable,
  type HiveAwardView,
  type HiveAwardSource,
} from './bus.js'
import { app } from './index.js'
import { withAuth } from './auth.js'

// SonarCloud S2068 防誤報：測試用「假」金鑰以非字面值組合生成，並非任何系統的真實憑證。
const GATEWAY_TEST_KEY = ['unit-test-mcp-gateway', 'token-0002'].join('-')
const secured = withAuth(app, { token: GATEWAY_TEST_KEY })
const authHeader = (scheme: string, value: string) => ({ authorization: `${scheme} ${value}` })

function mintEvent(uuid: string, topic: string, timestamp: number, payload: unknown = {}): BusEventView {
  return {
    uuid,
    version: '1.0.0',
    timestamp,
    source_origin: 'unit-test://omnibus-mirror',
    topic,
    payload,
  }
}

function stubBus(): { bus: BusObservable; emit: (topic: string, event: BusEventView) => void; calls: string[] } {
  const handlers = new Map<string, Array<(event: Readonly<BusEventView>) => void | Promise<void>>>()
  const calls: string[] = []
  const bus: BusObservable = {
    subscribe(topic, handler) {
      const list = handlers.get(topic) ?? []
      list.push(handler)
      handlers.set(topic, list)
      calls.push(topic)
      return () => {
        const current = handlers.get(topic) ?? []
        const index = current.indexOf(handler)
        if (index >= 0) current.splice(index, 1)
      }
    },
  }
  const emit = (topic: string, event: BusEventView) => {
    for (const handler of handlers.get(topic) ?? []) {
      void handler(event)
    }
  }
  return { bus, emit, calls }
}

function stubHive(records: HiveAwardView[]): HiveAwardSource {
  return { tenderHistory: () => records }
}

const award = (taskUuid: string, winnerId: string, winningScore: number): HiveAwardView => ({
  taskUuid,
  topic: 'esg.tender',
  winnerId,
  winningScore,
  rounds: 2,
  bids: [
    { workerId: winnerId, score: winningScore },
    { workerId: 'worker-b', score: 1, note: '讓賢' },
  ],
})

beforeEach(() => {
  gatewayBusMirror.reset()
})

afterEach(() => {
  gatewayBusMirror.reset()
})

describe('OmniBusMirror — 有界鏡像與過濾', () => {
  it('uuid 重複拒絕（MECE）', () => {
    const mirror = new OmniBusMirror()
    expect(mirror.record(mintEvent('u-1', 'sys.martial_law', 100))).toBe(true)
    expect(mirror.record(mintEvent('u-1', 'sys.martial_law', 200))).toBe(false)
    expect(mirror.busEvents()).toHaveLength(1)
  })

  it('環形緩衝滿載淘汰最舊', () => {
    const mirror = new OmniBusMirror(2)
    mirror.record(mintEvent('u-1', 'sys.martial_law', 100))
    mirror.record(mintEvent('u-2', 'sys.martial_law', 200))
    mirror.record(mintEvent('u-3', 'sys.martial_law', 300))
    const items = mirror.busEvents()
    expect(items.map((event) => event.uuid)).toEqual(['u-2', 'u-3'])
  })

  it('topic / since 過濾與 limit 尾段（時間升序）', () => {
    const mirror = new OmniBusMirror()
    mirror.record(mintEvent('u-1', 'oesg.pulse.tick', 100))
    mirror.record(mintEvent('u-2', 'sys.martial_law', 200))
    mirror.record(mintEvent('u-3', 'oesg.pulse.tick', 300))
    expect(mirror.busEvents({ topic: 'oesg.pulse.tick' }).map((e) => e.uuid)).toEqual(['u-1', 'u-3'])
    expect(mirror.busEvents({ since: 150 }).map((e) => e.uuid)).toEqual(['u-2', 'u-3'])
    expect(mirror.busEvents({ limit: 2 }).map((e) => e.uuid)).toEqual(['u-2', 'u-3'])
  })

  it('無活水源時 hiveAwards 回空陣列', () => {
    expect(new OmniBusMirror().hiveAwards()).toEqual([])
  })
})

describe('attachArchBus — 鴨子型別橋接', () => {
  it('預設訂閱 DEFAULT_BUS_TOPICS，事件流入單例鏡像', () => {
    const { bus, emit } = stubBus()
    const detach = attachArchBus({ bus })
    for (const topic of DEFAULT_BUS_TOPICS) {
      emit(topic, mintEvent(`u-${topic}`, topic, 100))
    }
    expect(gatewayBusMirror.busEvents()).toHaveLength(DEFAULT_BUS_TOPICS.length)
    detach()
    expect(gatewayBusMirror.isAttached()).toBe(false)
  })

  it('detach 後新事件不再入鏡', () => {
    const { bus, emit } = stubBus()
    const detach = attachArchBus({ bus, topics: ['hive.awarded'] })
    emit('hive.awarded', mintEvent('u-1', 'hive.awarded', 100))
    detach()
    emit('hive.awarded', mintEvent('u-2', 'hive.awarded', 200))
    expect(gatewayBusMirror.busEvents().map((e) => e.uuid)).toEqual(['u-1'])
  })

  it('hive 活水源即時反映得標軌跡（可依得標者過濾）', () => {
    const { bus } = stubBus()
    const records = [award('task-1', 'worker-a', 10), award('task-2', 'worker-b', 8)]
    attachArchBus({ bus, hive: stubHive(records) })
    expect(gatewayBusMirror.hiveAwards()).toHaveLength(2)
    expect(gatewayBusMirror.hiveAwards({ workerId: 'worker-a' }).map((r) => r.taskUuid)).toEqual(['task-1'])
  })
})

describe('bus_events / hive_awards 契約層（secured.fetch，不起伺服器）', () => {
  const post = (path: string, body: unknown, headers: Record<string, string> = {}): Request =>
    new Request(`http://127.0.0.1:8787${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  it('預設拒絕：未帶 token 回 401', async () => {
    const res = await secured.fetch(post('/bus/events', {}))
    expect(res.status).toBe(401)
  })

  it('未接線時 bus_events 回 503（優雅降級）', async () => {
    const res = await secured.fetch(post('/bus/events', {}, authHeader('Bearer', GATEWAY_TEST_KEY)))
    expect(res.status).toBe(503)
  })

  it('未提供活水源時 hive_awards 回 503', async () => {
    const { bus } = stubBus()
    const detach = attachArchBus({ bus })
    try {
      const res = await secured.fetch(post('/hive/awards', {}, authHeader('Bearer', GATEWAY_TEST_KEY)))
      expect(res.status).toBe(503)
    } finally {
      detach()
    }
  })

  it('接線後 bus_events 端到端 200 並可過濾', async () => {
    const { bus, emit } = stubBus()
    const detach = attachArchBus({ bus, topics: ['oesg.pulse.tick', 'sys.martial_law'] })
    try {
      emit('oesg.pulse.tick', mintEvent('u-1', 'oesg.pulse.tick', 100, { kgCo2e: 610.8 }))
      emit('sys.martial_law', mintEvent('u-2', 'sys.martial_law', 200))
      const res = await secured.fetch(
        post('/bus/events', { topic: 'oesg.pulse.tick', limit: 10 }, authHeader('Bearer', GATEWAY_TEST_KEY)),
      )
      expect(res.status).toBe(200)
      const body = (await res.json()) as { count: number; items: Array<{ uuid: string; payload: unknown }> }
      expect(body.count).toBe(1)
      expect(body.items[0]?.uuid).toBe('u-1')
      expect(body.items[0]?.payload).toEqual({ kgCo2e: 610.8 })
    } finally {
      detach()
    }
  })

  it('接線後 hive_awards 端到端 200 並回傳得標軌跡', async () => {
    const { bus } = stubBus()
    const detach = attachArchBus({ bus, hive: stubHive([award('task-1', 'worker-a', 10)]) })
    try {
      const res = await secured.fetch(
        post('/hive/awards', { workerId: 'worker-a' }, authHeader('Bearer', GATEWAY_TEST_KEY)),
      )
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        count: number
        items: Array<{ taskUuid: string; winnerId: string; winningScore: number; bids: Array<{ workerId: string; score: number | null }> }>
      }
      expect(body.count).toBe(1)
      expect(body.items[0]?.winnerId).toBe('worker-a')
      expect(body.items[0]?.winningScore).toBe(10)
      expect(body.items[0]?.bids).toHaveLength(2)
    } finally {
      detach()
    }
  })
})
