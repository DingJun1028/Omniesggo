/**
 * OesgExchangeEngine — OESG-Exchange 減量額度交易所引擎
 *
 * OESG 五路線圖第四站: Pulse → Report → Audit → **Exchange** → DAO。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 與前三站對稱:
 * - OmniBus: 訂閱 oesg.audit.verdict (listenTo) / 廣播 oesg.exchange.lot
 * - OmniMemory: 掛牌額度與拒掛結晶留痕 (tags: oesg/exchange/carbon|rejected)
 * - OmniHealing: 戒嚴期間拒絕掛牌寫入 (治理鐵律)
 *
 * 掛牌鐵律 (零幻覺, 不信任上游):
 * - 僅 clean 判定可鑄造掛牌額度; flagged 一律拒掛留痕
 * - 額度量 (kgCo2e) 以期報告結晶為權威 (linkReport), 量未知不得掛牌
 * - attestationHash 鎖 verdict/report/量/組織四方關聯, 供第五站 DAO 及 SLL 追溯
 */
import { randomUUID } from 'node:crypto';
import { computeHash } from '@esggo/omni-core';
import { mintEvent, OmniArchError, type ArchWire } from '@esggo/omni-arch';
import type { OesgAuditEngine } from '@esggo/oesg-audit';
import type { OesgReportEngine } from '@esggo/oesg-report';
import {
  ExchangeError,
  type ExchangeLot,
  type ExchangeRejection,
  type ExchangeResult,
  type ExchangeSink,
  type ExchangeSinkFailure,
  type ReportInput,
  type VerdictInput,
} from './types';

export interface OesgExchangeConfig {
  readonly orgId: string;
  readonly sinks: readonly ExchangeSink[];
  readonly sourceOrigin?: string;
}

const TOPIC_LOT = 'oesg.exchange.lot';
const INTENT_EXCHANGE = 'oesg.exchange.run';

export class OesgExchangeEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sinks: readonly ExchangeSink[];
  private readonly sourceOrigin: string;
  private readonly inbox: VerdictInput[] = [];
  private readonly reportTotals = new Map<string, number>();

  constructor(wire: ArchWire, config: OesgExchangeConfig) {
    if (!config.orgId) {
      throw new ExchangeError('E_EXCHANGE_ORG', 'orgId 為必填, 無主額度不成立');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://exchange';
  }

  /** 接線第三站: 訂閱 oesg.audit.verdict, 稽核判定自動納入待掛清單 */
  listenTo(audit: OesgAuditEngine): void {
    audit.subscribe((verdict) => {
      this.inbox.push(verdict);
    });
  }

  /** 接線第二站: 訂閱 oesg.report.draft, 期報告量 (kgCo2e) 為掛牌權威映射 */
  linkReport(report: OesgReportEngine): void {
    report.subscribe((draft) => {
      this.reportTotals.set(draft.uuid, draft.totalKgCo2e);
    });
  }

  /** 手動納入稽核判定 (離線批次/歷史結晶場景) */
  ingestVerdict(verdict: VerdictInput): void {
    this.inbox.push(verdict);
  }

  /** 手動納入期報告量映射 */
  ingestReport(report: ReportInput): void {
    this.reportTotals.set(report.uuid, report.totalKgCo2e);
  }

  /** 註冊代理意圖: agent.understand('oesg.exchange.run') 即執行掛牌 */
  registerIntent(): void {
    this.wire.agent.onIntent(INTENT_EXCHANGE, async () => this.exchange());
  }

  /** 執行掛牌: 逐判定鑄造或拒掛 → 結晶 → 留痕 → 廣播 → 寫出 */
  async exchange(): Promise<Readonly<ExchangeResult>> {
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕掛牌寫入');
    }
    if (this.inbox.length === 0) {
      throw new ExchangeError('E_EXCHANGE_EMPTY', '待掛清單為空, 空掛牌不成立');
    }

    const lots: ExchangeLot[] = [];
    const rejections: ExchangeRejection[] = [];
    for (const verdict of this.inbox) {
      const rejection = this.screen(verdict);
      if (rejection) {
        rejections.push(rejection);
        await this.wire.memory.remember(
          `oesg://exchange/rejected/${verdict.uuid}`,
          rejection,
          ['oesg', 'exchange', 'rejected']
        );
        continue;
      }
      lots.push(await this.mint(verdict));
    }
    return Object.freeze({
      lots: lots.map((l) => Object.freeze(l)),
      rejections: Object.freeze([...rejections]),
    });
  }

  /** 掛牌資格審查 (零幻覺, 不信任上游旗標) */
  private screen(verdict: VerdictInput): ExchangeRejection | null {
    if (verdict.verdict !== 'clean') {
      return {
        verdictUuid: verdict.uuid,
        reason: 'E_VERDICT_FLAGGED',
        detail: `verdict = ${verdict.verdict}: ${verdict.findings.map((f) => f.code).join(', ') || '漂綠攔截'}`,
      };
    }
    if (!this.reportTotals.has(verdict.reportUuid)) {
      return {
        verdictUuid: verdict.uuid,
        reason: 'E_QUANTITY_UNKNOWN',
        detail: `report ${verdict.reportUuid} 之 kgCo2e 量未知, 無量不得掛牌`,
      };
    }
    return null;
  }

  /** 鑄造掛牌額度: 結晶 → 留痕 → 廣播 → 寫出 (sink 失敗不毀額度) */
  private async mint(verdict: VerdictInput): Promise<ExchangeLot> {
    const kgCo2e = this.reportTotals.get(verdict.reportUuid) as number;
    const lot: ExchangeLot = {
      uuid: `oesg-exchange.${randomUUID()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: this.orgId,
      verdictUuid: verdict.uuid,
      reportUuid: verdict.reportUuid,
      periodStart: verdict.periodStart,
      periodEnd: verdict.periodEnd,
      kgCo2e,
      status: 'listed',
      attestationHash: computeHash({
        verdictUuid: verdict.uuid,
        reportUuid: verdict.reportUuid,
        kgCo2e,
        orgId: this.orgId,
      }),
      failures: Object.freeze([]),
    };

    await this.wire.memory.remember(`oesg://exchange/${lot.uuid}`, lot, [
      'oesg',
      'exchange',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_LOT, lot));

    const failures: ExchangeSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(lot);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    return failures.length > 0 ? { ...lot, failures: Object.freeze(failures) } : lot;
  }

  /** 供第五站 DAO 及下游訂閱掛牌事件 */
  subscribe(listener: (lot: Readonly<ExchangeLot>) => void): void {
    this.wire.bus.subscribe(TOPIC_LOT, (event) => listener(event.payload as ExchangeLot));
  }
}
