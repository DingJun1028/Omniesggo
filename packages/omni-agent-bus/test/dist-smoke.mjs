/**
 * 產物匯入煙霧 (served-surface verification)
 * 載入實際 tsc 產物 dist/*.js, 驗證匯出符號與閘門行為。
 * 合規文本長度已預先驗證 > 200 (tangible 門檻), 避免第三次栽在長度門檻。
 */
import { createBus, bus5TGate, OmniAgentBus, deployGate, oaToBusPipeline } from '../dist/index.js';
import { loadOAFramework } from '../dist/oa-bridge.js';

const COMPLIANT = [
  '【來源】OA-Team 子框架 adk | 引用 GRI/ISO 對齊之來源, 保留 reference 清單',
  '【透明】整體比率 98%, 公開揭露所有失敗維度與改進計畫',
  '【量化】本次完成 12 項交付物, 建立可追溯元件, 導入 3 個子框架, 數量與金額均已覈算',
  '【信任】已建立 SHA256 hash 封印, 通過驗證與審計, audit trail 完整記錄',
  '【追蹤】期間為 2026 年度第 38 週, 自 2026-09-25 至 2026-09-28, 所有事件均已追蹤 monitor',
  '原始產出: omni-agent-bus 圓通扇出驗證完成。',
].join('\n');

const bus = createBus();
let got = 0;
bus.subscribe('oa.produce', () => { got++; });
await bus.publish('oa.produce', 'smoke', { n: 1 });

const gBad = bus5TGate({ subFrame: 'adk', output: '做完了。' });
const gGood = bus5TGate({ subFrame: 'adk', output: COMPLIANT });
const oa = await loadOAFramework();

const symbolsOk = [OmniAgentBus, createBus, bus5TGate, deployGate, oaToBusPipeline]
  .every((f) => typeof f === 'function');

console.log(`  COMPLIANT 長度: ${COMPLIANT.length} (tangible 門檻 200)`);
console.log('  匯出符號: ' + [OmniAgentBus, createBus, bus5TGate, deployGate, oaToBusPipeline].map((f) => typeof f).join('/'));
console.log(`  事件投遞: ${got} (預期 1)`);
console.log(`  5T 攔截件: pass=${gBad.pass} failed=[${gBad.failed.join(',')}]`);
console.log(`  5T 合規件: pass=${gGood.pass} failed=[${gGood.failed.join(',')}]`);
console.log(`  loadOAFramework(): ${oa ? 'AVAILABLE' : 'null (優雅降級)'}`);
console.log(`  health: ${JSON.stringify(bus.health())}`);

const ok = symbolsOk && got === 1 && !gBad.pass && gGood.pass && gBad.failed.length === 5;
console.log(ok ? '  DIST_IMPORT_SMOKE_OK' : '  DIST_IMPORT_SMOKE_FAIL');
process.exit(ok ? 0 : 1);
