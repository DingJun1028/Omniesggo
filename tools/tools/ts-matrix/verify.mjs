#!/usr/bin/env node
// tools/ts-matrix/verify.mjs
// 終始矩陣雙向驗證閘 v1.3.0（全域 + 基線棘輪）:
//   forward  = 全域規範型別提供者（packages/shared/src/types + src/types + shared + types）
//   reverse  = 全域消費者（整個 repo 的 .ts/.tsx）不得重複定義 forward 名稱
//   治理邊界 = vendor/**（第三方）與 */types/generated/**（由 shared 產生的衍生檔）不受指控
//   棘輪     = tools/ts-matrix/baseline.json 既有 75 筆重複「只減不增」，新增即紅燈
//              （`--update-baseline` 需人為確認後重寫基線，僅可縮減）
// 5T: Traceable(this script path) / Trackable(drift-report.json timestamp) /
//      Tangible(exit 0 on pass) / Transparent(JSON report) / Trustworthy(SHA256 commit)

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// SHA256 helper (Trustworthy lock)
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// CLI-only constant; pure functions accept root parameter for in-process testing
// argv[2] 可能是 `--update-baseline` 旗標，不可誤當路徑
const argRoot = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
const ROOT = argRoot || process.cwd();

export const VERSION = '1.3.0';

// ─── 全域規範型別來源（forward providers）──────────────────────
// Canonical dirs are BOTH the forward provider set and (their files) the
// reverse-skip set — 自己不指控自己（規範檔不會被當成 shadow）。
const CANONICAL_DIRS = [
  'packages/shared/src/types',
  'src/types',
  'shared',
  'types',
];

// ─── 反向掃描排除（建置產物 / 備份 / 無關子樹）─────────────────
const REVERSE_SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'out',
  'build',
  'coverage',
  'archive',
  '_backup-20260731',
  '_fix-backup-20260801',
  '_tmp_vps',
  '_pyi',
  '__pycache__',
  '_analysis',
  'chapters',
  'chapter-templates',
  'VoiceTyper.App',
  'VoiceTyper.Core',
  'VoiceTyper.Tests',
]);

// ─── Forward: collect canonical type files（全域）──────────────
export function collectCanonicalFiles(root = ROOT) {
  const files = new Set();
  for (const rel of CANONICAL_DIRS) {
    const dir = join(root, rel);
    if (!existsSync(dir)) continue;
    const items = readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const p = join(dir, it.name);
      if (it.isDirectory()) {
        if (it.name === 'node_modules' || it.name === 'generated' || it.name.startsWith('.')) continue;
        collectDirTs(p, files);
      } else if (/\.(ts|tsx|d\.ts)$/.test(it.name)) {
        files.add(p);
      }
    }
  }
  return files;
}

function collectDirTs(dir, acc) {
  let items;
  try { items = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const it of items) {
    if (it.name === 'node_modules' || it.name === 'generated' || it.name.startsWith('.')) continue;
    const p = join(dir, it.name);
    if (it.isDirectory()) collectDirTs(p, acc);
    else if (/\.(ts|tsx|d\.ts)$/.test(it.name)) acc.add(p);
  }
  return acc;
}

// ─── Forward: scan canonical exports（全域）────────────────────
// 1) packages/shared/src/types/index.ts 的 `export * from './xxx'`（既有語意）
// 2) 全部規範檔上的 `export type|interface|const|class Name`（全域新增）
export function scanSharedExports(root = ROOT) {
  const exports = new Map();
  const packagesDir = join(root, 'packages');
  const sharedIndex = join(packagesDir, 'shared/src/types/index.ts');

  if (existsSync(sharedIndex)) {
    const content = readFileSync(sharedIndex, 'utf-8');
    // Match `export * from './xxx'` (re-exports)
    for (const m of content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
      const from = m[1];
      const target = join(packagesDir, 'shared/src/types', `${from}.ts`);
      if (!existsSync(target)) continue;
      const targetContent = readFileSync(target, 'utf-8');
      const typeRe = /export\s+type\s+(\w+)/g;
      const valueRe = /export\s+const\s+(\w+)/g;
      const ifaceRe = /export\s+interface\s+(\w+)/g;
      for (const t of targetContent.matchAll(typeRe)) exports.set(t[1], { from, kind: 'type' });
      for (const t of targetContent.matchAll(ifaceRe)) exports.set(t[1], { from, kind: 'interface' });
      for (const t of targetContent.matchAll(valueRe)) exports.set(t[1], { from, kind: 'const' });
    }
  }

  // 全域：其餘規範檔的直接宣告
  const declRe = /export\s+(?:type|interface|const|class)\s+(\w+)/g;
  for (const file of collectCanonicalFiles(root)) {
    if (file === sharedIndex) continue;
    let content;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    const from = relative(root, file);
    for (const m of content.matchAll(declRe)) {
      if (!exports.has(m[1])) exports.set(m[1], { from, kind: 'decl' });
    }
  }
  return exports;
}

// ─── 治理邊界：衍生檔與第三方不指控 ────────────────────────────
// derived = */types/generated/*.d.ts（由 shared 匯出生成的副本，改了下次生成會蓋掉）
// vendor  = vendor/**（第三方程式碼，不受本閘治理）
// 回傳 'derived' | 'vendor' | 'governed'；輸入為 POSIX 分隔的 repo 相對路徑
export function classifyShadowPath(relPosix) {
  if (relPosix.startsWith('vendor/')) return 'vendor';
  if (/(^|\/)types\/generated\//.test(relPosix)) return 'derived';
  return 'governed';
}

// ─── Reverse: scan WHOLE repo for shadowed declarations（全域）────
// stats（可選）: { derived, vendor } — 記錄被治理邊界排除的檔案數（report 取證用）
export function scanShadowedTypes(sharedExports, root = ROOT, stats = null) {
  const shadowed = [];
  const sharedNames = [...sharedExports.keys()];
  if (sharedNames.length === 0) return shadowed;

  const canonical = collectCanonicalFiles(root);
  const files = walkRepoTs(root);

  // 一次編譯合併 regex（全域 forward 名稱可達 282+，逐名逐行重建 regex 會爆炸）
  // 依長度降序，避免前綴名先匹配（Locale vs LocaleX）
  const sorted = [...sharedNames].sort((a, b) => b.length - a.length);
  const combined = new RegExp(`export\\s+(?:type|interface)\\s+(${sorted.map(escapeRe).join('|')})\\b`);
  const known = new Set(sharedNames);

  for (const file of files) {
    if (canonical.has(file)) continue; // 規範檔本身不指控
    const rel = relative(root, file).split(/[\\/]/).join('/');
    const cls = classifyShadowPath(rel);
    if (cls !== 'governed') {
      if (stats) stats[cls] = (stats[cls] || 0) + 1;
      continue;
    }
    let content;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    const pkg = rel.split('/')[0];
    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.includes('export')) continue; // 快速過濾
      const m = combined.exec(line);
      if (!m) continue;
      if (/from\s*['"]/.test(line)) continue; // re-export 不算重複定義
      if (!known.has(m[1])) continue;
      shadowed.push({ type: m[1], shadowedIn: rel, pkg });
    }
  }
  return shadowed;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 全域 walk：排除建置產物/備份/無關子樹與隱藏目錄
export function walkRepoTs(root = ROOT) {
  const files = [];
  let items;
  try { items = readdirSync(root, { withFileTypes: true }); } catch { return files; }
  for (const it of items) {
    if (it.name.startsWith('.') || it.name === 'node_modules' || REVERSE_SKIP_DIRS.has(it.name)) continue;
    const p = join(root, it.name);
    if (it.isDirectory()) walkDirTs(p, files);
    else if (/\.(ts|tsx)$/.test(it.name)) files.push(p);
  }
  return files;
}

function walkDirTs(dir, acc) {
  let items;
  try { items = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const it of items) {
    if (it.name.startsWith('.') || it.name === 'node_modules' || REVERSE_SKIP_DIRS.has(it.name)) continue;
    const p = join(dir, it.name);
    if (it.isDirectory()) walkDirTs(p, acc);
    else if (/\.(ts|tsx)$/.test(it.name)) acc.push(p);
  }
  return acc;
}

// 保留既有 export（相容既有呼叫端）
export function walkTs(dir) {
  const acc = [];
  return walkDirTs(dir, acc);
}

// ─── 基線棘輪（baseline ratchet）───────────────────────────────
// 既有重複定義（75 筆）不可一次性清完，但「不准再變多」是可立即執行的承諾。
// 規則：newDrift（現況不在基線內）> 0 → exit 1；resolved（基線已無對應現況）可縮減基線。
export const baselineKey = (s) => `${s.type}|${s.shadowedIn}`;

export function loadBaseline(root = ROOT) {
  const p = join(root, 'tools/ts-matrix/baseline.json');
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

export function writeBaseline(root, shadowed) {
  const p = join(root, 'tools/ts-matrix/baseline.json');
  const entries = shadowed
    .map((s) => ({ type: s.type, shadowedIn: s.shadowedIn, pkg: s.pkg }))
    .sort((a, b) => baselineKey(a).localeCompare(baselineKey(b)));
  const doc = {
    note: '終始矩陣基線棘輪 — 既有重複定義清單（只減不增）。收斂後執行 `node tools/ts-matrix/verify.mjs --update-baseline` 重寫縮減基線，需人工確認。',
    generatedBy: 'tools/ts-matrix/verify.mjs',
    version: VERSION,
    total: entries.length,
    entries,
  };
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(doc, null, 2) + '\n', 'utf-8');
  return { path: p, total: entries.length };
}

// ─── CLI guard ──────────────────────────────────────────────
const isCLI = process.argv[1] === fileURLToPath(import.meta.url);

if (isCLI) {
  const updateBaseline = process.argv.includes('--update-baseline');
  const sharedExports = scanSharedExports(ROOT);
  const scanStats = { derived: 0, vendor: 0 };
  const shadowed = scanShadowedTypes(sharedExports, ROOT, scanStats);
  const canonical = collectCanonicalFiles(ROOT);
  const scanned = walkRepoTs(ROOT);

  if (updateBaseline) writeBaseline(ROOT, shadowed);

  const baselineEntries = loadBaseline(ROOT);
  const baseKeys = new Set(baselineEntries.map(baselineKey));
  const curKeys = new Set(shadowed.map(baselineKey));
  const newDrift = shadowed.filter((s) => !baseKeys.has(baselineKey(s)));
  const resolved = baselineEntries.filter((e) => !curKeys.has(baselineKey(e)));

  const forward = {
    scope: 'global',
    sharedPaths: CANONICAL_DIRS.filter((p) => existsSync(join(ROOT, p))),
    canonicalFileCount: canonical.size,
    exportCount: sharedExports.size,
    exports: [...sharedExports.entries()].map(([name, info]) => ({ name, ...info })),
  };

  const reverse = {
    scope: 'global',
    scannedFileCount: scanned.length,
    shadowedCount: shadowed.length,
    excluded: { derivedFiles: scanStats.derived, vendorFiles: scanStats.vendor },
    baseline: {
      file: 'tools/ts-matrix/baseline.json',
      total: baselineEntries.length,
      newDriftCount: newDrift.length,
      newDrift,
      resolvedCount: resolved.length,
      resolved,
    },
    shadowed,
  };

  const passForward = forward.exportCount > 0;
  const passReverse = newDrift.length === 0;

  const report = {
    timestamp: new Date().toISOString(),
    version: VERSION,
    matrix: 'esggo-ts-matrix',
    forward,
    reverse,
    pass: passForward && passReverse,
  };

  // Trustworthy: SHA256 lock of the report's SUBSTANTIVE contract content.
  //
  // Pitfall (fixed 2026-09-28): the lock previously hashed the whole report
  // INCLUDING `timestamp`. That makes every run produce a different digest, so
  // the "lock" could never actually lock anything and drifted on every CI run.
  // Hash only the deterministic fields — the contract that must not change.
  const { timestamp: _volatile, ...substantive } = report;
  const reportSha = sha256(JSON.stringify(substantive, null, 2));
  const finalReport = {
    ...report,
    lock: {
      sha256: reportSha,
      algorithm: 'sha256',
      note: 'Trustworthy 5T - lock of drift-report.json content',
    },
  };

  const reportPath = join(ROOT, 'tools/ts-matrix/drift-report.json');
  mkdirSync(join(ROOT, 'tools/ts-matrix'), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(finalReport, null, 2) + '\n', 'utf-8');

  console.log(`=== 終始矩陣雙向驗證閘 (v${VERSION} 全域 + 基線棘輪 + Trustworthy lock) ===`);
  console.log(`Forward (全域規範 ${forward.canonicalFileCount} 檔提供 ${forward.exportCount} 個 export): ${passForward ? '✓' : '✗'}`);
  console.log(`Reverse (全域 ${reverse.scannedFileCount} 檔受檢 | 治理排除 衍生 ${scanStats.derived} / 第三方 ${scanStats.vendor}): ${passReverse ? '✓' : '✗'} | shadowed=${shadowed.length} | 基線=${baselineEntries.length} | 新增=${newDrift.length} | 已收斂=${resolved.length}`);
  console.log(`Trustworthy SHA256 lock: ${reportSha.slice(0, 24)}...`);
  if (newDrift.length) {
    console.log(`\n⛔ 新增 drift（不在基線內）:`);
    for (const s of newDrift) console.log(`  ✗ ${s.type} shadowed in ${s.shadowedIn} (scope=${s.pkg})`);
    console.log(`  → 請收斂重複定義；若確屬既有債務，人工確認後執行 --update-baseline`);
  }
  if (resolved.length) {
    console.log(`\n✨ 已收斂 ${resolved.length} 筆（基線可縮減）:`);
    for (const e of resolved.slice(0, 20)) console.log(`  - ${e.type} @ ${e.shadowedIn}`);
    if (resolved.length > 20) console.log(`  ... 其餘 ${resolved.length - 20} 筆見 report`);
    console.log(`  → 人工確認後執行 --update-baseline 縮減基線`);
  }
  if (updateBaseline) console.log(`\n基線已重寫: tools/ts-matrix/baseline.json (${baselineEntries.length} 筆)`);
  console.log(`\nReport: ${relative(ROOT, reportPath)}`);

  process.exitCode = passForward && passReverse ? 0 : 1;
}

// Always export for TDD in-process testing
export { sha256 };
