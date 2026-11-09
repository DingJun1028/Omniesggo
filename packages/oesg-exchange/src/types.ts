/**
 * OESG-Exchange 型別契約 — 減量額度交易所 (OESG 五路線圖第四站)
 *
 * MECE 邊界:
 * - 輸入: AuditVerdict 稽核判定 (由 oesg.audit.verdict 廣播或直接 ingestVerdict)
 *         + OesgReport 期報告 (linkReport 提供額度量 kgCo2e 之權威映射)
 * - 鑄造: 僅 clean 判定 → ExchangeLot 掛牌額度; flagged/量未知 → ExchangeRejection 拒掛留痕
 * - ExchangeSink: 可插拔寫出埠, 與 Pulse/Report/Audit 對稱
 */
import type { AuditVerdict } from '@esggo/oesg-audit';
import type { OesgReport } from '@esggo/oesg-report';

/** 掛牌狀態 (掛牌即結晶; 交易/註銷屬第五站 DAO 治理範疇) */
export type ExchangeLotStatus = 'listed';

/** 掛牌減量額度結晶: 對齊 IComponentCore 欄位 */
export interface ExchangeLot {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly verdictUuid: string;
  readonly reportUuid: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly kgCo2e: number;
  readonly status: ExchangeLotStatus;
  readonly attestationHash: string;
  readonly failures: readonly ExchangeSinkFailure[];
}

/** 拒掛結晶: flagged 判定或量未知之額度不得掛牌, 留痕供治理追溯 */
export interface ExchangeRejection {
  readonly verdictUuid: string;
  readonly reason: 'E_VERDICT_FLAGGED' | 'E_QUANTITY_UNKNOWN';
  readonly detail: string;
}

/** 一次掛牌作業之結果 (額度與拒掛皆如實回報, 零幻覺) */
export interface ExchangeResult {
  readonly lots: readonly Readonly<ExchangeLot>[];
  readonly rejections: readonly ExchangeRejection[];
}

/** 寫出埠失敗結晶: sink 失敗不毀額度, 留痕供自癒 */
export interface ExchangeSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** 交易所寫出埠 (可插拔: 記憶體/NCB/Supabase) */
export interface ExchangeSink {
  readonly id: string;
  write(lot: Readonly<ExchangeLot>): Promise<void>;
}

export class ExchangeError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ExchangeError';
    this.code = code;
  }
}

export type VerdictInput = Readonly<AuditVerdict>;
export type ReportInput = Readonly<OesgReport>;
