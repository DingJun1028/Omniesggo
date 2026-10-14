// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * knowledge-base-registry.ts — 萬能知識庫註冊中心
 *
 * 5T 對應:
 * - Traceable: source_origin / uuid / version 標記數據源頭
 * - Trackable: lifecycle hooks 記錄知識庫流轉
 * - Tangible: 知識庫可查詢 (OmniRegistry 索引)
 * - Transparent: 架構文件公開透明
 * - Trustworthy: hash_lock 封存後鎖定
 *
 * 設計:
 *   基於 OmniKernel (OmniRegistry + OmniEventBus + OmniCache)
 *   提供知識庫生命週期: create → register → sync → seal → verify
 */

import { createHash, randomBytes } from 'crypto';
import { EntropyForge } from './entropy-forge';
import {
  OmniEventBus,
  OMNI_TOPICS,
  OmniRegistry,
  OmniCache,
  OmniSyncGateway,
} from './omni-kernel';
import type {
  IComponentCore,
} from './types';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Types
// ═══════════════════════════════════════════════════════════════

export type KnowledgeBaseStatus = 'draft' | 'active' | 'archived' | 'sealed';
export type KnowledgeStorage = 'obsidian' | 'filesystem' | 'tencentdb' | 'gbrain';
export type KnowledgeTargetType = 'obsidian' | 'filesystem' | 'filesystem-git' | 'tencentdb';
export type KnowledgeEvidenceKind = 'traceable' | 'trackable' | 'tangible' | 'transparent' | 'trustworthy';
export type KnowledgeEvidenceStandard = '5T-PROOF' | 'ISO-14064-1' | 'Formal-Proof';

export interface KnowledgeEvidence {
  readonly hash: string;
  readonly verifiedBy: string;
  readonly standard: KnowledgeEvidenceStandard;
  readonly payload: Record<string, unknown>;
  readonly kind: KnowledgeEvidenceKind;
  readonly timestamp: number;
}

export interface KnowledgeBaseMeta {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly name: string;
  readonly description: string;
  readonly status: KnowledgeBaseStatus;
  readonly locked: boolean;
  readonly sealedAt?: number;
  readonly evidence: readonly KnowledgeEvidence[];
  readonly tags: readonly string[];
}

export interface KnowledgeSource {
  readonly uuid: string;
  readonly name: string;
  readonly storage: KnowledgeStorage;
  readonly path: string;
  readonly source_origin: string;
  readonly version: string;
  readonly status: 'synced' | 'active' | 'sealed';
  readonly sealedAt?: number;
  readonly evidence: readonly KnowledgeEvidence[];
  readonly tags: readonly string[];
}

export interface DeploymentTarget {
  readonly uuid: string;
  readonly type: KnowledgeTargetType;
  readonly path: string;
  readonly status: 'synced' | 'active' | 'sealed';
  readonly sealedAt?: number;
  readonly evidence: readonly KnowledgeEvidence[];
}

export interface KnowledgeRegistry {
  readonly base: KnowledgeBaseMeta;
  readonly sources: readonly KnowledgeSource[];
  readonly deploymentTargets: readonly DeploymentTarget[];
  readonly lifecycle: readonly KnowledgeLifecycleEvent[];
}

export interface KnowledgeLifecycleEvent {
  readonly event: 'store' | 'recall' | 'link' | 'seal' | 'verify' | 'sync';
  readonly timestamp: number;
  readonly details: Record<string, unknown>;
}

export interface SealedKnowledgeBase extends KnowledgeBaseMeta {
  readonly hashLock: string;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Factory Functions
// ═══════════════════════════════════════════════════════════════

/**
 * 建立新知識庫心核
 * 5T Traceable: source_origin 標記數據源頭
 */
export function createKnowledgeBase(
  name: string,
  description: string,
  source_origin: string,
  version: string = '1.0.0',
): KnowledgeBaseMeta {
  const uuid = `KB-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const timestamp = Date.now();

  return Object.freeze({
    uuid,
    version,
    timestamp,
    source_origin: EntropyForge.purify(source_origin),
    name: EntropyForge.purify(name),
    description: EntropyForge.purify(description),
    status: 'draft' as KnowledgeBaseStatus,
    locked: false,
    evidence: Object.freeze([]) as readonly KnowledgeEvidence[],
    tags: Object.freeze(['knowledge-base', 'omni-one', 'OA-Team-30']) as readonly string[],
  });
}

/**
 * 建立知識庫來源註冊
 * 5T Traceable: path 哈希記錄
 */
export function createKnowledgeSource(
  name: string,
  storage: KnowledgeStorage,
  path: string,
  source_origin: string,
  version: string = '1.0.0',
): KnowledgeSource {
  const uuid = `KS-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const hash = createHash('sha256').update(path).digest('hex');

  return Object.freeze({
    uuid,
    name: EntropyForge.purify(name),
    storage,
    path,
    source_origin: EntropyForge.purify(source_origin),
    version,
    status: 'synced' as const,
    evidence: Object.freeze([{
      hash,
      verifiedBy: 'knowledge-base-registry@1.0.0',
      standard: '5T-PROOF' as const,
      payload: { source: path },
      kind: 'traceable' as const,
      timestamp: Date.now(),
    }]) as readonly KnowledgeEvidence[],
    tags: Object.freeze(['source', storage, 'OA-Team-30']) as readonly string[],
  });
}

/**
 * 建立部署目標註冊
 * 5T Trustworthy: path 哈希記錄
 */
export function createDeploymentTarget(
  type: KnowledgeTargetType,
  path: string,
  evidence: KnowledgeEvidence[] = [],
): DeploymentTarget {
  const uuid = `DT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const hash = createHash('sha256').update(path).digest('hex');

  return Object.freeze({
    uuid,
    type,
    path,
    status: 'synced' as const,
    evidence: Object.freeze([{
      hash,
      verifiedBy: 'knowledge-base-registry@1.0.0',
      standard: '5T-PROOF' as const,
      payload: { target: path },
      kind: 'trustworthy' as const,
      timestamp: Date.now(),
    }, ...evidence]) as readonly KnowledgeEvidence[],
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: KnowledgeBaseRegistry — 知識庫註冊中心
// ═══════════════════════════════════════════════════════════════

export class KnowledgeBaseRegistry {
  private readonly registry: OmniRegistry;
  private readonly cache: OmniCache;
  private readonly sync: OmniSyncGateway;
  private readonly bases = new Map<string, KnowledgeBaseMeta>();
  private readonly sources = new Map<string, KnowledgeSource>();
  private readonly targets = new Map<string, DeploymentTarget>();
  private readonly lifecycleLog: KnowledgeLifecycleEvent[] = [];

  constructor() {
    this.registry = new OmniRegistry();
    this.cache = new OmniCache(10 * 60 * 1000); // 10 min TTL
    this.sync = new OmniSyncGateway();
  }

  /**
   * 註冊知識庫
   * 5T Trackable: 記錄生命週期事件
   */
  register(kb: KnowledgeBaseMeta): void {
    const registered: KnowledgeBaseMeta = Object.freeze({
      ...kb,
      status: 'active',
    });
    this.bases.set(kb.uuid, registered);

    // Register into OmniRegistry for type-indexed lookup
    this.registry.register(registered as unknown as IComponentCore, 'knowledge-base');

    this.recordEvent('store', {
      uuid: kb.uuid,
      name: kb.name,
      source_origin: kb.source_origin,
      version: kb.version,
    });

    OmniEventBus.publish(OMNI_TOPICS.KB_REGISTERED, {
      uuid: kb.uuid,
      type: 'knowledge-base',
      timestamp: Date.now(),
    });
  }

  /**
   * 取得知識庫
   * 5T Tangible: 可查詢
   */
  get(uuid: string): KnowledgeBaseMeta | undefined {
    const cached = this.cache.get<KnowledgeBaseMeta>(`kb:${uuid}`);
    if (cached) return cached;

    const kb = this.bases.get(uuid);
    if (kb) {
      this.cache.set(`kb:${uuid}`, kb);
    }
    return kb;
  }

  /**
   * 取得所有知識庫
   */
  getAll(): KnowledgeBaseMeta[] {
    return Array.from(this.bases.values());
  }

  /**
   * 加入知識庫來源
   */
  addSource(kbUuid: string, source: KnowledgeSource): void {
    this.sources.set(`${kbUuid}:${source.uuid}`, source);
    this.recordEvent('sync', {
      kbUuid,
      sourceUuid: source.uuid,
      sourcePath: source.path,
      storage: source.storage,
    });
  }

  /**
   * 加入部署目標
   */
  addTarget(kbUuid: string, target: DeploymentTarget): void {
    this.targets.set(`${kbUuid}:${target.uuid}`, target);
    this.recordEvent('sync', {
      kbUuid,
      targetUuid: target.uuid,
      targetPath: target.path,
      type: target.type,
    });
  }

  /**
   * 取得知識庫完整註冊資訊
   */
  getRegistry(kbUuid: string): KnowledgeRegistry | undefined {
    const base = this.bases.get(kbUuid);
    if (!base) return undefined;

    const sources = Array.from(this.sources.entries())
      .filter(([key]) => key.startsWith(`${kbUuid}:`))
      .map(([, v]) => v);

    const targets = Array.from(this.targets.entries())
      .filter(([key]) => key.startsWith(`${kbUuid}:`))
      .map(([, v]) => v);

    return Object.freeze({
      base,
      sources: Object.freeze(sources) as readonly KnowledgeSource[],
      deploymentTargets: Object.freeze(targets) as readonly DeploymentTarget[],
      lifecycle: Object.freeze([...this.lifecycleLog]) as readonly KnowledgeLifecycleEvent[],
    });
  }

  /**
   * 記錄生命週期事件
   * 5T Trackable
   */
  private recordEvent(event: KnowledgeLifecycleEvent['event'], details: Record<string, unknown>): void {
    this.lifecycleLog.push(Object.freeze({
      event,
      timestamp: Date.now(),
      details: Object.freeze(details),
    }));
  }

  /**
   * 取得生命週期歷史
   */
  getLifecycle(): readonly KnowledgeLifecycleEvent[] {
    return Object.freeze([...this.lifecycleLog]);
  }

  /**
   * 知識庫同步至全域
   * 5T Trackable: 通過 OmniSyncGateway 記錄
   */
  syncToAll(kbUuid: string, data: unknown): void {
    this.sync.sync(kbUuid, data, ['omni-note']);
    this.recordEvent('sync', {
      kbUuid,
      action: 'sync-to-all',
      timestamp: Date.now(),
    });
  }

  /**
   * 取得系統狀態
   */
  getMetrics(): {
    totalBases: number;
    totalSources: number;
    totalTargets: number;
    lifecycleCount: number;
  } {
    return {
      totalBases: this.bases.size,
      totalSources: this.sources.size,
      totalTargets: this.targets.size,
      lifecycleCount: this.lifecycleLog.length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Seal & Verify (Hash Lock + Object.freeze())
// ═══════════════════════════════════════════════════════════════

/**
 * 封存知識庫 (Hash Lock + Object.freeze())
 * 5T Trustworthy: 不可篡改
 */
export function sealKnowledgeBase(kb: KnowledgeBaseMeta): SealedKnowledgeBase {
  const payload = JSON.stringify({
    uuid: kb.uuid,
    version: kb.version,
    timestamp: kb.timestamp,
    source_origin: kb.source_origin,
    name: kb.name,
    description: kb.description,
    tags: kb.tags,
  });

  const hashLock = createHash('sha256').update(payload).digest('hex');

  const sealed: SealedKnowledgeBase = Object.freeze({
    ...kb,
    status: 'sealed' as const,
    locked: true,
    sealedAt: Date.now(),
    hashLock,
    evidence: Object.freeze([...kb.evidence, {
      hash: hashLock,
      verifiedBy: 'knowledge-base-registry@1.0.0',
      standard: '5T-PROOF' as const,
      payload: { lockedAt: new Date().toISOString(), version: kb.version },
      kind: 'trustworthy' as const,
      timestamp: Date.now(),
    }]) as readonly KnowledgeEvidence[],
  });

  OmniEventBus.publish(OMNI_TOPICS.KB_SEALED, {
    uuid: kb.uuid,
    type: 'knowledge-base',
    hashLock,
    timestamp: Date.now(),
  });

  return sealed;
}

/**
 * 驗證知識庫是否保持不可篡改
 * 5T Trustworthy: Hash 重算驗證
 */
export function verifyKnowledgeBase(kb: SealedKnowledgeBase): boolean {
  if (!Object.isFrozen(kb) || !kb.locked) {
    return false;
  }

  const sealEvidence = kb.evidence.find(e => e.kind === 'trustworthy' && e.standard === '5T-PROOF');
  if (!sealEvidence) {
    return false;
  }

  const payload = JSON.stringify({
    uuid: kb.uuid,
    version: kb.version,
    timestamp: kb.timestamp,
    source_origin: kb.source_origin,
    name: kb.name,
    description: kb.description,
    tags: kb.tags,
  });

  const recomputed = createHash('sha256').update(payload).digest('hex');
  return recomputed === sealEvidence.hash;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Singleton Instance
// ═══════════════════════════════════════════════════════════════

const globalForKBRegistry = globalThis as unknown as { kbRegistry?: KnowledgeBaseRegistry };
export const knowledgeBaseRegistry: KnowledgeBaseRegistry =
  globalForKBRegistry.kbRegistry ?? (globalForKBRegistry.kbRegistry = new KnowledgeBaseRegistry());
