import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine } from '@esggo/oesg-report';
import { OesgAuditEngine, type AuditVerdict } from '@esggo/oesg-audit';
import {
  createMemoryExchangeSink,
  OesgExchangeEngine,
  type ExchangeLot,
} from '@esggo/oesg-exchange';
import {
  createMemoryDaoSink,
  DaoError,
  OesgDaoEngine,
  type DaoAction,
  type DaoSink,
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

/** 以真實 Pulse→Report→Audit→Exchange 管線鑄造一枚掛牌額度 (kgCo2e = 247) */
async function makeLot(): Promise<Readonly<ExchangeLot>> {
  const arch = OmniArch.germinate();
  const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  report.ingest(await makeTick(500));
  const draft = await report.compile();
  const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  audit.ingest(draft);
  const [verdict] = await audit.audit();
  const exchange = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
  exchange.ingestReport(draft);
  exchange.ingestVerdict(verdict as Readonly<AuditVerdict>);
  const result = await exchange.exchange();
  return result.lots[0];
}

function sampleLot(orgId = 'org-a'): Readonly<ExchangeLot> {
  return {
    uuid: 'oesg-exchange.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://exchange',
    orgId,
    verdictUuid: 'oesg-audit.1',
    reportUuid: 'oesg-report.1',
    periodStart: PERIOD.start,
    periodEnd: PERIOD.end,
    kgCo2e: 247,
    status: 'listed',
    attestationHash: 'a'.repeat(64),
    failures: [],
  };
}

describe('OesgDaoEngine (OESG 路線圖終站: DAO 額度治理)', () => {
  it('註銷結晶: retire 動作、hash 64、溯源鍵完整、sink 收到', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemoryDaoSink();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [sink] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });

    const result = await engine.execute();

    expect(result.actions).toHaveLength(1);
    expect(result.rejections).toHaveLength(0);
    const action = result.actions[0];
    expect(action.action).toBe('retire');
    expect(action.toOrgId).toBeNull();
    expect(action.kgCo2e).toBe(247);
    expect(action.verdictUuid).toBe('oesg-audit.1');
    expect(action.reportUuid).toBe('oesg-report.1');
    expect(action.attestationHash).toHaveLength(64);
    expect(action.failures).toHaveLength(0);
    expect(sink.actions()).toHaveLength(1);
  });

  it('轉讓結晶: transfer 動作攜受讓組織', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'transfer', toOrgId: 'org-b' });

    const result = await engine.execute();

    expect(result.actions[0].action).toBe('transfer');
    expect(result.actions[0].toOrgId).toBe('org-b');
  });

  it('一額度一註銷: 二次 retire → E_LOT_RETIRED 拒絕留痕', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });
    await engine.execute();
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });

    const result = await engine.execute();

    expect(result.actions).toHaveLength(0);
    expect(result.rejections).toHaveLength(1);
    expect(result.rejections[0].reason).toBe('E_LOT_RETIRED');
    expect(arch.wire.memory.byTag('carbon')).toHaveLength(1); // 僅首次註銷結晶; 拒絕留痕另掛 rejected
  });

  it('治理資格: 未登記 E_LOT_UNKNOWN / 缺受讓 E_MISSING_OWNER / 自轉讓 E_TRANSFER_SELF', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.unknown', action: 'retire' });
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'transfer' });
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'transfer', toOrgId: 'org-a' });

    const result = await engine.execute();

    expect(result.actions).toHaveLength(0);
    expect(result.rejections.map((r) => r.reason)).toEqual([
      'E_LOT_UNKNOWN',
      'E_MISSING_OWNER',
      'E_TRANSFER_SELF',
    ]);
  });

  it('listenTo 接線第四站: exchange 掛牌自動入登記冊, 全管線閉環', async () => {
    const arch = OmniArch.germinate();
    const exchange = new OesgExchangeEngine(arch.wire, {
      orgId: 'org-a', sinks: [createMemoryExchangeSink()],
    });
    const dao = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    dao.listenTo(exchange);

    const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    report.ingest(await makeTick(500));
    const draft = await report.compile();
    const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    audit.ingest(draft);
    const [verdict] = await audit.audit();
    exchange.ingestReport(draft);
    exchange.ingestVerdict(verdict as Readonly<AuditVerdict>);
    const exchangeResult = await exchange.exchange();

    expect(exchangeResult.lots).toHaveLength(1);
    const lot = exchangeResult.lots[0];
    dao.propose({ lotUuid: lot.uuid, action: 'retire' });
    const result = await dao.execute();

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].lotUuid).toBe(lot.uuid);
    expect(result.actions[0].kgCo2e).toBeCloseTo(247, 6);
  });

  it('管線閉環: memory byTag dao + bus 廣播 oesg.dao.action + evidence 留痕', async () => {
    const arch = OmniArch.germinate();
    const broadcast: DaoAction[] = [];
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.subscribe((a) => broadcast.push(a));
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });

    await engine.execute();

    expect(broadcast).toHaveLength(1);
    expect(broadcast[0].action).toBe('retire');
    expect(arch.wire.memory.byTag('carbon')).toHaveLength(1);
    expect(arch.wire.evidence.records().length).toBeGreaterThanOrEqual(1);
  });

  it('sink 失敗結晶留痕, 不毀動作', async () => {
    const arch = OmniArch.germinate();
    const failing: DaoSink = {
      id: 'failing-dao-sink',
      write: async () => {
        throw new Error('dao sink unavailable');
      },
    };
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [failing] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });

    const result = await engine.execute();

    expect(result.actions[0].action).toBe('retire');
    expect(result.actions[0].failures).toHaveLength(1);
    expect(result.actions[0].failures[0].sinkId).toBe('failing-dao-sink');
    expect(arch.wire.memory.byTag('dao')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.dao.run")', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'transfer', toOrgId: 'org-b' });
    engine.registerIntent();

    const outcome = await arch.wire.agent.understand<Readonly<{ actions: readonly Readonly<DaoAction>[] }>>('oesg.dao.run', {});

    expect(outcome.actions).toHaveLength(1);
    expect(outcome.actions[0].toOrgId).toBe('org-b');
  });

  it('治理鐵律: 戒嚴期間拒絕治理寫入', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.propose({ lotUuid: 'oesg-exchange.1', action: 'retire' });
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.execute()).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 空待治理清單 / 缺 orgId / 空提案批次執行後再執行', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    await expect(engine.execute()).rejects.toThrowError(DaoError);
    expect(() => new OesgDaoEngine(arch.wire, { orgId: '', sinks: [] })).toThrowError(DaoError);
    // 額度未登記 + 提案後執行: 拒絕而非例外; 清單已清空, 再執行即 E_DAO_EMPTY
    engine.propose({ lotUuid: 'oesg-exchange.unknown', action: 'retire' });
    const result = await engine.execute();
    expect(result.rejections).toHaveLength(1);
    await expect(engine.execute()).rejects.toThrowError(DaoError);
  });

  it('真實全管線額度可治理: makeLot (Pulse→Report→Audit→Exchange) 產出之結晶', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const lot = await makeLot();
    engine.ingestLot(lot);
    engine.propose({ lotUuid: lot.uuid, action: 'retire' });
    const result = await engine.execute();
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].kgCo2e).toBeCloseTo(247, 6);
    expect(result.actions[0].attestationHash).toHaveLength(64);
    expect(lot.status).toBe('listed');
    expect(lot.attestationHash).toHaveLength(64);
  });
});
