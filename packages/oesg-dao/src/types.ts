/**
 * OESG-DAO 型別契約 — 減量額度治理引擎 (OESG 五路線圖第五站)
 *
 * MECE 邊界:
 * - 輸入: ExchangeLot 掛牌額度 (由 oesg.exchange.lot 廣播或直接 ingestLot)
 * - 治理: settle 交割 (買方組織承接) / retire 註銷 (自持註銷) → DaoTrade 治理結晶
 * - 每枚掛牌額度僅可治理一次 (雙花攔截 E_LOT_CONSUMED)
 * - DaoSink: 可插拔寫出埠, 與前四站對稱
 */
import type { ExchangeLot } from '@esggo/oesg-exchange';

/** 治理動作: settle = 交割移轉, retire = 註銷封存 */
export type DaoAction = 'settle' | 'retire';

/** 治理結晶狀態 */
export type DaoTradeStatus = 'settled' | 'retired';

/** DAO 治理交易結晶: 對齊 IComponentCore 欄位 */
export interface DaoTrade {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  /** 賣方 (掛牌) 組織 */
  readonly orgId: string;
  /** 買方組織; retire 時為 orgId 自持註銷 */
  readonly buyerOrgId: string;
  readonly lotUuid: string;
  readonly verdictUuid: string;
  readonly reportUuid: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly kgCo2e: number;
  readonly action: DaoAction;
  readonly status: DaoTradeStatus;
  readonly attestationHash: string;
  readonly failures: readonly DaoSinkFailure[];
}

/** 一次治理批次作業之結果 (零幻覺, 如實回報) */
export interface DaoResult {
  readonly trades: readonly Readonly<DaoTrade>[];
}

/** 寫出埠失敗結晶: sink 失敗不毀治理交易, 留痕供自癒 */
export interface DaoSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** DAO 寫出埠 (可插拔: 記憶體/NCB/Supabase) */
export interface DaoSink {
  readonly id: string;
  write(trade: Readonly<DaoTrade>): Promise<void>;
}

export class DaoError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DaoError';
    this.code = code;
  }
}

export type LotInput = Readonly<ExchangeLot>;
