import { describe, expect, it } from 'vitest';
import { OmniAgent } from '../src/agent';
import { OmniProphet } from '../src/prophet';
import { bindProphetToAgent } from '../src/prophet-bridge';
import { OmniArch } from '../src/arch';
import { OmniArchError } from '../src/types';

describe('bindProphetToAgent 先知矩陣 × OmniAgent 意圖層接線', () => {
  it('foreseeIntent: agent.understand 命中預運算宇宙, handler 不重算 (0ms 路徑)', async () => {
    const agent = new OmniAgent();
    const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 4 });
    const foreseeIntent = bindProphetToAgent(agent, prophet);

    let calls = 0;
    foreseeIntent<{ kwh: number }, number>(
      'esg.carbon.check',
      (args) => {
        calls += 1;
        return args.kwh * 0.509;
      },
      [{ kwh: 1200 }]
    );

    expect(agent.intents()).toContain('esg.carbon.check');
    expect(prophet.universeCount()).toBe(1);
    expect(calls).toBe(1);

    const hit = await agent.understand<{ kwh: number }, number>('esg.carbon.check', { kwh: 1200 });
    expect(Math.abs(hit - 610.8)).toBeLessThan(1e-6);
    expect(calls).toBe(1);
    expect(prophet.hitRate()).toBe(1);
  });

  it('未命中候選 → understand 走現算路徑 (miss 記錄)', async () => {
    const agent = new OmniAgent();
    const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 2 });
    const foreseeIntent = bindProphetToAgent(agent, prophet);
    foreseeIntent<{ kwh: number }, number>(
      'esg.carbon.check',
      (args) => args.kwh * 0.509,
      [{ kwh: 1200 }]
    );

    const miss = await agent.understand<{ kwh: number }, number>('esg.carbon.check', { kwh: 999 });
    expect(Math.abs(miss - 999 * 0.509)).toBeLessThan(1e-6);
    expect(prophet.hitRate()).toBe(0);
  });

  it('未知意圖 understand → fail-fast; 重複 foreseeIntent → E_PROPHET_INTENT_DUPLICATE (先知先報)', async () => {
    const agent = new OmniAgent();
    const prophet = new OmniProphet();
    const foreseeIntent = bindProphetToAgent(agent, prophet);
    foreseeIntent<{ kwh: number }, number>('esg.carbon.check', (args) => args.kwh * 0.509, []);

    await expect(agent.understand('esg.unknown', {})).rejects.toThrowError(OmniArchError);
    expect(() => foreseeIntent<{ kwh: number }, number>('esg.carbon.check', (args) => args.kwh, [])).toThrowError(
      OmniArchError
    );
  });

  it('arch.wire 頂層可用: bindProphetToAgent(wire.agent, wire.prophet) 於 germinate 後接線', async () => {
    const arch = OmniArch.germinate();
    const foreseeIntent = bindProphetToAgent(arch.wire.agent, arch.wire.prophet);
    foreseeIntent<{ kwh: number }, number>(
      'esg.carbon.check',
      (args) => args.kwh * 0.509,
      [{ kwh: 1200 }]
    );
    const hit = await arch.wire.agent.understand<{ kwh: number }, number>('esg.carbon.check', { kwh: 1200 });
    expect(Math.abs(hit - 610.8)).toBeLessThan(1e-6);
  });
});
