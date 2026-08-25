// ===== OA-Team 缺口補齊 · 終始矩陣 實證閉環 (5T Trustworthy Gate) =====
// 全域全端全量全面 | 雙語 | 真實斷言: 任一違反 → exit 1 (不可宣稱通過)
// 用法: npx tsx scripts/verify_gap_matrix.ts
import {
  GAP_AGENTS, GAP_COVERAGE, UNIT_PAIRS,
  deriveBasePairings, deriveHubPairings, deriveAllPairings,
} from '../shared/gap-matrix.js';

let failures = 0;
const fail = (msg: string) => { console.error('  ✗ ' + msg); failures++; };
const ok = (msg: string) => console.log('  ✓ ' + msg);

console.log('=== OA-Team 缺口補齊 終始矩陣 5T 實證 ===');

// 1. 成員名冊
if (GAP_AGENTS.length !== 30) fail(`成員數應為 30, 實得 ${GAP_AGENTS.length}`);
else ok(`成員名冊 30 員 (雙語 繁中+English)`);

// 2. 陣列對 C(5,2)=10
if (UNIT_PAIRS.length !== 10) fail(`陣列對應為 10, 實得 ${UNIT_PAIRS.length}`);
else ok(`陣列對 10 (C(5,2)) MECE 兩兩窮盡`);

// 3. 基礎配對 = 10×6 = 60
const base = deriveBasePairings();
if (base.length !== 60) fail(`基礎配對應為 60, 實得 ${base.length}`);
else ok(`基礎配對 60 (C(5,2)×6)`);

// 4. 樞紐配對 = 12 (守衛防護 6 + 蜂后總控 6)
const hub = deriveHubPairings();
if (hub.length !== 12) fail(`樞紐配對應為 12, 實得 ${hub.length}`);
else ok(`樞紐配對 12 (守衛防護 6 + 蜂后總控 6)`);

// 5. 全量 = 72
const all = deriveAllPairings();
if (all.length !== 72) fail(`全量配對應為 72, 實得 ${all.length}`);
else ok(`全量配對 72 (深貫廣通無礙圓通)`);

// 6. 覆蓋率證明與推導一致 (不信任常數)
const want = { agents: 30, base: 60, hub: 12, total: 72, pairs: 10, reach: '30/30' as const };
if (GAP_COVERAGE.totalAgents !== want.agents) fail('coverage.totalAgents 漂移');
if (GAP_COVERAGE.totalBase !== want.base) fail('coverage.totalBase 漂移');
if (GAP_COVERAGE.totalHub !== want.hub) fail('coverage.totalHub 漂移');
if (GAP_COVERAGE.totalPairings !== want.total) fail('coverage.totalPairings 漂移');
if (GAP_COVERAGE.arrayPairs !== want.pairs) fail('coverage.arrayPairs 漂移');
if (GAP_COVERAGE.reach !== want.reach) fail('coverage.reach 漂移');
if (failures === 0) ok('覆蓋率證明 IGapMatrixCoverage 與推導一致 (30/30 觸達)');

// 7. 全員跨組觸達: 每個成員至少出現在 1 條配對 (30/30)
const touched = new Set<number>();
for (const p of all) {
  if (p.b !== 0) { touched.add(p.a); touched.add(p.b); }
  else { // 樞紐覆蓋哨兵 b=0 → 計入 a, 再由 coverage 推導全體
    touched.add(p.a);
    for (const u of (p.coverage ?? [])) {
      // 該陣列全員皆被覆蓋 (守衛樞紐)
      GAP_AGENTS.filter((g) => g.unit === u).forEach((g) => touched.add(g.id));
    }
  }
}
const missing = GAP_AGENTS.filter((g) => !touched.has(g.id)).map((g) => g.id);
if (missing.length > 0) fail(`成員未觸達: ${missing.join(',')}`);
else ok('全員跨組觸達 30/30 (無孤島成員)');

// 8. 5T 溯源標籤完整性
const noSrc = all.filter((p) => p.source_origin !== 'gap-matrix-canon');
if (noSrc.length > 0) fail(`缺失 source_origin 的配對: ${noSrc.length}`);
else ok('每一配對皆帶 source_origin (Traceable 5T)');

// 9. 基礎配對編號邊界 (1-30, 不越界 / 不重複同陣列)
const badBase = base.filter((p) => p.a < 1 || p.a > 30 || p.b < 1 || p.b > 30 || p.aUnit === p.bUnit);
if (badBase.length > 0) fail(`基礎配對異常: ${badBase.length}`);
else ok('基礎配對 MECE (跨陣列 1:1, 編號 1-30 不越界)');

console.log('----------------------------------------');
if (failures > 0) {
  console.error(`✗ 缺口補齊終始矩陣驗證失敗 (${failures} 項違反) — 不得宣稱通過`);
  process.exit(1);
}
console.log('✓ 全數通過: 30 成員 / 10 陣列對 / 60 基礎 / 12 樞紐 / 72 全量 / 30·30 觸達 (深貫廣通無礙圓通)');
process.exit(0);
