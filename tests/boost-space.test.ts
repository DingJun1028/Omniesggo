/**
 * Boost.space Automation Client — 自動化引擎 (PRD F-09 / M5)
 *
 * 驗證需求: OMN-PRD-001 §4.1 FR-08 自動化工作流 → F-07 + F-09
 * 驗證方法: 工作流整合測試 — 鍛造產物 (F-07) → 情境映射 (F-09) → 傳輸契約
 * 以注入 fetch 測試，不對外發出任何真實請求。
 */

import { describe, it, expect } from 'vitest';
import { forge, type ForgingSpec } from '../src/lib/authority-forging';
import {
  createBoostSpaceClient,
  toBoostScenario,
  redactSecrets,
  BoostSpaceError,
  type BoostSpaceConfig,
} from '../src/lib/boost-space';

const TOKEN = 'bsp_super_secret_token_value';

interface FakeCall {
  url: string;
  init: RequestInit;
}

function fakeFetch(handler: (call: FakeCall, index: number) => { status?: number; body?: unknown }) {
  const calls: FakeCall[] = [];
  const impl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const call: FakeCall = { url: String(input), init: init ?? {} };
    const result = handler(call, calls.length);
    calls.push(call);
    const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body ?? {});
    return new Response(body, {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  return { impl: impl as typeof fetch, calls };
}

function configWith(overrides: Partial<BoostSpaceConfig> & { fetchImpl: typeof fetch }): BoostSpaceConfig {
  return {
    apiBase: 'https://automation.boost.space',
    token: TOKEN,
    workspaceId: 'ws_42',
    ...overrides,
  };
}

const workflowSpec = (): ForgingSpec => ({
  id: 'esg-nightly-sync',
  intent: 'Sync ESG metrics then seal the nightly report',
  kind: 'workflow',
  steps: [
    { id: 'pull', run: 'pnpm', args: ['run', 'metrics:pull'] },
    { id: 'seal', run: 'pnpm', args: ['run', 'report:seal'], needs: ['pull'], timeoutMs: 60000 },
  ],
  safety: { network: true, secrets: ['SUPABASE_SERVICE_KEY'], maxDurationMs: 600000 },
});

async function expectCode(fn: () => Promise<unknown> | unknown, code: string): Promise<void> {
  try {
    await fn();
    throw new Error(`expected ${code} but nothing was thrown`);
  } catch (error) {
    expect(error, `expected BoostSpaceError, got ${String(error)}`).toBeInstanceOf(BoostSpaceError);
    expect((error as BoostSpaceError).code).toBe(code);
  }
}

describe('Boost.space F-09 — 組態校驗 (configuration gate)', () => {
  const fetchImpl = fakeFetch(() => ({ body: {} })).impl;

  it('rejects a missing apiBase and a missing token', async () => {
    await expectCode(() => createBoostSpaceClient({ apiBase: '', token: TOKEN, fetchImpl }), 'CONFIG_MISSING_BASE');
    await expectCode(() => createBoostSpaceClient({ apiBase: '   ', token: TOKEN, fetchImpl }), 'CONFIG_MISSING_BASE');
    await expectCode(
      () => createBoostSpaceClient({ apiBase: 'https://automation.boost.space', token: '', fetchImpl }),
      'CONFIG_MISSING_TOKEN'
    );
    await expectCode(
      () => createBoostSpaceClient({ apiBase: 'https://automation.boost.space', token: undefined as unknown as string, fetchImpl }),
      'CONFIG_MISSING_TOKEN'
    );
  });

  it('rejects an apiBase containing whitespace', async () => {
    await expectCode(
      () => createBoostSpaceClient({ apiBase: 'https://automation.boost.space /api', token: TOKEN, fetchImpl }),
      'CONFIG_MISSING_BASE'
    );
  });
});

describe('Boost.space F-09 — 傳輸契約 (transport contract)', () => {
  it('sends bearer auth, workspace header and the documented endpoints', async () => {
    const { impl, calls } = fakeFetch(() => ({ body: [{ id: 's1', name: 'n', active: true }] }));
    const client = createBoostSpaceClient(configWith({ fetchImpl: impl }));

    await client.listScenarios();
    expect(calls[0].url).toBe('https://automation.boost.space/api/scenarios');
    expect(calls[0].init.method).toBe('GET');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Workspace-Id']).toBe('ws_42');

    await client.runScenario('s 1', { a: 1 });
    expect(calls[1].url).toBe('https://automation.boost.space/api/scenarios/s%201/run');
    expect(calls[1].init.method).toBe('POST');
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ input: { a: 1 } });

    await client.setScenarioActive('s1', true);
    expect(calls[2].url).toBe('https://automation.boost.space/api/scenarios/s1');
    expect(calls[2].init.method).toBe('PATCH');
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ active: true });
  });

  it('does not send a workspace header when workspaceId is absent', async () => {
    const { impl, calls } = fakeFetch(() => ({ body: [] }));
    const client = createBoostSpaceClient(configWith({ fetchImpl: impl, workspaceId: undefined }));
    await client.listScenarios();
    expect((calls[0].init.headers as Record<string, string>)['X-Workspace-Id']).toBeUndefined();
  });

  it('surfaces non-retryable HTTP failures with status and no token', async () => {
    const { impl } = fakeFetch(() => ({ status: 401, body: { error: `denied for Bearer ${TOKEN}` } }));
    const client = createBoostSpaceClient(configWith({ fetchImpl: impl }));
    try {
      await client.listScenarios();
      throw new Error('expected failure');
    } catch (error) {
      expect(error).toBeInstanceOf(BoostSpaceError);
      const err = error as BoostSpaceError;
      expect(err.code).toBe('HTTP_ERROR');
      expect(err.status).toBe(401);
      expect(err.message).not.toContain(TOKEN);
      expect(err.message).toContain('Bearer ***');
    }
  });

  it('retries 429/5xx with backoff, then succeeds', async () => {
    const sleeps: number[] = [];
    const { impl, calls } = fakeFetch((_call, index) =>
      index < 2
        ? { status: 503, body: { error: 'unavailable' } }
        : { body: [{ id: 'ok', name: 'n', active: false }] }
    );
    const client = createBoostSpaceClient(
      configWith({ fetchImpl: impl, sleepImpl: async (ms) => void sleeps.push(ms) })
    );

    const result = await client.listScenarios();
    expect(calls).toHaveLength(3);
    expect(result[0].id).toBe('ok');
    expect(sleeps).toEqual([200, 400]);
  });

  it('gives up after maxRetries and reports RETRIES_EXHAUSTED', async () => {
    const { impl, calls } = fakeFetch(() => ({ status: 500, body: { error: 'boom' } }));
    const client = createBoostSpaceClient(
      configWith({ fetchImpl: impl, maxRetries: 1, sleepImpl: async () => {} })
    );
    try {
      await client.listScenarios();
      throw new Error('expected failure');
    } catch (error) {
      expect((error as BoostSpaceError).code).toBe('RETRIES_EXHAUSTED');
    }
    expect(calls).toHaveLength(2);
  });

  it('maps network failures to NETWORK_ERROR with redaction', async () => {
    const impl = (async () => {
      throw new Error(`ECONNREFUSED while sending Bearer ${TOKEN}`);
    }) as typeof fetch;
    const client = createBoostSpaceClient(configWith({ fetchImpl: impl, maxRetries: 0 }));
    try {
      await client.listScenarios();
      throw new Error('expected failure');
    } catch (error) {
      expect((error as BoostSpaceError).code).toBe('NETWORK_ERROR');
      expect((error as BoostSpaceError).message).not.toContain(TOKEN);
      expect((error as BoostSpaceError).message).toContain('***');
    }
  });

  it('redactSecrets removes raw tokens, Bearer values and query-string secrets', () => {
    const config = { apiBase: 'https://x', token: TOKEN };
    expect(redactSecrets(`failed: ${TOKEN}`, config)).toBe('failed: ***');
    expect(redactSecrets(`Authorization: Bearer ${TOKEN}`, config)).toContain('Bearer ***');
    expect(redactSecrets('https://x/hook?access_token=abc123&y=1', config)).toBe(
      'https://x/hook?access_token=***&y=1'
    );
  });
});

describe('Boost.space F-09 — 鍛造產物映射 (F-07 → F-09 integration)', () => {
  it('maps a forged workflow into a scenario with provenance digest', () => {
    const forged = forge(workflowSpec());
    const scenario = toBoostScenario(forged);

    expect(scenario.definition.name).toBe('esg-nightly-sync');
    expect(scenario.definition.intent).toContain('Sync ESG metrics');
    expect(scenario.definition.active, 'pushed scenarios stay inactive until reviewed').toBe(false);
    expect(scenario.definition.network).toBe(true);
    expect(scenario.definition.maxDurationMs).toBe(600000);
    expect(scenario.definition.requiredSecrets).toEqual(['SUPABASE_SERVICE_KEY']);
    expect(scenario.definition.order).toEqual(['pull', 'seal']);

    expect(scenario.definition.modules).toHaveLength(2);
    expect(scenario.definition.modules[0]).toMatchObject({
      position: 1,
      key: 'pull',
      module: 'pnpm',
      parameters: ['run', 'metrics:pull'],
      dependsOn: [],
    });
    expect(scenario.definition.modules[1]).toMatchObject({
      position: 2,
      key: 'seal',
      dependsOn: ['pull'],
      timeoutMs: 60000,
    });

    expect(scenario.provenance).toEqual({
      source: 'authority-forging',
      specId: 'esg-nightly-sync',
      digest: forged.digest,
      stepCount: 2,
    });
  });

  it('rejects non-workflow forged scripts', () => {
    const shell = forge({ ...workflowSpec(), kind: 'shell' });
    expect(() => toBoostScenario(shell)).toThrowError(BoostSpaceError);
    try {
      toBoostScenario(shell);
    } catch (error) {
      expect((error as BoostSpaceError).code).toBe('SCENARIO_NOT_WORKFLOW');
    }
  });

  it('pushForgedWorkflow posts the scenario and echoes the 5T digest', async () => {
    const forged = forge(workflowSpec());
    const { impl, calls } = fakeFetch(() => ({ status: 201, body: { id: 'scn_9', name: 'esg-nightly-sync', active: false } }));
    const client = createBoostSpaceClient(configWith({ fetchImpl: impl }));

    const record = await client.pushForgedWorkflow(forged);

    expect(record.id).toBe('scn_9');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://automation.boost.space/api/scenarios');
    expect(calls[0].init.method).toBe('POST');

    const body = JSON.parse(String(calls[0].init.body)) as {
      metadata: { source: string; digest: string; specId: string };
      modules: unknown[];
      requiredSecrets: string[];
    };
    expect(body.metadata.source).toBe('authority-forging');
    expect(body.metadata.digest).toBe(forged.digest);
    expect(body.metadata.specId).toBe('esg-nightly-sync');
    expect(body.modules).toHaveLength(2);
    expect(body.requiredSecrets).toEqual(['SUPABASE_SERVICE_KEY']);
    expect(String(calls[0].init.body)).not.toContain(TOKEN);
  });
});
