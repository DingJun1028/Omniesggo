import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, createMemorySink, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine, type OesgReport } from '@esggo/oesg-report';
import {
  AuditError,
  createMemoryAuditSink,
  OesgAuditEngine,
  type AuditSink,
  type AuditVerdict,
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

/** 以真實 Pulse→Report 管線產生一份正常期報告結晶 */
async function makeReport(): Promise<Readonly<OesgReport>> {
  const arch = OmniArch.germinate();
  const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  report.ingest(await makeTick(1200)); // S2: 592.8
  report.ingest(await makeDieselTick(100)); // S1: 268
  return report.compile();
}

describe('OesgAuditEngine (OESG 路線圖第三站: Audit 漂綠稽核)', () => {
  it('clean 判定: 正常報告複核通過, findings 空、attestationHash 64、sink 收到', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemoryAuditSink();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [sink] });
    engine.ingest(await makeReport());

    const verdicts = await engine.audit();

    expect(verdicts).toHaveLength(1);
    const verdict = verdicts[0];
    expect(verdict.verdict).toBe('clean');
    expect(verdict.findings).toHaveLength(0);
    expect(verdict.attestationHash).toHaveLength(64);
    expect(verdict.reportUuid).toBeTruthy();
    expect(verdict.failures).toHaveLength(0);
    expect(sink.verdicts()).toHaveLength(1);
  });

  it('漂綠攔截一: 竄改範疇加總 → flagged + E_SCOPE_SUM_MISMATCH', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const report = await makeReport();
    engine.ingest({
      ...report,
      scopeShares: report.scopeShares.map((s) => ({ ...s, kgCo2e: s.kgCo2e / 2 })),
    } as OesgReport);

    const [verdict] = await engine.audit();

    expect(verdict.verdict).toBe('flagged');
    expect(verdict.findings.map((f) => f.code)).toContain('E_SCOPE_SUM_MISMATCH');
  });

  it('漂綠攔截二: 佔比和 ≠ 1 → flagged + E_SHARE_NOT_CLOSED', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const report = await makeReport();
    engine.ingest({
      ...report,
      scopeShares: report.scopeShares.map((s) => ({ ...s, share: 0.4 })),
    } as OesgReport);

    const [verdict] = await engine.audit();

    expect(verdict.verdict).toBe('flagged');
    expect(verdict.findings.map((f) => f.code)).toContain('E_SHARE_NOT_CLOSED');
  });

  it('漂綠攔截三: 上游零幻覺旗標 verified=false → flagged + E_UPSTREAM_UNVERIFIED', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const report = await makeReport();
    engine.ingest({ ...report, verified: false } as OesgReport);

    const [verdict] = await engine.audit();

    expect(verdict.verdict).toBe('flagged');
    expect(verdict.findings.map((f) => f.code)).toContain('E_UPSTREAM_UNVERIFIED');
  });

  it('漂綠攔截四: tickCount = 0 → flagged + E_EMPTY_PERIOD', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const report = await makeReport();
    engine.ingest({ ...report, tickCount: 0 } as OesgReport);

    const [verdict] = await engine.audit();

    expect(verdict.verdict).toBe('flagged');
    expect(verdict.findings.map((f) => f.code)).toContain('E_EMPTY_PERIOD');
  });

  it('listenTo 接線第二站: report.compile 廣播 → 稽核自動納入', async () => {
    const arch = OmniArch.germinate();
    const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    audit.listenTo(report);

    report.ingest(await makeTick(500)); // S2: 247
    const draft = await report.compile();
    const verdicts = await audit.audit();

    expect(verdicts).toHaveLength(1);
    expect(verdicts[0].verdict).toBe('clean');
    expect(verdicts[0].reportUuid).toBe(draft.uuid);
  });

  it('管線閉環: memory byTag audit + bus 廣播 oesg.audit.verdict + evidence 留痕', async () => {
    const arch = OmniArch.germinate();
    const broadcast: AuditVerdict[] = [];
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.subscribe((v) => broadcast.push(v));
    engine.ingest(await makeReport());

    await engine.audit();

    expect(broadcast).toHaveLength(1);
    expect(broadcast[0].verdict).toBe('clean');
    expect(arch.wire.memory.byTag('audit')).toHaveLength(1);
    expect(arch.wire.evidence.records().length).toBeGreaterThanOrEqual(2);
  });

  it('sink 失敗結晶留痕, 不毀判定', async () => {
    const arch = OmniArch.germinate();
    const failing: AuditSink = {
      id: 'failing-audit-sink',
      write: async () => {
        throw new Error('audit sink unavailable');
      },
    };
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [failing] });
    engine.ingest(await makeReport());

    const [verdict] = await engine.audit();

    expect(verdict.verdict).toBe('clean');
    expect(verdict.failures).toHaveLength(1);
    expect(verdict.failures[0].sinkId).toBe('failing-audit-sink');
    expect(arch.wire.memory.byTag('audit')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.audit.run")', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingest(await makeReport());
    engine.registerIntent();

    const outcome = await arch.wire.agent.understand<Readonly<AuditVerdict>[]>('oesg.audit.run', {});

    expect(outcome).toHaveLength(1);
    expect(outcome[0].verdict).toBe('clean');
  });

  it('治理鐵律: 戒嚴期間拒絕稽核寫入', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingest(await makeReport());
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.audit()).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 空待稽清單 / 缺 orgId', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    await expect(engine.audit()).rejects.toThrowError(AuditError);
    expect(() => new OesgAuditEngine(arch.wire, { orgId: '', sinks: [] })).toThrowError(AuditError);
  });
});
