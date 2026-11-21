import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, createMemorySink, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine, createMemoryReportSink, ReportError, type OesgReport, type ReportSink } from '../src';

const PERIOD = { start: 1_780_000_000_000, end: 1_780_003_600_000 };

function staticSource(id: string, readings: any[]) {
  return { id, label: id, read: async () => readings };
}

async function makeTick(kwh: number): Promise<Readonly<PulseTick>> {
  const arch = OmniArch.germinate();
  const engine = new OesgPulseEngine(arch.wire, {
    orgId: 'org-r',
    sources: [staticSource('electricity', [
      { scope: 'S2', sourceId: 'electricity', activity: kwh, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
    ])],
    sinks: [],
  });
  return engine.sweep(PERIOD);
}

async function makeDieselTick(liters: number): Promise<Readonly<PulseTick>> {
  const arch = OmniArch.germinate();
  const engine = new OesgPulseEngine(arch.wire, {
    orgId: 'org-r',
    sources: [staticSource('diesel', [
      { scope: 'S1', sourceId: 'diesel', activity: liters, unit: 'L', factor: 2.68, takenAt: PERIOD.start },
    ])],
    sinks: [],
  });
  return engine.sweep(PERIOD);
}

describe('OesgReportEngine (OESG 路線圖次站: Report 報告生成)', () => {
  it('彙整兩枚脈動結晶: 總和 + 範疇佔比 + 熱點定位', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemoryReportSink();
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [sink] });
    engine.ingest(await makeTick(1200)); // S2: 592.8
    engine.ingest(await makeDieselTick(100)); // S1: 268

    const report = await engine.compile();

    expect(report.tickCount).toBe(2);
    expect(report.totalKgCo2e).toBeCloseTo(860.8, 6);
    expect(report.verified).toBe(true);
    expect(report.scopeShares.find((s) => s.scope === 'S1')?.kgCo2e).toBeCloseTo(268, 6);
    expect(report.scopeShares.find((s) => s.scope === 'S2')?.kgCo2e).toBeCloseTo(592.8, 6);
    const shareSum = report.scopeShares.reduce((sum, s) => sum + s.share, 0);
    expect(Math.abs(shareSum - 1)).toBeLessThan(1e-9);
    expect(report.topEmission?.sourceId).toBe('electricity');
    expect(report.topEmission?.kgCo2e).toBeCloseTo(592.8, 6);
    expect(report.attestationHash).toHaveLength(64);
    expect(sink.reports()).toHaveLength(1);
  });

  it('listenTo 接線首站: pulse.sweep 結晶自動納入報告輸入', async () => {
    const arch = OmniArch.germinate();
    const pulse = new OesgPulseEngine(arch.wire, {
      orgId: 'org-r',
      sources: [staticSource('electricity', [
        { scope: 'S2', sourceId: 'electricity', activity: 500, unit: 'kWh', factor: 0.494, takenAt: PERIOD.start },
      ])],
      sinks: [createMemorySink()],
    });
    const report = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    report.listenTo(pulse);

    await pulse.sweep(PERIOD);
    const compiled = await report.compile();

    expect(compiled.tickCount).toBe(1);
    expect(compiled.totalKgCo2e).toBeCloseTo(247, 6);
  });

  it('管線閉環: memory 留痕 + bus 廣播 oesg.report.draft (供 Audit 訂閱)', async () => {
    const arch = OmniArch.germinate();
    const drafts: OesgReport[] = [];
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    engine.subscribe((r) => drafts.push(r));
    engine.ingest(await makeTick(800));

    await engine.compile();

    expect(drafts).toHaveLength(1);
    expect(drafts[0].totalKgCo2e).toBeCloseTo(395.2, 6);
    expect(arch.wire.memory.byTag('report')).toHaveLength(1);
    expect(arch.wire.evidence.records().length).toBeGreaterThanOrEqual(2);
  });

  it('零幻覺攔截: 結晶申報總量與讀值重算不符 → verified false', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    engine.ingest(await makeTick(800));
    engine.ingest({
      ...(await makeTick(100)),
      totalKgCo2e: 999, // 竄改申報總量
    } as PulseTick);

    const report = await engine.compile();

    expect(report.verified).toBe(false);
  });

  it('sink 失敗結晶留痕, 不毀報告', async () => {
    const arch = OmniArch.germinate();
    const failing: ReportSink = {
      id: 'failing-report-sink',
      write: async () => {
        throw new Error('report sink unavailable');
      },
    };
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [failing] });
    engine.ingest(await makeTick(100));

    const report = await engine.compile();

    expect(report.totalKgCo2e).toBeCloseTo(49.4, 6);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].sinkId).toBe('failing-report-sink');
    expect(arch.wire.memory.byTag('report')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.report.compile")', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    engine.ingest(await makeTick(600));
    engine.registerIntent();

    const outcome = await arch.wire.agent.understand<Readonly<OesgReport>>('oesg.report.compile', {});

    expect(outcome.totalKgCo2e).toBeCloseTo(296.4, 6);
  });

  it('治理鐵律: 戒嚴期間拒絕報告生成', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    engine.ingest(await makeTick(10));
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.compile()).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 無輸入 / 缺 orgId', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgReportEngine(arch.wire, { orgId: 'org-r', sinks: [] });
    await expect(engine.compile()).rejects.toThrowError(ReportError);
    expect(() => new OesgReportEngine(arch.wire, { orgId: '', sinks: [] })).toThrowError(ReportError);
  });
});
