#!/usr/bin/env node
// tools/ts-matrix/test-verify.mjs
// TDD RED → GREEN 測試 (Stage 5)
// 重點: .d.ts 必須在 shadowed 偵測範圍內

import { writeFileSync, mkdirSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const VERIFY = 'C:/Project/esggo/tools/ts-matrix/verify.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}: ${JSON.stringify(actual)}`);
  } else {
    failed++;
    failures.push({ name, actual, expected });
    console.log(`  ✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// Run verify.mjs with target dir as argv[2]
function runVerify(tmp, files) {
  for (const f of files) {
    const dir = dirname(f.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(f.path, f.content);
  }
  // Also create the verify.mjs output dir
  mkdirSync(join(tmp, 'tools/ts-matrix'), { recursive: true });

  let exitCode = null;
  let stderr = '';
  let stdout = '';
  try {
    stdout = execFileSync('node', [VERIFY, tmp], { cwd: tmp, encoding: 'utf-8', timeout: 30, stdio: ['ignore', 'pipe', 'pipe'] });
    exitCode = 0;
  } catch (e) {
    exitCode = e.status ?? 1;
    stderr = e.stderr?.toString() || '';
    stdout = e.stdout?.toString() || '';
  }

  const driftPath = join(tmp, 'tools/ts-matrix/drift-report.json');
  let report = { forward: { exportCount: 0 }, reverse: { shadowedCount: 0, shadowed: [] }, pass: false };
  try {
    report = JSON.parse(readFileSync(driftPath, 'utf-8'));
  } catch {
    console.log('  driftReport not found at:', driftPath);
  }
  return { ...report, exitCode, stderr, stdout };
}

function mktmp(prefix) {
  // Use short path on Windows (long paths break spawnSync)
  return 'C:/tmp/' + prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// T1
async function t1_dtsShadow() {
  console.log(`\n--- T1: .d.ts shadowed MUST be detected (was v1.1.0 bug) ---`);
  const tmp = mktmp('t1');
  try {
    const report = runVerify(tmp, [
      { path: join(tmp, 'packages/shared/src/types/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './locale';\n" },
      { path: join(tmp, 'packages/consumer/src/i18n.d.ts'), content: 'export interface Locale { x: string; };\n' },
    ]);
    assert('T1 shadowedCount', report.reverse.shadowedCount, 1);
    assert('T1 shadowed type', report.reverse.shadowed[0]?.type, 'Locale');
    assert('T1 exit code 1', report.exitCode, 1);
    console.log('  diag:', JSON.stringify({
      exitCode: report.exitCode,
      error: report.error,
      stderrStart: (report.stderr || '').slice(0, 300),
      stdoutStart: (report.stdout || '').slice(0, 200),
    }, null, 2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T2
async function t2_tsReexportIgnored() {
  console.log(`\n--- T2: .ts re-export ignored ---`);
  const tmp = mktmp('t2');
  try {
    const report = runVerify(tmp, [
      { path: join(tmp, 'packages/shared/src/types/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './locale';\n" },
      { path: join(tmp, 'packages/consumer/src/types.ts'), content: "export type { Locale } from '@esggo/shared/types';\n" },
    ]);
    assert('T2 shadowedCount', report.reverse.shadowedCount, 0);
    assert('T2 exit code 0', report.exitCode, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T3
async function t3_tsxShadow() {
  console.log(`\n--- T3: .tsx shadowed MUST be detected ---`);
  const tmp = mktmp('t3');
  try {
    const report = runVerify(tmp, [
      { path: join(tmp, 'packages/shared/src/types/badge.ts'), content: 'export interface BadgeProps { label: string };\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './badge';\n" },
      { path: join(tmp, 'packages/ui/src/card.tsx'), content: 'export interface BadgeProps { title: string };\n' },
    ]);
    assert('T3 shadowedCount', report.reverse.shadowedCount, 1);
    assert('T3 shadowedCount shadow', report.reverse.shadowed[0]?.type, 'BadgeProps');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T4
async function t4_clean() {
  console.log(`\n--- T4: clean tree no drift ---`);
  const tmp = mktmp('t4');
  try {
    const report = runVerify(tmp, [
      { path: join(tmp, 'packages/shared/src/types/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './locale';\n" },
      { path: join(tmp, 'packages/consumer/src/foo.ts'), content: 'export interface Foo { x: number };\n' },
    ]);
    assert('T4 shadowedCount', report.reverse.shadowedCount, 0);
    assert('T4 forward exports > 0', report.forward.exportCount > 0, true);
    assert('T4 exit code 0', report.exitCode, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('=== ts-matrix verify.mjs TDD test ===');
await t1_dtsShadow();
await t2_tsReexportIgnored();
await t3_tsxShadow();
await t4_clean();

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: got ${JSON.stringify(f.actual)}, expected ${JSON.stringify(f.expected)}`);
  }
  process.exit(1);
}
console.log('\n✅ ALL TESTS PASS - ts-matrix drift detector is trustworthy.');
