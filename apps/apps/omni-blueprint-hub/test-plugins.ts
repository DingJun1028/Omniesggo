// Hub Plugin System — 回歸測試 (5T Gate + 生命週期 + 3 示範外掛)
// 運行: npx tsc --module nodenext --target es2022 --skipLibCheck --outDir .compiled hub-engine.ts plugin-registry.ts plugin-types.ts hub-demo.ts plugins/*.ts test-plugins.ts && node .compiled/test-plugins.js
import { OmniBlueprintHub } from './hub-engine.js';
import { EntropyReducerPlugin } from './plugins/entropy-reducer.js';
import { ConduitBridgePlugin } from './plugins/conduit-bridge.js';
import { SoulCanonVerifierPlugin } from './plugins/soul-canon-verifier.js';

let passed = 0, failed = 0;
function assert(cond: boolean, name: string): void {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.error('  ❌ ' + name); }
}

async function main(): Promise<void> {
  const hub = new OmniBlueprintHub();
  hub.bindPluginContext(
    () => {}, // broadcast stub
    () => {}  // log stub
  );

  console.log('[Plugin] 5T Gate 註冊');
  const r1 = hub.plugins.register(new EntropyReducerPlugin());
  const r2 = hub.plugins.register(new ConduitBridgePlugin());
  const r3 = hub.plugins.register(new SoulCanonVerifierPlugin());
  assert(r1 && r2 && r3, '三外掛全數通過 5T Gate 註冊');

  console.log('[Plugin] 啟用');
  const e1 = await hub.plugins.enable('entropy-reducer');
  const e2 = await hub.plugins.enable('conduit-bridge');
  const e3 = await hub.plugins.enable('soul-canon-verifier');
  assert(e1 && e2 && e3, '三外掛啟用成功');

  console.log('[Plugin] 生命週期 — 列出與健康');
  const list = hub.plugins.list();
  assert(list.length === 3 && list.every((x) => x.phase === 'enabled'), '註冊表 3 enabled');
  const h = hub.plugins.health();
  assert(h.total === 3 && h.enabled === 3 && h.errored === 0, '健康彙總正確');

  console.log('[Plugin] 鉤子反應 — 推播觸發熵減/跨蜂/聖典校驗');
  const bp = hub.createBlueprint('LIVE_BROADCAST', '外掛測試', 'test@esggo.app', 'https://x', ['en']);
  const prod = hub.manifestToProduct(bp); // 觸發 onProductManifested
  hub.pushBroadcastPayload(prod, '測試廣播', { en: 'test broadcast' }); // 觸發 onBroadcastPushed ×2

  console.log('[Plugin] 停用與卸載 (無作 graceful)');
  const d1 = await hub.plugins.disable('entropy-reducer');
  assert(d1, 'entropy-reducer 停用');
  const u1 = await hub.plugins.unload('conduit-bridge');
  assert(u1, 'conduit-bridge 卸載');
  assert(hub.plugins.list().length === 2, '卸載後剩 2');

  console.log(`\n=== Plugin 結果: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
  console.log('✅ Hub Plugin System 全測試通過 (5T 合規 + 生命週期)');
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
