import { describe, expect, it } from 'vitest';
import { OmniHive } from '../src/hive';
import { OmniProphet } from '../src/prophet';
import { OmniArch } from '../src/arch';
import { mintEvent, OmniArchError } from '../src/types';
import type { BusEvent } from '../src/types';

describe('OmniHive 全知蜂巢 (共享黑板 + 動態競標)', () => {
  it('黑板事實深凍結刻印, uuid 重複拒絕', () => {
    const hive = new OmniHive();
    const fact = hive.post(mintEvent('hive://sensor', 'esg.fact', { kwh: 1200 }));
    expect(Object.isFrozen(fact)).toBe(true);
    expect(hive.blackboard()).toHaveLength(1);
    expect(() => hive.post(mintEvent('hive://sensor', 'esg.fact', {}, { uuid: fact.uuid }))).toThrowError(OmniArchError);
    expect(() => hive.post(fact)).toThrowError(OmniArchError);
  });

  it('入伍重複拒絕; 單輪競標最高分得標並執行', async () => {
    const awards: BusEvent[] = [];
    const hive = new OmniHive((event) => {
      awards.push(event);
    });
    const low = {
      id: 'worker-low',
      bid: () => ({ score: 5, note: '低價試探' }),
      execute: async (task: Readonly<BusEvent>) => {
        await Promise.resolve(undefined);
        return `low-executed-${task.uuid}`;
      },
    };
    const high = {
      id: 'worker-high',
      bid: () => ({ score: 10, note: '勝券在握' }),
      execute: async (task: Readonly<BusEvent>) => {
        await Promise.resolve(undefined);
        return `high-executed-${task.uuid}`;
      },
    };
    hive.enlist(low);
    hive.enlist(high);
    expect(() => hive.enlist(high)).toThrowError(OmniArchError);

    const task = mintEvent('hive://ops', 'esg.tender', { kwh: 1200 });
    const result = await hive.tender(task);
    expect(result).toBe(`high-executed-${task.uuid}`);
    expect(hive.awardsOf('worker-high')).toBe(1);
    expect(hive.awardsOf('worker-low')).toBe(0);
    expect(hive.tenderHistory()).toHaveLength(1);
    expect(hive.tenderHistory()[0].winningScore).toBe(10);
    expect(hive.tenderHistory()[0].bids).toHaveLength(2);
    expect(awards).toHaveLength(1);
    expect((awards[0].payload as { winnerId: string }).winnerId).toBe('worker-high');
  });

  it('多輪動態 re-bid: 偵察輪後重新出價翻盤得標', async () => {
    const hive = new OmniHive();
    const steady = {
      id: 'worker-steady',
      bid: () => ({ score: 10 }),
      execute: async () => {
        await Promise.resolve(undefined);
        return 'steady';
      },
    };
    const counter = {
      id: 'worker-counter',
      bid: (task: Readonly<BusEvent>, board: readonly Readonly<BusEvent>[], round: number) =>
        round >= 2 ? { score: 12, note: '偵察後加價' } : { score: 6 },
      execute: async () => {
        await Promise.resolve(undefined);
        return 'counter';
      },
    };
    hive.enlist(steady);
    hive.enlist(counter);

    const result = await hive.tender(mintEvent('hive://ops', 'esg.tender', { kwh: 800 }), { rounds: 2 });
    expect(result).toBe('counter');
    expect(hive.awardsOf('worker-counter')).toBe(1);
    expect(hive.tenderHistory()[0].rounds).toBe(2);
    expect(hive.tenderHistory()[0].winningScore).toBe(12);
  });

  it('全員棄標 → 流標 fail-fast', async () => {
    const hive = new OmniHive();
    hive.enlist({
      id: 'worker-abstain',
      bid: () => null,
      execute: async () => {
        await Promise.resolve(undefined);
        return 'never';
      },
    });
    await expect(hive.tender(mintEvent('hive://ops', 'esg.tender', {}))).rejects.toThrowError(OmniArchError);
  });

  it('arch.germinate 接線: 得標事件上總線 hive.awarded', async () => {
    const arch = OmniArch.germinate();
    const seen: string[] = [];
    arch.wire.bus.subscribe('hive.awarded', (event) => {
      seen.push((event.payload as { winnerId: string }).winnerId);
    });
    arch.wire.hive.enlist({
      id: 'OA-Carbon-1',
      bid: () => ({ score: 9 }),
      execute: async (task: Readonly<BusEvent>) => {
        const payload = task.payload as { kwh: number };
        return await Promise.resolve(payload.kwh * 0.509);
      },
    });
    const kgco2e = await arch.wire.hive.tender(mintEvent('hive://ops', 'esg.tender', { kwh: 1200 }));
    expect(Math.abs((kgco2e as number) - 610.8)).toBeLessThan(1e-6);
    expect(seen).toEqual(['OA-Carbon-1']);
  });
});

describe('OmniProphet 先知矩陣 (意圖預判 + 多重宇宙並行)', () => {
  const carbonHandler = async (args: { kwh: number }): Promise<number> => {
    return await Promise.resolve(args.kwh * 0.509);
  };

  it('foresee 平行 fork 宇宙; ask 命中 → 0ms 路徑並記 hit', async () => {
    const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 4 });
    expect(prophet.gateOpen()).toBe(true);
    prophet.foresee('esg.carbon.check', carbonHandler, [{ kwh: 1200 }, { kwh: 300 }]);
    expect(prophet.universeCount()).toBe(2);
    expect(prophet.hitRate()).toBe(0);

    const hit = await prophet.ask<{ kwh: number }, number>('esg.carbon.check', { kwh: 1200 });
    expect(Math.abs(hit - 610.8)).toBeLessThan(1e-6);
    expect(prophet.hitRate()).toBe(1);
  });

  it('ask 未命中 → 現算並記 miss; 命中率低於門檻 → 閘門關閉停用預判', async () => {
    const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 2 });
    prophet.foresee('esg.carbon.check', carbonHandler, [{ kwh: 1200 }]);
    expect(prophet.universeCount()).toBe(1);

    const miss = await prophet.ask<{ kwh: number }, number>('esg.carbon.check', { kwh: 999 });
    expect(Math.abs(miss - 999 * 0.509)).toBeLessThan(1e-6);
    expect(prophet.hitRate()).toBe(0);
    expect(prophet.gateOpen()).toBe(false);

    prophet.foresee('esg.carbon.check2', carbonHandler, [{ kwh: 500 }]);
    expect(prophet.universeCount()).toBe(1);
    expect(prophet.replenish()).toBe(0);
  });

  it('maxUniverses 截斷候選宇宙數 (bounded 並行可驗收)', () => {
    const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 2 });
    prophet.foresee('esg.carbon.check', carbonHandler, [
      { kwh: 1 },
      { kwh: 2 },
      { kwh: 3 },
      { kwh: 4 },
    ]);
    expect(prophet.universeCount()).toBe(2);
  });

  it('未知意圖 ask → 拒絕猜測 fail-fast; 重複 foresee → MECE 拒絕', async () => {
    const prophet = new OmniProphet();
    await expect(prophet.ask('esg.unknown', {})).rejects.toThrowError(OmniArchError);
    prophet.foresee('esg.carbon.check', carbonHandler, []);
    expect(() => prophet.foresee('esg.carbon.check', carbonHandler, [])).toThrowError(OmniArchError);
  });
});
