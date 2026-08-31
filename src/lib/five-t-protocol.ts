// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * src/lib/five-t-protocol.ts — 5T 協議完整實作
 *
 * 五大維度：
 *   T1 Traceable   — 數據溯源追蹤
 *   T2 Transparent — 演算法公開可驗算
 *   T3 Tangible    — 抽象願景具體化
 *   T4 Trustworthy — Hash Lock 不可篡改
 *   T5 Trackable   — 生命週期即時記錄
 */

import { createHash } from 'crypto';

// ── Types ─────────────────────────────────────────────────────

export type FiveTDimension = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

export interface FiveTScore {
  traceable: number;    // 0.0 – 1.0
  transparent: number;
  tangible: number;
  trustworthy: number;
  trackable: number;
}

export interface FiveTStatus {
  traceable: boolean;
  transparent: boolean;
  tangible: boolean;
  trustworthy: boolean;
  trackable: boolean;
}

export interface FiveTMetadata {
  zh: string;
  en: string;
  symbol: string;
  color: string;
  description: string;
}

export interface FiveTEvent {
  dimension: FiveTDimension;
  action: string;
  timestamp: number;
  data: Record<string, unknown>;
  hash: string;
}

export interface FiveTAuditTrail {
  entityId: string;
  entityType: string;
  events: FiveTEvent[];
  currentScore: FiveTScore;
  currentStatus: FiveTStatus;
  lastUpdated: string;
}

// ── Constants ─────────────────────────────────────────────────

export const FIVE_T_META: Record<FiveTDimension, FiveTMetadata> = {
  traceable: {
    zh: '真',
    en: 'Traceable',
    symbol: 'T¹',
    color: '#3B82F6',
    description: '數據溯源追蹤 — 所有數據來源可追溯，記錄完整生命週期',
  },
  transparent: {
    zh: '善',
    en: 'Transparent',
    symbol: 'T²',
    color: '#22C55E',
    description: '演算法公開可驗算 — 計算邏輯透明，結果可獨立驗證',
  },
  tangible: {
    zh: '美',
    en: 'Tangible',
    symbol: 'T³',
    color: '#F59E0B',
    description: '抽象願景具體化 — 將永續目標轉化為可衡量指標',
  },
  trustworthy: {
    zh: '信',
    en: 'Trustworthy',
    symbol: 'T⁴',
    color: '#8B5CF6',
    description: 'Hash Lock 不可篡改 — 數據完整性密碼學保障',
  },
  trackable: {
    zh: '通',
    en: 'Trackable',
    symbol: 'T⁵',
    color: '#06B6D4',
    description: '生命週期即時記錄 — 即時監控與歷史追溯',
  },
};

export const FIVE_T_DIMENSIONS: FiveTDimension[] = [
  'traceable',
  'transparent',
  'tangible',
  'trustworthy',
  'trackable',
];

export const DEFAULT_THRESHOLD = 0.7;

// ── Gatekeeper ────────────────────────────────────────────────

export class FiveTGatekeeper {
  /**
   * 評估 5T 狀態 — 所有維度是否通過門檻
   */
  static evaluate(score: FiveTScore, threshold: number = DEFAULT_THRESHOLD): FiveTStatus {
    return {
      traceable: score.traceable >= threshold,
      transparent: score.transparent >= threshold,
      tangible: score.tangible >= threshold,
      trustworthy: score.trustworthy >= threshold,
      trackable: score.trackable >= threshold,
    };
  }

  /**
   * 計算通過的維度數量
   */
  static passCount(status: FiveTStatus): number {
    return Object.values(status).filter(Boolean).length;
  }

  /**
   * 所有維度是否全部通過
   */
  static allPass(status: FiveTStatus): boolean {
    return Object.values(status).every(Boolean);
  }

  /**
   * 找出最弱維度
   */
  static weakestDimension(score: FiveTScore): FiveTDimension {
    const entries = Object.entries(score) as [FiveTDimension, number][];
    return entries.reduce((weakest, [dim, val]) =>
      val < score[weakest] ? dim : weakest,
      entries[0][0]
    );
  }

  /**
   * 計算綜合分數（加權平均）
   */
  static compositeScore(score: FiveTScore, weights?: Partial<Record<FiveTDimension, number>>): number {
    const defaultWeights: Record<FiveTDimension, number> = {
      traceable: 0.2,
      transparent: 0.2,
      tangible: 0.2,
      trustworthy: 0.25,
      trackable: 0.15,
    };
    const w = { ...defaultWeights, ...weights };
    const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);

    return FIVE_T_DIMENSIONS.reduce((sum, dim) => {
      return sum + (score[dim] * (w[dim] / totalWeight));
    }, 0);
  }
}

// ── Hash Lock ─────────────────────────────────────────────────

export class FiveTHashLock {
  /**
   * 生成 Trustworthy Hash Lock
   * 結合 source + content + timestamp 確保不可篡改
   */
  static generate(source: string, content: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const payload = `${source}|${content}|${ts}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * 驗證 Hash Lock
   * 若提供 timestamp（由 generate 回傳），直接精確比對；
   * 否則在 toleranceMs 時間窗內逐毫秒嘗試，確保任何在窗內建立的鎖皆可驗證。
   */
  static verify(
    source: string,
    content: string,
    hash: string,
    toleranceMs: number = 5000,
    timestamp?: number
  ): boolean {
    // 精確時間戳優先（避免依賴取樣步進造成的驗證窗口缺口）
    if (timestamp !== undefined && this.generate(source, content, timestamp) === hash) {
      return true;
    }

    const now = Date.now();
    // Check within tolerance window (step = 1ms so the window is fully covered)
    for (let offset = 0; offset <= toleranceMs; offset += 1) {
      const testHash = this.generate(source, content, now - offset);
      if (testHash === hash) return true;
    }
    return false;
  }

  /**
   * 生成 Trinity Hash — 結合多個元素
   */
  static trinityHash(...elements: string[]): string {
    const combined = elements.join('||');
    const hash = createHash('sha256').update(combined).digest('hex');
    return '0x' + hash.substring(0, 32);
  }

  // Verifies that `hashLock` matches the deterministic trinity hash of
  // (data, salt). Pairs with `trinityHash` so a client that produced the
  // lock via `trinityHash(data, salt)` can validate it.
  static verifyTrinity(data: string, salt: string, hashLock: string): boolean {
    return this.trinityHash(data, salt) === hashLock;
  }
}

// ── Traceable ─────────────────────────────────────────────────

export class FiveTTraceable {
  private static _provenance: Map<string, Array<{ source: string; timestamp: number; metadata?: Record<string, unknown> }>> = new Map();

  /**
   * 記錄數據來源
   */
  static recordSource(entityId: string, source: string, metadata?: Record<string, unknown>): void {
    const existing = this._provenance.get(entityId) || [];
    existing.push({ source, timestamp: Date.now(), metadata });
    this._provenance.set(entityId, existing);
  }

  /**
   * 取得數據溯源鏈
   */
  static getProvenance(entityId: string): Array<{ source: string; timestamp: number; metadata?: Record<string, unknown> }> {
    return this._provenance.get(entityId) || [];
  }

  /**
   * 驗證數據溯源完整性
   */
  static verifyProvenance(entityId: string): boolean {
    const chain = this._provenance.get(entityId);
    if (!chain || chain.length === 0) return false;

    // Verify timestamps are monotonically increasing
    for (let i = 1; i < chain.length; i++) {
      if (chain[i].timestamp < chain[i - 1].timestamp) return false;
    }
    return true;
  }
}

// ── Transparent ───────────────────────────────────────────────

export class FiveTTransparent {
  private static _algorithms: Map<string, { description: string; parameters: Record<string, unknown>; hash: string }> = new Map();

  /**
   * 註冊演算法（公開可驗算）
   */
  static registerAlgorithm(name: string, description: string, parameters: Record<string, unknown>): void {
    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
    const hash = createHash('sha256').update(paramStr).digest('hex');
    this._algorithms.set(name, { description, parameters, hash });
  }

  /**
   * 取得演算法資訊
   */
  static getAlgorithm(name: string) {
    return this._algorithms.get(name);
  }

  /**
   * 驗證演算法一致性
   */
  static verifyAlgorithm(name: string, parameters: Record<string, unknown>): boolean {
    const algo = this._algorithms.get(name);
    if (!algo) return false;

    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
    const hash = createHash('sha256').update(paramStr).digest('hex');
    return hash === algo.hash;
  }

  /**
   * 列出所有已註冊演算法
   */
  static listAlgorithms(): Array<{ name: string; description: string; hash: string }> {
    return Array.from(this._algorithms.entries()).map(([name, algo]) => ({
      name,
      description: algo.description,
      hash: algo.hash,
    }));
  }
}

// ── Tangible ──────────────────────────────────────────────────

export class FiveTTangible {
  private static _metrics: Map<string, { target: number; current: number; unit: string }> = new Map();

  /**
   * 註冊具體指標
   */
  static registerMetric(name: string, target: number, unit: string, current: number = 0): void {
    this._metrics.set(name, { target, current, unit });
  }

  /**
   * 更新指標
   */
  static updateMetric(name: string, current: number): void {
    const metric = this._metrics.get(name);
    if (metric) {
      metric.current = current;
    }
  }

  /**
   * 計算指標完成度
   */
  static getProgress(name: string): number {
    const metric = this._metrics.get(name);
    if (!metric || metric.target === 0) return 0;
    return Math.min(1, metric.current / metric.target);
  }

  /**
   * 取得所有指標摘要
   */
  static getSummary(): Array<{ name: string; current: number; target: number; unit: string; progress: number }> {
    return Array.from(this._metrics.entries()).map(([name, metric]) => ({
      name,
      current: metric.current,
      target: metric.target,
      unit: metric.unit,
      progress: metric.target === 0 ? 0 : Math.min(1, metric.current / metric.target),
    }));
  }
}

// ── Trackable ─────────────────────────────────────────────────

export class FiveTTrackable {
  private static _lifecycle: Map<string, Array<{ event: string; timestamp: number; data?: Record<string, unknown> }>> = new Map();

  /**
   * 記錄生命週期事件
   */
  static recordEvent(entityId: string, event: string, data?: Record<string, unknown>): void {
    const existing = this._lifecycle.get(entityId) || [];
    existing.push({ event, timestamp: Date.now(), data });
    this._lifecycle.set(entityId, existing);
  }

  /**
   * 取得生命週期記錄
   */
  static getLifecycle(entityId: string): Array<{ event: string; timestamp: number; data?: Record<string, unknown> }> {
    return this._lifecycle.get(entityId) || [];
  }

  /**
   * 計算生命週期時長
   */
  static getDuration(entityId: string): number | null {
    const events = this._lifecycle.get(entityId);
    if (!events || events.length < 2) return null;
    return events[events.length - 1].timestamp - events[0].timestamp;
  }
}

// ── Utility Functions ─────────────────────────────────────────

/**
 * 計算 5T 分數
 */
export function calculateFiveTScore(data: {
  sources?: string[];
  algorithmVerified?: boolean;
  metricsProgress?: number;
  hashLocked?: boolean;
  eventsCount?: number;
}): FiveTScore {
  return {
    traceable: data.sources ? Math.min(1, data.sources.length * 0.25) : 0.5,
    transparent: data.algorithmVerified ? 1.0 : 0.3,
    tangible: data.metricsProgress ?? 0.5,
    trustworthy: data.hashLocked ? 1.0 : 0.2,
    trackable: data.eventsCount ? Math.min(1, data.eventsCount * 0.2) : 0.3,
  };
}

/**
 * 產生 5T 報告
 */
export function generateFiveTReport(score: FiveTScore): string {
  const status = FiveTGatekeeper.evaluate(score);
  const passCount = FiveTGatekeeper.passCount(status);
  const composite = FiveTGatekeeper.compositeScore(score);

  let report = `# 5T 協議報告\n\n`;
  report += `## 綜合評分: ${(composite * 100).toFixed(1)}%\n`;
  report += `## 通過維度: ${passCount}/5\n\n`;

  report += `| 維度 | 分數 | 狀態 |\n`;
  report += `|------|------|------|\n`;

  for (const dim of FIVE_T_DIMENSIONS) {
    const meta = FIVE_T_META[dim];
    const passed = status[dim];
    report += `| ${meta.symbol} ${meta.zh} ${meta.en} | ${(score[dim] * 100).toFixed(0)}% | ${passed ? '✅' : '❌'} |\n`;
  }

  if (passCount < 5) {
    const weakest = FiveTGatekeeper.weakestDimension(score);
    report += `\n## 建議改善: ${FIVE_T_META[weakest].zh} (${FIVE_T_META[weakest].en})\n`;
    report += `${FIVE_T_META[weakest].description}\n`;
  }

  return report;
}

// ── §20.5 OmniTag 契約閘（5T 驗算陣列 25-30 接線） ──────────
// 零侵入掛接 src/lib/omnitag-contract.ts，產物誕生/變更即過契約閘。
// 用相對 import 避免 @/ alias 在 core tsconfig 解析爭議（參見 universal-tag-service.ts 註解）。
import {
  verifyOmniTagContract,
  routeOmniTag,
  type OmniTagSet,
  type ContractCheck,
} from './omnitag-contract';

export class OmniTagContractViolation extends Error {
  constructor(public readonly check: ContractCheck) {
    super(`§20.5 OmniTag 契約違規: ${check.violations.join('; ')}`);
    this.name = 'OmniTagContractViolation';
  }
}

// ── §20.6 契約持久化抽象層（對齊 oa-cli OmniTagRegistry 同構）──
// src/lib 跨瀏覽器/Node 環境，禁止硬依賴 node:fs（會炸 Vite 建置）。
// 定義 ArtifactStore 介面 + 預設 MemoryArtifactStore（零依賴）。
// Node 環境可透過 FiveTOmniTagGate.setStore() 注入檔案版（見 omnitag-registry-file.ts）。

export interface PersistedArtifact {
  entityId: string;
  tag: OmniTagSet;
  content?: string;
  hashLock: string;
  sealedAt: number;
  sourceOrigin: string;
}

export interface ArtifactStore {
  write(record: PersistedArtifact): void;
  read(entityId: string): PersistedArtifact | null;
  list(): PersistedArtifact[];
}

/** 預設記憶體儲存：零依賴，供瀏覽器/測試使用。 */
export class MemoryArtifactStore implements ArtifactStore {
  private _map = new Map<string, PersistedArtifact>();

  write(record: PersistedArtifact): void {
    this._map.set(record.entityId, record);
  }

  read(entityId: string): PersistedArtifact | null {
    return this._map.get(entityId) ?? null;
  }

  list(): PersistedArtifact[] {
    return [...this._map.values()];
  }
}

/**
 * FiveTOmniTagGate — 產物誕生/變更時的自動契約閘。
 * 對齊 §18 5T 驗證閘 + §20.5 五規則 + §20.4 自動路由，預設即合規（§6.2）。
 */
export class FiveTOmniTagGate {
  private static _sealedArtifacts = new Set<string>();
  private static _store: ArtifactStore = new MemoryArtifactStore();

  /** 注入持久化後端（Node 環境用檔案版，瀏覽器用預設記憶體）。 */
  static setStore(store: ArtifactStore): void {
    this._store = store;
  }

  static getStore(): ArtifactStore {
    return this._store;
  }

  /**
   * 產物誕生：通過 5T 評分 + OmniTag 契約閘 + 自動路由後才放行。
   * @throws OmniTagContractViolation 契約不合規時
   */
  static emitArtifact(params: {
    entityId: string;
    tag: OmniTagSet;
    ctx?: Parameters<typeof verifyOmniTagContract>[1];
  }): { entityId: string; contract: ContractCheck; route: ReturnType<typeof routeOmniTag> } {
    const check = verifyOmniTagContract(params.tag, params.ctx);
    if (!check.valid) {
      throw new OmniTagContractViolation(check);
    }
    const route = routeOmniTag(params.tag);
    FiveTTrackable.recordEvent(params.entityId, 'omnitag:sealed', {
      tag: params.tag,
      routeKey: route.target?.routeKey,
      source_origin: `agent:${params.tag.agent ?? '??'}`,
    });
    if (!route.consistent) {
      FiveTTrackable.recordEvent(params.entityId, 'omnitag:route-warn', {
        agent: params.tag.agent,
        squad: params.tag.squad,
      });
    }
    return { entityId: params.entityId, contract: check, route };
  }

  /**
   * §20.6 寫入即凍結：過閘後將產物持久化到 store。
   * 對齊 oa-cli OmniTagRegistry.persistArtifact 語意。
   * @throws OmniTagContractViolation 契約不合規
   * @throws Error frozen+restricted 實體已存在（H4 不可改）
   */
  static persistArtifact(params: {
    entityId: string;
    tag: OmniTagSet;
    content?: string;
    ctx?: Parameters<typeof verifyOmniTagContract>[1];
  }): PersistedArtifact {
    // 1. 過閘
    this.emitArtifact(params);

    // 2. 凍結不可改：若已存在 frozen+restricted 實體，拒絕
    const existing = this._store.read(params.entityId);
    if (existing) {
      const isSealed =
        existing.tag.lifecycle === 'frozen' && existing.tag.security === 'restricted';
      if (isSealed) {
        throw new Error(
          `H4 frozen: entity ${params.entityId} is sealed (frozen+restricted) — immutable`,
        );
      }
    }

    // 3. 寫入即凍結（含 Hash Lock，對齊 §18 FiveTHashLock 同構）
    const sealedAt = Date.now();
    const hashLock = FiveTHashLock.generate(
      params.tag.agent ?? 'unknown',
      params.content ?? JSON.stringify(params.tag),
      sealedAt,
    );
    const record: PersistedArtifact = {
      entityId: params.entityId,
      tag: params.tag,
      content: params.content,
      hashLock,
      sealedAt,
      sourceOrigin: `agent:${params.tag.agent ?? 'unknown'}`,
    };
    this._store.write(record);
    return record;
  }

  /** 讀取持久化實體 */
  static getPersisted(entityId: string): PersistedArtifact | null {
    return this._store.read(entityId);
  }

  /**
   * §5 Trustworthy 篡改驗證：重算 hashLock 比對寫入後是否未被改動。
   */
  static verifyPersisted(entityId: string): {
    exists: boolean;
    tampered: boolean;
    record?: PersistedArtifact;
  } {
    const rec = this._store.read(entityId);
    if (!rec) return { exists: false, tampered: false };
    const expected = FiveTHashLock.generate(
      rec.tag.agent ?? 'unknown',
      rec.content ?? JSON.stringify(rec.tag),
      rec.sealedAt,
    );
    return { exists: true, tampered: expected !== rec.hashLock, record: rec };
  }

  /**
   * 凍結不可改（規則 2 / H4）：試圖變更 lifecycle:frozen+restricted 時拒絕。
   */
  static mutateArtifact(entityId: string, tag: OmniTagSet): void {
    const check = verifyOmniTagContract(tag, { attemptedMutation: true });
    if (!check.valid) {
      throw new OmniTagContractViolation(check);
    }
    this._sealedArtifacts.delete(entityId);
  }

  static isSealed(entityId: string): boolean {
    return this._sealedArtifacts.has(entityId);
  }
}
