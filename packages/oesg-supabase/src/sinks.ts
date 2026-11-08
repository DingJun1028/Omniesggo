/**
 * OESG Supabase 寫出埠 — PostgREST sink adapter
 *
 * 設計原則 (對齊 PR #118 RAG 層與 De-Google 政策):
 * - 零新依賴: 原生 fetch, 不引入 @supabase/supabase-js
 * - 憑證由呼叫端注入 (server-only service key), 本套件不接觸 .env
 * - fetch 可注入 (測試 mock), CI 零網路
 * - 表結構對應 migration oesg_pulse_report_tables (RLS 僅 service_role)
 */
import type { AuditSink, AuditVerdict } from '@esggo/oesg-audit';
import type { ExchangeLot, ExchangeSink } from '@esggo/oesg-exchange';
import type { PulseSink } from '@esggo/oesg-pulse';
import type { OesgReport, ReportSink } from '@esggo/oesg-report';

export interface PostgrestOptions {
  /** 專案 API URL, 例 https://achguefnmctyfprajdsl.supabase.co */
  readonly url: string;
  /** service role key (server-only, 唯寫入用) */
  readonly serviceKey: string;
  /** 覆寫表名 (預設 oesg_pulse_ticks / oesg_reports / oesg_audit_verdicts / oesg_exchange_lots) */
  readonly pulseTable?: string;
  readonly reportTable?: string;
  readonly auditTable?: string;
  readonly exchangeTable?: string;
  /** 測試注入用; 省略即用全域 fetch */
  readonly fetchImpl?: typeof fetch;
  readonly id?: string;
}

type FetchLike = typeof fetch;

const DEFAULT_PULSE_TABLE = 'oesg_pulse_ticks';
const DEFAULT_REPORT_TABLE = 'oesg_reports';
const DEFAULT_AUDIT_TABLE = 'oesg_audit_verdicts';
const DEFAULT_EXCHANGE_TABLE = 'oesg_exchange_lots';

async function postgrestInsert(
  fetchImpl: FetchLike,
  url: string,
  serviceKey: string,
  table: string,
  row: Record<string, unknown>
): Promise<void> {
  const response = await fetchImpl(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    throw new Error(`Supabase insert into ${table} failed: ${response.status} ${response.statusText}`);
  }
}

/** OESG-Pulse 結晶寫出埠 (PostgREST) */
export function createSupabasePulseSink(options: PostgrestOptions): PulseSink {
  const { url, serviceKey } = options;
  const table = options.pulseTable ?? DEFAULT_PULSE_TABLE;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  const id = options.id ?? `supabase-pulse-sink:${table}`;
  return {
    id,
    async write(tick) {
      await postgrestInsert(fetchImpl, url, serviceKey, table, {
        tick_uuid: tick.uuid,
        org_id: tick.orgId,
        period_start: tick.periodStart,
        period_end: tick.periodEnd,
        total_kgco2e: tick.totalKgCo2e,
        verified: tick.verified,
        attestation_hash: tick.attestationHash,
        payload: tick,
      });
    },
  };
}

/** OESG-Report 期報告寫出埠 (PostgREST) */
export function createSupabaseReportSink(options: PostgrestOptions): ReportSink {
  const { url, serviceKey } = options;
  const table = options.reportTable ?? DEFAULT_REPORT_TABLE;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  const id = options.id ?? `supabase-report-sink:${table}`;
  return {
    id,
    async write(report: Readonly<OesgReport>) {
      await postgrestInsert(fetchImpl, url, serviceKey, table, {
        report_uuid: report.uuid,
        org_id: report.orgId,
        period_start: report.periodStart,
        period_end: report.periodEnd,
        tick_count: report.tickCount,
        total_kgco2e: report.totalKgCo2e,
        verified: report.verified,
        attestation_hash: report.attestationHash,
        scope_shares: report.scopeShares,
        top_emission: report.topEmission,
        payload: report,
      });
    },
  };
}

/** OESG-Audit 稽核判定寫出埠 (PostgREST) — 表結構對應 migration oesg_audit_verdicts_table */
export function createSupabaseAuditSink(options: PostgrestOptions): AuditSink {
  const { url, serviceKey } = options;
  const table = options.auditTable ?? DEFAULT_AUDIT_TABLE;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  const id = options.id ?? `supabase-audit-sink:${table}`;
  return {
    id,
    async write(verdict: Readonly<AuditVerdict>) {
      await postgrestInsert(fetchImpl, url, serviceKey, table, {
        verdict_uuid: verdict.uuid,
        report_uuid: verdict.reportUuid,
        org_id: verdict.orgId,
        period_start: verdict.periodStart,
        period_end: verdict.periodEnd,
        verdict: verdict.verdict,
        findings: verdict.findings,
        attestation_hash: verdict.attestationHash,
        payload: verdict,
      });
    },
  };
}

/** OESG-Exchange 掛牌額度寫出埠 (PostgREST) — 表結構對應 migration oesg_exchange_lots_table */
export function createSupabaseExchangeSink(options: PostgrestOptions): ExchangeSink {
  const { url, serviceKey } = options;
  const table = options.exchangeTable ?? DEFAULT_EXCHANGE_TABLE;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  const id = options.id ?? `supabase-exchange-sink:${table}`;
  return {
    id,
    async write(lot: Readonly<ExchangeLot>) {
      await postgrestInsert(fetchImpl, url, serviceKey, table, {
        lot_uuid: lot.uuid,
        verdict_uuid: lot.verdictUuid,
        report_uuid: lot.reportUuid,
        org_id: lot.orgId,
        period_start: lot.periodStart,
        period_end: lot.periodEnd,
        kgco2e: lot.kgCo2e,
        status: lot.status,
        attestation_hash: lot.attestationHash,
        payload: lot,
      });
    },
  };
}
