/**
 * Agent Registry 冒煙測試 (60 員雙蜂軍團)
 * 1. 載入 SOUL_MATRIX_60 → 建立 Registry
 * 2. 驗證 60 員觸達 (verify60)
 * 3. 驗證 5 陣列 MECE (每陣列 12 員)
 * 4. 驗證雙蜂部署 (local 30 + vps 30)
 * 5. 驗證暗光屬性 (umbra 30 + lumen 30)
 * 6. 驗證能力搜尋
 * 7. 驗證 heartbeat + health
 */
import { AgentRegistry } from '../src/registry/agent-registry.js';
import { SOUL_MATRIX_60 } from '../../../oa-swarm/src/soul-matrix-60.js';

const registry = new AgentRegistry(SOUL_MATRIX_60);

// 1. 60 員觸達
const v60 = registry.verify60();
console.log('60 員觸達:', v60.pass ? '✅ PASS' : '❌ FAIL', `(${v60.count}/60)`);
if (!v60.pass) console.log('  缺失:', v60.missing);

// 2. 5 陣列 MECE
const arrays = ['sanctum', 'rune', 'wing', 'alchemy', 'audit'] as const;
let arrayOk = true;
for (const arr of arrays) {
  const agents = registry.byArrayKey(arr);
  if (agents.length !== 12) { arrayOk = false; console.log(`  ❌ ${arr}: ${agents.length} (expected 12)`); }
}
console.log('5 陣列 MECE (每陣列 12):', arrayOk ? '✅ PASS' : '❌ FAIL');

// 3. 雙蜂部署
const local = registry.bySideKey('local');
const vps = registry.bySideKey('vps');
console.log('雙蜂部署:', local.length === 30 && vps.length === 30 ? '✅ PASS' : '❌ FAIL', `(local=${local.length}, vps=${vps.length})`);

// 4. 暗光屬性
const umbra = registry.byAlignmentKey('umbra');
const lumen = registry.byAlignmentKey('lumen');
console.log('暗光屬性:', umbra.length === 30 && lumen.length === 30 ? '✅ PASS' : '❌ FAIL', `(umbra=${umbra.length}, lumen=${lumen.length})`);

// 5. 能力搜尋
const repairAgents = registry.byCapability('self-healing');
console.log('自癒能力搜尋:', repairAgents.length > 0 ? '✅ PASS' : '❌ FAIL', `(${repairAgents.length} agents)`);

// 6. Heartbeat + Health
registry.heartbeat(1);
registry.heartbeat(31);
const h = registry.health();
console.log('Heartbeat:', h.alive === 2 ? '✅ PASS' : '❌ FAIL', `(alive=${h.alive}/${h.total})`);

// 7. 驗證 5T 驗算陣列
const auditAgents = registry.byArrayKey('audit');
console.log('5T 驗算陣列:', auditAgents.length === 12 ? '✅ PASS' : '❌ FAIL', `(${auditAgents.length})`);

// 總結
const allPass = v60.pass && arrayOk && local.length === 30 && vps.length === 30 &&
  umbra.length === 30 && lumen.length === 30 && repairAgents.length > 0 && h.alive === 2;
console.log('\n=== Agent Registry 冒煙測試 ===', allPass ? '✅ ALL PASS' : '❌ SOME FAILED');
