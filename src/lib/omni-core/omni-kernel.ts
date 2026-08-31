// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniKernel v1.0 — 萬能中心核心引擎
 *
 * 架構：
 * - OmniRegistry: 組件註冊表（UUID 索引）
 * - OmniEventBus: 中心事件總線（Observer Pattern）
 * - OmniLifecycleManager: 生命週期管理器
 * - OmniSyncGateway: 數據一次產生，全域自動對標
 * - OmniCache (L1 In-Memory): 高速快取層
 */

import { createHash, randomBytes } from 'crypto';
import { EntropyForge } from './entropy-forge';
import type {
  IComponentCore,
  LifecycleEvent,
  FiveTScore,
  FiveTStatus,
  FiveTDimension,
} from './types';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: OmniEventBus
// ═══════════════════════════════════════════════════════════════

type OmniHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface OmniEvent<T = unknown> {
  readonly topic: string;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly payload: T;
}

export const OMNI_TOPICS = {
  // Component lifecycle
  COMPONENT_REGISTERED:  'omni:component:registered',
  COMPONENT_UPDATED:     'omni:component:updated',
  COMPONENT_LOCKED:      'omni:component:locked',
  COMPONENT_ARCHIVED:    'omni:component:archived',
  // Note system
  NOTE_CREATED:          'omni:note:created',
  NOTE_UPDATED:          'omni:note:updated',
  TASK_CREATED:          'omni:task:created',
  TASK_COMPLETED:        'omni:task:completed',
  TASK_STATUS_CHANGED:   'omni:task:status_changed',
  // OmniOne SDK
  OMNI_ONE_INITIALIZED:  'omni:one:initialized',
  OMNI_ONE_CASE_ROUTED:  'omni:one:case_routed',
  OMNI_ONE_RESULT:       'omni:one:result',
  OMNI_ONE_LEARNED:      'omni:one:learned',
  // System
  FIVE_T_GATE_PASSED:    'omni:fiveT:gate_passed',
  ENTROPY_REDUCED:       'omni:entropy:reduced',
  SYNC_COMPLETED:        'omni:sync:completed',
} as const;

export type OmniTopic = (typeof OMNI_TOPICS)[keyof typeof OMNI_TOPICS];

class OmniEventBusImpl {
  private readonly handlers = new Map<string, Set<OmniHandler>>();

  publish<T>(topic: string, payload: T): OmniEvent<T> {
    const event: OmniEvent<T> = {
      topic,
      correlationId: `EVT-${randomBytes(6).toString('hex').toUpperCase()}`,
      timestamp: Date.now(),
      payload,
    };
    const h = this.handlers.get(topic);
    if (h) {
      h.forEach(handler => {
        try { handler(event.payload); } catch { /* bus must never throw */ }
      });
    }
    return event;
  }

  subscribe<T>(topic: string, handler: OmniHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler as OmniHandler);
    return () => this.handlers.get(topic)?.delete(handler as OmniHandler);
  }

  clear(topic?: string): void {
    if (topic) { this.handlers.delete(topic); }
    else { this.handlers.clear(); }
  }
}

export const OmniEventBus = new OmniEventBusImpl();

// ═══════════════════════════════════════════════════════════════
// SECTION 2: OmniRegistry — 組件註冊中心
// ═══════════════════════════════════════════════════════════════

interface RegistryEntry {
  readonly component: IComponentCore;
  readonly registeredAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export class OmniRegistry {
  private readonly store = new Map<string, RegistryEntry>();
  private readonly typeIndex = new Map<string, Set<string>>();

  register<T>(component: IComponentCore, type: string = 'generic'): void {
    this.store.set(component.uuid, {
      component: component as IComponentCore,
      registeredAt: Date.now(),
      accessCount: 0,
      lastAccessedAt: Date.now(),
    });
    if (!this.typeIndex.has(type)) this.typeIndex.set(type, new Set());
    this.typeIndex.get(type)!.add(component.uuid);

    OmniEventBus.publish(OMNI_TOPICS.COMPONENT_REGISTERED, {
      uuid: component.uuid,
      type,
      timestamp: Date.now(),
    });
  }

  get(uuid: string): IComponentCore | undefined {
    const entry = this.store.get(uuid);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessedAt = Date.now();
    }
    return entry?.component;
  }

  getByType(type: string): IComponentCore[] {
    const uuids = this.typeIndex.get(type);
    if (!uuids) return [];
    return Array.from(uuids).map(id => this.store.get(id)?.component).filter(Boolean) as IComponentCore[];
  }

  all(): IComponentCore[] {
    return Array.from(this.store.values()).map(e => e.component);
  }

  count(): number {
    return this.store.size;
  }

  getMetrics(): { total: number; byType: Record<string, number>; avgAccessCount: number } {
    const byType: Record<string, number> = {};
    this.typeIndex.forEach((uuids, type) => { byType[type] = uuids.size; });
    const entries = Array.from(this.store.values());
    const avgAccess = entries.length > 0
      ? entries.reduce((s, e) => s + e.accessCount, 0) / entries.length
      : 0;
    return { total: this.store.size, byType, avgAccessCount: avgAccess };
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: OmniLifecycleManager
// ═══════════════════════════════════════════════════════════════

export class OmniLifecycleManager {
  private readonly lifecycles = new Map<string, LifecycleEvent[]>();

  record(uuid: string, event: LifecycleEvent, _actor?: string): void {
    if (!this.lifecycles.has(uuid)) this.lifecycles.set(uuid, []);
    this.lifecycles.get(uuid)!.push(event);
  }

  getHistory(uuid: string): LifecycleEvent[] {
    return [...(this.lifecycles.get(uuid) || [])];
  }

  isLocked(uuid: string): boolean {
    const history = this.lifecycles.get(uuid) || [];
    return history.includes('locked');
  }

  isArchived(uuid: string): boolean {
    const history = this.lifecycles.get(uuid) || [];
    return history.includes('archived');
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: OmniCache — L1 In-Memory 快取
// ═══════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class OmniCache {
  private readonly l1 = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.l1.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      hits: 0,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.l1.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.l1.delete(key);
      return undefined;
    }
    entry.hits++;
    return entry.value;
  }

  delete(key: string): boolean {
    return this.l1.delete(key);
  }

  clear(): void {
    this.l1.clear();
  }

  /** Evict expired entries */
  evict(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [k, v] of this.l1) {
      if (now > v.expiresAt) { this.l1.delete(k); evicted++; }
    }
    return evicted;
  }

  getMetrics(): { size: number; hitRate: number } {
    const entries = Array.from(this.l1.values());
    const totalHits = entries.reduce((s, e) => s + e.hits, 0);
    const hitRate = entries.length > 0 ? totalHits / entries.length : 0;
    return { size: this.l1.size, hitRate };
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: OmniSyncGateway — 萬能圓通邏輯門
// 數據一次產生，全域自動對標
// ═══════════════════════════════════════════════════════════════

type SyncTarget = 'omni-note' | 'omni-calendar' | 'omni-task' | 'omni-todo' | 'esg-report';

interface SyncRecord {
  readonly source: string;
  readonly targets: SyncTarget[];
  readonly syncedAt: number;
  readonly hash: string;
}

export class OmniSyncGateway {
  private readonly syncLog: SyncRecord[] = [];

  sync(sourceId: string, data: unknown, targets: SyncTarget[]): SyncRecord {
    const purifiedDataStr = EntropyForge.purify(JSON.stringify(data));
    const hash = createHash('sha256').update(purifiedDataStr).digest('hex').slice(0, 16);
    const record: SyncRecord = Object.freeze({
      source: sourceId,
      targets,
      syncedAt: Date.now(),
      hash,
    });
    this.syncLog.push(record);
    OmniEventBus.publish(OMNI_TOPICS.SYNC_COMPLETED, {
      sourceId,
      targets,
      hash,
      timestamp: record.syncedAt,
    });
    return record;
  }

  getLog(): SyncRecord[] {
    return [...this.syncLog];
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: FiveTGatekeeper
// ═══════════════════════════════════════════════════════════════

export class FiveTGatekeeper {
  /** Compute pass/fail status from scores (threshold=0.7) */
  static evaluate(score: FiveTScore, threshold: number = 0.7): FiveTStatus {
    return {
      traceable:   score.traceable   >= threshold,
      transparent: score.transparent >= threshold,
      tangible:    score.tangible    >= threshold,
      trustworthy: score.trustworthy >= threshold,
      trackable:   score.trackable   >= threshold,
    };
  }

  /** Count how many dimensions pass */
  static passCount(status: FiveTStatus): number {
    return Object.values(status).filter(Boolean).length;
  }

  /** Check if ALL 5 dimensions pass (fully compliant) */
  static allPass(status: FiveTStatus): boolean {
    return Object.values(status).every(Boolean);
  }

  /** Dimension that needs most improvement */
  static weakestDimension(score: FiveTScore): FiveTDimension {
    const entries = Object.entries(score) as [FiveTDimension, number][];
    return entries.sort((a, b) => a[1] - b[1])[0][0];
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: OmniKernel — 同心圓核心（組合所有子系統）
// ═══════════════════════════════════════════════════════════════

import { agnesApi } from '@/lib/agnes-api';

export class OmniKernel {
  readonly registry: OmniRegistry;
  readonly lifecycle: OmniLifecycleManager;
  readonly cache: OmniCache;
  readonly sync: OmniSyncGateway;
  readonly eventBus: typeof OmniEventBus;
  private _initialized = false;
  private _agnesMetrics: Record<string, unknown> | null = null;

  constructor() {
    this.registry = new OmniRegistry();
    this.lifecycle = new OmniLifecycleManager();
    this.cache = new OmniCache();
    this.sync = new OmniSyncGateway();
    this.eventBus = OmniEventBus;
  }

  initialize(): void {
    if (this._initialized) return;
    // Start cache eviction every 60s
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cache.evict(), 60_000);
      setInterval(async () => {
        try {
          const res = await agnesApi.getMetrics();
          if (res.success) this._agnesMetrics = res.data;
        } catch (e) {
          console.warn('[OmniKernel] Failed to fetch AGNES metrics', e);
        }
      }, 60_000);
    }
    this._initialized = true;
  }

  getSystemStatus(): {
    registryCount: number;
    cacheMetrics: { size: number; hitRate: number };
    syncLogCount: number;
    initialized: boolean;
    agnesStatus: Record<string, unknown>;
  } {
    return {
      registryCount: this.registry.count(),
      cacheMetrics: this.cache.getMetrics(),
      syncLogCount: this.sync.getLog().length,
      initialized: this._initialized,
      agnesStatus: this._agnesMetrics || { activeNodes: 0, throughput: '0 req/s' },
    };
  }
}

/** Singleton kernel instance.
 *  Cached on globalThis so the instrumentation hook and API route handlers
 *  (which Next.js may compile into separate module scopes) share ONE instance.
 *  Without this, initializing in instrumentation doesn't affect the route's
 *  copy, and `initialized` / registry / cache state diverges per bundle. */
const globalForOmniKernel = globalThis as unknown as { omniKernel?: OmniKernel };
export const omniKernel: OmniKernel =
  globalForOmniKernel.omniKernel ?? (globalForOmniKernel.omniKernel = new OmniKernel());
