/**
 * OESG-DAO 型別契約 — 額度治理 (OESG 五路線圖終站)
 *
 * MECE 邊界:
 * - 輸入: ExchangeLot 掛牌額度 (由 oesg.exchange.lot 廣播或直接 ingestLot)
 * - 治理: transfer 轉讓所有權 / retire 終結註銷; 每額度僅可註銷一次
 * - DaoSink: 可插拔寫出埠, 與 Pulse/Report/Audit/Exchange 對稱
 */
import type { ExchangeLot } from '@esggo/oesg-exchange';

/** 治理動作: transfer 轉讓 / retire 註銷 */
export type DaoActionKind = 'transfer' | 'retire';

/** 治理請求 (提案): 額度唯一, 動作由呼叫端指定 */
export interface DaoRequest {
  readonly lotUuid: string;
  readonly action: DaoActionKind;
  /** transfer 必填: 受讓組織 */
  readonly toOrgId?: string;
}

/** 治理動作結晶: 對齊 IComponentCore 欄位 */
export interface DaoAction {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly lotUuid: string;
  readonly verdictUuid: string;
  readonly reportUuid: string;
  readonly kgCo2e: number;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly action: DaoActionKind;
  /** transfer: 受讓組織; retire: null */
  readonly toOrgId: string | null;
  readonly attestationHash: string;
  readonly failures: readonly DaoSinkFailure[];
}

/** 治理拒絕結晶: 違反治理鐵律之請求留痕供追溯 */
export interface DaoRejection {
  readonly lotUuid: string;
  readonly reason:
    | 'E_LOT_UNKNOWN'
    | 'E_LOT_RETIRED'
    | 'E_TRANSFER_SELF'
    | 'E_MISSING_OWNER';
  readonly detail: string;
}

/** 一次治理作業之結果 (動作與拒絕皆如實回報, 零幻覺) */
export interface DaoResult {
  readonly actions: readonly Readonly<DaoAction>[];
  readonly rejections: readonly DaoRejection[];
}

/** 寫出埠失敗結晶: sink 失敗不毀動作, 留痕供自癒 */
export interface DaoSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** 治理寫出埠 (可插拔: 記憶體/NCB/Supabase) */
export interface DaoSink {
  readonly id: string;
  write(action: Readonly<DaoAction>): Promise<void>;
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
