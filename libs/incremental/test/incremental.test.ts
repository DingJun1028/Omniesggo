import { describe, it, expect } from 'vitest';
import { EventBus } from '../src/event-bus';
import { ServiceOrchestrator } from '../src/service-orchestrator';
import { ETLPipeline } from '../src/etl-pipeline';
import { APIGateway } from '../src/api-gateway';
import { CacheManager } from '../src/cache-manager';
import { ErrorHandler } from '../src/error-handler';
import { hashLock, generateTraceableId } from '../src/stream-buffer';

describe('5T 合規增量輸出架構 (圣典 §12.0/§12.1)', () => {
  it('T1 Traceable: 事件帶 source 溯源標記', async () => {
    const bus = new EventBus();
    const id = await bus.publish('my-worker', { x: 1 });
    expect(id).toMatch(/^tr_/);
    expect(id).toContain('my-wor');
  });

  it('T2 Trackable: getEvents 僅返回增量 (Delta Sync)', async () => {
    const bus = new EventBus();
    await bus.publish('s', { n: 1 });
    await bus.publish('s', { n: 2 });
    const all = await bus.getEvents(0);
    expect(all.length).toBe(2);
    const delta = await bus.getEvents(1); // 僅第 2 筆之後
    expect(delta.length).toBe(1);
  });

  it('T3 Trustworthy: hashLock 凍結不可篡改', () => {
    const locked = hashLock({ a: 1 });
    expect(Object.isFrozen(locked)).toBe(true);
    expect(() => { (locked as any).a = 2; }).toThrow(); // 嚴格模式凍結
  });

  it('T4 Transparent: 服務編排執行日誌可查', async () => {
    const orch = new ServiceOrchestrator();
    const r = await orch.executeWorkflow(['a', 'b'], async (s) => `done_${s}`);
    expect(r.items.length).toBe(2);
    expect(r.size).toBe(10); // 分頁大小
  });

  it('T5 Tangible: API 閘道 HMAC 認證', async () => {
    const gw = new APIGateway();
    const ok = await gw.handle({ clientId: 'c1', hmac: 'hmac_secret_c1' }, 'secret');
    expect(ok.ok).toBe(true);
    const bad = await gw.handle({ clientId: 'c1', hmac: 'wrong' }, 'secret');
    expect(bad.ok).toBe(false);
  });

  it('T6 增量: ETL 僅返回版本變更', async () => {
    const etl = new ETLPipeline();
    const r1 = await etl.process('src', [{ version: 1 }, { version: 2 }]);
    expect(r1.length).toBe(2);
    const r2 = await etl.process('src', [{ version: 1 }, { version: 2 }, { version: 3 }]);
    expect(r2.length).toBe(1); // 僅 version:3 是新增
  });

  it('T7 快取命中率追蹤 (Trackable)', async () => {
    const cm = new CacheManager();
    cm.set('k', { v: 1 }, 1);
    await cm.get('k');
    await cm.get('k');
    await cm.get('miss');
    expect(cm.hitRate).toBeCloseTo(2 / 3);
  });

  it('T8 錯誤處理增量日誌', async () => {
    const eh = new ErrorHandler();
    const id = await eh.handle(new Error('boom'), { ctx: 'test' });
    expect(id).toMatch(/^tr_/);
    const logs = await eh.getErrorLogs(0);
    expect(logs.length).toBe(1);
    expect(logs[0].message).toBe('boom');
  });

  it('T9 generateTraceableId 唯一性', () => {
    const a = generateTraceableId('x');
    const b = generateTraceableId('x');
    expect(a).not.toBe(b);
  });
});
