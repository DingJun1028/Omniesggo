/**
 * OESG-Audit 型別契約 — 漂綠稽核 (OESG 五路線圖第三站)
 *
 * MECE 邊界:
 * - 輸入: OesgReport 期報告結晶 (由 oesg.report.draft 廣播或直接 ingest)
 * - 判定: AuditVerdict clean/flagged + findings 逐項違規軌跡
 * - AuditSink: 可插拔寫出埠, 與 Pulse/Report 對稱
 */
import type { OesgReport } from '@esggo/oesg-report';

/** 稽核判定 */
export type AuditVerdictValue = 'clean' | 'flagged';

/** 逐項稽核發現 (漂綠軌跡) */
export interface AuditFinding {
  readonly code: string;
  readonly detail: string;
}

/** 稽核判定結晶: 對齊 IComponentCore 欄位 */
export interface AuditVerdict {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly reportUuid: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly verdict: AuditVerdictValue;
  readonly findings: readonly AuditFinding[];
  readonly attestationHash: string;
  readonly failures: readonly AuditSinkFailure[];
}

/** 寫出埠失敗結晶: sink 失敗不毀判定, 留痕供自癒 */
export interface AuditSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** 稽核寫出埠 (可插拔: 記憶體/NCB/Supabase) */
export interface AuditSink {
  readonly id: string;
  write(verdict: Readonly<AuditVerdict>): Promise<void>;
}

export class AuditError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuditError';
    this.code = code;
  }
}

export type ReportInput = Readonly<OesgReport>;
