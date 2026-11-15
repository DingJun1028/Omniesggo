import { describe, expect, it } from 'vitest';
import { OmniArch } from '../src/arch';
import { OmniGateway } from '../src/gateway';
import { OmniHealing } from '../src/healing';
import { OmniEvolution } from '../src/evolution';
import { OmniSeed } from '../src/seed';
import { OmniUserRegistry } from '../src/user-registry';
import { OmniTheme } from '../src/theme';
import { mintEvent, OmniArchError } from '../src/types';

describe('OmniGateway + OmniHealing (維度四: 治理)', () => {
  it('ingress 契約形狀驗證 + 深凍結', () => {
    const gateway = new OmniGateway(new OmniHealing());
    const sealed = gateway.ingress({
      uuid: 'c-1',
      version: '1.0.0',
      timestamp: 1,
      source_origin: 'gw://outside',
    });
    expect(Object.isFrozen(sealed)).toBe(true);
    expect(() =>
      gateway.ingress({ uuid: 'c-2', version: '1.0.0', timestamp: 1, source_origin: '' })
    ).toThrowError(OmniArchError);
  });

  it('戒嚴期間拒絕寫入, 解除後恢復', () => {
    const healing = new OmniHealing();
    const gateway = new OmniGateway(healing);
    healing.declareMartialLaw('祕密洩漏事故');
    expect(() =>
      gateway.ingress({ uuid: 'c-3', version: '1.0.0', timestamp: 1, source_origin: 'gw://x' })
    ).toThrowError(OmniArchError);
    expect(healing.lockReason()).toBe('祕密洩漏事故');
    healing.liftMartialLaw();
    expect(() =>
      gateway.ingress({ uuid: 'c-4', version: '1.0.0', timestamp: 1, source_origin: 'gw://x' })
    ).not.toThrow();
  });

  it('egress 強制 source_origin 溯源 + Hash Lock', () => {
    const gateway = new OmniGateway(new OmniHealing());
    const seal = gateway.egress(mintEvent('gw://inside', 'esg.report', { kwh: 1200 }));
    expect(seal.hash).toHaveLength(64);
    expect(seal.sealed.evidence?.['hash_lock']).toBe(seal.hash);
    expect(seal.sealed.evidence?.['verification_standard']).toBe('ISO-14064-1');
  });

  it('混沌自癒: 未知失敗結晶模板, 同類失敗復用', async () => {
    const healing = new OmniHealing();
    const failProbe = async (): Promise<void> => {
      throw new Error('stale_timestamp');
    };
    expect(await healing.heal('sys.chaos::stale', failProbe)).toBe('crystallized');
    expect(healing.templateCount()).toBe(1);
    expect(await healing.heal('sys.chaos::stale', failProbe)).toBe('learned');
  });
});

describe('OmniEvolution (每週熵減)', () => {
  it('重複事件驅動技術債指標, 熵減比例可驗收', () => {
    const journal = ['a', 'b', 'b', 'c'];
    const evolution = new OmniEvolution(() => journal);
    const report = evolution.weeklyReduce();
    expect(report.duplicateEventRate).toBe(0.25);
    expect(report.technicalDebtIndex).toBe(0.15);
    expect(report.debtReductionRatio).toBe(1);
    expect(report.agplCompliant).toBe(true);
    expect(evolution.reviewLicense('GPL-2.0')).toBe(false);
    expect(evolution.reviewLicense('AGPL-3.0')).toBe(true);
  });
});

describe('OmniSeed (細胞分裂母體)', () => {
  it('germinateAgent 世代遞增, 血脈可溯源, 子代各自新 uuid', async () => {
    const seed = new OmniSeed();
    const first = await seed.germinateAgent({ kind: 'agent', traits: ['#光之羽翼'], parentUuid: 'parent-1' });
    const second = await seed.germinateAgent({ kind: 'agent', traits: ['#自主代行'] });
    expect(first.generation).toBe(1);
    expect(second.generation).toBe(2);
    expect(first.parentUuid).toBe('parent-1');
    expect(first.uuid).not.toBe(second.uuid);
    expect(Object.isFrozen(first)).toBe(true);
    expect(seed.generationOf('agent')).toBe(2);
    expect(seed.generationOf('component')).toBe(0);
  });
});

describe('OmniUserRegistry (個體成長軌跡)', () => {
  it('per-user 成長紀錄, 軌跡依序回放', async () => {
    const registry = new OmniUserRegistry();
    await registry.grow('user-a', '偏好繁體中文報告');
    await registry.grow('user-a', '熟悉 GRI 2024');
    await registry.grow('user-b', '首次使用');
    expect(registry.trajectory('user-a')).toHaveLength(2);
    expect(registry.trajectory('user-b')).toHaveLength(1);
    expect(registry.userCount()).toBe(2);
    await expect(registry.grow('user-a', '')).rejects.toThrowError(OmniArchError);
  });
});

describe('OmniTheme (萬能主題)', () => {
  it('戒嚴時強制防護色, 解鎖後可切換輝煌', () => {
    const healing = new OmniHealing();
    const theme = new OmniTheme(() => healing.isLocked());
    expect(theme.current()).toBe('LiquidGlass');
    healing.declareMartialLaw('全域演練');
    expect(theme.set('CelestialGlow')).toBe('MartialLock');
    expect(theme.current()).toBe('MartialLock');
    healing.liftMartialLaw();
    expect(theme.set('CelestialGlow')).toBe('CelestialGlow');
    expect(() => theme.set('Unknown' as 'LiquidGlass')).toThrowError(OmniArchError);
  });
});

describe('OmniArch 萬能架構組裝 (MECE + 生命體編排)', () => {
  it('四維度 × 3 模組 = 12, 不重不漏', () => {
    const arch = OmniArch.germinate();
    expect(arch.verifyTopology()).toBe(true);
    expect(arch.wire.base.registeredIds()).toHaveLength(12);
  });

  it('ensureContract 契約執行 fail-fast', () => {
    const arch = OmniArch.germinate();
    const sealed = arch.ensureContract({
      uuid: 'x-1',
      version: '1.0.0',
      timestamp: 1,
      source_origin: 'arch://t',
    });
    expect(Object.isFrozen(sealed)).toBe(true);
    expect(() =>
      arch.ensureContract({ uuid: 'x-2', version: '', timestamp: 1, source_origin: 'arch://t' })
    ).toThrowError(OmniArchError);
  });

  it('戒嚴廣播: sys.martial_law 上總線並留時空裂縫痕跡', async () => {
    const arch = OmniArch.germinate();
    const seen: boolean[] = [];
    arch.wire.bus.subscribe('sys.martial_law', (event) => {
      const payload = event.payload as { locked: boolean };
      seen.push(payload.locked);
    });
    arch.wire.healing.declareMartialLaw('滲透測試');
    expect(arch.wire.theme.current()).toBe('MartialLock');
    arch.wire.healing.liftMartialLaw();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(seen).toEqual([true, false]);
    const lawEvents = arch.wire.time.replay(0).filter((e) => e.topic === 'sys.martial_law');
    expect(lawEvents).toHaveLength(2);
    expect(arch.wire.theme.current()).toBe('LiquidGlass');
  });

  it('端到端生命週期: 意圖 → 符文 → 總線 → 記憶 → 驗算 → 心跳', async () => {
    const arch = OmniArch.germinate();
    const { agent, api, bus, memory, evidence, engine } = arch.wire;

    api.engrave('carbon.compute', (args: { kwh: number; factor: number }) => args.kwh * args.factor);
    agent.onIntent('esg.carbon.check', async (args: { kwh: number }) => {
      const kgco2e = await api.invoke<number>('carbon.compute', {
        kwh: args.kwh,
        factor: 0.509,
      });
      const verification = await evidence.verify({
        standard: 'ISO-14064-1',
        formula: (inputs) => inputs.kwh * inputs.factor,
        formulaName: 'activity_data × emission_factor',
        inputs: { kwh: args.kwh, factor: 0.509 },
        expected: kgco2e,
      });
      await memory.remember('e2e://carbon', { kgco2e }, ['esg', 'carbon']);
      await bus.publish(mintEvent('e2e://carbon', 'esg.verified', { kgco2e, passed: verification.passed }));
      return { kgco2e, passed: verification.passed };
    });

    const busEvents: string[] = [];
    bus.subscribe('esg.verified', (event) => busEvents.push(event.uuid));

    const outcome = await agent.understand<{ kgco2e: number; passed: boolean }>('esg.carbon.check', {
      kwh: 1200,
    });
    expect(outcome.passed).toBe(true);
    expect(Math.abs(outcome.kgco2e - 610.8)).toBeLessThan(1e-6);
    expect(busEvents).toHaveLength(1);
    expect(memory.byTag('carbon')).toHaveLength(1);

    const pulse = await engine.heartbeat();
    expect(pulse.probe).toBe('passed');
    expect(pulse.entropy.agplCompliant).toBe(true);
    expect(pulse.theme).toBe('LiquidGlass');
  });
});