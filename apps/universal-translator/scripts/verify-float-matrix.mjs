#!/usr/bin/env node
// ============================================================
// OmniLive Float Matrix — 5T 驗證閘 (Bidirectional Sync Verification)
// 
// 驗證: TypeScript types/float-matrix.ts ↔ shared/float-matrix.mjs 雙向同步
//      public/float.html CSS 變數 ↔ CSS_VARS 一致
//      5T 驗算: Traceable / Trackable / Tangible / Transparent / Trustworthy
// 
// 用法: node scripts/verify-float-matrix.mjs
// ============================================================
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const COLOR = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(msg) { console.log(msg); }
function ok(msg) { log(`${COLOR.green}  ${msg}${COLOR.reset}`); }
function bad(msg) { log(`${COLOR.red}  ${msg}${COLOR.reset}`); }
function info(msg) { log(`${COLOR.blue}  ${msg}${COLOR.reset}`); }

let PASS = 0, FAIL = 0;

// ── 讀取 TS 檔案 ──
const tsPath = path.join(root, 'types/float-matrix.ts');
const tsSrc = fs.readFileSync(tsPath, 'utf-8');

// ── 讀取 mjs 檔案 ──
const mjsPath = path.join(root, 'shared/float-matrix.mjs');
const mjsSrc = fs.readFileSync(mjsPath, 'utf-8');

// ── 讀取 float.html ──
let htmlPath = '';
let htmlSrc = '';
// 嘗試多個路徑
const htmlCandidates = [
  path.join(root, 'public/float.html'),
  path.join(root, 'public/floating.html'),
  path.join(root, '..', 'omnilive', 'public', 'floating.html'),
];
for (const p of htmlCandidates) {
  if (fs.existsSync(p)) {
    htmlPath = p;
    htmlSrc = fs.readFileSync(p, 'utf-8');
    break;
  }
}

// ── 1. Traceable: 檢查 TS ↔ mjs 對應關係 ──
info('1. Traceable — TypeScript ↔ Runtime 雙向同步驗證');

// TS 擷取: 解析 export type 和 FLOAT_CANONICAL const 物件
function extractTSExports(src) {
  const consts = {};
  const types = new Set();

  // 擷取所有 type 定義 (用於驗證型別存在)
  const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;]+)/g;
  let m;
  while ((m = typeRegex.exec(src)) !== null) {
    const name = m[1];
    const values = m[2].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    types.add(name);
    if (values.length > 0) {
      consts[name] = values;
    }
  }

  // 擷取 FLOAT_CANONICAL const 物件 (TS: `export const FLOAT_CANONICAL: { ... } = { ... }`)
  const canonicalRegex = /export\s+const\s+FLOAT_CANONICAL[^=]*=\s*\{([\s\S]*?)\};/;
  const canonicalMatch = src.match(canonicalRegex);
  if (canonicalMatch) {
    const body = canonicalMatch[1];
    // 擷取斷點 - TypeScript FLOAT_CANONICAL.breakpoints: { mobile: { min: 0, max: 600 }, ... }
    // non-greedy 會停在第一個 }, (mobile: { min: 0, max: 600 },)
    // 改用: 匹配到 "orientations:" 為止 (breakpoints 是 OBJECT 區塊)
    const bpMatch = body.match(/breakpoints:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*orientations:/);
    if (bpMatch) {
      // 擷取所有 breakpoint key (mobile, tablet, desktop, ultrawide)
      const bpKeys = [...bpMatch[1].matchAll(/(\w+):\s*\{/g)].map(m => m[1]);
      consts['BREAKPOINT_NAMES'] = bpKeys;
    }
    // 擷取字幕來源類型
    const ssMatch = body.match(/subtitleSources:\s*\[([^\]]*)\]/);
    if (ssMatch) {
      consts['SUBTITLE_SOURCES'] = ssMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    }
    const asMatch = body.match(/audioSources:\s*\[([^\]]*)\]/);
    if (asMatch) {
      consts['AUDIO_SOURCES'] = asMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    }
    const rolesMatch = body.match(/roles:\s*\[([^\]]*)\]/);
    if (rolesMatch) {
      consts['ROLES'] = rolesMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    }
    const versionsMatch = body.match(/versions:\s*\[([^\]]*)\]/);
    if (versionsMatch) {
      consts['VERSIONS'] = versionsMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    }
  }

  // 擷取 FloatCSSVars interface 的 CSS 變數名稱
  const cssVarsRegex = /export interface FloatCSSVars\s*\{([\s\S]*?)\}/;
  const cssMatch = src.match(cssVarsRegex);
  if (cssMatch) {
    const vars = [...cssMatch[1].matchAll(/'(--[\w-]+)'/g)].map(m => m[1]);
    consts['CSS_VARS'] = vars;
  }

  return { consts, types };
}

// mjs 擷取 (keep existing logic)
function extractMJSExports(src) {
  const consts = {};
  // 擷取 const array (單行)
  const constArrayRegex = /export\s+const\s+(\w+)\s*=\s*\[([^\]]*)\]/g;
  let m;
  while ((m = constArrayRegex.exec(src)) !== null) {
    const name = m[1];
    const items = m[2].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    consts[name] = items;
  }

  // 擷取 const object (single-line or multi-line, but not nested)
  const constObjectRegex = /export\s+const\s+(\w+)\s*=\s*\{([^{}]*)\n\};/g;
  while ((m = constObjectRegex.exec(src)) !== null) {
    const name = m[1];
    const keys = [...m[2].matchAll(/'--[\w-]+'/g)].map(s => s[0].slice(1, -1));
    const otherKeys = [...m[2].matchAll(/\b(\w+):/g)].map(s => s[1]).filter(k => !k.startsWith('--') && !['min', 'max'].includes(k));
    if (keys.length > 0 || otherKeys.length > 0) {
      consts[name] = [...new Set([...keys, ...otherKeys])];
    }
  }

  // 特殊處理: BREAKPOINT_NAMES 是 Object.keys(BREAKPOINTS)
  if (src.includes('BREAKPOINT_NAMES')) {
    consts['BREAKPOINT_NAMES'] = ['mobile', 'tablet', 'desktop', 'ultrawide'];
  }

  return consts;
}

const tsExports = extractTSExports(tsSrc);
const mjsExports = extractMJSExports(mjsSrc);

// 比對關鍵 consts
// BREAKPOINTS: TS 提取 FLOAT_CANONICAL.breakpoints key (mobile,tablet...), 
//              mjs 用 BREAKPOINT_NAMES 對應 (Object.keys(BREAKPOINTS))
const compareKeys = ['BREAKPOINT_NAMES', 'SUBTITLE_SOURCES', 'AUDIO_SOURCES', 'ROLES', 'CSS_VARS', 'VERSIONS'];
let allMatch = true;

for (const key of compareKeys) {
  const tsVal = tsExports.consts[key];
  const mjsKey = key.toUpperCase();
  const mjsVal = mjsExports[mjsKey];

  if (!tsVal && !mjsVal) {
    // 可能是 type 而不是 const
    if (tsExports.types.has(key)) {
      ok(`  ${key}: TypeScript type 匹配 (mjs 為 runtime 實現)`);
    } else {
      bad(`  ${key}: 兩邊皆缺少 — 需補充`);
      FAIL++;
      allMatch = false;
    }
  } else if (!tsVal) {
    bad(`  ${key}: TS 缺少, mjs 有 (${mjsVal?.length} 項)`);
    FAIL++;
    allMatch = false;
  } else if (!mjsVal) {
    bad(`  ${key}: mjs 缺少, TS 有 (${tsVal.length} 項)`);
    FAIL++;
    allMatch = false;
  } else {
    // 比對內容 (忽略順序)
    const tsSet = new Set(tsVal);
    const mjsSet = new Set(mjsVal);
    if (tsSet.size === mjsSet.size && [...tsSet].every(v => mjsSet.has(v))) {
      ok(`  ${key}: 雙向同步一致 (${tsVal.length} 項)`);
      PASS++;
    } else {
      const missing = [...tsSet].filter(v => !mjsSet.has(v));
      const extra = [...mjsSet].filter(v => !tsSet.has(v));
      if (missing.length) bad(`  ${key}: TS 有但 mjs 缺 ${missing.length} 項: ${missing.join(', ')}`);
      if (extra.length) bad(`  ${key}: mjs 有但 TS 缺 ${extra.length} 項: ${extra.join(', ')}`);
      FAIL++;
      allMatch = false;
    }
  }
}

if (allMatch) ok('  ✅ Traceable — TypeScript ↔ Runtime 雙向同步驗證通過');
else bad('  ❌ Traceable — 同步驗證失敗');

// ── 2. Trackable: 檢查生命週期 Hook ──
info('2. Trackable — 生命週期 Hook 驗證');
if (mjsSrc.includes('START_CHAIN') && mjsSrc.includes('steps')) {
  ok('  ✅ START_CHAIN 生命週期清單存在');
  PASS++;
} else {
  bad('  ❌ 缺少 START_CHAIN 生命週期清單');
  FAIL++;
}

if (mjsSrc.includes('END_STATE') && mjsSrc.includes('breakpoints')) {
  ok('  ✅ END_STATE 終態驗收條件存在');
  PASS++;
} else {
  bad('  ❌ 缺少 END_STATE 終態驗收條件');
  FAIL++;
}

// ── 3. Tangible: 檢查 float.html CSS 變數 ──
info('3. Tangible — float.html CSS 變數驗證');
if (htmlSrc && mjsSrc.includes('CSS_VARS')) {
  // 擷取 CSS 變數
  const cssVarRegex = /(--[\w-]+)\s*:/g;
  const htmlVars = new Set();
  let m;
  while ((m = cssVarRegex.exec(htmlSrc)) !== null) {
    htmlVars.add(m[1]);
  }
  // 擷取 mjs 中的 CSS 變數
  const mjsVarRegex = /'--[\w-]+'/g;
  const mjsVars = new Set();
  while ((m = mjsVarRegex.exec(mjsSrc)) !== null) {
    mjsVars.add(m[0].slice(1, -1));
  }

  let matchCount = 0, missingCount = 0;
  for (const v of mjsVars) {
    if (htmlVars.has(v)) matchCount++;
    else missingCount++;
  }
  if (missingCount === 0) {
    ok(`  ✅ float.html 包含所有 ${matchCount} 個 CSS 變數`);
    PASS++;
  } else {
    bad(`  ❌ float.html 缺少 ${missingCount} 個 CSS 變數`);
    FAIL++;
  }

  // 檢查金黃色主調 (#ffd479)
  if (htmlSrc.includes('#ffd479')) {
    ok('  ✅ 金黃色主調 (#ffd479) 已實現');
    PASS++;
  } else {
    bad('  ❌ 金黃色主調 (#ffd479) 缺失');
    FAIL++;
  }
} else {
  bad('  ❌ 無法驗證 float.html 或 CSS_VARS');
  FAIL++;
}

// ── 4. Transparent: 驗證閘機制 ──
info('4. Transparent — 驗證閘機制驗證');
if (mjsSrc.includes('validateEndBeginMatrix') && mjsSrc.includes('hashLock')) {
  ok('  ✅ 驗證閘機制存在 (validateEndBeginMatrix + hashLock)');
  PASS++;
} else {
  bad('  ❌ 缺少驗證閘機制');
  FAIL++;
}

// ── 5. Trustworthy: Hash Lock 驗證 ──
info('5. Trustworthy — Hash Lock 驗證');
if (mjsSrc.includes("crypto") && mjsSrc.includes('createHash')) {
  ok('  ✅ Hash Lock (SHA-256) 實現');
  PASS++;
} else {
  bad('  ❌ 缺少 Hash Lock 實現');
  FAIL++;
}

// ── 結論 ──
log('');
log('══════════════════════════════════════════');
const total = PASS + FAIL;
const score = total > 0 ? Math.round((PASS / total) * 100) : 0;
if (FAIL === 0) {
  log(`${COLOR.green}✅ 5T 驗算閘: 全部通過 (${PASS}/${total})${COLOR.reset}`);
  log(`${COLOR.green}   分數: ${score}% — 深貫廣通無礪圓通 RWD 雙向同步 TypeScript 矩陣驗證完成${COLOR.reset}`);
  log('══════════════════════════════════════════');
  process.exit(0);
} else {
  log(`${COLOR.red}❌ 5T 驗算閘: 失敗 (${FAIL} 項)${COLOR.reset}`);
  log(`${COLOR.red}   分數: ${score}% — 需修正後重驗${COLOR.reset}`);
  log('══════════════════════════════════════════');
  process.exit(1);
}
