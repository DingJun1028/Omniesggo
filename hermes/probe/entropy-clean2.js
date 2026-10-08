/**
 * 熵減腳本（第二轮）：移除 7 處已查證未使用的匯入、死碼與冗餘型別參數
 * 每一處都先經 grep 查證「匯入行／宣告行以外使用次數 = 0」。
 */
const fs = require('fs');
const path = require('path');
const root = process.cwd();

const edits = [
  // 死碼第 2、3 處：同一段 os.loadavg() copy-paste 到另兩個 health 路由
  ['src/app/api/health-metrics/route.ts', "import os from 'os';\n", '', '死碼：連帶移除僅供 cpu 使用的 os 匯入'],
  ['src/app/api/health-metrics/route.ts', '    const cpu = os.loadavg()[0];\n', '', '死碼：win32 上恆為 [0,0,0]'],
  ['src/app/api/health/metrics/route.ts', "import os from 'os';\n", '', '死碼：連帶移除僅供 cpu 使用的 os 匯入'],
  ['src/app/api/health/metrics/route.ts', '    const cpu = os.loadavg()[0];\n', '', '死碼：win32 上恆為 [0,0,0]'],

  // 未用匯入（grep 查證：匯入行外使用次數 = 0）
  ['src/lib/auth-claims.ts',
   "import { getAdminApp } from './firebase-admin';\n", '', '未用匯入 getAdminApp'],
  ['src/lib/unified-auth.ts',
   "import { getAuth } from './firebase-admin';\n", '', '未用匯入 getAuth'],
  ['src/oa-integration/cache-manager.ts',
   "import { freeze, OA_VERSION } from './types';",
   "import { freeze } from './types';", '未用匯入 OA_VERSION'],

  // 死碼：squad 名稱完整保留於 src/core/omnitag_registry.py，移除不損失資訊
  ['src/lib/omnitag-contract.ts',
   "const SQUAD_SET = new Set([\n  '智庫聖所',\n  '符文契約',\n  '光之羽翼',\n  '煉金熵減',\n  '5T驗算',\n]);\n\n",
   '', '死碼：未使用的 SQUAD_SET（名稱另存於 omnitag_registry.py）'],

  // 冗餘型別參數：專案程式碼無任何 .register<Type>() 顯式引數
  ['src/lib/omni-core/omni-kernel.ts',
   '    register<T>(component: IComponentCore, type: string = \'generic\'): void {',
   '    register(component: IComponentCore, type: string = \'generic\'): void {',
   '移除未使用的型別參數 <T>'],
];

let hit = 0, miss = 0;
for (const [file, from, to, why] of edits) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  const n = src.split(from).length - 1;
  if (n !== 1) {
    console.log(`  ${n === 0 ? '❌ 未命中' : '⚠️ 出現 ' + n + ' 次'}  ${file}  ← ${why}`);
    miss++; continue;
  }
  fs.writeFileSync(p, src.replace(from, to), 'utf8');
  console.log(`  ✅ ${file}  ← ${why}`);
  hit++;
}
console.log(`\n  套用 ${hit} 筆，略過 ${miss} 筆`);
process.exit(miss > 0 ? 1 : 0);
