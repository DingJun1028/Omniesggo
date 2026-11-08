import { describe, expect, it } from 'vitest';
import {
  createSupabaseAuditSink,
  createSupabaseExchangeSink,
  createSupabasePulseSink,
  createSupabaseReportSink,
  type PostgrestOptions,
} from '../src';

const BASE: PostgrestOptions = {
  url: 'https://demo.supabase.co',
  serviceKey: 'test-service-key',
};

/** 注入 mock fetch, 錄製請求 */
function mockFetch(status = 201) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(null, { status });
  };
  return { calls, impl: impl as unknown as typeof fetch };
}

/** 一枚最小 PulseTick 樣本 */
function sampleTick() {
  return {
    uuid: 'oesg-pulse.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://pulse',
    orgId: 'org-demo',
    periodStart: 10,
    periodEnd: 20,
    readings: [],
    emissions: [{ scope: 'S2', kgCo2e: 592.8 }],
    totalKgCo2e: 592.8,
    verified: true,
    attestationHash: 'a'.repeat(64),
    failures: [],
  };
}

function sampleReport() {
  return {
    uuid: 'oesg-report.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://report',
    orgId: 'org-demo',
    periodStart: 10,
    periodEnd: 20,
    tickCount: 1,
    totalKgCo2e: 592.8,
    scopeShares: [{ scope: 'S2', kgCo2e: 592.8, share: 1 }],
    topEmission: { sourceId: 'electricity', kgCo2e: 592.8 },
    verified: true,
    attestationHash: 'b'.repeat(64),
    failures: [],
  };
}

function sampleVerdict() {
  return {
    uuid: 'oesg-audit.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://audit',
    orgId: 'org-demo',
    reportUuid: 'oesg-report.1',
    periodStart: 10,
    periodEnd: 20,
    verdict: 'flagged',
    findings: [{ code: 'E_SHARE_NOT_CLOSED', detail: 'Σ ≠ 1' }],
    attestationHash: 'c'.repeat(64),
    failures: [],
  };
}

function sampleLot() {
  return {
    uuid: 'oesg-exchange.1',
    version: '1.0.0',
    timestamp: 1,
    source_origin: 'oesg://exchange',
    orgId: 'org-demo',
    verdictUuid: 'oesg-audit.1',
    reportUuid: 'oesg-report.1',
    periodStart: 10,
    periodEnd: 20,
    kgCo2e: 592.8,
    status: 'listed',
    attestationHash: 'd'.repeat(64),
    failures: [],
  };
}

describe('OESG Supabase sink adapter (PostgREST 零依賴)', () => {
  it('pulse sink: 正確端點、service key 標頭與列映射', async () => {
    const { calls, impl } = mockFetch();
    const sink = createSupabasePulseSink({ ...BASE, fetchImpl: impl });

    await sink.write(sampleTick() as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://demo.supabase.co/rest/v1/oesg_pulse_ticks');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-service-key');
    expect(headers.apikey).toBe('test-service-key');
    expect(headers.Prefer).toBe('return=minimal');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.tick_uuid).toBe('oesg-pulse.1');
    expect(body.org_id).toBe('org-demo');
    expect(body.total_kgco2e).toBe(592.8);
    expect(body.attestation_hash).toHaveLength(64);
    expect(body.payload.uuid).toBe('oesg-pulse.1');
  });

  it('report sink: 列映射含 tick_count/scope_shares/top_emission', async () => {
    const { calls, impl } = mockFetch();
    const sink = createSupabaseReportSink({ ...BASE, fetchImpl: impl });

    await sink.write(sampleReport() as never);

    expect(calls[0].url).toBe('https://demo.supabase.co/rest/v1/oesg_reports');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.report_uuid).toBe('oesg-report.1');
    expect(body.tick_count).toBe(1);
    expect(body.scope_shares).toEqual([{ scope: 'S2', kgCo2e: 592.8, share: 1 }]);
    expect(body.top_emission.sourceId).toBe('electricity');
  });

  it('非 2xx 回應轉為明確錯誤 (供引擎 failures 結晶留痕)', async () => {
    const { impl } = mockFetch(403);
    const sink = createSupabasePulseSink({ ...BASE, fetchImpl: impl });

    await expect(sink.write(sampleTick() as never)).rejects.toThrowError(
      /Supabase insert into oesg_pulse_ticks failed: 403/
    );
  });

  it('表名可覆寫 (分支/測試 schema)', async () => {
    const { calls, impl } = mockFetch();
    const sink = createSupabasePulseSink({ ...BASE, fetchImpl: impl, pulseTable: 'oesg_pulse_ticks_staging' });

    await sink.write(sampleTick() as never);

    expect(calls[0].url).toContain('oesg_pulse_ticks_staging');
  });

  it('sink id 命名與預設表', () => {
    expect(createSupabasePulseSink(BASE).id).toBe('supabase-pulse-sink:oesg_pulse_ticks');
    expect(createSupabaseReportSink(BASE).id).toBe('supabase-report-sink:oesg_reports');
    expect(createSupabaseAuditSink(BASE).id).toBe('supabase-audit-sink:oesg_audit_verdicts');
    expect(createSupabaseExchangeSink(BASE).id).toBe('supabase-exchange-sink:oesg_exchange_lots');
  });

  it('audit sink: 正確端點與列映射 (verdict/findings/attestation_hash)', async () => {
    const { calls, impl } = mockFetch();
    const sink = createSupabaseAuditSink({ ...BASE, fetchImpl: impl });

    await sink.write(sampleVerdict() as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://demo.supabase.co/rest/v1/oesg_audit_verdicts');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.verdict_uuid).toBe('oesg-audit.1');
    expect(body.report_uuid).toBe('oesg-report.1');
    expect(body.org_id).toBe('org-demo');
    expect(body.verdict).toBe('flagged');
    expect(body.findings).toEqual([{ code: 'E_SHARE_NOT_CLOSED', detail: 'Σ ≠ 1' }]);
    expect(body.attestation_hash).toHaveLength(64);
    expect(body.payload.verdict).toBe('flagged');
  });

  it('exchange sink: 正確端點與列映射 (lot_uuid/kgco2e/status)', async () => {
    const { calls, impl } = mockFetch();
    const sink = createSupabaseExchangeSink({ ...BASE, fetchImpl: impl });

    await sink.write(sampleLot() as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://demo.supabase.co/rest/v1/oesg_exchange_lots');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.lot_uuid).toBe('oesg-exchange.1');
    expect(body.verdict_uuid).toBe('oesg-audit.1');
    expect(body.report_uuid).toBe('oesg-report.1');
    expect(body.kgco2e).toBe(592.8);
    expect(body.status).toBe('listed');
    expect(body.attestation_hash).toHaveLength(64);
    expect(body.payload.uuid).toBe('oesg-exchange.1');
  });

  it('exchange sink: 非 2xx 轉明確錯誤', async () => {
    const { impl } = mockFetch(403);
    const sink = createSupabaseExchangeSink({ ...BASE, fetchImpl: impl });
    await expect(sink.write(sampleLot() as never)).rejects.toThrowError(
      /Supabase insert into oesg_exchange_lots failed: 403/
    );
  });

  it('audit sink: 非 2xx 轉明確錯誤', async () => {
    const { impl } = mockFetch(403);
    const sink = createSupabaseAuditSink({ ...BASE, fetchImpl: impl });
    await expect(sink.write(sampleVerdict() as never)).rejects.toThrowError(
      /Supabase insert into oesg_audit_verdicts failed: 403/
    );
  });
});
