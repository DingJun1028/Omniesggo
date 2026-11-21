import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, createMemorySink } from '../src';
import { PulseError, type PulseReading, type PulseSource, type PulseSink, type PulseTick } from '../src';

const PERIOD = { start: 1_780_000_000_000, end: 1_780_003_600_000 };
const INTENT = 'oesg.pulse.sweep';

function staticSource(id: string, readings: PulseReading[]): PulseSource {
  return { id, label: id, read: async () => readings };
}

function failingSink(): PulseSink {
  return {
    id: 'failing-sink',
    write: async () => {
      throw new Error('sink unavailable');
    },
  };
}

describe('OesgPulseEngine (OESG 路線圖首站: Pulse 碳排監控)', () => {
  it('全源脈動: 讀取 → ISO-14064-1 驗算 → 範疇彙總 → 結晶封存', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemorySink();
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-demo',
      sources: [
        staticSource('electricity', [
          { scope: 'S2', sourceId: 'electricity', activity: 1200, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
        ]),
        staticSource('diesel', [
          { scope: 'S1', sourceId: 'diesel', activity: 100, unit: 'L', factor: 2.68, takenAt: PERIOD.start },
        ]),
      ],
      sinks: [sink],
    });

    const tick = await engine.sweep(PERIOD);

    expect(tick.orgId).toBe('org-demo');
    expect(tick.verified).toBe(true);
    expect(tick.readings).toHaveLength(2);
    // S2: 1200 kWh × 0.494 kgCO2e/度 (能源署電力排碳係數, A06 規範)
    expect(tick.emissions.find((e) => e.scope === 'S2')?.kgCo2e).toBeCloseTo(592.8, 6);
    // S1: 100 L × 2.68
    expect(tick.emissions.find((e) => e.scope === 'S1')?.kgCo2e).toBeCloseTo(268, 6);
    expect(tick.totalKgCo2e).toBeCloseTo(860.8, 6);
    expect(tick.attestationHash).toHaveLength(64);
    expect(tick.failures).toHaveLength(0);
    expect(sink.ticks()).toHaveLength(1);
    expect(Object.isFrozen(tick)).toBe(true);
  });

  it('管線閉環: memory 留痕 + bus 廣播 oesg.pulse.tick (供 Report/Audit 訂閱)', async () => {
    const arch = OmniArch.germinate();
    const broadcasts: PulseTick[] = [];
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-bus',
      sources: [
        staticSource('electricity', [
          { scope: 'S2', sourceId: 'electricity', activity: 500, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
        ]),
      ],
      sinks: [],
    });
    engine.subscribe((tick) => broadcasts.push(tick));

    await engine.sweep(PERIOD);

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].totalKgCo2e).toBeCloseTo(247, 6);
    expect(arch.wire.memory.byTag('carbon')).toHaveLength(1);
    expect(arch.wire.memory.byTag('pulse')).toHaveLength(1);
    // 驗算存證已入 OmniEvidence
    expect(arch.wire.evidence.records().length).toBeGreaterThanOrEqual(1);
  });

  it('sink 失敗結晶留痕, 不毀脈動 (混沌自癒語彙)', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-fail',
      sources: [
        staticSource('electricity', [
          { scope: 'S2', sourceId: 'electricity', activity: 100, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
        ]),
      ],
      sinks: [failingSink()],
    });

    const tick = await engine.sweep(PERIOD);

    expect(tick.totalKgCo2e).toBeCloseTo(49.4, 6);
    expect(tick.failures).toHaveLength(1);
    expect(tick.failures[0].sinkId).toBe('failing-sink');
    expect(tick.failures[0].error).toContain('sink unavailable');
    // 留痕與廣播不受 sink 失敗影響
    expect(arch.wire.memory.byTag('carbon')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.pulse.sweep") 觸發脈動', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-intent',
      sources: [
        staticSource('electricity', [
          { scope: 'S2', sourceId: 'electricity', activity: 800, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
        ]),
      ],
      sinks: [],
    });
    engine.registerIntent();

    const outcome = await arch.wire.agent.understand<Readonly<PulseTick>>(INTENT, { period: PERIOD });

    expect(outcome.totalKgCo2e).toBeCloseTo(395.2, 6);
    expect(outcome.verified).toBe(true);
  });

  it('治理鐵律: 戒嚴期間拒絕脈動', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-law',
      sources: [
        staticSource('electricity', [
          { scope: 'S2', sourceId: 'electricity', activity: 10, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
        ]),
      ],
      sinks: [],
    });
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.sweep(PERIOD)).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 期間倒置 / 空源 / 缺 orgId', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-contract',
      sources: [staticSource('empty', [])],
      sinks: [],
    });
    await expect(engine.sweep({ start: 100, end: 50 })).rejects.toThrowError(PulseError);
    await expect(engine.sweep(PERIOD)).rejects.toThrowError(PulseError);
    expect(() =>
      new OesgPulseEngine(arch.wire, { orgId: '', sources: [staticSource('x', [])], sinks: [] })
    ).toThrowError(PulseError);
  });
});

