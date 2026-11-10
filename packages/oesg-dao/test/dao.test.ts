import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine, type PulseTick } from '@esggo/oesg-pulse';
import { OesgReportEngine } from '@esggo/oesg-report';
import { OesgAuditEngine } from '@esggo/oesg-audit';
import { OesgExchangeEngine } from '@esggo/oesg-exchange';
import {
  createMemoryDaoSink,
  DaoError,
  OesgDaoEngine,
  type DaoSink,
  type DaoTrade,
  type LotInput,
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

function sampleLot(): LotInput {
  return {
    uuid: 'oesg-exchange.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://exchange',
    orgId: 'org-a',
    verdictUuid: 'oesg-audit.1',
    reportUuid: 'oesg-report.1',
    periodStart: 10,
    periodEnd: 20,
    kgCo2e: 860.8,
    status: 'listed',
    attestationHash: 'd'.repeat(64),
    failures: [],
  };
}

describe('OesgDaoEngine (OESG 路線圖第五站: DAO 減量額度治理引擎)', () => {
  it('settle 交割治理: 治理結晶欄位齊備, attestationHash 64, sink 收到', async () => {
    const arch = OmniArch.germinate();
    const sink = createMemoryDaoSink();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [sink] });
    engine.ingestLot(sampleLot());

    const trade = await engine.settle(sampleLot().uuid, 'org-b');

    expect(trade.action).toBe('settle');
    expect(trade.status).toBe('settled');
    expect(trade.buyerOrgId).toBe('org-b');
    expect(trade.orgId).toBe('org-a');
    expect(trade.lotUuid).toBe('oesg-exchange.1');
    expect(trade.kgCo2e).toBe(860.8);
    expect(trade.attestationHash).toHaveLength(64);
    expect(trade.failures).toHaveLength(0);
    expect(sink.trades()).toHaveLength(1);
    expect(arch.wire.memory.byTag('dao')).toHaveLength(1);
  });

  it('retire 註銷治理: 買方為自持 orgId, status retired', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());

    const trade = await engine.retire(sampleLot().uuid);

    expect(trade.action).toBe('retire');
    expect(trade.status).toBe('retired');
    expect(trade.buyerOrgId).toBe('org-a');
  });

  it('治理鐵律: 已治理額度再治理 → E_LOT_CONSUMED 雙花攔截', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    await engine.settle(sampleLot().uuid, 'org-b');

    await expect(engine.settle(sampleLot().uuid, 'org-b')).rejects.toMatchObject({
      code: 'E_LOT_CONSUMED',
    });
  });

  it('治理鐵律: 未知額度不得治理 → E_LOT_UNKNOWN', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });

    await expect(engine.settle('oesg-exchange.unknown', 'org-b')).rejects.toMatchObject({
      code: 'E_LOT_UNKNOWN',
    });
  });

  it('治理鐵律: settle 無買方組織不成立 → E_DAO_BUYER', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());

    await expect(engine.settle(sampleLot().uuid, '')).rejects.toMatchObject({
      code: 'E_DAO_BUYER',
    });
  });

  it('五站管線閉環: listenTo(exchange) → 掛牌額度自動納入並交割', async () => {
    const arch = OmniArch.germinate();
    const report = new OesgReportEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const audit = new OesgAuditEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const exchange = new OesgExchangeEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    const dao = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    audit.listenTo(report);
    exchange.linkReport(report);
    exchange.listenTo(audit);
    dao.listenTo(exchange);

    report.ingest(await makeTick(500)); // S2: 247
    await report.compile();
    await audit.audit();
    const result = await exchange.exchange();
    expect(dao.pendingCount()).toBe(1);

    const trade = await dao.settle(result.lots[0].uuid, 'org-b');

    expect(trade.kgCo2e).toBe(247);
    expect(trade.status).toBe('settled');
    expect(trade.periodStart).toBe(PERIOD.start);
    expect(dao.pendingCount()).toBe(0);
  });

  it('廣播接線: bus 廣播 oesg.dao.trade 供下游訂閱', async () => {
    const arch = OmniArch.germinate();
    const broadcast: DaoTrade[] = [];
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.subscribe((t) => broadcast.push(t));
    engine.ingestLot(sampleLot());

    await engine.retire(sampleLot().uuid);

    expect(broadcast).toHaveLength(1);
    expect(broadcast[0].uuid.startsWith('oesg-dao.')).toBe(true);
    expect(arch.wire.memory.byTag('dao')).toHaveLength(1);
  });

  it('sink 失敗結晶留痕, 不毀治理交易', async () => {
    const arch = OmniArch.germinate();
    const failing: DaoSink = {
      id: 'failing-dao-sink',
      write: async () => {
        throw new Error('dao sink unavailable');
      },
    };
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [failing] });
    engine.ingestLot(sampleLot());

    const trade = await engine.retire(sampleLot().uuid);

    expect(trade.failures).toHaveLength(1);
    expect(trade.failures[0].sinkId).toBe('failing-dao-sink');
    expect(arch.wire.memory.byTag('dao')).toHaveLength(1);
  });

  it('意圖驅動: agent.understand("oesg.dao.run") 批次註銷全部待治理額度', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    engine.registerIntent('retire');

    const result = await arch.wire.agent.understand<{ trades: unknown[] }>('oesg.dao.run', {});

    expect(result.trades).toHaveLength(1);
  });

  it('治理鐵律: 戒嚴期間拒絕治理寫入', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    engine.ingestLot(sampleLot());
    arch.wire.healing.declareMartialLaw('滲透測試');

    await expect(engine.retire(sampleLot().uuid)).rejects.toThrowError(OmniArchError);
  });

  it('契約 fail-fast: 空待治理清單 runAll / 缺 orgId', async () => {
    const arch = OmniArch.germinate();
    const engine = new OesgDaoEngine(arch.wire, { orgId: 'org-a', sinks: [] });
    await expect(engine.runAll('retire')).rejects.toThrowError(DaoError);
    expect(() => new OesgDaoEngine(arch.wire, { orgId: '', sinks: [] })).toThrowError(DaoError);
  });
});
