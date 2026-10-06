/**
 * Authority Forging Script Generator — 權能鍛造腳本生成器 (PRD F-07 / M3)
 *
 * 驗證需求: OMN-PRD-001 §4.1 FR-08 → F-09 自動化引擎（鍛造產物為其輸入）
 * 驗證方法: 單元測試 — 安全閘、拓撲排序、確定性、SHA-256 封印
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  forge,
  inspect,
  planOrder,
  ForgingError,
  type ForgingSpec,
} from '../src/lib/authority-forging';

const baseSpec = (): ForgingSpec => ({
  id: 'nightly-esg-sync',
  intent: 'Sync ESG metrics then seal the nightly report',
  kind: 'shell',
  steps: [
    { id: 'pull', run: 'pnpm', args: ['run', 'metrics:pull'] },
    { id: 'compute', run: 'node', args: ['scripts/compute.mjs'], needs: ['pull'] },
    { id: 'seal', run: 'pnpm', args: ['run', 'report:seal'], needs: ['compute'] },
  ],
  safety: { network: false, secrets: ['SUPABASE_SERVICE_KEY'], maxDurationMs: 600000 },
});

function codeOf(fn: () => unknown): string {
  try {
    fn();
    return 'NO_THROW';
  } catch (error) {
    return error instanceof ForgingError ? error.code : 'NOT_FORGING_ERROR';
  }
}

describe('權能鍛造 Authority Forging — 正常路徑 (happy path)', () => {
  it('forges a sealed shell script with 5T header and fail-fast shell options', () => {
    const forged = forge(baseSpec());

    expect(forged.kind).toBe('shell');
    expect(forged.script).toContain('#!/usr/bin/env bash');
    expect(forged.script).toContain('set -euo pipefail');
    expect(forged.script).toContain('# 5T: Truth|Goodness|Beauty|Trust|Trackable');
    expect(forged.script).toContain('# spec: nightly-esg-sync');
    expect(forged.order).toEqual(['pull', 'compute', 'seal']);
  });

  it('seals the script with a SHA-256 digest that matches the emitted text', () => {
    const forged = forge(baseSpec());
    expect(forged.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(createHash('sha256').update(forged.script, 'utf8').digest('hex')).toBe(forged.digest);
  });

  it('is deterministic: same spec → identical script and digest (Trackable)', () => {
    const a = forge(baseSpec());
    const b = forge(baseSpec());
    expect(a.script).toBe(b.script);
    expect(a.digest).toBe(b.digest);
  });

  it('changes the digest when any step changes (Hash Lock sensitivity)', () => {
    const mutated = baseSpec();
    mutated.steps[1].args = ['scripts/compute.mjs', '--strict'];
    expect(forge(mutated).digest).not.toBe(forge(baseSpec()).digest);
  });
});

describe('權能鍛造 Authority Forging — 拓撲排序 (DAG planning)', () => {
  it('honours needs and keeps declaration order for independent steps', () => {
    const spec: ForgingSpec = {
      id: 'dag-order',
      intent: 'order check',
      kind: 'shell',
      steps: [
        { id: 'first', run: 'echo' },
        { id: 'third', run: 'echo', needs: ['second'] },
        { id: 'second', run: 'echo', needs: ['first'] },
        { id: 'loose', run: 'echo' },
      ],
    };
    expect(planOrder(spec.steps)).toEqual(['first', 'loose', 'second', 'third']);
  });

  it('rejects a dependency cycle', () => {
    const spec: ForgingSpec = {
      id: 'cycle-spec',
      intent: 'cycle',
      kind: 'shell',
      steps: [
        { id: 'a', run: 'echo', needs: ['b'] },
        { id: 'b', run: 'echo', needs: ['a'] },
      ],
    };
    expect(codeOf(() => forge(spec))).toBe('DEPENDENCY_CYCLE');
  });

  it('rejects a self dependency and an unknown dependency', () => {
    const selfDep: ForgingSpec = {
      id: 'self-spec',
      intent: 'self',
      kind: 'shell',
      steps: [{ id: 'a', run: 'echo', needs: ['a'] }],
    };
    expect(codeOf(() => forge(selfDep))).toBe('DEPENDENCY_CYCLE');

    const unknown: ForgingSpec = {
      id: 'unknown-spec',
      intent: 'unknown',
      kind: 'shell',
      steps: [{ id: 'a', run: 'echo', needs: ['ghost'] }],
    };
    expect(codeOf(() => forge(unknown))).toBe('UNKNOWN_DEPENDENCY');
  });
});

describe('權能鍛造 Authority Forging — 安全閘 (safety gate)', () => {
  const withStep = (step: Partial<ForgingSpec['steps'][number]>, id = 'only'): ForgingSpec => ({
    id: 'safety-spec',
    intent: 'safety',
    kind: 'shell',
    steps: [{ id, run: 'echo', ...step }],
  });

  it('blocks shell metacharacter injection in arguments', () => {
    expect(codeOf(() => forge(withStep({ args: ['ok', ';', 'rm', '-rf', '/tmp/x'] })))).toBe(
      'INVALID_ARG'
    );
    expect(codeOf(() => forge(withStep({ args: ['$(whoami)'] })))).toBe('INVALID_ARG');
    expect(codeOf(() => forge(withStep({ args: ['`id`'] })))).toBe('INVALID_ARG');
    expect(codeOf(() => forge(withStep({ args: ['a\nb'] })))).toBe('INVALID_ARG');
    expect(codeOf(() => forge(withStep({ args: ['two words'] })))).toBe('INVALID_ARG');
    expect(codeOf(() => forge(withStep({ args: ['plain-path/file.txt'] })))).toBe('NO_THROW');
  });

  it('blocks deny-listed programs and root-targeting rm', () => {
    expect(codeOf(() => forge(withStep({ run: 'sudo' })))).toBe('UNSAFE_COMMAND');
    expect(codeOf(() => forge(withStep({ run: '/bin/sudo' })))).toBe('UNSAFE_COMMAND');
    expect(codeOf(() => forge(withStep({ run: 'mkfs.ext4' })))).toBe('UNSAFE_COMMAND');
    expect(codeOf(() => forge(withStep({ run: 'rm', args: ['-rf', '/'] })))).toBe('UNSAFE_COMMAND');
    expect(codeOf(() => forge(withStep({ run: 'rm', args: ['-rf', 'build'] })))).toBe('NO_THROW');
  });

  it('blocks unsafe program tokens (no shell lines)', () => {
    expect(codeOf(() => forge(withStep({ run: 'cat file.txt && evil' })))).toBe('INVALID_PROGRAM');
    expect(codeOf(() => forge(withStep({ run: '' })))).toBe('INVALID_PROGRAM');
  });

  it('blocks invalid env keys and multi-line env values', () => {
    expect(codeOf(() => forge(withStep({ env: { 'lower-case': 'x' } })))).toBe('INVALID_ENV_KEY');
    expect(codeOf(() => forge(withStep({ env: { OK: 'a\nb' } })))).toBe('INVALID_ENV_VALUE');
    expect(codeOf(() => forge(withStep({ env: { '1BAD': 'x' } })))).toBe('INVALID_ENV_KEY');
  });

  it('validates ids, intent, steps and timeouts', () => {
    expect(codeOf(() => forge({ ...baseSpec(), id: 'Bad Slug!' }))).toBe('INVALID_ID');
    expect(codeOf(() => forge({ ...baseSpec(), intent: '   ' }))).toBe('INVALID_INTENT');
    expect(codeOf(() => forge({ ...baseSpec(), steps: [] }))).toBe('NO_STEPS');
    expect(codeOf(() => forge({ ...baseSpec(), kind: 'powershell' as 'shell' }))).toBe('INVALID_KIND');
    expect(codeOf(() => forge(withStep({ timeoutMs: 0 })))).toBe('INVALID_TIMEOUT');
    expect(codeOf(() => forge(withStep({ timeoutMs: 9_999_999 })))).toBe('INVALID_TIMEOUT');
    expect(codeOf(() => forge({ ...baseSpec(), steps: [{ ...baseSpec().steps[0] }, { ...baseSpec().steps[0] }] }))).toBe(
      'DUPLICATE_STEP'
    );
  });

  it('validates secret names as env-style identifiers, never values', () => {
    const bad = baseSpec();
    bad.safety = { secrets: ['not a name'] };
    expect(codeOf(() => forge(bad))).toBe('INVALID_SECRET');

    const dup = baseSpec();
    dup.safety = { secrets: ['API_KEY', 'API_KEY'] };
    expect(codeOf(() => forge(dup))).toBe('INVALID_SECRET');

    const good = baseSpec();
    const forged = forge(good);
    expect(forged.secrets).toEqual(['SUPABASE_SERVICE_KEY']);
    expect(forged.script).toContain('missing required secret: SUPABASE_SERVICE_KEY');
    expect(forged.script).not.toContain('SUPABASE_SERVICE_KEY=');
  });
});

describe('權能鍛造 Authority Forging — 產出型別 (output kinds)', () => {
  it('node kind emits an executable Node.js runner', () => {
    const forged = forge({ ...baseSpec(), kind: 'node' });
    expect(forged.script).toContain('#!/usr/bin/env node');
    expect(forged.script).toContain('spawnSync');
    expect(forged.script).toContain('const STEPS = [');
    expect(forged.script).toContain('missing required secret');
    expect(JSON.parse(JSON.stringify(forged.order))).toEqual(['pull', 'compute', 'seal']);
  });

  it('workflow kind emits a parseable Boost.space-shaped workflow', () => {
    const forged = forge({ ...baseSpec(), kind: 'workflow' });
    const workflow = JSON.parse(forged.script) as {
      id: string;
      order: string[];
      steps: Array<{ key: string; module: string; position: number; dependsOn: string[] }>;
      requiredSecrets: string[];
    };
    expect(workflow.id).toBe('nightly-esg-sync');
    expect(workflow.order).toEqual(['pull', 'compute', 'seal']);
    expect(workflow.steps.map((s) => s.module)).toEqual(['pnpm', 'node', 'pnpm']);
    expect(workflow.steps[1].dependsOn).toEqual(['pull']);
    expect(workflow.steps[0].position).toBe(1);
    expect(workflow.requiredSecrets).toEqual(['SUPABASE_SERVICE_KEY']);
  });
});

describe('權能鍛造 Authority Forging — inspect() 非例外檢查 (non-throwing probe)', () => {
  it('reports ok with digest and order for a valid spec', () => {
    const result = inspect(baseSpec());
    expect(result.ok).toBe(true);
    expect(result.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(result.order).toEqual(['pull', 'compute', 'seal']);
  });

  it('reports the exact failure code instead of throwing', () => {
    const bad = baseSpec();
    bad.steps.push({ id: 'evil', run: 'sudo', args: ['-i'] });
    const result = inspect(bad);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('UNSAFE_COMMAND');
    expect(result.message).toContain('deny-listed');
    expect(result.digest).toBeUndefined();
  });
});
