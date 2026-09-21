#!/usr/bin/env node
// tools/ts-matrix/verify.mjs
// 終始矩陣雙向驗證閘: forward (shared 提供) + reverse (consumer 不得重複定義)
// 5T: Traceable(this script path) / Trackable(drift-report.json timestamp) /
//      Tangible(exit 0 on pass) / Transparent(JSON report) / Trustworthy(SHA256 commit)

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

// SHA256 helper (Trustworthy lock)
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');

// ─── Forward: scan shared/types/* exports ──────────────────────
function scanSharedExports() {
  const sharedIndex = join(PACKAGES, 'shared/src/types/index.ts');
  if (!existsSync(sharedIndex)) return new Map();
  const content = readFileSync(sharedIndex, 'utf-8');
  const exports = new Map();
  // Match `export * from './xxx'` (re-exports)
  for (const m of content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
    const from = m[1];
    const target = join(PACKAGES, 'shared/src/types', `${from}.ts`);
    if (!existsSync(target)) continue;
    const targetContent = readFileSync(target, 'utf-8');
    // Extract exported types & values from the module
    const typeRe = /export\s+type\s+(\w+)/g;
    const valueRe = /export\s+const\s+(\w+)/g;
    const ifaceRe = /export\s+interface\s+(\w+)/g;
    for (const m of targetContent.matchAll(typeRe)) exports.set(m[1], { from, kind: 'type' });
    for (const m of targetContent.matchAll(ifaceRe)) exports.set(m[1], { from, kind: 'interface' });
    for (const m of targetContent.matchAll(valueRe)) exports.set(m[1], { from, kind: 'const' });
  }
  return exports;
}

// ─── Reverse: scan all consumer packages for shadowed declarations ──
function scanShadowedTypes(sharedExports) {
  const shadowed = [];
  const sharedNames = [...sharedExports.keys()];
  if (sharedNames.length === 0) return shadowed;
  const sharedPkg = 'shared';
  const pkgDirs = readdirSync(PACKAGES, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const pkg of pkgDirs) {
    if (pkg.name === sharedPkg) continue;
    const pkgPath = join(PACKAGES, pkg.name);
    let files;
    try { files = walkTs(pkgPath); } catch { continue; }
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      // Skip shared itself
      if (file.includes(`packages\\${sharedPkg}\\`) || file.includes(`packages/${sharedPkg}/`)) continue;
      for (const name of sharedNames) {
        // Match `export type Name` or `export interface Name` (NOT a re-export)
        const re = new RegExp(`export\\s+(?:type|interface)\\s+${name}\\b`, 'g');
        if (re.test(content) && !/export\s*\*\s*from/.test(content.split(re)[0])) {
          shadowed.push({
            type: name,
            shadowedIn: relative(ROOT, file),
            pkg: pkg.name,
          });
        }
      }
    }
  }
  return shadowed;
}

function walkTs(dir) {
  const files = [];
  const items = readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === 'node_modules' || it.name.startsWith('.')) continue;
    const p = join(dir, it.name);
    if (it.isDirectory()) {
      files.push(...walkTs(p));
    } else if (it.name.endsWith('.ts') && !it.name.endsWith('.d.ts')) {
      files.push(p);
    }
  }
  return files;
}

// ─── Main ────────────────────────────────────────────────────
const sharedExports = scanSharedExports();
const shadowed = scanShadowedTypes(sharedExports);

const forward = {
  sharedPath: 'packages/shared/src/types',
  exportCount: sharedExports.size,
  exports: [...sharedExports.entries()].map(([name, info]) => ({ name, ...info })),
};

const reverse = {
  shadowedCount: shadowed.length,
  shadowed,
};

// 5T PASS criteria:
const passForward = forward.exportCount > 0;
const passReverse = reverse.shadowedCount === 0;
const pass = passForward && passReverse;

const report = {
  timestamp: new Date().toISOString(),
  version: '1.1.0',
  matrix: 'esggo-ts-matrix',
  forward,
  reverse,
  pass,
};

// Trustworthy: SHA256 lock of report itself (5T Gate)
const reportSha = sha256(JSON.stringify(report, null, 2));
const finalReport = {
  ...report,
  lock: {
    sha256: reportSha,
    algorithm: 'sha256',
    note: 'Trustworthy 5T - lock of drift-report.json content',
  },
};

// Write drift-report.json (Trustworthy artifact)
const reportPath = join(ROOT, 'tools/ts-matrix/drift-report.json');
mkdirSync(join(ROOT, 'tools/ts-matrix'), { recursive: true });
writeFileSync(reportPath, JSON.stringify(finalReport, null, 2) + '\n', 'utf-8');

console.log(`=== 終始矩陣雙向驗證閘 (v1.1.0 + Trustworthy lock) ===`);
console.log(`Forward (shared 提供 ${forward.exportCount} 個 export): ${passForward ? '✓' : '✗'}`);
console.log(`Reverse (consumer 無 drift): ${passReverse ? '✓' : '✗'} | shadowed=${reverse.shadowedCount}`);
console.log(`Trustworthy SHA256 lock: ${reportSha.slice(0, 24)}...`);
if (reverse.shadowed.length) {
  for (const s of reverse.shadowed) {
    console.log(`  ⚠️  ${s.type} shadowed in ${s.shadowedIn} (pkg=${s.pkg})`);
  }
}
console.log(`\nReport: ${relative(ROOT, reportPath)}`);

process.exit(passForward && passReverse ? 0 : 1);
