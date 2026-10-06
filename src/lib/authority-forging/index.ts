// ═══════════════════════════════════════════════════════════════
// Authority Forging Script Generator — 權能鍛造腳本生成器 (F-07 / M3)
// Convention: 英標繁博 (English Standard, Traditional Chinese Broad)
// PRD: docs/OMN-PRD-001.md §2.3 F-07 (L4 能力層) · §5.1 M3 · §4.1 FR-08
//
// Generates a deterministic, safety-validated automation script from a
// ForgingSpec, sealed with a SHA-256 digest (5T: Trustworthy + Trackable).
// 依需求生成自動化腳本，輸出前通過安全閘，並以 SHA-256 摘要封印。
// ═══════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────

export type ForgingKind = 'shell' | 'node' | 'workflow';

export interface ForgingStep {
  /** Unique slug within the spec — 步驟唯一識別 (slug) */
  id: string;
  /** Program name/path, never a shell line — 執行程式（非整行 shell） */
  run: string;
  args?: string[];
  env?: Record<string, string>;
  /** IDs of steps that must complete first — 前置步驟 */
  needs?: string[];
  timeoutMs?: number;
}

export interface ForgingSafety {
  /** Declares whether outbound network is required — 是否需要對外網路 */
  network?: boolean;
  /** Secret NAMES only; values are never accepted by this API — 僅秘密名稱 */
  secrets?: string[];
  maxDurationMs?: number;
}

export interface ForgingSpec {
  id: string;
  intent: string;
  kind: ForgingKind;
  steps: ForgingStep[];
  safety?: ForgingSafety;
}

export interface ForgedScript {
  spec: ForgingSpec;
  kind: ForgingKind;
  script: string;
  /** sha256 hex of `script` — 5T Hash Lock 封印 */
  digest: string;
  /** Topological execution order (step IDs) — 拓撲執行順序 */
  order: string[];
  /** Secrets referenced by NAME only — 僅秘密名稱，絕無值 */
  secrets: string[];
}

export type ForgingErrorCode =
  | 'INVALID_ID'
  | 'INVALID_INTENT'
  | 'INVALID_KIND'
  | 'NO_STEPS'
  | 'DUPLICATE_STEP'
  | 'INVALID_STEP_ID'
  | 'INVALID_PROGRAM'
  | 'INVALID_ARG'
  | 'UNSAFE_COMMAND'
  | 'INVALID_ENV_KEY'
  | 'INVALID_ENV_VALUE'
  | 'UNKNOWN_DEPENDENCY'
  | 'DEPENDENCY_CYCLE'
  | 'INVALID_TIMEOUT'
  | 'INVALID_SECRET'
  | 'INVALID_SAFETY';

export class ForgingError extends Error {
  readonly code: ForgingErrorCode;
  constructor(code: ForgingErrorCode, message: string) {
    super(message);
    this.name = 'ForgingError';
    this.code = code;
  }
}

// ─── Safety Constants ───────────────────────────────────────

const SPEC_ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
const STEP_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PROGRAM_RE = /^[A-Za-z0-9@/._+-]+$/;
const ENV_KEY_RE = /^[A-Z_][A-Z0-9_]{0,63}$/;
const SECRET_RE = /^[A-Z_][A-Z0-9_]{0,63}$/;

/** Args may never carry shell metacharacters or quotes — 引數禁止 shell 元字元 */
const UNSAFE_ARG_RE = /[\s;|&<>()`$'"\\\n\r\0]/;

/** Programs that may never be forged — 禁止鍛造的危險程式 */
const DENIED_PROGRAMS = new Set([
  'sudo', 'su', 'doas', 'shutdown', 'reboot', 'halt', 'poweroff',
  'mkfs', 'fdisk', 'format', 'dd', 'chown', 'chmod',
]);

/** Deny-listed prefixes, e.g. mkfs.ext4 — 禁止鍛造的程式前綴 */
const DENIED_PREFIXES = ['mkfs.', 'chmod.', 'chown.', 'dd.'];

/** `rm` may only target non-root paths — rm 不得指向根路徑 */
const ROOT_TARGETS = new Set(['/', '/*', '~/..', '/**', '/*/*']);

const KINDS = new Set<ForgingKind>(['shell', 'node', 'workflow']);

const MAX_STEPS = 200;
const MAX_TIMEOUT_MS = 3_600_000;
const MAX_INTENT = 500;

// ─── Validation ─────────────────────────────────────────────

function validateProgram(program: string, args: string[]): void {
  if (!PROGRAM_RE.test(program)) {
    throw new ForgingError('INVALID_PROGRAM', `Program name is not a safe token: ${program}`);
  }
  const base = program.split('/').pop()!.toLowerCase();
  const denied = DENIED_PROGRAMS.has(base) || DENIED_PREFIXES.some((p) => base.startsWith(p));
  if (denied) {
    throw new ForgingError('UNSAFE_COMMAND', `Program is deny-listed: ${program}`);
  }
  if (base === 'rm' && args.some((a) => ROOT_TARGETS.has(a))) {
    throw new ForgingError('UNSAFE_COMMAND', `rm may not target a root path: ${args.join(' ')}`);
  }
  for (const arg of args) {
    if (UNSAFE_ARG_RE.test(arg)) {
      throw new ForgingError('INVALID_ARG', `Argument carries shell metacharacters or whitespace: ${arg}`);
    }
    if (arg.length > 512) {
      throw new ForgingError('INVALID_ARG', `Argument exceeds 512 characters`);
    }
  }
}

function validateSpec(spec: ForgingSpec): void {
  if (typeof spec.id !== 'string' || !SPEC_ID_RE.test(spec.id)) {
    throw new ForgingError('INVALID_ID', `Spec id must be a lowercase slug (a-z0-9-, 3-64): ${String(spec.id)}`);
  }
  if (typeof spec.intent !== 'string' || spec.intent.trim().length === 0) {
    throw new ForgingError('INVALID_INTENT', 'Spec intent is required');
  }
  if (spec.intent.length > MAX_INTENT) {
    throw new ForgingError('INVALID_INTENT', `Spec intent exceeds ${MAX_INTENT} characters`);
  }
  if (!KINDS.has(spec.kind)) {
    throw new ForgingError('INVALID_KIND', `Unknown forging kind: ${String(spec.kind)}`);
  }
  if (!Array.isArray(spec.steps) || spec.steps.length === 0) {
    throw new ForgingError('NO_STEPS', 'At least one step is required');
  }
  if (spec.steps.length > MAX_STEPS) {
    throw new ForgingError('NO_STEPS', `Step count exceeds ${MAX_STEPS}`);
  }

  const seen = new Set<string>();
  for (const step of spec.steps) {
    if (typeof step.id !== 'string' || !STEP_ID_RE.test(step.id)) {
      throw new ForgingError('INVALID_STEP_ID', `Step id must be a lowercase slug: ${String(step.id)}`);
    }
    if (seen.has(step.id)) {
      throw new ForgingError('DUPLICATE_STEP', `Duplicate step id: ${step.id}`);
    }
    seen.add(step.id);

    if (typeof step.run !== 'string' || step.run.length === 0) {
      throw new ForgingError('INVALID_PROGRAM', `Step ${step.id} has no program`);
    }
    validateProgram(step.run, step.args ?? []);

    for (const [key, value] of Object.entries(step.env ?? {})) {
      if (!ENV_KEY_RE.test(key)) {
        throw new ForgingError('INVALID_ENV_KEY', `Step ${step.id} has invalid env key: ${key}`);
      }
      if (typeof value !== 'string' || /[\n\r\0]/.test(value)) {
        throw new ForgingError('INVALID_ENV_VALUE', `Step ${step.id} env value for ${key} is not a single line`);
      }
      if (value.length > 4096) {
        throw new ForgingError('INVALID_ENV_VALUE', `Step ${step.id} env value for ${key} exceeds 4096 chars`);
      }
    }

    if (step.timeoutMs !== undefined) {
      if (!Number.isInteger(step.timeoutMs) || step.timeoutMs <= 0 || step.timeoutMs > MAX_TIMEOUT_MS) {
        throw new ForgingError(
          'INVALID_TIMEOUT',
          `Step ${step.id} timeoutMs must be an integer in 1..${MAX_TIMEOUT_MS}`
        );
      }
    }

    if (step.needs !== undefined && !Array.isArray(step.needs)) {
      throw new ForgingError('UNKNOWN_DEPENDENCY', `Step ${step.id} needs must be an array`);
    }
  }

  for (const step of spec.steps) {
    for (const dep of step.needs ?? []) {
      if (!seen.has(dep)) {
        throw new ForgingError('UNKNOWN_DEPENDENCY', `Step ${step.id} depends on unknown step: ${dep}`);
      }
      if (dep === step.id) {
        throw new ForgingError('DEPENDENCY_CYCLE', `Step ${step.id} depends on itself`);
      }
    }
  }

  const safety = spec.safety;
  if (safety !== undefined) {
    if (typeof safety !== 'object' || safety === null || Array.isArray(safety)) {
      throw new ForgingError('INVALID_SAFETY', 'safety must be an object');
    }
    if (safety.secrets !== undefined) {
      if (!Array.isArray(safety.secrets)) {
        throw new ForgingError('INVALID_SECRET', 'safety.secrets must be an array of names');
      }
      for (const secret of safety.secrets) {
        if (typeof secret !== 'string' || !SECRET_RE.test(secret)) {
          throw new ForgingError('INVALID_SECRET', `Secret name must be an env-style name: ${String(secret)}`);
        }
      }
      if (new Set(safety.secrets).size !== safety.secrets.length) {
        throw new ForgingError('INVALID_SECRET', 'safety.secrets contains duplicates');
      }
    }
    if (safety.maxDurationMs !== undefined) {
      if (!Number.isInteger(safety.maxDurationMs) || safety.maxDurationMs <= 0) {
        throw new ForgingError('INVALID_SAFETY', 'safety.maxDurationMs must be a positive integer');
      }
    }
    if (safety.network !== undefined && typeof safety.network !== 'boolean') {
      throw new ForgingError('INVALID_SAFETY', 'safety.network must be a boolean');
    }
  }
}

/** Topological order via Kahn's algorithm, stable to declaration order — 穩定拓撲排序 */
export function planOrder(steps: ForgingStep[]): string[] {
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const step of steps) {
    indegree.set(step.id, 0);
    dependents.set(step.id, []);
  }
  for (const step of steps) {
    for (const dep of step.needs ?? []) {
      indegree.set(step.id, (indegree.get(step.id) ?? 0) + 1);
      dependents.get(dep)!.push(step.id);
    }
  }

  const queue = steps.filter((s) => (indegree.get(s.id) ?? 0) === 0).map((s) => s.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of dependents.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  if (order.length !== steps.length) {
    const remaining = steps.filter((s) => !order.includes(s.id)).map((s) => s.id);
    throw new ForgingError('DEPENDENCY_CYCLE', `Dependency cycle detected among: ${remaining.join(', ')}`);
  }
  return order;
}

// ─── Shell Rendering ────────────────────────────────────────

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function renderShell(spec: ForgingSpec, order: string[], secrets: string[]): string {
  const byId = new Map(spec.steps.map((s) => [s.id, s]));
  const lines: string[] = [
    '#!/usr/bin/env bash',
    '# Authority Forging Script — 權能鍛造腳本',
    `# spec: ${spec.id}`,
    `# intent: ${spec.intent}`,
    '# 5T: Truth|Goodness|Beauty|Trust|Trackable',
    'set -euo pipefail',
    '',
    'export LC_ALL=C',
  ];

  if (spec.safety?.network === false) {
    lines.push('# network: denied (declared by spec)');
  }
  if (secrets.length > 0) {
    lines.push('', '# secret presence guards — 只檢查存在，絕不寫入值');
    for (const secret of secrets) {
      lines.push(`if [ -z "\${${secret}:-}" ]; then echo "missing required secret: ${secret}" >&2; exit 78; fi`);
    }
  }

  for (const id of order) {
    const step = byId.get(id)!;
    const deps = step.needs ?? [];
    lines.push('', `# step: ${step.id}${deps.length > 0 ? ` (needs: ${deps.join(', ')})` : ''}`);
    const envs = Object.entries(step.env ?? {});
    if (envs.length > 0) {
      lines.push(`env ${envs.map(([k, v]) => `${k}=${shellQuote(v)}`).join(' ')} \\`);
    }
    const cmd = [step.run, ...(step.args ?? []).map(shellQuote)].join(' ');
    if (envs.length > 0) {
      lines.push(`  ${cmd}`);
    } else {
      lines.push(cmd);
    }
  }

  lines.push('', 'echo "forged: ' + spec.id + ' ok"');
  return lines.join('\n') + '\n';
}

// ─── Node Rendering ─────────────────────────────────────────

function jsString(value: string): string {
  return JSON.stringify(value);
}

function renderNode(spec: ForgingSpec, order: string[], secrets: string[]): string {
  const byId = new Map(spec.steps.map((s) => [s.id, s]));
  const steps = order.map((id) => {
    const step = byId.get(id)!;
    return `  {
    id: ${jsString(step.id)},
    run: ${jsString(step.run)},
    args: ${JSON.stringify(step.args ?? [])},
    env: ${JSON.stringify(step.env ?? {})},
    needs: ${JSON.stringify(step.needs ?? [])}${step.timeoutMs !== undefined ? `,\n    timeoutMs: ${step.timeoutMs}` : ''}
  }`;
  });

  return [
    '#!/usr/bin/env node',
    '// Authority Forging Script — 權能鍛造腳本',
    `// spec: ${spec.id}`,
    `// intent: ${spec.intent}`,
    '// 5T: Truth|Goodness|Beauty|Trust|Trackable',
    "'use strict';",
    "const { spawnSync } = require('node:child_process');",
    '',
    `const SPEC_ID = ${jsString(spec.id)};`,
    `const SECRETS = ${JSON.stringify(secrets)};`,
    'const STEPS = [',
    steps.join(',\n'),
    '];',
    '',
    'for (const name of SECRETS) {',
    '  if (!process.env[name]) {',
    '    console.error(`missing required secret: ${name}`);',
    '    process.exit(78);',
    '  }',
    '}',
    '',
    'for (const step of STEPS) {',
    '  const started = Date.now();',
    '  const res = spawnSync(step.run, step.args, {',
    '    stdio: "inherit",',
    '    env: { ...process.env, ...step.env },',
    '    timeout: step.timeoutMs,',
    '  });',
    '  if (res.error) { console.error(step.id, res.error.message); process.exit(1); }',
    '  if (res.status !== 0) { console.error(`step ${step.id} failed (${res.status})`); process.exit(res.status ?? 1); }',
    '  console.log(`step ${step.id} ok (${Date.now() - started}ms)`);',
    '}',
    '',
    'console.log(`forged: ${SPEC_ID} ok`);',
    '',
  ].join('\n');
}

// ─── Workflow Rendering (Boost.space-compatible shape) ──────

function renderWorkflow(spec: ForgingSpec, order: string[], secrets: string[]): string {
  const byId = new Map(spec.steps.map((s) => [s.id, s]));
  const workflow = {
    id: spec.id,
    intent: spec.intent,
    version: 1,
    network: spec.safety?.network ?? null,
    maxDurationMs: spec.safety?.maxDurationMs ?? null,
    requiredSecrets: secrets,
    order,
    steps: order.map((id, index) => {
      const step = byId.get(id)!;
      return {
        position: index + 1,
        key: step.id,
        module: step.run,
        parameters: step.args ?? [],
        environment: step.env ?? {},
        dependsOn: step.needs ?? [],
        timeoutMs: step.timeoutMs ?? null,
      };
    }),
  };
  return JSON.stringify(workflow, null, 2) + '\n';
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Forge a sealed automation script from a spec.
 * 校驗 → 安全閘 → 拓撲排序 → 產生腳本 → SHA-256 封印。
 *
 * @throws {ForgingError} when validation or the safety gate fails
 */
export function forge(spec: ForgingSpec): ForgedScript {
  validateSpec(spec);

  const order = planOrder(spec.steps);
  const secrets = [...(spec.safety?.secrets ?? [])];

  const script =
    spec.kind === 'shell'
      ? renderShell(spec, order, secrets)
      : spec.kind === 'node'
        ? renderNode(spec, order, secrets)
        : renderWorkflow(spec, order, secrets);

  const digest = createHash('sha256').update(script, 'utf8').digest('hex');

  return { spec, kind: spec.kind, script, digest, order, secrets };
}

/** Non-throwing probe for UI/CI — 供 UI 與 CI 使用的非例外檢查 */
export function inspect(spec: ForgingSpec): {
  ok: boolean;
  code?: ForgingErrorCode;
  message?: string;
  digest?: string;
  order?: string[];
} {
  try {
    const forged = forge(spec);
    return { ok: true, digest: forged.digest, order: forged.order };
  } catch (error) {
    if (error instanceof ForgingError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: false, code: 'INVALID_SAFETY', message: (error as Error).message };
  }
}
