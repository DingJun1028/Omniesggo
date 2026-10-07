// ═══════════════════════════════════════════════════════════════
// Boost.space Automation Client — 自動化引擎 Boost.space 整合 (F-09 / M5)
// Convention: 英標繁博 (English Standard, Traditional Chinese Broad)
// PRD: docs/OMN-PRD-001.md §2.3 F-09 (L4 能力層) · §5.1 M5 · §4.1 FR-08
//
// Bridges the Authority Forging workflow output (F-07) into Boost.space
// scenarios, with bounded retry, explicit errors and no secret leakage.
// 將權能鍛造 (F-07) 的 workflow 產物橋接為 Boost.space 情境，含限次重試、
// 明確錯誤與秘密不外洩。
// ═══════════════════════════════════════════════════════════════

import type { ForgedScript } from '../authority-forging';

// ─── Types ──────────────────────────────────────────────────

export interface BoostSpaceConfig {
  /** e.g. https://automation.boost.space (no trailing slash) */
  apiBase: string;
  token: string;
  workspaceId?: string;
  /** Injectable for tests — 測試注入用 */
  fetchImpl?: typeof fetch;
  /** Retries on 429/5xx and network errors (default 2) */
  maxRetries?: number;
  sleepImpl?: (ms: number) => Promise<void>;
}

export interface BoostScenarioDefinition {
  name: string;
  intent: string;
  active: boolean;
  network: boolean | null;
  maxDurationMs: number | null;
  requiredSecrets: string[];
  order: string[];
  modules: Array<{
    position: number;
    key: string;
    module: string;
    parameters: string[];
    environment: Record<string, string>;
    dependsOn: string[];
    timeoutMs: number | null;
  }>;
}

export interface BoostScenarioProvenance {
  source: 'authority-forging';
  specId: string;
  digest: string;
  stepCount: number;
}

export interface BoostScenario {
  definition: BoostScenarioDefinition;
  provenance: BoostScenarioProvenance;
}

export interface BoostSpaceScenarioRecord {
  id: string;
  name: string;
  active: boolean;
}

export type BoostSpaceErrorCode =
  | 'CONFIG_MISSING_TOKEN'
  | 'CONFIG_MISSING_BASE'
  | 'SCENARIO_NOT_WORKFLOW'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'RETRIES_EXHAUSTED';

export class BoostSpaceError extends Error {
  readonly code: BoostSpaceErrorCode;
  readonly status?: number;
  constructor(code: BoostSpaceErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'BoostSpaceError';
    this.code = code;
    this.status = status;
  }
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 200;
const MAX_BODY_IN_MESSAGE = 400;

// Boost.space Automation REST endpoints — 以 config 可覆寫避免硬編碼綁死
const PATHS = {
  scenarios: () => '/api/scenarios',
  scenario: (id: string) => `/api/scenarios/${encodeURIComponent(id)}`,
  run: (id: string) => `/api/scenarios/${encodeURIComponent(id)}/run`,
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Configuration ──────────────────────────────────────────

function assertConfig(config: BoostSpaceConfig): void {
  if (!config || typeof config.apiBase !== 'string' || config.apiBase.trim() === '') {
    throw new BoostSpaceError('CONFIG_MISSING_BASE', 'apiBase is required (e.g. https://automation.boost.space)');
  }
  if (/^\s*$/.test(config.token ?? '')) {
    throw new BoostSpaceError('CONFIG_MISSING_TOKEN', 'token is required');
  }
  if (config.apiBase.includes(' ')) {
    throw new BoostSpaceError('CONFIG_MISSING_BASE', 'apiBase must not contain whitespace');
  }
}

/** Narrows the injected/global fetch — 斷言 fetch 可用，避免閉包中型別寬化 */
function assertFetchAvailable(value: unknown): asserts value is typeof fetch {
  if (typeof value !== 'function') {
    throw new BoostSpaceError('CONFIG_MISSING_BASE', 'fetch is unavailable — provide config.fetchImpl');
  }
}

/** Redacts any token-like value from a message — 訊息去密，5T Trustworthy */
export function redactSecrets(message: string, config: BoostSpaceConfig): string {
  let out = message;
  if (config?.token) out = out.split(config.token).join('***');
  out = out.replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, '$1***');
  out = out.replace(/([?&](token|access_token|api_key)=)[^&\s]+/gi, '$1***');
  return out;
}

// ─── F-07 → F-09 mapping ───────────────────────────────────

/**
 * Map a forged workflow (F-07) into a Boost.space scenario (F-09).
 * 鍛造產物 → 自動化情境的單向映射，附 digest 溯源（5T Traceable）。
 */
export function toBoostScenario(forged: ForgedScript): BoostScenario {
  if (forged.kind !== 'workflow') {
    throw new BoostSpaceError(
      'SCENARIO_NOT_WORKFLOW',
      `Only 'workflow' forged scripts can be mapped to a scenario (got '${forged.kind}')`
    );
  }

  let parsed: {
    id?: string;
    intent?: string;
    network?: boolean | null;
    maxDurationMs?: number | null;
    requiredSecrets?: string[];
    order?: string[];
    steps?: Array<{
      position?: number;
      key?: string;
      module?: string;
      parameters?: string[];
      environment?: Record<string, string>;
      dependsOn?: string[];
      timeoutMs?: number | null;
    }>;
  };
  try {
    parsed = JSON.parse(forged.script);
  } catch (error) {
    throw new BoostSpaceError('SCENARIO_NOT_WORKFLOW', `Workflow payload is not valid JSON: ${(error as Error).message}`);
  }

  const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const order = Array.isArray(parsed.order) ? parsed.order : [];

  const definition: BoostScenarioDefinition = {
    name: String(parsed.id ?? forged.spec.id),
    intent: String(parsed.intent ?? forged.spec.intent),
    active: false,
    network: parsed.network ?? null,
    maxDurationMs: parsed.maxDurationMs ?? null,
    requiredSecrets: Array.isArray(parsed.requiredSecrets) ? parsed.requiredSecrets : [],
    order,
    modules: steps.map((step, index) => ({
      position: typeof step.position === 'number' ? step.position : index + 1,
      key: String(step.key ?? `step-${index + 1}`),
      module: String(step.module ?? ''),
      parameters: Array.isArray(step.parameters) ? step.parameters : [],
      environment: step.environment && typeof step.environment === 'object' ? step.environment : {},
      dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : [],
      timeoutMs: typeof step.timeoutMs === 'number' ? step.timeoutMs : null,
    })),
  };

  return {
    definition,
    provenance: {
      source: 'authority-forging',
      specId: forged.spec.id,
      digest: forged.digest,
      stepCount: definition.modules.length,
    },
  };
}

// ─── Client ─────────────────────────────────────────────────

export interface BoostSpaceClient {
  listScenarios(): Promise<BoostSpaceScenarioRecord[]>;
  createScenario(scenario: BoostScenario): Promise<BoostSpaceScenarioRecord>;
  setScenarioActive(id: string, active: boolean): Promise<BoostSpaceScenarioRecord>;
  runScenario(id: string, input?: Record<string, unknown>): Promise<{ id: string; status: string }>;
  pushForgedWorkflow(forged: ForgedScript): Promise<BoostSpaceScenarioRecord>;
}

export function createBoostSpaceClient(config: BoostSpaceConfig): BoostSpaceClient {
  assertConfig(config);

  const rawFetch: unknown = config.fetchImpl ?? globalThis.fetch;
  assertFetchAvailable(rawFetch);
  const fetchImpl: typeof fetch = rawFetch;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const sleep = config.sleepImpl ?? defaultSleep;

  function url(path: string): string {
    const base = config.apiBase.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  async function request<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (config.workspaceId) headers['X-Workspace-Id'] = config.workspaceId;

    let lastError: BoostSpaceError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) await sleep(DEFAULT_BACKOFF_MS * 2 ** (attempt - 1));

      let response: Response;
      try {
        response = await fetchImpl(url(path), {
          method: init.method,
          headers,
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
        });
      } catch (error) {
        lastError = new BoostSpaceError(
          'NETWORK_ERROR',
          redactSecrets(`network failure calling ${path}: ${(error as Error).message}`, config)
        );
        continue;
      }

      const text = await response.text().catch(() => '');
      if (response.ok) {
        if (!text) return {} as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new BoostSpaceError('HTTP_ERROR', `non-JSON response from ${path}`, response.status);
        }
      }

      const bodyPreview = text.slice(0, MAX_BODY_IN_MESSAGE);
      lastError = new BoostSpaceError(
        'HTTP_ERROR',
        redactSecrets(`${init.method} ${path} → ${response.status}: ${bodyPreview}`, config),
        response.status
      );

      if (!RETRYABLE_STATUS.has(response.status)) return Promise.reject(lastError);
    }

    // No retries configured → surface the original failure verbatim.
    // 未配置重試時，回報原始錯誤而非泛化的 RETRIES_EXHAUSTED。
    if (maxRetries === 0 && lastError) return Promise.reject(lastError);

    return Promise.reject(
      new BoostSpaceError(
        'RETRIES_EXHAUSTED',
        redactSecrets(`${init.method} ${path} failed after ${maxRetries + 1} attempts: ${lastError?.message}`, config),
        lastError?.status
      )
    );
  }

  return {
    listScenarios: () => request<BoostSpaceScenarioRecord[]>(PATHS.scenarios(), { method: 'GET' }),

    createScenario: (scenario) =>
      request<BoostSpaceScenarioRecord>(PATHS.scenarios(), {
        method: 'POST',
        body: { ...scenario.definition, metadata: scenario.provenance },
      }),

    setScenarioActive: (id, active) =>
      request<BoostSpaceScenarioRecord>(PATHS.scenario(id), { method: 'PATCH', body: { active } }),

    runScenario: (id, input) =>
      request<{ id: string; status: string }>(PATHS.run(id), { method: 'POST', body: { input: input ?? {} } }),

    pushForgedWorkflow: async (forged) => {
      const scenario = toBoostScenario(forged);
      return request<BoostSpaceScenarioRecord>(PATHS.scenarios(), {
        method: 'POST',
        body: { ...scenario.definition, metadata: scenario.provenance },
      });
    },
  };
}
