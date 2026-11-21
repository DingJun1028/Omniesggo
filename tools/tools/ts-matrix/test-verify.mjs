#!/usr/bin/env node
// tools/ts-matrix/test-verify.mjs
// TDD Stage 5 GREEN: in-process import (no subprocess)
// 重點: .d.ts 必須在 shadowed 偵測範圍內

import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanSharedExports, scanShadowedTypes, sha256 } from './verify.mjs';

const VERIFY = fileURLToPath(new URL('./verify.mjs', import.meta.url));

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

// In-process: 寫檔 + 直接 call 純函數
function runVerifyInProcess(tmp, files) {
  for (const f of files) {
    const dir = dirname(f.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(f.path, f.content);
  }

  const sharedExports = scanSharedExports(tmp);
  const shadowed = scanShadowedTypes(sharedExports, tmp);

  const forward = {
    exportCount: sharedExports.size,
    exports: [...sharedExports.entries()].map(([name, info]) => ({ name, ...info })),
  };
  const reverse = {
    shadowedCount: shadowed.length,
    shadowed,
  };

  const passForward = forward.exportCount > 0;
  const passReverse = reverse.shadowedCount === 0;
  const pass = passForward && passReverse;

  // 寫 Trustworthy lock (同 CLI 行為, 但 in-process)
  const report = { timestamp: new Date().toISOString(), version: '1.3.1', matrix: 'esggo-ts-matrix', forward, reverse, pass };
  const reportSha = sha256(JSON.stringify(report, null, 2));
  const finalReport = { ...report, lock: { sha256: reportSha, algorithm: 'sha256', note: 'Trustworthy 5T' } };

  const reportPath = join(tmp, 'tools/ts-matrix/drift-report.json');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(finalReport, null, 2) + '\n', 'utf-8');

  return { ...finalReport, exitCode: pass ? 0 : 1 };
}

function mktmp(prefix) {
  return 'C:/tmp/' + prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// T1
async function t1_dtsShadow() {
  console.log(`\n--- T1: .d.ts shadowed MUST be detected (was v1.1.0 bug) ---`);
  const tmp = mktmp('t1');
  try {
    const report = runVerifyInProcess(tmp, [
      { path: join(tmp, 'packages/shared/src/types/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './locale';\n" },
      { path: join(tmp, 'packages/consumer/src/i18n.d.ts'), content: 'export interface Locale { x: string; };\n' },
    ]);
    assert('T1 shadowedCount', report.reverse.shadowedCount, 1);
    assert('T1 shadowed type', report.reverse.shadowed[0]?.type, 'Locale');
    assert('T1 exit code 1', report.exitCode, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T2
async function t2_tsReexportIgnored() {
  console.log(`\n--- T2: .ts re-export ignored ---`);
  const tmp = mktmp('t2');
  try {
    const report = runVerifyInProcess(tmp, [
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
    const report = runVerifyInProcess(tmp, [
      { path: join(tmp, 'packages/shared/src/types/badge.ts'), content: 'export interface BadgeProps { label: string };\n' },
      { path: join(tmp, 'packages/shared/src/types/index.ts'), content: "export * from './badge';\n" },
      { path: join(tmp, 'packages/ui/src/card.tsx'), content: 'export interface BadgeProps { title: string };\n' },
    ]);
    assert('T3 shadowedCount', report.reverse.shadowedCount, 1);
    assert('T3 shadowedCount shadow', report.reverse.shadowed[0]?.type, 'BadgeProps');
    assert('T3 exit code 1', report.exitCode, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T4
async function t4_clean() {
  console.log(`\n--- T4: clean tree no drift ---`);
  const tmp = mktmp('t4');
  try {
    const report = runVerifyInProcess(tmp, [
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

// T5: 全域範圍 — 規範檔可在根目錄 shared/，重複定義可出現在根目錄 src/lib/**（非 packages 下）
async function t5_globalRootPathShadow() {
  console.log(`\n--- T5: 全域根目錄路徑 shadowed MUST be detected ---`);
  const tmp = mktmp('t5');
  try {
    const files = [
      { path: join(tmp, 'shared/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'src/lib/dup.ts'), content: 'export interface Locale { x: string };\n' },
    ];
    for (const f of files) {
      mkdirSync(dirname(f.path), { recursive: true });
      writeFileSync(f.path, f.content);
    }
    const fwd = scanSharedExports(tmp);
    const shadowed = scanShadowedTypes(fwd, tmp);
    assert('T5 shadowedCount', shadowed.length, 1);
    assert('T5 shadowedIn is posix root path', shadowed[0]?.shadowedIn, 'src/lib/dup.ts');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T6: 全域 forward — 根目錄規範檔的直接宣告必須計入 export 清單
async function t6_rootCanonicalForward() {
  console.log(`\n--- T6: 根目錄規範檔 forward export MUST be counted ---`);
  const tmp = mktmp('t6');
  try {
    const files = [
      { path: join(tmp, 'shared/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'shared/gap-matrix.ts'), content: 'export interface GapPair { id: string };\n' },
      { path: join(tmp, 'src/consumer.ts'), content: 'export const uses = true;\n' },
    ];
    for (const f of files) {
      mkdirSync(dirname(f.path), { recursive: true });
      writeFileSync(f.path, f.content);
    }
    const fwd = scanSharedExports(tmp);
    const locale = [...fwd.entries()].find(([n]) => n === 'Locale');
    assert('T6 forward has Locale', !!locale, true);
    assert('T6 forward from shared/locale.ts', locale ? String(locale[1].from).split('\\').join('/') : null, 'shared/locale.ts');
    assert('T6 forward has GapPair', fwd.has('GapPair'), true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// T7: 基線棘輪 e2e（真實 CLI）
//   無基線有重複 → 1；寫入基線 → 0；再新增一處 → 1（棘輪攔截惡化）
async function t7_baselineRatchet() {
  console.log(`\n--- T7: 基線棘輪 e2e (real CLI) ---`);
  const tmp = mktmp('t7');
  try {
    const files = [
      { path: join(tmp, 'shared/locale.ts'), content: 'export type Locale = "en";\n' },
      { path: join(tmp, 'src/lib/dup.ts'), content: 'export interface Locale { x: string };\n' },
    ];
    for (const f of files) {
      mkdirSync(dirname(f.path), { recursive: true });
      writeFileSync(f.path, f.content);
    }
    const reportPath = join(tmp, 'tools/ts-matrix/drift-report.json');
    const readReport = () => JSON.parse(readFileSync(reportPath, 'utf-8'));

    let r = spawnSync(process.execPath, [VERIFY, tmp], { encoding: 'utf-8' });
    assert('T7 no-baseline exit 1', r.status, 1);
    assert('T7 newDriftCount 1', readReport().reverse.baseline.newDriftCount, 1);

    r = spawnSync(process.execPath, [VERIFY, tmp, '--update-baseline'], { encoding: 'utf-8' });
    assert('T7 with-baseline exit 0', r.status, 0);
    assert('T7 baseline total 1', readReport().reverse.baseline.total, 1);

    writeFileSync(join(tmp, 'src/lib/dup2.ts'), 'export interface Locale { y: string };\n');
    r = spawnSync(process.execPath, [VERIFY, tmp], { encoding: 'utf-8' });
    assert('T7 new-drift exit 1', r.status, 1);
    const rep = readReport();
    assert('T7 newDriftCount 1 after growth', rep.reverse.baseline.newDriftCount, 1);
    assert('T7 shadowed total 2', rep.reverse.shadowedCount, 2);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('=== ts-matrix verify.mjs TDD test ===');
await t1_dtsShadow();
await t2_tsReexportIgnored();
await t3_tsxShadow();
await t4_clean();
await t5_globalRootPathShadow();
await t6_rootCanonicalForward();
await t7_baselineRatchet();

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: got ${JSON.stringify(f.actual)}, expected ${JSON.stringify(f.expected)}`);
  }
  process.exit(1);
}
console.log('\n✅ ALL TESTS PASS - ts-matrix drift detector is trustworthy.');
