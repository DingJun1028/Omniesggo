/**
 * 探針 2：驗證「部分設定」是否會產生 undefined 的渲染輸出
 *
 * 背景：LiquidGlassRenderer 建構子為
 *   this.config = config ? { ...config } : { ...DEFAULT_GLASS }
 * => 傳入部分設定時【不與預設值合併】，未提供的欄位會是 undefined。
 * 這是既存行為（本次修復只補欄位宣告，未改建構子），但屬潛在 runtime 缺陷。
 */
import { LiquidGlassRenderer, DEFAULT_GLASS, type LiquidGlassConfig } from '../../packages/omni-ui/src/index.js';

// 情境：只給部分設定（真實呼叫端很可能這樣用）
const partial = new LiquidGlassRenderer({ blur: 33 } as LiquidGlassConfig);
const style = partial.renderStyle();

console.log('  DEFAULT_GLASS 欄位:', Object.keys(DEFAULT_GLASS).join(', '));
console.log('  部分設定後欄位  :', Object.keys(partial.getConfig()).join(', ') || '(空)');
console.log('  renderStyle() 輸出:');
for (const [k, v] of Object.entries(style)) {
  const bad = v === 'undefined' || String(v).includes('undefined') || String(v).includes('NaN');
  console.log(`    ${bad ? '❌' : '✅'} ${k}: ${v}`);
}

const hasUndefined = Object.values(style).some(
  (v) => v === 'undefined' || String(v).includes('undefined') || String(v).includes('NaN'),
);
console.log(hasUndefined ? '  PARTIAL_CONFIG_BUG：部分設定產生 undefined 渲染值' : '  PARTIAL_CONFIG_OK');
process.exit(hasUndefined ? 1 : 0);
