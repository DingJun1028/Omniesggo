/**
 * OESG-Pulse 可插拔寫出埠 (PulseSink) 具現工廠。
 *
 * Sink 為純邊界介面: 引擎不依賴任何雲端 SDK,
 * NCB / Supabase / 其他儲存皆以 adapter 形式接入 (De-Google 政策相容)。
 */
import type { PulseSink, PulseTick } from './types';

/**
 * 記憶體寫出埠 — 預設降級方案與測試用途。
 * 降級保證: 雲端埠全數不可用時, 脈動仍可於本地結晶, 不中斷監控。
 */
export function createMemorySink(id = 'memory-sink'): PulseSink & { ticks(): readonly PulseTick[] } {
  const ticks: PulseTick[] = [];
  return {
    id,
    async write(tick) {
      ticks.push(tick);
    },
    ticks() {
      return [...ticks];
    },
  };
}

/**
 * NCB (NoCodeBackend) 寫出埠 — 依 NCB-INTEGRATION-RUNBOOK 慣例:
 * POST {baseUrl}/write/{table}, Bearer token, JSON body。
 * 憑證由呼叫端注入 (server-only), 本套件不接觸 .env。
 */
export function createNcbSink(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  table: string;
  id?: string;
}): PulseSink {
  const { baseUrl, token, projectId, table } = options;
  const id = options.id ?? `ncb-sink:${projectId}/${table}`;
  return {
    id,
    async write(tick) {
      const response = await fetch(`${baseUrl}/write/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-NCB-Project': projectId,
        },
        body: JSON.stringify({
          org_id: tick.orgId,
          period_start: tick.periodStart,
          period_end: tick.periodEnd,
          total_kgco2e: tick.totalKgCo2e,
          verified: tick.verified,
          attestation_hash: tick.attestationHash,
          payload: JSON.stringify(tick),
        }),
      });
      if (!response.ok) {
        throw new Error(`NCB write failed: ${response.status} ${response.statusText}`);
      }
    },
  };
}
