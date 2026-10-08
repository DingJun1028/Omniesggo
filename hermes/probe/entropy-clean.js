/**
 * 熵減腳本：移除 13 處「已驗證未使用」的匯入與死碼
 * 每筆皆為精確字串替換，替換後回報是否命中，避免靜默失敗。
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

/** [檔案, 原文, 新文, 說明] */
const edits = [
  // 死碼：Windows 上 os.loadavg() 恆為 [0,0,0]，指標從未使用該值
  ['src/app/api/health/route.ts', "import os from 'os';\n", '', '死碼：連帶移除僅供 cpu 使用的 os 匯入'],
  ['src/app/api/health/route.ts', '    const cpu = os.loadavg()[0];\n', '', '死碼：os.loadavg() 在 win32 恆為 [0,0,0]'],

  // 未使用匯入（eslint 已證明未使用）
  ['src/app/api/health-metrics/route.ts',
   "import { NextRequest, NextResponse } from 'next/server';",
   "import { NextResponse } from 'next/server';", '未用匯入 NextRequest'],
  ['src/app/api/health/metrics/route.ts',
   "import { NextRequest, NextResponse } from 'next/server';",
   "import { NextResponse } from 'next/server';", '未用匯入 NextRequest'],
  ['src/lib/auth-claims.ts',
   "import { getAuth } from './firebase-admin';\n", '', '未用匯入 getAuth（getAdminApp 仍有使用）'],
  ['src/lib/unified-auth.ts',
   "import { getAdminApp } from './firebase-admin';\n", '', '未用匯入 getAdminApp（getAuth 仍有使用）'],

  // oa-integration：僅移除 flagged 名稱，保留同匯入中仍有使用的成員
  ['src/oa-integration/api-gateway.ts',
   "import { freeze, uuidV4, OA_VERSION } from './types';",
   "import { freeze, uuidV4 } from './types';", 'OA_VERSION 未用（freeze/uuidV4 仍用）'],
  ['src/oa-integration/cache-manager.ts',
   "import { freeze, uuidV4, OA_VERSION } from './types';",
   "import { freeze, OA_VERSION } from './types';", 'uuidV4 未用（freeze/OA_VERSION 仍用）'],
  ['src/oa-integration/error-handler.ts',
   "import { freeze, uuidV4, OA_VERSION } from './types';",
   "import { freeze, uuidV4 } from './types';", 'OA_VERSION 未用（freeze/uuidV4 仍用）'],
  ['src/oa-integration/etl-pipeline.ts',
   "import { freeze, hashLock, uuidV4, OA_VERSION } from './types';",
   "import { freeze, hashLock, uuidV4 } from './types';", 'OA_VERSION 未用（其餘三者仍用）'],
  ['src/oa-integration/event-bus.ts',
   "import { type FiveT, hashLock, freeze, uuidV4, OA_VERSION } from './types';",
   "import { type FiveT, freeze, uuidV4 } from './types';", 'hashLock + OA_VERSION 未用'],
  ['src/oa-integration/service-orchestrator.ts',
   "import { freeze, uuidV4, OA_VERSION } from './types';",
   "import { freeze, uuidV4 } from './types';", 'OA_VERSION 未用（freeze/uuidV4 仍用）'],
];

let hit = 0;
let miss = 0;
for (const [file, from, to, why] of edits) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (!src.includes(from)) {
    console.log(`  ❌ 未命中  ${file}  ← ${why}`);
    miss++;
    continue;
  }
  const count = src.split(from).length - 1;
  if (count !== 1) {
    console.log(`  ⚠️  出現 ${count} 次，未套用  ${file}  ← ${why}`);
    miss++;
    continue;
  }
  fs.writeFileSync(p, src.replace(from, to), 'utf8');
  console.log(`  ✅ ${file}  ← ${why}`);
  hit++;
}
console.log(`\n  套用 ${hit} 筆，略過 ${miss} 筆`);
process.exit(miss > 0 ? 1 : 0);
