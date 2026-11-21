import { describe, it, expect } from 'vitest';
import { EventBus } from '../event-bus';
import { ServiceOrchestrator } from '../service-orchestrator';
import { ETLPipeline } from '../etl-pipeline';
import { APIGateway } from '../api-gateway';
import { CacheManager } from '../cache-manager';
import { ErrorHandler } from '../error-handler';

describe('§12 進階整合模式 六件套', () => {
  it('EventBus: 發布即凍結 payload + Trackable 流', async () => {
    const bus = new EventBus();
    const got: string[] = [];
    bus.subscribe('t', (e) => { got.push((e.payload as any).v); });
    const ev = await bus.publish('t', 'soul.md§12', { v: 'x' });
    expect(Object.isFrozen(ev.payload)).toBe(true);
    expect(got).toContain('x');
    expect(bus.getStream().length).toBe(1);
  });

  it('ServiceOrchestrator: 逐步執行 + Transparent 記錄', async () => {
    const o = new ServiceOrchestrator();
    const r = await o.executeWorkflow([
      { name: 'a', run: async () => 1 },
      { name: 'b', run: async () => 2 },
    ]);
    expect(r).toEqual([1, 2]);
    expect(o.getRecords().length).toBe(2);
  });

  it('ETLPipeline: 轉換凍結 + Hash Lock (Trustworthy)', async () => {
    const p = new ETLPipeline();
    const res = await p.process([1, 2], (n) => n * 10);
    expect(res.rows).toBe(2);
    expect(res.hashLock).toMatch(/^[0-9a-f]{8}$/);
    expect(Object.isFrozen(res)).toBe(true);
  });

  it('APIGateway: 訪問日誌 Trackable', async () => {
    const g = new APIGateway();
    await g.handle({ clientId: 'c1', path: '/x' }, () => 'ok');
    expect(g.getAccessLog().length).toBe(1);
  });

  it('CacheManager: 命中率 Tangible', () => {
    const c = new CacheManager();
    c.set('k', 'v');
    expect(c.get('k')).toBe('v');
    expect(c.get('miss')).toBeNull();
    expect(c.getStats().hits).toBe(1);
  });

  it('ErrorHandler: 錯誤凍結存證 (Trustworthy)', async () => {
    const h = new ErrorHandler();
    const rec = await h.handle(new Error('boom'), { ctx: 1 });
    expect(rec.message).toBe('boom');
    expect(Object.isFrozen(rec.context)).toBe(true);
    expect(h.getLog().length).toBe(1);
  });
});
