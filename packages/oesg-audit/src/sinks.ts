/**
 * OESG-Audit 可插拔寫出埠 (AuditSink) 具現工廠。與前兩站對稱。
 */
import type { AuditSink, AuditVerdict } from './types';

/** 記憶體寫出埠 — 預設降級方案與測試用途 */
export function createMemoryAuditSink(id = 'memory-audit-sink'): AuditSink & { verdicts(): readonly AuditVerdict[] } {
  const verdicts: AuditVerdict[] = [];
  return {
    id,
    async write(verdict) {
      verdicts.push(verdict);
    },
    verdicts() {
      return [...verdicts];
    },
  };
}

/** NCB 寫出埠 — 依 NCB-INTEGRATION-RUNBOOK 慣例, 憑證由呼叫端注入 */
export function createNcbAuditSink(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  table: string;
  id?: string;
}): AuditSink {
  const { baseUrl, token, projectId, table } = options;
  const id = options.id ?? `ncb-audit-sink:${projectId}/${table}`;
  return {
    id,
    async write(verdict) {
      const response = await fetch(`${baseUrl}/write/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-NCB-Project': projectId,
        },
        body: JSON.stringify({
          org_id: verdict.orgId,
          report_uuid: verdict.reportUuid,
          period_start: verdict.periodStart,
          period_end: verdict.periodEnd,
          verdict: verdict.verdict,
          findings: verdict.findings,
          attestation_hash: verdict.attestationHash,
          payload: JSON.stringify(verdict),
        }),
      });
      if (!response.ok) {
        throw new Error(`NCB audit write failed: ${response.status} ${response.statusText}`);
      }
    },
  };
}
