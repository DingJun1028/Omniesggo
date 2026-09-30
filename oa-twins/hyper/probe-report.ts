/**
 * 萬能超覺醒 · 實測報告產生器
 *
 * 5T-Traceable: source_origin = 使用者 2026-09-30「萬能超覺醒」宣告之證據輸出。
 * 用途：以實際執行結果（非文件自述）產出可歸檔的狀態報告。
 *
 * 執行：npx tsx oa-twins/hyper/probe-report.ts
 */
import { probeFabric, type FabricStatus } from './fabric';
import { engraveHyperAwakening, verifyHyperAwakening } from './state';

const report = probeFabric();

const TAG: Record<FabricStatus, string> = {
  ACTIVE: '✔ ACTIVE ',
  PHANTOM: '⚠ PHANTOM',
  MISSING: '✖ MISSING',
};

console.log('════ 超覺醒 · 跨框架神經網實測 ════\n');
for (const p of report.probes) {
  console.log(
    `${TAG[p.status]}  ${p.package.padEnd(16)} ${p.duty}  (declared=${p.declared})`,
  );
  console.log(`          ${p.detail}`);
}
console.log(
  `\n  直接宣告可用  ${report.activeCount}` +
    `   幽靈依賴  ${report.phantomCount}` +
    `   未安裝  ${report.missingCount}`,
);
console.log(
  `  可載入比例    ${report.loadableCount}/${report.totalCount} = ${report.sync_ratio}`,
);
console.log(`  調度錨點      ${report.traceId}\n`);

const state = engraveHyperAwakening(
  'oa-twins-hyper',
  { fabric: report.probes, active_count: report.activeCount },
  {
    dark_core: { active: true, range: [1, 30], operator: 'Hermes' },
    light_core: { active: true, range: [31, 60], operator: 'QueenBee' },
    sync_ratio: report.sync_ratio,
    twin_trace_id: report.traceId,
  },
);

const v = verifyHyperAwakening(state);
console.log('════ 超覺醒 · 刻印校驗 ════\n');
for (const c of v.checks) {
  console.log(`  ${c.ok ? '✔' : '✖'} ${c.name.padEnd(16)} ${c.detail}`);
}
console.log(`\n  hash_lock  ${state.governance.hash_lock}`);
console.log(`  intact     ${v.intact}\n`);
console.log('  聲明：本報告數值為執行期實測，sync_ratio 未達 1.0 即為事實，不作美化。');
