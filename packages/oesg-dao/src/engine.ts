/**
 * OesgDaoEngine — OESG-DAO 減量額度治理引擎
 *
 * OESG 五路線圖第五站 (終站): Pulse → Report → Audit → Exchange → **DAO**。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 與前四站對稱:
 * - OmniBus: 訂閱 oesg.exchange.lot (listenTo) / 廣播 oesg.dao.trade
 * - OmniMemory: 治理交易結晶留痕 (tags: oesg/dao/carbon)
 * - OmniHealing: 戒嚴期間拒絕治理寫入 (治理鐵律)
 *
 * 治理鐵律 (零幻覺, 不信任上游):
 * - 僅掛牌額度可治理; 未知額度 E_LOT_UNKNOWN, 已治理額度 E_LOT_CONSUMED (雙花攔截)
 * - settle 交割必須有買方組織, 無買方不成立 (E_DAO_BUYER)
 * - attestationHash 鎖 lot/verdict/report/量/雙方組織/動作七方關聯, 供 SLL 追溯
 */
import { randomUUID } from 'node:crypto';
import { computeHash } from '@esggo/omni-core';
import { mintEvent, OmniArchError, type ArchWire } from '@esggo/omni-arch';
import type { OesgExchangeEngine } from '@esggo/oesg-exchange';
import {
  DaoError,
  type DaoAction,
  type DaoResult,
  type DaoSink,
  type DaoSinkFailure,
  type DaoTrade,
  type LotInput,
} from './types';

export interface OesgDaoConfig {
  readonly orgId: string;
  readonly sinks: readonly DaoSink[];
  readonly sourceOrigin?: string;
}

const TOPIC_TRADE = 'oesg.dao.trade';
const INTENT_DAO = 'oesg.dao.run';

export class OesgDaoEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sinks: readonly DaoSink[];
  private readonly sourceOrigin: string;
  private readonly lots = new Map<string, LotInput>();
  private readonly consumed = new Set<string>();

  constructor(wire: ArchWire, config: OesgDaoConfig) {
    if (!config.orgId) {
      throw new DaoError('E_DAO_ORG', 'orgId 為必填, 無主治理不成立');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://dao';
  }

  /** 接線第四站: 訂閱 oesg.exchange.lot, 掛牌額度自動納入待治理清單 */
  listenTo(exchange: OesgExchangeEngine): void {
    exchange.subscribe((lot) => {
      this.ingestLot(lot);
    });
  }

  /** 手動納入掛牌額度 (離線批次/歷史結晶場景) */
  ingestLot(lot: LotInput): void {
    this.lots.set(lot.uuid, lot);
  }

  /** 待治理掛牌額度數 (治理盤點用) */
  pendingCount(): number {
    return this.lots.size;
  }

  /** 註冊代理意圖: agent.understand('oesg.dao.run') 即批次治理全部待治理額度 */
  registerIntent(action: DaoAction = 'retire', buyerOrgId?: string): void {
    this.wire.agent.onIntent(INTENT_DAO, async () => this.runAll(action, buyerOrgId));
  }

  /** 交割治理: 掛牌額度移轉予買方組織 */
  async settle(lotUuid: string, buyerOrgId: string): Promise<Readonly<DaoTrade>> {
    if (!buyerOrgId) {
      throw new DaoError('E_DAO_BUYER', '交割必須有買方組織, 無買方不成立');
    }
    return this.consume(lotUuid, 'settle', buyerOrgId);
  }

  /** 註銷治理: 掛牌額度自持註銷封存 */
  async retire(lotUuid: string): Promise<Readonly<DaoTrade>> {
    return this.consume(lotUuid, 'retire', this.orgId);
  }

  /** 批次治理: 對全部待治理掛牌額度執行同一治理動作 */
  async runAll(action: DaoAction, buyerOrgId?: string): Promise<Readonly<DaoResult>> {
    if (action === 'settle' && !buyerOrgId) {
      throw new DaoError('E_DAO_BUYER', '交割必須有買方組織, 無買方不成立');
    }
    if (this.lots.size === 0) {
      throw new DaoError('E_DAO_EMPTY', '待治理掛牌清單為空, 空治理不成立');
    }
    const trades: DaoTrade[] = [];
    for (const lotUuid of [...this.lots.keys()]) {
      trades.push(
        await this.consume(lotUuid, action, action === 'settle' ? (buyerOrgId as string) : this.orgId)
      );
    }
    return Object.freeze({ trades: Object.freeze(trades) });
  }

  /** 治理資格審查 (零幻覺, 不信任上游): 未知/雙花/買方缺額逐項攔截 */
  private async consume(lotUuid: string, action: DaoAction, buyerOrgId: string): Promise<DaoTrade> {
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕治理寫入');
    }
    if (this.consumed.has(lotUuid)) {
      throw new DaoError('E_LOT_CONSUMED', '掛牌額度已治理, 雙花攔截');
    }
    const lot = this.lots.get(lotUuid);
    if (!lot) {
      throw new DaoError('E_LOT_UNKNOWN', '掛牌額度未知, 不得治理');
    }
    if (action === 'settle' && !buyerOrgId) {
      throw new DaoError('E_DAO_BUYER', '交割必須有買方組織, 無買方不成立');
    }
    // 先消耗再鑄造, 防非同步窗口雙花
    this.lots.delete(lotUuid);
    this.consumed.add(lotUuid);
    return this.mint(lot, action, buyerOrgId);
  }

  /** 鑄造治理交易: 結晶 → 留痕 → 廣播 → 寫出 (sink 失敗不毀治理交易) */
  private async mint(lot: LotInput, action: DaoAction, buyerOrgId: string): Promise<DaoTrade> {
    const trade: DaoTrade = {
      uuid: 'oesg-dao.' + randomUUID(),
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: this.orgId,
      buyerOrgId,
      lotUuid: lot.uuid,
      verdictUuid: lot.verdictUuid,
      reportUuid: lot.reportUuid,
      periodStart: lot.periodStart,
      periodEnd: lot.periodEnd,
      kgCo2e: lot.kgCo2e,
      action,
      status: action === 'settle' ? 'settled' : 'retired',
      attestationHash: computeHash({
        lotUuid: lot.uuid,
        verdictUuid: lot.verdictUuid,
        reportUuid: lot.reportUuid,
        kgCo2e: lot.kgCo2e,
        orgId: this.orgId,
        buyerOrgId,
        action,
      }),
      failures: Object.freeze([]),
    };

    await this.wire.memory.remember('oesg://dao/' + trade.uuid, trade, [
      'oesg',
      'dao',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_TRADE, trade));

    const failures: DaoSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(trade);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    return failures.length > 0 ? { ...trade, failures: Object.freeze(failures) } : trade;
  }

  /** 供下游 (SLL 稽核/對帳) 訂閱治理事件 */
  subscribe(listener: (trade: Readonly<DaoTrade>) => void): void {
    this.wire.bus.subscribe(TOPIC_TRADE, (event) => listener(event.payload as DaoTrade));
  }
}
