/**
 * OesgDaoEngine — OESG-DAO 額度治理引擎
 *
 * OESG 五路線圖終站: Pulse → Report → Audit → Exchange → **DAO**。
 * 復用 12大萬能模組管線 (@esggo/omni-arch), 與前四站對稱:
 * - OmniBus: 訂閱 oesg.exchange.lot (listenTo) / 廣播 oesg.dao.action
 * - OmniMemory: 治理動作與拒絕結晶留痕 (tags: oesg/dao/carbon|rejected)
 * - OmniHealing: 戒嚴期間拒絕治理寫入 (治理鐵律)
 *
 * 治理鐵律 (零幻覺, 不信任上游):
 * - 僅登記冊內額度可治理 (E_LOT_UNKNOWN)
 * - 已註銷額度不得再治理 (E_LOT_RETIRED; 每額度僅可註銷一次)
 * - 轉讓標的不得為原持有人 (E_TRANSFER_SELF)
 * - 轉讓必填受讓組織 (E_MISSING_OWNER)
 * - attestationHash 鎖 action/lot/verdict/report 關聯, 供 SLL 第三方追溯
 */
import { randomUUID } from 'node:crypto';
import { computeHash } from '@esggo/omni-core';
import { mintEvent, OmniArchError, type ArchWire } from '@esggo/omni-arch';
import type { OesgExchangeEngine } from '@esggo/oesg-exchange';
import {
  DaoError,
  type DaoAction,
  type DaoRejection,
  type DaoRequest,
  type DaoResult,
  type DaoSink,
  type DaoSinkFailure,
  type LotInput,
} from './types';

export interface OesgDaoConfig {
  readonly orgId: string;
  readonly sinks: readonly DaoSink[];
  readonly sourceOrigin?: string;
}

const TOPIC_ACTION = 'oesg.dao.action';
const TOPIC_LOT = 'oesg.exchange.lot';
const INTENT_DAO = 'oesg.dao.run';

/** 登記冊條目: 額度結晶 + 生死狀態 (註銷即終結) */
interface RegistryEntry {
  readonly lot: LotInput;
  retired: boolean;
}

export class OesgDaoEngine {
  readonly orgId: string;
  private readonly wire: ArchWire;
  private readonly sinks: readonly DaoSink[];
  private readonly sourceOrigin: string;
  private readonly registry = new Map<string, RegistryEntry>();
  private readonly requests: DaoRequest[] = [];

  constructor(wire: ArchWire, config: OesgDaoConfig) {
    if (!config.orgId) {
      throw new DaoError('E_DAO_ORG', 'orgId 為必填, 無主治理不成立');
    }
    this.wire = wire;
    this.orgId = config.orgId;
    this.sinks = [...config.sinks];
    this.sourceOrigin = config.sourceOrigin ?? 'oesg://dao';
  }

  /** 接線第四站: 訂閱 oesg.exchange.lot, 掛牌額度自動納入登記冊 */
  listenTo(exchange: OesgExchangeEngine): void {
    exchange.subscribe((lot) => {
      this.register(lot);
    });
  }

  /** 訂閱原始匯流排議題 (直連測試場景) */
  subscribeLotTopic(listener: (lot: LotInput) => void): void {
    this.wire.bus.subscribe(TOPIC_LOT, (event) => listener(event.payload as LotInput));
  }

  /** 手動納入掛牌額度 (離線批次/歷史結晶場景) */
  ingestLot(lot: LotInput): void {
    this.register(lot);
  }

  private register(lot: LotInput): void {
    if (!this.registry.has(lot.uuid)) {
      this.registry.set(lot.uuid, { lot, retired: false });
    }
  }

  /** 提交治理請求 (提案), 待 execute 批次執行 */
  propose(request: DaoRequest): void {
    this.requests.push(request);
  }

  /** 註冊代理意圖: agent.understand('oesg.dao.run') 即執行治理批次 */
  registerIntent(): void {
    this.wire.agent.onIntent(INTENT_DAO, async () => this.execute());
  }

  /** 執行治理: 逐請求審查 → 動作/拒絕結晶 → 留痕 → 廣播 → 寫出 */
  async execute(): Promise<Readonly<DaoResult>> {
    if (this.wire.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', '戒嚴期間拒絕治理寫入');
    }
    if (this.requests.length === 0) {
      throw new DaoError('E_DAO_EMPTY', '待治理清單為空, 空治理不成立');
    }

    const requests = [...this.requests];
    this.requests.length = 0;
    const actions: DaoAction[] = [];
    const rejections: DaoRejection[] = [];
    for (const request of requests) {
      const rejection = this.screen(request);
      if (rejection) {
        rejections.push(rejection);
        await this.wire.memory.remember(
          `oesg://dao/rejected/${rejection.lotUuid}`,
          rejection,
          ['oesg', 'dao', 'rejected']
        );
        continue;
      }
      actions.push(await this.settle(request));
    }
    return Object.freeze({
      actions: actions.map((a) => Object.freeze(a)),
      rejections: Object.freeze([...rejections]),
    });
  }

  /** 治理資格審查 (零幻覺, 不信任上游旗標) */
  private screen(request: DaoRequest): DaoRejection | null {
    const entry = this.registry.get(request.lotUuid);
    if (!entry) {
      return {
        lotUuid: request.lotUuid,
        reason: 'E_LOT_UNKNOWN',
        detail: `額度 ${request.lotUuid} 不在登記冊, 無登記不得治理`,
      };
    }
    if (entry.retired) {
      return {
        lotUuid: request.lotUuid,
        reason: 'E_LOT_RETIRED',
        detail: `額度 ${request.lotUuid} 已註銷, 不得再治理`,
      };
    }
    if (request.action === 'transfer') {
      if (!request.toOrgId) {
        return {
          lotUuid: request.lotUuid,
          reason: 'E_MISSING_OWNER',
          detail: '轉讓必填受讓組織 toOrgId',
        };
      }
      if (request.toOrgId === entry.lot.orgId) {
        return {
          lotUuid: request.lotUuid,
          reason: 'E_TRANSFER_SELF',
          detail: `轉讓標的 ${request.toOrgId} 為原持有人, 自轉讓不成立`,
        };
      }
    }
    return null;
  }

  /** 結算治理動作: 結晶 → 留痕 → 廣播 → 寫出 (sink 失敗不毀動作) */
  private async settle(request: DaoRequest): Promise<DaoAction> {
    const entry = this.registry.get(request.lotUuid) as RegistryEntry;
    const lot = entry.lot;
    const toOrgId = request.action === 'transfer' ? (request.toOrgId as string) : null;
    const action: DaoAction = {
      uuid: `oesg-dao.${randomUUID()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: this.sourceOrigin,
      orgId: lot.orgId,
      lotUuid: lot.uuid,
      verdictUuid: lot.verdictUuid,
      reportUuid: lot.reportUuid,
      kgCo2e: lot.kgCo2e,
      periodStart: lot.periodStart,
      periodEnd: lot.periodEnd,
      action: request.action,
      toOrgId,
      attestationHash: computeHash({
        lotUuid: lot.uuid,
        verdictUuid: lot.verdictUuid,
        reportUuid: lot.reportUuid,
        kgCo2e: lot.kgCo2e,
        action: request.action,
        toOrgId,
        orgId: lot.orgId,
      }),
      failures: Object.freeze([]),
    };

    // 註銷即終結: 每額度僅可註銷一次
    if (request.action === 'retire') {
      entry.retired = true;
    } else if (toOrgId) {
      // 轉讓後登記冊保有額度結晶, 所有權以動作鏈 (action chain) 追溯
    }

    // 治理存證: 額度量以掛牌結晶為權威, 治理動作不改量 (零幻覺)
    const quantityVerification = await this.wire.evidence.verify({
      standard: 'ISO-14064-1',
      formulaName: 'governed_kgco2e = lot_kgco2e * (status == listed ? 1 : 0)',
      inputs: { lotKgCo2e: lot.kgCo2e, listed: lot.status === 'listed' ? 1 : 0 },
      formula: (i) => i.lotKgCo2e * i.listed,
      expected: lot.kgCo2e,
    });
    if (!quantityVerification.passed) {
      throw new DaoError('E_DAO_QUANTITY', '額度量與掛牌結晶不符, 治理不成立');
    }

    await this.wire.memory.remember(`oesg://dao/${action.uuid}`, action, [
      'oesg',
      'dao',
      'carbon',
    ]);
    await this.wire.bus.publish(mintEvent(this.sourceOrigin, TOPIC_ACTION, action));

    const failures: DaoSinkFailure[] = [];
    for (const sink of this.sinks) {
      try {
        await sink.write(action);
      } catch (error) {
        failures.push({ sinkId: sink.id, error: String(error) });
      }
    }
    return failures.length > 0 ? { ...action, failures: Object.freeze(failures) } : action;
  }

  /** 供下游 (SLL/帳本) 訂閱治理動作 */
  subscribe(listener: (action: Readonly<DaoAction>) => void): void {
    this.wire.bus.subscribe(TOPIC_ACTION, (event) => listener(event.payload as DaoAction));
  }
}
