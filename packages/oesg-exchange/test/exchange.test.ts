import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine, type OesgReport } from '@esggo/oesg-report';
import { OesgAuditEngine } from '@esggo/oesg-audit';
import {
  createMemoryExchangeSink,
  ExchangeError,
  OesgExchangeEngine,
  type ExchangeSink,
  type ExchangeLot,
} from '../src';

const PERIOD = { start: 1_780_000_000_000, end: 1_780_003_600_000 };

function staticSource(id: string, readings: any[]) {
  return { id, label: id, read: async () => readings };
}

async function makeTick(kwh: number): Promise<Readonly<PulseTick>> {
  const arch = OmniArch.germinate();
  const engine = new OesgPulseEngine(arch.wire, {
    orgId: 'org-a',
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
    orgId: 'org-a',
    sources: [staticSource('diesel', [
      { scope: 'S1', sourceId: 'diesel', activity: liters, unit: 'L', factor: 2.68, takenAt: PERIOD.start },
    ])],
    sinks: [],
  });
  return engine.sweep(PERIOD);
}

/** 以真實 Pulse→Report→Audit 管線產生 clean 判定 */
async function makeCleanVerdict(arch: ReturnType<typeof OmniArch.germinate>): Promise<Readonly<OesgReport>> {
  const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  report.ingest(await makeTick(1200)); // S2: 592.8
  report.ingest(await makeDieselTick(100)); // S1: 268
  return report.compile();
}

function sampleVerdict(reportUuid: string, verdict: 'clean' | 'flagged') {
  return {
    uuid: 'oesg-audit.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://audit',
    orgId: 'org-a',
    reportUuid,
    periodStart: 10,
    periodEnd: 20,
    verdict,
    findings: verdict === 'flagged' ? [{ code: 'E_SHARE_NOT_CLOSED', detail: 'Σ ≠ 1' }] : [],
    attestationHash: 'c'.repeat(64),
    failures: [],
  };
}

function sampleReport(uuid: string, totalKgCo2e: number) {
  return {
    uuid,
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://report',
    orgId: 'org-a',
    periodStart: 10,
    periodEnd: 20,
    tickCount: 2,
    totalKgCo2e,
    scopeShares: [
      { scope: 'S1', kgCo2e: 268, share: 0.311 },
      { scope: 'S2', kgCo2e: 592.8, share: 0.689 },
    ],
    topEmission: { sourceId: 'electricity', kgCo2e: 592.8 },
    verified: true,
    attestationHash: 'b'.repeat(64),
    failures: [],
  };
}

describe('OesgExchangeEngine (OESG 路線圖第四站: Exchange 減量額度交易所)', () => {
  it('clean 判定掛牌: 額度量取期報告權威值, attestationHash 64, sink 收到', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemoryExchangeSink();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [sink] });
    engine.ingestReport(sampleReport('oesg-report.1', 860.8) as never);
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'clean') as never);

    const result = await engine.exchange();

    expect(result.lots).toHaveLength(1);
    const lot = result.lots[0];
    expect(lot.kgCo2e).toBe(860.8);
    expect(lot.status).toBe('listed');
    expect(lot.verdictUuid).toBe('oesg-audit.1');
    expect(lot.reportUuid).toBe('oesg-report.1');
    expect(lot.attestationHash).toHaveLength(64);
    expect(lot.failures).toHaveLength(0);
    expect(result.rejections).toHaveLength(0);
    expect(sink.lots()).toHaveLength(1);
  });

  it('掛牌鐵律一: flagged 判定拒掛留痕, 不鑄造額度', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestReport(sampleReport('oesg-report.1', 860.8) as never);
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'flagged') as never);

    const result = await engine.exchange();

    expect(result.lots).toHaveLength(0);
    expect(result.rejections).toHaveLength(1);
    expect(result.rejections[0].reason).toBe('E_VERDICT_FLAGGED');
    expect(arch.wire.memory.byTag('rejected')).toHaveLength(1);
    expect(arch.wire.memory.byTag('exchange')).toHaveLength(1); // 僅拒掛留痕, 無掛牌結晶
  });

  it('掛牌鐵律二: 量未知 (未接線報告) 不得掛牌 → E_QUANTITY_UNKNOWN', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestVerdict(sampleVerdict('oesg-report.unknown', 'clean') as never);

    const result = await engine.exchange();

    expect(result.lots).toHaveLength(0);
    expect(result.rejections[0].reason).toBe('E_QUANTITY_UNKNOWN');
  });

  it('四站管線閉環: listenTo(audit) + linkReport(report) → 稽核判定自動掛牌', async () => {
    const arch = OmniArch.germinate();
    const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const exchange = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    audit.listenTo(report);
    exchange.linkReport(report);
    exchange.listenTo(audit);

    report.ingest(await makeTick(500)); // S2: 247
    await report.compile();
    await audit.audit();
    const result = await exchange.exchange();

    expect(result.lots).toHaveLength(1);
    expect(result.lots[0].kgCo2e).toBe(247);
    expect(result.lots[0].periodStart).toBe(PERIOD.start);
  });

  it('廣播接線: bus 廣播 oesg.exchange.lot + memory byTag exchange 留痕', async () => {
    const arch = OmniArch.germinate();
    const broadcast: ExchangeLot[] = [];
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.subscribe((l) => broadcast.push(l));
    engine.ingestReport(sampleReport('oesg-report.1', 860.8) as never);
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'clean') as never);

    await engine.exchange();

    expect(broadcast).toHaveLength(1);
    expect(broadcast[0].uuid.startsWith('oesg-exchange.')).toBe(true);
    expect(arch.wire.memory.byTag('exchange')).toHaveLength(1);
  });

  it('sink 失敗結晶留痕, 不毀額度', async () => {
    const arch = OmniArch.germinate();
    const failing: ExchangeSink = {
      id: 'failing-exchange-sink',
      write: async () => {
        throw new Error('exchange sink unavailable');
      },
    };
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [failing] });
    engine.ingestReport(sampleReport('oesg-report.1', 860.8) as never);
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'clean') as never);

    const result = await engine.exchange();

    expect(result.lots).toHaveLength(1);
    expect(result.lots[0].failures).toHaveLength(1);
    expect(result.lots[0].failures[0].sinkId).toBe('failing-exchange-sink');
    expect(arch.wire.memory.byTag('exchange')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.exchange.run")', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestReport(sampleReport('oesg-report.1', 860.8) as never);
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'clean') as never);
    engine.registerIntent();

    const result = await arch.wire.agent.understand<{ lots: unknown[] }>('oesg.exchange.run', {});

    expect(result.lots).toHaveLength(1);
  });

  it('治理鐵律: 戒嚴期間拒絕掛牌寫入', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestVerdict(sampleVerdict('oesg-report.1', 'clean') as never);
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.exchange()).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 空待掛清單 / 缺 orgId', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    await expect(engine.exchange()).rejects.toThrowError(ExchangeError);
    expect(() => new OesgExchangeEngine(arch.wire, { orgId: '', sinks: [] })).toThrowError(ExchangeError);
  });
});
