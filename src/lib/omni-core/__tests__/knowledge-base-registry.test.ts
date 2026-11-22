/**
 * knowledge-base-registry.test.ts — 萬能知識庫註冊中心單元測試
 *
 * 5T 驗證:
 * - Traceable: source_origin 標記
 * - Trustworthy: Hash Lock 封存 + 驗證
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createKnowledgeBase,
  createKnowledgeSource,
  createDeploymentTarget,
  sealKnowledgeBase,
  verifyKnowledgeBase,
  KnowledgeBaseRegistry,
  knowledgeBaseRegistry,
  type SealedKnowledgeBase,
} from '../knowledge-base-registry';
import { OMNI_TOPICS, OmniEventBus } from '../omni-kernel';

describe('知識庫工廠函數', () => {
  it('createKnowledgeBase 建立 draft 狀態知識庫', () => {
    const kb = createKnowledgeBase(
      'OmniOne 萬能筆記',
      '萬能知識庫',
      '/omniione萬能筆記',
    );
    expect(kb.name).toBe('OmniOne 萬能筆記');
    expect(kb.description).toBe('萬能知識庫');
    expect(kb.source_origin).toBe('/omniione萬能筆記');
    expect(kb.status).toBe('draft');
    expect(kb.locked).toBe(false);
    expect(kb.version).toBe('1.0.0');
    expect(kb.uuid).toMatch(/^KB-/);
    expect(kb.tags).toContain('omni-one');
    expect(Object.isFrozen(kb)).toBe(true);
  });

  it('createKnowledgeSource 建立 synced 來源並含 traceable 證據', () => {
    const src = createKnowledgeSource(
      '萬能筆記源',
      'obsidian',
      '/omniione萬能筆記',
      '/omniione萬能筆記',
    );
    expect(src.storage).toBe('obsidian');
    expect(src.status).toBe('synced');
    expect(src.evidence).toHaveLength(1);
    expect(src.evidence[0].kind).toBe('traceable');
    expect(src.evidence[0].hash).toMatch(/^[0-9a-f]{64}$/);
    expect(src.uuid).toMatch(/^KS-/);
    expect(Object.isFrozen(src)).toBe(true);
  });

  it('createDeploymentTarget 建立目標並含 trustworthy 證據', () => {
    const tgt = createDeploymentTarget(
      'filesystem',
      '/c/Project/omniesggo/Omni-Sanctuary/omni-one-萬能筆記',
    );
    expect(tgt.type).toBe('filesystem');
    expect(tgt.status).toBe('synced');
    expect(tgt.evidence[0].kind).toBe('trustworthy');
    expect(tgt.evidence[0].hash).toMatch(/^[0-9a-f]{64}$/);
    expect(tgt.uuid).toMatch(/^DT-/);
    expect(Object.isFrozen(tgt)).toBe(true);
  });
});

describe('知識庫封存與驗證 (5T Trustworthy)', () => {
  it('sealKnowledgeBase 封存後 locked=true 且有 hashLock', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    const sealed = sealKnowledgeBase(kb);
    expect(sealed.status).toBe('sealed');
    expect(sealed.locked).toBe(true);
    expect(sealed.sealedAt).toBeGreaterThan(0);
    expect(sealed.hashLock).toMatch(/^[0-9a-f]{64}$/);
    expect(sealed.evidence.some(e => e.kind === 'trustworthy')).toBe(true);
    expect(Object.isFrozen(sealed)).toBe(true);
  });

  it('verifyKnowledgeBase 對封存庫回傳 true', () => {
    const kb = createKnowledgeBase('驗證庫', '說明', '/src');
    const sealed = sealKnowledgeBase(kb);
    expect(verifyKnowledgeBase(sealed)).toBe(true);
  });

  it('verifyKnowledgeBase 對未封存庫回傳 false', () => {
    const kb = createKnowledgeBase('未封存庫', '說明', '/src');
    // 偽造成 locked 但無 evidence 的物件
    const fake = { ...kb, locked: true, sealedAt: Date.now(), hashLock: 'x', status: 'sealed' as const };
    expect(verifyKnowledgeBase(fake as SealedKnowledgeBase)).toBe(false);
  });

  it('verifyKnowledgeBase 偵測篡改（名稱變更後 hash 不符）', () => {
    const kb = createKnowledgeBase('原名', '說明', '/src');
    const sealed = sealKnowledgeBase(kb);
    const tampered = { ...sealed, name: '篡改名' };
    expect(verifyKnowledgeBase(tampered)).toBe(false);
  });
});

describe('KnowledgeBaseRegistry 註冊中心', () => {
  let registry: KnowledgeBaseRegistry;

  beforeEach(() => {
    registry = new KnowledgeBaseRegistry();
  });

  it('register 後狀態變 active 且可查詢', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    registry.register(kb);
    const got = registry.get(kb.uuid);
    expect(got).toBeDefined();
    expect(got?.status).toBe('active');
    expect(registry.getAll()).toHaveLength(1);
  });

  it('get 不存在的 uuid 回傳 undefined', () => {
    expect(registry.get('KB-NONEXIST')).toBeUndefined();
  });

  it('addSource / addTarget 記錄於 registry', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    registry.register(kb);

    const src = createKnowledgeSource('源', 'obsidian', '/src/path', '/src');
    registry.addSource(kb.uuid, src);

    const tgt = createDeploymentTarget('filesystem', '/dst/path');
    registry.addTarget(kb.uuid, tgt);

    const reg = registry.getRegistry(kb.uuid);
    expect(reg).toBeDefined();
    expect(reg?.sources).toHaveLength(1);
    expect(reg?.deploymentTargets).toHaveLength(1);
    expect(reg?.base.uuid).toBe(kb.uuid);
  });

  it('生命週期事件已記錄 (5T Trackable)', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    registry.register(kb);
    const src = createKnowledgeSource('源', 'obsidian', '/src/path', '/src');
    registry.addSource(kb.uuid, src);

    const lifecycle = registry.getLifecycle();
    expect(lifecycle.length).toBeGreaterThanOrEqual(2);
    expect(lifecycle[0].event).toBe('store');
    expect(lifecycle[1].event).toBe('sync');
  });

  it('getRegistry 對不存在的 uuid 回傳 undefined', () => {
    expect(registry.getRegistry('KB-NONE')).toBeUndefined();
  });

  it('getMetrics 回傳正確計數', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    registry.register(kb);
    const src = createKnowledgeSource('源', 'obsidian', '/src/path', '/src');
    registry.addSource(kb.uuid, src);
    const tgt = createDeploymentTarget('filesystem', '/dst/path');
    registry.addTarget(kb.uuid, tgt);

    const metrics = registry.getMetrics();
    expect(metrics.totalBases).toBe(1);
    expect(metrics.totalSources).toBe(1);
    expect(metrics.totalTargets).toBe(1);
    expect(metrics.lifecycleCount).toBeGreaterThanOrEqual(3);
  });

  it('syncToAll 記錄 sync 事件', () => {
    const kb = createKnowledgeBase('測試庫', '說明', '/src');
    registry.register(kb);
    registry.syncToAll(kb.uuid, { test: true });
    const lifecycle = registry.getLifecycle();
    const syncEvents = lifecycle.filter(e => e.event === 'sync');
    expect(syncEvents.length).toBeGreaterThanOrEqual(1);
  });
});

describe('事件總線整合', () => {
  it('register 時發布 KB_REGISTERED 事件', () => {
    const captured: Array<{ uuid: string }> = [];
    const unsub = OmniEventBus.subscribe<{ uuid: string }>(OMNI_TOPICS.KB_REGISTERED, (payload) => {
      captured.push(payload);
    });

    const registry = new KnowledgeBaseRegistry();
    const kb = createKnowledgeBase('事件測試', '說明', '/src');
    registry.register(kb);

    expect(captured.length).toBeGreaterThan(0);
    expect(captured[0].uuid).toBe(kb.uuid);

    unsub();
  });

  it('sealKnowledgeBase 時發布 KB_SEALED 事件', () => {
    const captured: Array<{ hashLock: string }> = [];
    const unsub = OmniEventBus.subscribe<{ hashLock: string }>(OMNI_TOPICS.KB_SEALED, (payload) => {
      captured.push(payload);
    });

    const kb = createKnowledgeBase('封存事件測試', '說明', '/src');
    const sealed = sealKnowledgeBase(kb);

    expect(captured.length).toBeGreaterThan(0);
    expect(captured[0].hashLock).toBe(sealed.hashLock);

    unsub();
  });
});

describe('全域單例', () => {
  it('knowledgeBaseRegistry 是 KnowledgeBaseRegistry 實例', () => {
    expect(knowledgeBaseRegistry).toBeInstanceOf(KnowledgeBaseRegistry);
  });

  it('全域單例為同一實例', () => {
    expect(knowledgeBaseRegistry).toBe(knowledgeBaseRegistry);
  });
});
