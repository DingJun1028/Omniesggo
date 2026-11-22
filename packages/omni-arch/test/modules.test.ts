import { describe, expect, it } from 'vitest';
import { OmniBase } from '../src/base';
import { OmniMemory } from '../src/memory';
import { OmniTime } from '../src/time';
import { OmniComponent } from '../src/component';
import { HIGH_RISK_TAG, OmniTagRegistry } from '../src/tag';
import { OmniEvidence } from '../src/evidence';
import { OmniAgent } from '../src/agent';
import { OmniAPI } from '../src/api';
import { OmniBus } from '../src/bus';
import { mintEvent, OmniArchError } from '../src/types';

describe('OmniBase (維度一: 物理)', () => {
  it('註冊表 MECE 禁止重複註冊', () => {
    const base = new OmniBase();
    base.register('OmniMemory', {});
    expect(() => base.register('OmniMemory', {})).toThrowError(OmniArchError);
    expect(base.registeredIds()).toEqual(['OmniMemory']);
  });

  it('start/stop 生命週期按註冊序與逆序執行', async () => {
    const base = new OmniBase();
    const order: string[] = [];
    base.register('A', { start: () => order.push('start:A'), stop: () => order.push('stop:A') });
    base.register('B', { start: () => order.push('start:B'), stop: () => order.push('stop:B') });
    await base.start();
    await base.stop();
    expect(order).toEqual(['start:A', 'start:B', 'stop:B', 'stop:A']);
    expect(base.currentState()).toBe('stopped');
  });
});

describe('OmniMemory (群體知識聖所)', () => {
  it('remember 後核心封存不可篡改, 可按標籤召回', async () => {
    const memory = new OmniMemory();
    const record = await memory.remember('mem://carbon', { kwh: 1200 }, ['esg', 'carbon']);
    await memory.remember('mem://brand', { name: 'ESG-GO' }, ['brand']);
    expect(Object.isFrozen(record)).toBe(true);
    expect(record.core.source_origin).toBe('mem://carbon');
    expect(memory.byTag('carbon')).toHaveLength(1);
    expect(memory.recall((r) => r.core.source_origin === 'mem://brand')).toHaveLength(1);
    expect(memory.size()).toBe(2);
  });
});

describe('OmniTime (時空裂縫)', () => {
  it('append-only 事件流可依時間區間重放, 快照深凍結', () => {
    const time = new OmniTime();
    time.append(mintEvent('t://a', 'esg.ingest', { v: 1 }, { timestamp: 100, uuid: 'e-1' }));
    time.append(mintEvent('t://a', 'esg.ingest', { v: 2 }, { timestamp: 200, uuid: 'e-2' }));
    time.append(mintEvent('t://a', 'esg.report', { v: 3 }, { timestamp: 300, uuid: 'e-3' }));
    expect(time.replay(100, 300).map((e) => e.uuid)).toEqual(['e-1', 'e-2']);
    expect(time.replay(300).map((e) => e.uuid)).toEqual(['e-3']);
    const snap = time.snapshot();
    expect(Object.isFrozen(snap)).toBe(true);
    expect(time.journalUuids()).toEqual(['e-1', 'e-2', 'e-3']);
  });

  it('非法 timestamp fail-fast', () => {
    const time = new OmniTime();
    expect(() =>
      time.append(mintEvent('t://a', 'esg.ingest', {}, { timestamp: Number.NaN, uuid: 'bad' }))
    ).toThrowError(OmniArchError);
  });
});

describe('OmniComponent (UI 載體)', () => {
  it('描述子經 Hash Lock 封存, props 深凍結', async () => {
    const component = new OmniComponent();
    const descriptor = await component.describe('SustainCard', { title: '碳盤查' });
    expect(descriptor.kind).toBe('SustainCard');
    expect(descriptor.theme).toBe('LiquidGlass');
    expect(descriptor.effect).toBe('ripple');
    expect(Object.isFrozen(descriptor)).toBe(true);
    expect(Object.isFrozen(descriptor.props)).toBe(true);
    expect(descriptor.evidence.at(-1)?.standard).toBe('5T-PROOF');
  });
});

describe('OmniTag (語義標籤)', () => {
  it('高危標籤觸發唯讀防護色', () => {
    const tags = new OmniTagRegistry();
    tags.define(HIGH_RISK_TAG, 'readonly');
    tags.define('#日常');
    expect(tags.isProtected(HIGH_RISK_TAG)).toBe(true);
    expect(tags.protectionTheme(HIGH_RISK_TAG)).toBe('MartialLock');
    expect(tags.protectionTheme('#日常')).toBe('LiquidGlass');
  });

  it('非 # 開頭標籤拒收', () => {
    const tags = new OmniTagRegistry();
    expect(() => tags.define('高危操作')).toThrowError(OmniArchError);
  });
});

describe('OmniEvidence (零幻覺驗算)', () => {
  it('ISO-14064-1 碳盤查驗算: 1200 kWh × 0.509 = 610.8 kgCO2e', async () => {
    const evidence = new OmniEvidence();
    const verification = await evidence.verify({
      standard: 'ISO-14064-1',
      formula: (inputs) => inputs.kwh * inputs.factor,
      formulaName: 'activity_data × emission_factor',
      inputs: { kwh: 1200, factor: 0.509 },
      expected: 610.8,
    });
    expect(verification.passed).toBe(true);
    expect(Math.abs(verification.actual - 610.8)).toBeLessThan(1e-6);
    expect(evidence.records()).toHaveLength(1);
    expect(evidence.attestationHash(verification)).toHaveLength(64);
  });

  it('驗算失敗 (期望值不符) 如實不通過', async () => {
    const evidence = new OmniEvidence();
    const verification = await evidence.verify({
      standard: 'Formal-Proof',
      formula: (inputs) => inputs.a + inputs.b,
      formulaName: 'a + b',
      inputs: { a: 1, b: 2 },
      expected: 4,
    });
    expect(verification.passed).toBe(false);
  });
});

describe('OmniAgent (UX 靈魂)', () => {
  it('意圖分發零儀式感, 未知意圖 fail-fast', async () => {
    const agent = new OmniAgent();
    agent.onIntent('esg.report.draft', (args: { title: string }) => ({ draft: args.title }));
    expect(await agent.understand('esg.report.draft', { title: 'GRI' })).toEqual({ draft: 'GRI' });
    await expect(agent.understand('unknown.intent', {})).rejects.toThrowError(OmniArchError);
    expect(() => agent.onIntent('esg.report.draft', () => ({}))).toThrowError(OmniArchError);
  });
});

describe('OmniAPI (萬能符文)', () => {
  it('符文銘刻/召喚, 結果深凍結, 未知符文拒絕', async () => {
    const api = new OmniAPI();
    api.engrave('cf.billing.token', (args: { scope: string }) => ({ scope: args.scope, ro: true }));
    const result = await api.invoke<{ scope: string; ro: boolean }>('cf.billing.token', {
      scope: 'billing:read',
    });
    expect(result.scope).toBe('billing:read');
    expect(Object.isFrozen(result)).toBe(true);
    await expect(api.invoke('nope', {})).rejects.toThrowError(OmniArchError);
    expect(api.runeCount()).toBe(1);
  });
});

describe('OmniBus (總線 + 背壓監聽)', () => {
  it('發佈/訂閱 + egressLock 刻印 + journal 供熵減', async () => {
    const bus = new OmniBus();
    const received: string[] = [];
    bus.subscribe('esg.ingest', (event) => {
      received.push(event.uuid);
      expect(Object.isFrozen(event)).toBe(true);
    });
    const result = await bus.publish(mintEvent('b://t', 'esg.ingest', { kwh: 1 }, { uuid: 'evt-1' }));
    expect(result.delivered).toBe(1);
    expect(result.dropped).toBe(false);
    expect(result.seal.hash).toHaveLength(64);
    expect(received).toEqual(['evt-1']);
    expect(bus.journalUuids()).toEqual(['evt-1']);
  });

  it('超越高水位時 drop-oldest 策略丟棄並計數', async () => {
    const bus = new OmniBus({ highWaterMark: 1, strategy: 'drop-oldest' });
    const seen: string[] = [];
    bus.subscribe('heavy.topic', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      seen.push('handler');
    });
    const first = bus.publish(mintEvent('b://t', 'heavy.topic', {}, { uuid: 'h-1' }));
    const second = bus.publish(mintEvent('b://t', 'heavy.topic', {}, { uuid: 'h-2' }));
    const [r1, r2] = await Promise.all([first, second]);
    expect(r1.dropped).toBe(false);
    expect(r2.dropped).toBe(true);
    expect(bus.droppedEvents()).toBe(1);
    expect(bus.journalUuids()).toEqual(['h-1']);
  });

  it('reject 策略於高水位時 fail-fast', async () => {
    const bus = new OmniBus({ highWaterMark: 1, strategy: 'reject' });
    bus.subscribe('locked.topic', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const first = bus.publish(mintEvent('b://t', 'locked.topic', {}, { uuid: 'r-1' }));
    await expect(
      bus.publish(mintEvent('b://t', 'locked.topic', {}, { uuid: 'r-2' }))
    ).rejects.toThrowError(OmniArchError);
    await first;
  });
});