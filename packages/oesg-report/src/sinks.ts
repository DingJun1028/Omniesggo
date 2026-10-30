/**
 * OESG-Report 可插拔寫出埠 (ReportSink) 具現工廠。
 * 與 oesg-pulse 之 sinks 對稱: 引擎不依賴任何雲端 SDK,
 * NCB / Supabase 皆以 adapter 形式接入 (De-Google 政策相容)。
 */
import type { OesgReport, ReportSink } from './types';

/** 記憶體寫出埠 — 預設降級方案與測試用途 */
export function createMemoryReportSink(id = 'memory-report-sink'): ReportSink & { reports(): readonly OesgReport[] } {
  const reports: OesgReport[] = [];
  return {
    id,
    async write(report) {
      reports.push(report);
    },
    reports() {
      return [...reports];
    },
  };
}

/** NCB 寫出埠 — 依 NCB-INTEGRATION-RUNBOOK 慣例, 憑證由呼叫端注入 */
export function createNcbReportSink(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  table: string;
  id?: string;
}): ReportSink {
  const { baseUrl, token, projectId, table } = options;
  const id = options.id ?? `ncb-report-sink:${projectId}/${table}`;
  return {
    id,
    async write(report) {
      const response = await fetch(`${baseUrl}/write/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-NCB-Project': projectId,
        },
        body: JSON.stringify({
          org_id: report.orgId,
          period_start: report.periodStart,
          period_end: report.periodEnd,
          tick_count: report.tickCount,
          total_kgco2e: report.totalKgCo2e,
          verified: report.verified,
          attestation_hash: report.attestationHash,
          payload: JSON.stringify(report),
        }),
      });
      if (!response.ok) {
        throw new Error(`NCB report write failed: ${response.status} ${response.statusText}`);
      }
    },
  };
}
