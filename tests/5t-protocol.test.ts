/**
 * ==========================================
 * ESG GO 平台 - 5T 協議合規驗證測試
 * ==========================================
 * Validate the 5T Protocol implementation:
 *   T1 Traceable   — 數據溯源追蹤 (provenance)
 *   T2 Transparent — 演算法公開可驗算 (algorithm registry)
 *   T3 Tangible    — 抽象願景具體化 (measurable metrics)
 *   T4 Trustworthy — Hash Lock 不可篡改 (SHA-256 lock)
 *   T5 Trackable   — 生命週期即時記錄 (lifecycle events)
 *
 * Reference implementation: src/lib/five-t-protocol.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  FIVE_T_DIMENSIONS,
  FIVE_T_META,
  DEFAULT_THRESHOLD,
  FiveTGatekeeper,
  FiveTHashLock,
  FiveTTraceable,
  FiveTTransparent,
  FiveTTangible,
  FiveTTrackable,
  calculateFiveTScore,
  generateFiveTReport,
} from '../src/lib/five-t-protocol';

// ==========================================
// 0. 結構完整性 — 五個維度必須完整定義
// ==========================================

describe('5T Protocol — structure integrity', () => {
  it('defines exactly 5 dimensions in the canonical order', () => {
    expect(FIVE_T_DIMENSIONS).toHaveLength(5);
    expect(FIVE_T_DIMENSIONS).toEqual([
      'traceable',
      'transparent',
      'tangible',
      'trustworthy',
      'trackable',
    ]);
  });

  it('defines metadata for every dimension with zh/en/symbol/color/description', () => {
    for (const dim of FIVE_T_DIMENSIONS) {
      const meta = FIVE_T_META[dim];
      expect(meta).toBeDefined();
      expect(meta.zh).toBeTruthy();
      expect(meta.en).toBeTruthy();
      expect(meta.symbol).toMatch(/^T[¹²³⁴⁵]$/);
      expect(meta.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(meta.description).toBeTruthy();
    }
  });

  it('exposes a sane default threshold', () => {
    expect(DEFAULT_THRESHOLD).toBe(0.7);
  });
});

// ==========================================
// 1. FiveTGatekeeper — 評分門檻與弱點偵測
// ==========================================

describe('FiveTGatekeeper', () => {
  const fullScore = {
    traceable: 1,
    transparent: 1,
    tangible: 1,
    trustworthy: 1,
    trackable: 1,
  };
  const zeroScore = {
    traceable: 0,
    transparent: 0,
    tangible: 0,
    trustworthy: 0,
    trackable: 0,
  };

  it('marks all dimensions as passed when every score meets the threshold', () => {
    const status = FiveTGatekeeper.evaluate(fullScore);
    expect(FiveTGatekeeper.allPass(status)).toBe(true);
    expect(FiveTGatekeeper.passCount(status)).toBe(5);
  });

  it('marks failing dimensions when score is below threshold', () => {
    const status = FiveTGatekeeper.evaluate(zeroScore);
    expect(FiveTGatekeeper.allPass(status)).toBe(false);
    expect(FiveTGatekeeper.passCount(status)).toBe(0);
    expect(Object.values(status).every((v) => v === false)).toBe(true);
  });

  it('honors the boundary of the threshold (exact equality passes)', () => {
    const boundaryScore = {
      traceable: DEFAULT_THRESHOLD,
      transparent: DEFAULT_THRESHOLD,
      tangible: DEFAULT_THRESHOLD,
      trustworthy: DEFAULT_THRESHOLD,
      trackable: DEFAULT_THRESHOLD,
    };
    const status = FiveTGatekeeper.evaluate(boundaryScore);
    expect(FiveTGatekeeper.allPass(status)).toBe(true);
  });

  it('detects the weakest dimension', () => {
    expect(
      FiveTGatekeeper.weakestDimension({
        ...fullScore,
        trackable: 0.1,
      })
    ).toBe('trackable');

    expect(
      FiveTGatekeeper.weakestDimension({
        ...fullScore,
        trustworthy: 0.05,
        tangible: 0.4,
      })
    ).toBe('trustworthy');
  });

  it('computes a weighted composite score in [0,1]', () => {
    const composite = FiveTGatekeeper.compositeScore(fullScore);
    expect(composite).toBeCloseTo(1.0, 5);

    const zeroComposite = FiveTGatekeeper.compositeScore(zeroScore);
    expect(zeroComposite).toBeCloseTo(0.0, 5);

    const halfComposite = FiveTGatekeeper.compositeScore({
      traceable: 0.5,
      transparent: 0.5,
      tangible: 0.5,
      trustworthy: 0.5,
      trackable: 0.5,
    });
    expect(halfComposite).toBeCloseTo(0.5, 5);
  });

  it('supports custom weights and re-normalizes', () => {
    const composite = FiveTGatekeeper.compositeScore(fullScore, {
      trustworthy: 1,
      traceable: 0,
      transparent: 0,
      tangible: 0,
      trackable: 0,
    });
    expect(composite).toBeCloseTo(1.0, 5);
  });
});

// ==========================================
// 2. FiveTHashLock — T4 Trustworthy 核心
// ==========================================

describe('FiveTHashLock (T4 Trustworthy)', () => {
  it('generates a deterministic 64-char hex SHA-256 lock', () => {
    const hash = FiveTHashLock.generate('source-a', 'content-1', 1234567890);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);

    const again = FiveTHashLock.generate('source-a', 'content-1', 1234567890);
    expect(again).toBe(hash);
  });

  it('changes the lock when any input changes (source/content/timestamp)', () => {
    const base = FiveTHashLock.generate('src', 'content', 1000);
    expect(FiveTHashLock.generate('other', 'content', 1000)).not.toBe(base);
    expect(FiveTHashLock.generate('src', 'other', 1000)).not.toBe(base);
    expect(FiveTHashLock.generate('src', 'content', 2000)).not.toBe(base);
  });

  it('verifies a lock created within the tolerance window', () => {
    const hash = FiveTHashLock.generate('src', 'content', Date.now());
    expect(FiveTHashLock.verify('src', 'content', hash)).toBe(true);
  });

  it('verifies a lock with an explicit timestamp (exact match)', () => {
    const ts = Date.now() - 4000; // 四秒前建立，仍在預設容差窗內
    const hash = FiveTHashLock.generate('src', 'content', ts);
    expect(FiveTHashLock.verify('src', 'content', hash, 5000, ts)).toBe(true);
  });

  it('verifies a lock at any age inside the window (per-ms coverage)', () => {
    // 驗證修復：容差窗內任何偏移（如 250ms / 3300ms）皆可驗證，不再依賴 1000ms 取樣。
    //
    // 刻意保留餘裕（最大 4500ms < 5000ms 窗），原因是 verify() 以「呼叫當下的 Date.now()」
    // 為基準回掃 offset ∈ [0, toleranceMs]，因此 generate → verify 之間的執行耗時會
    // 累加到鎖的實際年齡上。若沿用貼齊邊界的 4999ms，只要這段耗時超過 1ms，
    // 年齡即達 5000ms 並被實作「正確地」拒絕 —— 那是在測牆上時鐘而非測契約，
    // 會讓 CI 隨機紅燈 (flake)。實作本身無誤，故修正點在測資選擇。
    //
    // 邊界年齡的覆蓋沒有被放棄：改由下一則測試以 race-free 的精確時間戳路徑驗證；
    // 超窗必須拒絕的語意則由 'rejects a lock created outside the tolerance window' 覆蓋。
    for (const age of [1, 250, 3300, 4500]) {
      const ts = Date.now() - age;
      const hash = FiveTHashLock.generate('src', 'content', ts);
      expect(FiveTHashLock.verify('src', 'content', hash, 5000)).toBe(true);
    }
  });

  it('verifies a boundary-age lock deterministically via explicit timestamp', () => {
    // 貼齊容差窗邊界（4999ms / 5000ms）的年齡走「精確時間戳」比對路徑，
    // 不經過以 Date.now() 為基準的回掃，故不受執行耗時影響，可穩定斷言。
    const ts = Date.now() - 4999;
    const hash = FiveTHashLock.generate('src', 'content', ts);
    expect(FiveTHashLock.verify('src', 'content', hash, 5000, ts)).toBe(true);
  });

  it('rejects a lock created outside the tolerance window', () => {
    const staleHash = FiveTHashLock.generate('src', 'content', Date.now() - 60_000);
    expect(FiveTHashLock.verify('src', 'content', staleHash, 5000)).toBe(false);
  });

  it('rejects a lock for different source or content', () => {
    const hash = FiveTHashLock.generate('src', 'content', Date.now());
    expect(FiveTHashLock.verify('different', 'content', hash)).toBe(false);
    expect(FiveTHashLock.verify('src', 'tampered', hash)).toBe(false);
  });

  it('generates a trinity hash as 0x-prefixed 32-char hex', () => {
    const trinity = FiveTHashLock.trinityHash('a', 'b', 'c');
    expect(trinity).toMatch(/^0x[0-9a-f]{32}$/);
  });

  it('verifies trinity hashes deterministically', () => {
    const lock = FiveTHashLock.trinityHash('data', 'salt');
    expect(FiveTHashLock.verifyTrinity('data', 'salt', lock)).toBe(true);
    expect(FiveTHashLock.verifyTrinity('data', 'other', lock)).toBe(false);
    expect(FiveTHashLock.verifyTrinity('other', 'salt', lock)).toBe(false);
  });
});

// ==========================================
// 3. FiveTTraceable — T1 溯源追蹤
// ==========================================

describe('FiveTTraceable (T1 Traceable)', () => {
  beforeEach(() => {
    // 清理 static map，避免跨測試污染
    vi.stubGlobal('__fiveTTestCleanup', true);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records provenance sources for an entity', () => {
    FiveTTraceable.recordSource('entity-1', 'source://manual', { doc: 'report-1' });
    FiveTTraceable.recordSource('entity-1', 'source://import', { doc: 'report-2' });

    const chain = FiveTTraceable.getProvenance('entity-1');
    expect(chain).toHaveLength(2);
    expect(chain[0].source).toBe('source://manual');
    expect(chain[1].source).toBe('source://import');
  });

  it('verifies provenance only when a non-empty chain exists with monotonic timestamps', () => {
    // 尚未記錄 → 無溯源鏈
    expect(FiveTTraceable.verifyProvenance('entity-empty')).toBe(false);

    // 記錄兩筆來源，時間戳由實作自動寫入 (monotonic)
    FiveTTraceable.recordSource('entity-ok', 'source://a');
    FiveTTraceable.recordSource('entity-ok', 'source://b');
    expect(FiveTTraceable.verifyProvenance('entity-ok')).toBe(true);
  });

  it('returns an empty array for unknown entities', () => {
    expect(FiveTTraceable.getProvenance('entity-unknown')).toEqual([]);
  });
});

// ==========================================
// 4. FiveTTransparent — T2 演算法公開可驗算
// ==========================================

describe('FiveTTransparent (T2 Transparent)', () => {
  it('registers and retrieves an algorithm with parameter hash', () => {
    FiveTTransparent.registerAlgorithm('esg-scope-1', 'Scope 1 碳排計算', { factor: 1.2 });

    const algo = FiveTTransparent.getAlgorithm('esg-scope-1');
    expect(algo).toBeDefined();
    expect(algo!.description).toBe('Scope 1 碳排計算');
    expect(algo!.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verifies an algorithm is consistent with the same parameters', () => {
    const params = { factor: 1.2, unit: 'tCO2e' };
    FiveTTransparent.registerAlgorithm('esg-scope-2', 'desc', params);
    expect(FiveTTransparent.verifyAlgorithm('esg-scope-2', params)).toBe(true);
    expect(FiveTTransparent.verifyAlgorithm('esg-scope-2', { factor: 9.9 })).toBe(false);
  });

  it('returns false when verifying an unregistered algorithm', () => {
    expect(FiveTTransparent.verifyAlgorithm('no-such-algo', {})).toBe(false);
  });

  it('lists all registered algorithms with name/description/hash', () => {
    FiveTTransparent.registerAlgorithm('esg-scope-list-1', 'A', {});
    FiveTTransparent.registerAlgorithm('esg-scope-list-2', 'B', {});

    const list = FiveTTransparent.listAlgorithms();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const names = list.map((a) => a.name);
    expect(names).toContain('esg-scope-list-1');
    expect(names).toContain('esg-scope-list-2');
    for (const item of list) {
      expect(item.hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

// ==========================================
// 5. FiveTTangible — T3 具體化指標
// ==========================================

describe('FiveTTangible (T3 Tangible)', () => {
  it('registers a metric and reports initial progress 0', () => {
    FiveTTangible.registerMetric('carbon-reduction', 100, 'tCO2e');
    expect(FiveTTangible.getProgress('carbon-reduction')).toBe(0);
  });

  it('updates a metric and computes capped progress in [0,1]', () => {
    FiveTTangible.registerMetric('energy-efficiency', 200, 'MWh', 50);
    expect(FiveTTangible.getProgress('energy-efficiency')).toBeCloseTo(0.25, 5);

    FiveTTangible.updateMetric('energy-efficiency', 400); // 超過目標 → cap 1
    expect(FiveTTangible.getProgress('energy-efficiency')).toBe(1);
  });

  it('returns 0 progress for unknown metrics and for zero targets', () => {
    expect(FiveTTangible.getProgress('does-not-exist')).toBe(0);
    FiveTTangible.registerMetric('zero-target', 0, 'unit', 10);
    expect(FiveTTangible.getProgress('zero-target')).toBe(0);
  });

  it('summarizes all metrics with progress values', () => {
    FiveTTangible.registerMetric('summary-metric', 10, 'unit', 3);
    const summary = FiveTTangible.getSummary();
    const entry = summary.find((m) => m.name === 'summary-metric');
    expect(entry).toBeDefined();
    expect(entry!.current).toBe(3);
    expect(entry!.target).toBe(10);
    expect(entry!.unit).toBe('unit');
    expect(entry!.progress).toBeCloseTo(0.3, 5);
  });
});

// ==========================================
// 6. FiveTTrackable — T5 生命週期追蹤
// ==========================================

describe('FiveTTrackable (T5 Trackable)', () => {
  it('records lifecycle events in order', () => {
    FiveTTrackable.recordEvent('job-1', 'CREATED', { by: 'system' });
    FiveTTrackable.recordEvent('job-1', 'VERIFIED', { by: 'audit' });

    const events = FiveTTrackable.getLifecycle('job-1');
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('CREATED');
    expect(events[1].event).toBe('VERIFIED');
  });

  it('computes lifecycle duration from first to last event', () => {
    FiveTTrackable.recordEvent('job-duration', 'START');
    FiveTTrackable.recordEvent('job-duration', 'END');
    const duration = FiveTTrackable.getDuration('job-duration');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('returns null duration when fewer than 2 events exist', () => {
    FiveTTrackable.recordEvent('job-lonely', 'START');
    expect(FiveTTrackable.getDuration('job-lonely')).toBeNull();
    expect(FiveTTrackable.getDuration('job-unknown')).toBeNull();
  });

  it('returns an empty lifecycle for unknown entities', () => {
    expect(FiveTTrackable.getLifecycle('job-unknown')).toEqual([]);
  });
});

// ==========================================
// 7. calculateFiveTScore / generateFiveTReport
// ==========================================

describe('calculateFiveTScore + generateFiveTReport', () => {
  it('computes a full score when all evidence is present', () => {
    const score = calculateFiveTScore({
      sources: ['a', 'b', 'c', 'd'],
      algorithmVerified: true,
      metricsProgress: 1,
      hashLocked: true,
      eventsCount: 5,
    });
    expect(score.traceable).toBe(1);
    expect(score.transparent).toBe(1);
    expect(score.tangible).toBe(1);
    expect(score.trustworthy).toBe(1);
    expect(score.trackable).toBe(1);
  });

  it('defaults weaker scores when evidence is missing', () => {
    const score = calculateFiveTScore({});
    expect(score.transparent).toBe(0.3);
    expect(score.trustworthy).toBe(0.2);
    expect(score.trackable).toBe(0.3);
  });

  it('generates a markdown report containing score table and pass count', () => {
    const report = generateFiveTReport({
      traceable: 0.9,
      transparent: 0.8,
      tangible: 0.9,
      trustworthy: 1,
      trackable: 0.8,
    });
    expect(report).toContain('# 5T 協議報告');
    expect(report).toContain('綜合評分');
    expect(report).toContain('5/5');
    expect(report).toContain('Traceable');
    expect(report).toContain('Trustworthy');
  });

  it('suggests the weakest dimension when not all pass', () => {
    const report = generateFiveTReport({
      traceable: 0.9,
      transparent: 0.9,
      tangible: 0.9,
      trustworthy: 0.2,
      trackable: 0.9,
    });
    expect(report).toContain('建議改善');
    expect(report).toContain('Trustworthy');
    expect(report).toContain('4/5');
  });
});
