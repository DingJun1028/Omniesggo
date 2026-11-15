/**
 * OESG-Exchange 可插拔寫出埠 (ExchangeSink) 具現工廠。與前三站對稱。
 */
import type { ExchangeSink, ExchangeLot } from './types';

/** 記憶體寫出埠 — 預設降級方案與測試用途 */
export function createMemoryExchangeSink(
  id = 'memory-exchange-sink'
): ExchangeSink & { lots(): readonly ExchangeLot[] } {
  const lots: ExchangeLot[] = [];
  return {
    id,
    async write(lot) {
      lots.push(lot);
    },
    lots() {
      return [...lots];
    },
  };
}

/** NCB 寫出埠 — 依 NCB-INTEGRATION-RUNBOOK 慣例, 憑證由呼叫端注入 */
export function createNcbExchangeSink(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  table: string;
  id?: string;
}): ExchangeSink {
  const { baseUrl, token, projectId, table } = options;
  const id = options.id ?? `ncb-exchange-sink:${projectId}/${table}`;
  return {
    id,
    async write(lot) {
      const response = await fetch(`${baseUrl}/write/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-NCB-Project': projectId,
        },
        body: JSON.stringify({
          org_id: lot.orgId,
          lot_uuid: lot.uuid,
          verdict_uuid: lot.verdictUuid,
          report_uuid: lot.reportUuid,
          period_start: lot.periodStart,
          period_end: lot.periodEnd,
          kgco2e: lot.kgCo2e,
          status: lot.status,
          attestation_hash: lot.attestationHash,
          payload: JSON.stringify(lot),
        }),
      });
      if (!response.ok) {
        throw new Error(`NCB exchange write failed: ${response.status} ${response.statusText}`);
      }
    },
  };
}
