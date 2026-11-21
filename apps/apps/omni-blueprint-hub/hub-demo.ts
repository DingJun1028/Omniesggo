// Omni-Blueprint Hub - Execution Demo (5T Verified)
import { OmniBlueprintHub } from './hub-engine.js';
import { UnifiedBlueprintEntity } from './core-types.js';

console.log('=== 啟動萬能藍圖中心 (Omni-Blueprint Hub) ===\n');
const hub = new OmniBlueprintHub();

// 任務一：即時轉播
console.log('--- [1/2] 萬能藍圖【即時轉播】 ---');
const liveBlueprint = hub.createBlueprint(
  'LIVE_BROADCAST', '即時串流轉播', 'master@esggo.app',
  'https://api.esggo.app/stream/xxx', ['en', 'ja', 'zh-TW']
);
console.log(' 藍圖鑄造:', liveBlueprint.uuid);
const liveProduct = hub.manifestToProduct(liveBlueprint);
console.log(' 產品實現:', liveProduct.productName);
hub.pushBroadcastPayload(liveProduct, '永續報告書數據 ISO-14064-1 驗算已通過。', {
  en: 'Sustainability report data verified under ISO-14064-1.',
  ja: '持続可能性レポートデータは ISO-14064-1 に基づいて検証されました。'
});
console.log(' 即時轉播數據已推播 (5T 可溯源)。\n');

// 任務二：指定轉播 (一台翻譯，全員共享)
console.log('--- [2/2] 萬能藍圖【指定轉播】 ---');
const designatedBlueprint = hub.createBlueprint(
  'DESIGNATED_URL_BROADCAST', '主帳號 Email 翻譯共享廣播',
  'chief-strategy-officer@esggo.app', 'mailto:chief-strategy-officer@esggo.app', ['en', 'ja']
);
const designatedProduct = hub.manifestToProduct(designatedBlueprint);
console.log(' 藍圖鑄造:', designatedBlueprint.uuid);
console.log(' 產品實現成功！');
console.log(' [一台翻譯 全員共享] 專屬轉播網址:', designatedProduct.broadcastUrl);
hub.pushBroadcastPayload(designatedProduct,
  '主帳號來信：請確認 5T 協議單一資料表之 Hash Lock 是否完全凍結。', {
    en: 'Host Email: Please confirm whether the Hash Lock of the 5T protocol single table is fully frozen.',
    ja: 'ホストメール：5Tプロトコル単一データテーブルのHash Lockが完全凍結されているか確認してください。'
  });
console.log(' 主帳號 Email 翻譯已完成，即時廣播給所有連結訂閱者！');

console.log('\n--- 單一資料表 (Unified Table) 狀態彙整 ---');
console.table(hub.getUnifiedTable().map((row: UnifiedBlueprintEntity) => ({
  ID: row.id,
  Type: row.entityType,
  BlueprintType: row.blueprintType,
  Host: row.hostEmail,
  HashLock: row.hashLock.substring(0, 16) + '...'
})));
console.log('\n=== 外掛系統演示 (Hub Plugin System v0.7) ===\n');

// 1. 綁定 PluginContext (broadcast/log 由本地 stub 模擬, 真實環境接 monitor-server)
hub.bindPluginContext(
  (src, event) => console.log('  [broadcast]', src, '→', (event as { type: string }).type),
  (level, msg) => console.log('  [log:' + level + ']', msg)
);

// 2. 註冊 3 個示範外掛 (皆過 5T Gate)
import { EntropyReducerPlugin } from './plugins/entropy-reducer.js';
import { ConduitBridgePlugin } from './plugins/conduit-bridge.js';
import { SoulCanonVerifierPlugin } from './plugins/soul-canon-verifier.js';

const ok1 = hub.plugins.register(new EntropyReducerPlugin());
const ok2 = hub.plugins.register(new ConduitBridgePlugin());
const ok3 = hub.plugins.register(new SoulCanonVerifierPlugin());
console.log(' 註冊結果:', ok1 && ok2 && ok3 ? '✅ 3 外掛全數通過 5T Gate' : '❌ 部分被拒');

// 3. 啟用全部
await hub.plugins.enable('entropy-reducer');
await hub.plugins.enable('conduit-bridge');
await hub.plugins.enable('soul-canon-verifier');

// 4. 觸發一筆廣播 → 外掛自動反應 (熵減 / 跨蜂 / 聖典校驗)
hub.pushBroadcastPayload(liveProduct, '外掛演示：永續數據已通過 ISO-14064-1 驗算。', {
  en: 'Plugin demo: sustainability data verified.',
  ja: 'プラグインデモ：データ検証済み。'
});

// 5. 列出註冊表 (Transparent)
console.table(hub.plugins.list());
console.log(' 註冊表健康:', JSON.stringify(hub.plugins.health()));

console.log('\n 萬能藍圖產品運作完畢，完全符合 5T 誠信協定與萬能元件心核規範。');
