/**
 * OesgReportEngine — OESG-Report 報告生成引擎
 *
 * OESG 五路線圖次站: Pulse (碳排監控) → **Report (報告生成)** → Audit → Exchange → DAO。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 與首站 OesgPulseEngine 對稱:
 * - OmniBus: 訂閱 oesg.pulse.tick (listenTo) / 廣播 oesg.report.draft (供 Audit 訂閱)
 * - OmniEvidence: ISO-14064-1 零幻覺驗算 (報告總量 = 各 tick 總和重算 + 佔比和 = 100%)
 * - OmniMemory: 期報告結晶留痕 (tags: oesg/report/carbon)
 * - OmniHealing: 戒嚴期間拒絕報告生成 (治理鐵律)
 */
import { computeHash } from '@esggo/omni-core';
import { mintEvent, OmniArchError, type ArchWire } from '@esggo/omni-arch';
import type { OesgPulseEngine, PulseTick } from '@esggo/oesg-pulse';
import {
  ReportError,
  type OesgReport,
  type ReportSink,
  type ReportSinkFailure,
  type ScopeShare,
  type TickInput,
} from './types';

export interface OesgReportConfig {
  readonly orgId: string;
  readonly sinks: readonly ReportSink[];
  readonly sourceOrigin?: string;
}

const EMISSION_STANDARD = 'ISO-14064-1';
const TOPIC_REPORT = 'oesg.report.draft';
const TOPIC_TICK = 'oesg.pulse.tick';
const INTENT_COMPILE = 'oesg.report.compile';

export class OesgReportEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sinks: readonly ReportSink[];
  private readonly sourceOrigin: string;
  private readonly ingested: TickInput[] = [];

  constructor(wire: ArchWire, config: OesgReportConfig) {
    if (!config.orgId) {
      throw new ReportError('E_REPORT_ORG', 'orgId 為必填, 報告無主不成立');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://report';
  }

  /** 接線首站: 訂閱 oesg.pulse.tick, 每一枚脈動結晶自動納入本期報告輸入 */
  listenTo(pulse: OesgPulseEngine): void {
    pulse.subscribe((tick) => {
      this.ingested.push(tick);
    });
  }

  /** 手動納入脈動結晶 (離線批次/補件場景) */
  ingest(tick: TickInput): void {
    this.ingested.push(tick);
  }

  /** 註冊代理意圖: agent.understand('oesg.report.compile') 即生成期報告 */
  registerIntent(): void {
    this.wire.agent.onIntent(INTENT_COMPILE, async () => this.compile());
  }

  /** 編製期報告: 彙整 → 驗算 → 結晶 → 留痕 → 廣播 → 寫出 */
  async compile(): Promise<Readonly<OesgReport>> {
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕報告生成');
    }
    if (this.ingested.length === 0) {
      throw new ReportError('E_REPORT_EMPTY', '本期無任何脈動結晶, 空報告不成立');
    }

    const periodStart = Math.min(...this.ingested.map((t) => t.periodStart));
    const periodEnd = Math.max(...this.ingested.map((t) => t.periodEnd));
    const tickTotals = this.ingested.map((t) => t.totalKgCo2e);
    const totalKgCo2e = tickTotals.reduce((sum, value) => sum + value, 0);

    // [承] 零幻覺驗算一: 逐 tick 重算 Σ(activity×factor) 與其申報總量一致
    let verified = true;
    for (const tick of this.ingested) {
      const readingsTotal = tick.readings.reduce((sum, r) => sum + r.activity * r.factor, 0);
      const tickVerification = await this.wire.evidence.verify({
        standard: EMISSION_STANDARD,
        formula: (inputs) => inputs.readingsTotal,
        formulaName: 'Σ(activity_data × emission_factor) = pulse_tick.total_kgco2e',
        inputs: { readingsTotal, reportedTotal: tick.totalKgCo2e },
        expected: tick.totalKgCo2e,
      });
      if (!tickVerification.passed) {
        verified = false;
      }
    }

    // [轉] 範疇佔比 (和必為 100%)
    const scopeTotals: Record<string, number> = { S1: 0, S2: 0, S3: 0 };
    const sourceTotals: Record<string, number> = {};
    for (const tick of this.ingested) {
      for (const emission of tick.emissions) {
        scopeTotals[emission.scope] += emission.kgCo2e;
      }
      for (const reading of tick.readings) {
        sourceTotals[reading.sourceId] = (sourceTotals[reading.sourceId] ?? 0) + reading.activity * reading.factor;
      }
    }
    const scopeShares: ScopeShare[] = (['S1', 'S2', 'S3'] as const)
      .filter((scope) => scopeTotals[scope] > 0)
      .map((scope) => ({
        scope,
        kgCo2e: scopeTotals[scope],
        share: totalKgCo2e > 0 ? scopeTotals[scope] / totalKgCo2e : 0,
      }));
    const shareSum = scopeShares.reduce((sum, s) => sum + s.share, 0);
    const shareVerification = await this.wire.evidence.verify({
      standard: EMISSION_STANDARD,
      formula: (inputs) => inputs.shareSum,
      formulaName: 'Σ scope_share = 100%',
      inputs: { shareSum, total: 1 },
      expected: 1,
      tolerance: 1e-9,
    });
    if (!shareVerification.passed) {
      verified = false;
    }

    // 熱點: 最高排放源
    const sourceTotalsEntries = Object.entries(sourceTotals).sort((a, b) => b[1] - a[1]);
    const topEmission = sourceTotalsEntries.length > 0
      ? { sourceId: sourceTotalsEntries[0][0], kgCo2e: sourceTotalsEntries[0][1] }
      : null;

    // [合] 結晶封存 (Hash Lock 溯源)
    const report: OesgReport = Object.freeze({
      uuid: `oesg-report.${Date.now()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: this.orgId,
      periodStart,
      periodEnd,
      tickCount: this.ingested.length,
      totalKgCo2e,
      scopeShares: Object.freeze(scopeShares.map((s) => Object.freeze({ ...s })) as readonly ScopeShare[]),
      topEmission,
      verified,
      attestationHash: computeHash({ tickTotals, totalKgCo2e, orgId: this.orgId }),
      failures: Object.freeze([]),
    });

    // [終] 留痕 + 廣播 + 寫出 (sink 失敗不毀報告)
    await this.wire.memory.remember(`oesg://report/${report.uuid}`, report, [
      'oesg',
      'report',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_REPORT, report));

    const failures: ReportSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(report);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    if (failures.length > 0) {
      return Object.freeze({ ...report, failures: Object.freeze(failures) });
    }
    return report;
  }

  /** 供 Audit (第三站) 訂閱報告廣播 */
  subscribe(listener: (report: Readonly<OesgReport>) => void): void {
    this.wire.bus.subscribe(TOPIC_REPORT, (event) => listener(event.payload as OesgReport));
  }
}
