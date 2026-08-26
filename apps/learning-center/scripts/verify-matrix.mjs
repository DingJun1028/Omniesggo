#!/usr/bin/env node
// ============================================================
// OmniLive / Learning-Center 消費端 終始矩陣健康閘 (Consumer-Side Gate)
//
// 職責: 驗證本 consumer (apps/learning-center) 的 types/generated/esggo-shared.d.ts
//       確實同步到終始矩陣契約 (缺口補齊 72 + Float 5柱), 並重放根層 72 不變式。
// 雙向同步拓撲: shared/types.ts(終) → export-shared-types.js → 本檔(始) 必須含新契約。
// 5T: 任一缺失 → exit 1 (Trustworthy 不可篡改閉環)
//
// 用法: node scripts/verify-matrix.mjs
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..', '..'); // apps/learning-center → esggo root

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let failures = 0;
const fail = (m) => { console.error(`${RED}  ✗ ${m}${RESET}`); failures++; };
const ok = (m) => console.log(`${GREEN}  ✓ ${m}${RESET}`);

console.log(`${CYAN}── Learning-Center 消費端終始矩陣健康閘 ──${RESET}`);

// 1. consumer .d.ts 必須含缺口補齊終始矩陣契約 (Learning-Center 實際消費的集合)
//    注意: Float 契約屬 universal-translator canonical, 不經 export-shared-types.js 分發, 故不在此驗證
const dtsPath = path.join(__dirname, '..', 'types', 'generated', 'esggo-shared.d.ts');
if (!fs.existsSync(dtsPath)) { fail(`缺少 consumer 型別檔: ${dtsPath}`); }
else {
  const src = fs.readFileSync(dtsPath, 'utf-8');
  const must = [
    'GapUnitKey', 'GapRole', 'GapHubKind',
    'IGapAgent', 'IGapPairing', 'IGapMatrixCoverage',
  ];
  const missing = must.filter((k) => !src.includes(k));
  if (missing.length > 0) fail(`consumer .d.ts 缺缺口補齊契約: ${missing.join(', ')}`);
  else ok('consumer .d.ts 含缺口補齊終始矩陣契約 (GapUnitKey/GapRole/GapHubKind/IGapAgent/IGapPairing/IGapMatrixCoverage) — 終→始 雙向同步');
}

// 2. 重放根層 72 不變式 (經 tsx 跑根 verify_gap_matrix.ts, 輸出不重複印)
const r = spawnSync('npx', ['tsx', 'scripts/verify_gap_matrix.ts'], {
  cwd: root, encoding: 'utf-8',
});
if (r.status !== 0) {
  fail('根層缺口補齊 72 不變式重放失敗 (verify_gap_matrix.ts exit=' + r.status + ')');
  if (r.stderr) process.stderr.write(r.stderr);
} else {
  ok('根層缺口補齊 72 不變式重放 PASS (30/10/60/12/72/30·30)');
}

console.log('----------------------------------------');
if (failures > 0) {
  console.error(`${RED}✗ Learning-Center 終始矩陣健康閘失敗 (${failures} 項) — 不得宣稱通過${RESET}`);
  process.exit(1);
}
console.log(`${GREEN}✓ Learning-Center 終始矩陣健康閘: consumer 契約完整 + 72 不變式重放通過${RESET}`);
process.exit(0);
