/**
 * OESG-Report 型別契約 — 報告生成 (OESG 五路線圖次站)
 *
 * MECE 邊界:
 * - 輸入: PulseTick 結晶 (由 oesg.pulse.tick 廣播或直接 ingest)
 * - 輸出: OesgReport 期報告結晶 (彙整 + 驗算 + 溯源)
 * - ReportSink: 可插拔寫出埠 (memory/NCB), 與 PulseSink 對稱
 */
import type { CarbonScope, PulseTick } from '@esggo/oesg-pulse';

/** 範疇佔比 (0-1) */
export interface ScopeShare {
  readonly scope: CarbonScope;
  readonly kgCo2e: number;
  readonly share: number;
}

/** 最高排放源 (熱點定位, 供減量決策) */
export interface TopEmission {
  readonly sourceId: string;
  readonly kgCo2e: number;
}

/** 期報告結晶: 對齊 IComponentCore 欄位 (uuid/version/timestamp/source_origin) */
export interface OesgReport {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly tickCount: number;
  readonly totalKgCo2e: number;
  readonly scopeShares: readonly ScopeShare[];
  readonly topEmission: TopEmission | null;
  readonly verified: boolean;
  readonly attestationHash: string;
  readonly failures: readonly ReportSinkFailure[];
}

/** 寫出埠失敗結晶: sink 失敗不毀報告, 留痕供自癒 */
export interface ReportSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** 報告寫出埠 (可插拔: 記憶體/NCB) */
export interface ReportSink {
  readonly id: string;
  write(report: Readonly<OesgReport>): Promise<void>;
}

export class ReportError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReportError';
    this.code = code;
  }
}

/** 供 compile 驗算用之輸入摘要 */
export interface ReportInputs {
  readonly tickTotals: readonly number[];
  readonly scopeTotals: readonly number[];
}

export type TickInput = Readonly<PulseTick>;
