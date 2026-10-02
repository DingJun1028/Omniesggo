/**
 * omni-ui runtime 實測探針（獨立驗證，非 subagent 自述）
 * 目的：確認「補上 private readonly config 欄位宣告」不只是編譯過關，
 *       而是讓建構子傳入的設定值真的能讀回來。
 */
import { LiquidGlassRenderer, FloatingCore } from '../../packages/omni-ui/src/index.js';

const g = new LiquidGlassRenderer({ blur: 33, opacity: 0.7 });
const c = new FloatingCore({ size: 88 });

const gc = g.getConfig();
const cc = c.getConfig();

console.log('  LiquidGlass getConfig:', JSON.stringify(gc));
console.log('  FloatingCore getConfig:', JSON.stringify(cc));

const checks: Array<[string, boolean]> = [
  ['LiquidGlass blur=33', gc.blur === 33],
  ['LiquidGlass opacity=0.7', gc.opacity === 0.7],
  ['FloatingCore size=88', cc.size === 88],
];

for (const [label, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

// 預設值路徑：不傳設定時應拿到預設而非 undefined
const d = new LiquidGlassRenderer();
const dc = d.getConfig();
const defaultOk = dc !== undefined && Object.keys(dc).length > 0;
console.log(`  ${defaultOk ? '✅' : '❌'} 無參數建構有預設設定 (keys=${Object.keys(dc ?? {}).length})`);

const allOk = checks.every(([, ok]) => ok) && defaultOk;
console.log(allOk ? '  OMNI_UI_RUNTIME_OK' : '  OMNI_UI_RUNTIME_FAIL');
process.exit(allOk ? 0 : 1);
