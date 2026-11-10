/**
 * OESG-DAO 可插拔寫出埠 (DaoSink) 具現工廠。與前四站對稱。
 */
import type { DaoSink, DaoTrade } from './types';

/** 記憶體寫出埠 — 預設降級方案與測試用途 */
export function createMemoryDaoSink(
  id = 'memory-dao-sink'
): DaoSink & { trades(): readonly DaoTrade[] } {
  const trades: DaoTrade[] = [];
  return {
    id,
    async write(trade) {
      trades.push(trade);
    },
    trades() {
      return [...trades];
    },
  };
}

/** NCB 寫出埠 — 依 NCB-INTEGRATION-RUNBOOK 慣例, 憑證由呼叫端注入 */
export function createNcbDaoSink(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  table: string;
  id?: string;
}): DaoSink {
  const { baseUrl, token, projectId, table } = options;
  const id = options.id ?? 'ncb-dao-sink:' + projectId + '/' + table;
  return {
    id,
    async write(trade) {
      const response = await fetch(baseUrl + '/write/' + table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
          'X-NCB-Project': projectId,
        },
        body: JSON.stringify({
          org_id: trade.orgId,
          buyer_org_id: trade.buyerOrgId,
          trade_uuid: trade.uuid,
          lot_uuid: trade.lotUuid,
          verdict_uuid: trade.verdictUuid,
          report_uuid: trade.reportUuid,
          period_start: trade.periodStart,
          period_end: trade.periodEnd,
          kgco2e: trade.kgCo2e,
          action: trade.action,
          status: trade.status,
          attestation_hash: trade.attestationHash,
          payload: JSON.stringify(trade),
        }),
      });
      if (!response.ok) {
        throw new Error('NCB dao write failed: ' + response.status + ' ' + response.statusText);
      }
    },
  };
}
