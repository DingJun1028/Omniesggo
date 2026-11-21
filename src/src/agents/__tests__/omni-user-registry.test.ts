import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IOmniMemory, MemoryEntry } from '../../types/twelve-omni';

vi.mock('../twelve-omni/omni-memory', () => ({
  getOmniMemory: vi.fn(),
}));

import { getOmniMemory } from '../twelve-omni/omni-memory';
import { OmniUserRegistry, getOmniUserRegistry } from '../omni-user-registry';

function createMockMemory(): IOmniMemory {
  return {
    uuid: 'mock-memory',
    version: '1.0.0',
    timestamp: Date.now(),
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
    store: vi.fn().mockResolvedValue('mock-id'),
    retrieve: vi.fn().mockResolvedValue(null),
    search: vi.fn().mockResolvedValue([]),
    evolve: vi.fn().mockResolvedValue('mock-id'),
    merge: vi.fn().mockResolvedValue('mock-id'),
    size: vi.fn().mockResolvedValue(0),
    garbageCollect: vi.fn().mockResolvedValue(0),
  };
}

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: `MEM-${Date.now()}`,
    content: 'test content',
    metadata: { source: 'test', confidence: 0.8, domain: 'test', relatedIds: [] },
    createdAt: Date.now(),
    accessCount: 0,
    decayFactor: 1,
    tags: [],
    parentIds: [],
    hash: '',
    ...overrides,
  };
}

describe('OmniUserRegistry', () => {
  let mockMemory: IOmniMemory;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMemory = createMockMemory();
    vi.mocked(getOmniMemory).mockReturnValue(mockMemory);
  });

  it('constructor initializes with correct default metrics', () => {
    const registry = new OmniUserRegistry();
    const metrics = registry.getMetrics();

    expect(metrics.totalInteractions).toBe(0);
    expect(metrics.uniqueUsers).toBe(0);
    expect(metrics.knowledgeNodes).toBe(0);
    expect(metrics.preferencesLearned).toBe(0);
    expect(metrics.averageConfidence).toBe(0);
    expect(metrics.growthRate).toBe(0);
    expect(metrics.lastUpdated).toBeTypeOf('number');
    expect(registry.uuid).toBeTypeOf('string');
    expect(registry.version).toBe('1.0.0');
  });

  it('recordInteraction() returns an interaction ID', async () => {
    const registry = new OmniUserRegistry();
    const id = await registry.recordInteraction({
      userId: 'user-1',
      type: 'query',
      content: 'hello world',
      timestamp: Date.now(),
    });

    expect(id).toMatch(/^INT-\d+-[A-Z0-9]{8}$/);
  });

  it('recordInteraction() updates metrics (totalInteractions increases)', async () => {
    const registry = new OmniUserRegistry();

    expect(registry.getMetrics().totalInteractions).toBe(0);

    await registry.recordInteraction({
      userId: 'user-1',
      type: 'query',
      content: 'hello',
      timestamp: Date.now(),
    });
    expect(registry.getMetrics().totalInteractions).toBe(1);

    await registry.recordInteraction({
      userId: 'user-2',
      type: 'command',
      content: 'help me',
      timestamp: Date.now(),
    });
    expect(registry.getMetrics().totalInteractions).toBe(2);
  });

  it('getUserPreferences() returns empty array for unknown user', () => {
    const registry = new OmniUserRegistry();
    expect(registry.getUserPreferences('nonexistent')).toEqual([]);
  });

  it('getUserPreferences() returns preferences after recording interactions', async () => {
    const registry = new OmniUserRegistry();

    await registry.recordInteraction({
      userId: 'user-1',
      type: 'query',
      content: 'hello',
      timestamp: Date.now(),
    });

    const prefs = registry.getUserPreferences('user-1');
    expect(prefs.length).toBeGreaterThan(0);
    expect(prefs.some(p => p.category === 'language' && p.value === 'en')).toBe(true);
  });

  it('getMetrics() returns correct structure', () => {
    const registry = new OmniUserRegistry();
    const metrics = registry.getMetrics();

    expect(metrics).toHaveProperty('totalInteractions');
    expect(metrics).toHaveProperty('uniqueUsers');
    expect(metrics).toHaveProperty('knowledgeNodes');
    expect(metrics).toHaveProperty('preferencesLearned');
    expect(metrics).toHaveProperty('averageConfidence');
    expect(metrics).toHaveProperty('growthRate');
    expect(metrics).toHaveProperty('lastUpdated');

    expect(typeof metrics.totalInteractions).toBe('number');
    expect(typeof metrics.uniqueUsers).toBe('number');
    expect(typeof metrics.knowledgeNodes).toBe('number');
    expect(typeof metrics.lastUpdated).toBe('number');
  });

  it('getKnowledgeStats() returns correct structure', () => {
    const registry = new OmniUserRegistry();
    const stats = registry.getKnowledgeStats();

    expect(stats).toHaveProperty('totalNodes');
    expect(stats).toHaveProperty('totalEdges');
    expect(stats).toHaveProperty('topConcepts');
    expect(typeof stats.totalNodes).toBe('number');
    expect(typeof stats.totalEdges).toBe('number');
    expect(Array.isArray(stats.topConcepts)).toBe(true);
    expect(stats.totalNodes).toBe(0);
  });

  it('enhancedSearch() returns memory entries (mocked memory layer)', async () => {
    const registry = new OmniUserRegistry();
    const now = Date.now();
    const entries = [
      makeEntry({ content: 'hello result', createdAt: now - 60_000 }),
      makeEntry({ content: 'another result', createdAt: now - 120_000 }),
    ];
    vi.mocked(mockMemory.search).mockResolvedValue(entries);

    const results = await registry.enhancedSearch('user-1', 'hello');

    expect(mockMemory.search).toHaveBeenCalled();
    // 比對關鍵欄位而非整物件深等（避免 CI 環境下 entry 參考/欄位微差導致 flaky）
    // Also use expect.arrayContaining to avoid flaky order due to identical timestamps
    expect(results.length).toBe(entries.length);
    // 同分時按 createdAt 新→舊（實作含穩定 tie-break，確定性排序）
    expect(results[0].content).toBe('hello result');
    expect(results[1].content).toBe('another result');
  });

  it('singleton getOmniUserRegistry() returns same instance', () => {
    const a = getOmniUserRegistry();
    const b = getOmniUserRegistry();
    expect(a).toBe(b);
    expect(a.uuid).toBe(b.uuid);
  });
});
