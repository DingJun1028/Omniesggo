/**
 * §12 進階整合模式 — 實戰冒煙測試 (增量輸出優化版)
 *
 * 對齊 soul.md §12 + best-practice-items.md 三條硬規則:
 *   預設即合規 (啟動即過 5T) · 不帶病上線 · 醒著就頂標
 *
 * 運行: tsx test/patterns.smoke.ts
 */
import { createHash } from 'node:crypto';
import {
  EventBus,
  ServiceOrchestrator,
  ETLPipeline,
  APIGateway,
  CacheManager,
  ErrorHandler,
  StreamBuffer,
  WorkerPool,
  DeltaTracker,
  CompressionEngine,
  LRUCache,
  RateLimiter,
  PriorityQueue,
  verify5T,
  hashLock,
  Conduit,
  createConduit,
} from '../src/patterns/index.js';

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string): void {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.error(`  ❌ ${name}`);
  }
}

async function main(): Promise<void> {
  console.log('=== §12 進階整合模式冒煙測試 ===');

  // --- 基礎設施 ---
  console.log('[infra] 增量輸出基礎設施');
  const sb = new StreamBuffer<number>(4);
  sb.append(1); sb.append(2); sb.append(3); sb.append(4); sb.append(5); // 超容, 丟最舊
  assert(sb.size() === 4, 'StreamBuffer 環形容量上限');

  const wp = new WorkerPool(2);
  const r = await wp.processDelta([1, 2, 3, 4], async (x) => x * 2);
  assert(JSON.stringify(r) === JSON.stringify([2, 4, 6, 8]), 'WorkerPool 並行處理');

  const dt = new DeltaTracker<{ value: number }>();
  dt.set('a', { value: 1 }); dt.set('b', { value: 2 });
  dt.batchUpdateDelta([{ key: 'a', delta: { value: 5 } }]);
  assert((dt.get('a') as { value: number }).value === 5, 'DeltaTracker 批量合併');

  const comp = new CompressionEngine();
  const buf = comp.compress({ x: 1, y: 2, z: 'hello world hello world' });
  const back = comp.decompress(buf) as any;
  assert(back?.x === 1 && back?.z?.includes('hello'), 'CompressionEngine gzip 往返');

  const lru = new LRUCache<string, number>(2);
  lru.set('a', 1); lru.set('b', 2); lru.set('c', 3); // 逐出 a
  assert(lru.get('a') === null && lru.get('c') === 3, 'LRUCache 逐出最舊');

  const rl = new RateLimiter(2, 1000);
  assert(rl.tryAcquire() && rl.tryAcquire() && !rl.tryAcquire(), 'RateLimiter 滑動窗口');

  const pq = new PriorityQueue<{ p: number }>((t) => t.p);
  pq.enqueue({ p: 3 }); pq.enqueue({ p: 1 }); pq.enqueue({ p: 2 });
  assert(pq.dequeue()!.p === 1 && pq.dequeue()!.p === 2, 'PriorityQueue 最小優先');

  // 5T 工具 — 合規文本須同時滿足長度閘 + 關鍵字模式 (對齊 bus.ts)
  const ok5t = verify5T(
    '本專案依據 GRI 305 與 ISO 14064 標準進行溫室氣體盤查，並參考 TCFD 框架與 SDG 13 目標。' +
      '2026 年度揭露範疇一與範疇二排放比率達 85%，較上年度提升 12 個百分點，比例改善顯見且公開於官網揭露專區。' +
      '我們已實現減碳目標完成 60%，達成階段性里程碑，推動 3 項再生能源導入專案，建立內部碳定價機制並導入綠電採購數量紀錄。' +
      '所有數據經 ZKP 零知識證明與 SHA256 hash 封印處理，並由第三方審計機構完成 audit 驗證，確保不可篡改之 Trustworthy 特性。' +
      '追蹤機制採 monitor 持續監控，期間涵蓋 2026 年度至 2027 年度，日期與追蹤頻率皆可追溯，滿足 Trackable 要求。'
  );
  assert(ok5t.pass, 'verify5T 合規文本通過');
  const bad5t = verify5T('short text');
  assert(!bad5t.pass, 'verify5T 短文本被拒 (5T 閘門生效)');
  assert(hashLock('test').length >= 16, 'hashLock 產生 SHA256');

  // --- Pattern 7: LifecycleTracker (§24 P2: entropy + cross_unit_pairing) ---
  console.log('[P7] LifecycleTracker');
  const { createLifecycleTracker } = await import('../src/patterns/lifecycle.js');
  const lt = createLifecycleTracker();
  // 跨組任務: 3 筆, 2 筆雙簽 (pairing 66.7%) + 每筆熵減 -0.03
  lt.record({ taskId: 't1', crossUnit: true, dualSigned: true, entropyDelta: -0.03, source: 'esggo:src/omni-orchestrator' });
  lt.record({ taskId: 't2', crossUnit: true, dualSigned: true, entropyDelta: -0.03, source: 'esggo:src/app/api/delegation' });
  lt.record({ taskId: 't3', crossUnit: true, dualSigned: false, entropyDelta: -0.03, source: 'esggo:src/core/services' });
  const snap = lt.snapshot();
  assert(snap.crossUnitEvents === 3, 'LifecycleTracker 記錄跨組事件');
  assert(snap.dualSigned === 2, 'LifecycleTracker 雙簽計數');
  assert(Math.abs(snap.pairingRate - 66.7) < 0.1, 'LifecycleTracker 配對率 66.7%');
  assert(snap.entropy < 1.0, 'LifecycleTracker 熵收斂 (<1.0)');
  // 未過 5T 閘的 source 靜默略過
  const ignored = lt.record({ taskId: 'bad', crossUnit: false, dualSigned: false, entropyDelta: 0.5, source: 'x' });
  assert(ignored === false, 'LifecycleTracker 拒絕不可溯源事件');
  const gaps = lt.gaps();
  assert(gaps.length > 0 && gaps.some((g) => g.includes('pairingRate')), 'LifecycleTracker 診斷缺口 (pairing<100%)');

  // --- Pattern 1: EventBus ---
  console.log('[P1] EventBus');
  const bus = new EventBus();
  let received = 0;
  bus.on('user.created', () => { received++; });
  const rec = await bus.publish({ source: 'oa-team', type: 'user.created', payload: { id: 1 } });
  assert(rec.id.startsWith('evt_'), 'EventBus 產生 Traceable id');
  assert(received === 1, 'EventBus 廣播至訂閱者');
  assert(bus.getEvents(0).length === 1, 'EventBus 增量讀取 (since=0)');

  // --- Pattern 2: ServiceOrchestrator ---
  console.log('[P2] ServiceOrchestrator');
  const orch = new ServiceOrchestrator();
  const wf = {
    id: 'wf-1',
    services: ['svc-a'],
    steps: [
      { name: 'step1', run: async () => 'r1' },
      { name: 'step2', run: async () => 'r2' },
    ],
  };
  const pres = await orch.executeWorkflow(wf);
  assert(pres.items.length === 2 && pres.total === 2, 'ServiceOrchestrator 執行 + 分頁');
  const p2 = await orch.getPage('wf-1', 1);
  assert(p2.items.length === 2, 'ServiceOrchestrator 快取分頁');

  // --- Pattern 3: ETLPipeline ---
  console.log('[P3] ETLPipeline');
  const etl = new ETLPipeline();
  const src = {
    id: 'db-1',
    extractDelta: async (since: number) => {
      void since;
      return [
        { key: 'row1', value: { v: 1 } },
        { key: 'row2', value: { v: 2 } },
      ];
    },
  };
  const pres2 = await etl.process(src);
  assert(pres2.rows === 2 && pres2.frozen, 'ETLPipeline 提取 + 鎖定');
  const cbuf = await etl.getCompressedData(0);
  assert(cbuf.length > 0, 'ETLPipeline 壓縮增量輸出');

  // --- Pattern 4: APIGateway ---
  console.log('[P4] APIGateway');
  const secret = 's3cr3t';
  const gw = new APIGateway(secret);
  const body = 'payload';
  const sig = createHash('sha256').update(body).update(secret).digest('hex');
  const ok = await gw.handleRequest({
    clientId: 'c1',
    path: '/v1/run',
    body,
    headers: { 'x-signature': sig },
    handler: async () => ['a', 'b', 'c'],
  });
  assert(ok.status === 200 && (ok.body as any).items.length === 3, 'APIGateway HMAC 認證 + 分頁');
  let rejected = false;
  try {
    await gw.handleRequest({ clientId: 'c2', path: '/x', body: 'z', headers: { 'x-signature': 'bad' } });
  } catch {
    rejected = true;
  }
  assert(rejected, 'APIGateway 拒絕錯誤 HMAC');

  // --- Pattern 5: CacheManager ---
  console.log('[P5] CacheManager');
  const cm = new CacheManager<{ name: string }>();
  cm.set('k1', { name: 'v1' });
  const got = await cm.get('k1');
  assert(got?.name === 'v1', 'CacheManager 命中');
  await cm.batchUpdateDelta([{ key: 'k1', delta: { name: 'v2' } }]);
  const got2 = await cm.get('k1');
  assert((got2 as any)?.name === 'v2', 'CacheManager 批量 delta 更新');

  // --- Pattern 6: ErrorHandler ---
  console.log('[P6] ErrorHandler');
  const eh = new ErrorHandler();
  const r1 = await eh.handle(new Error('boom'), { retryCount: 0 });
  assert(r1.queued && r1.errId.startsWith('err_'), 'ErrorHandler 鎖定 + 入重試隊列');
  const logs = await eh.getErrorLogs(0);
  assert(logs.items.length === 1, 'ErrorHandler 增量錯誤日誌分頁');

  // --- Pattern 7: Conduit (第七種 5T 合規模式) ---
  console.log('[P7] Conduit');
  const cdt = createConduit({ strict: true });
  const cdtId = await cdt.send('02', ['12'], 'gap_02_12', {
    text: '品牌戰略草案',
    meta: '【來源/source_origin】OA-Team 子框架 reference 引用 soul.md 5T 協議，建立可追溯元件。【透明/揭露】合規率 100% 說明數據流向。【達成/完成】建立跨組元件，產出可部署成果。【封印/hash】SHA-256 hash lock 凍結 audit trail。【追蹤/年度】2026 年度 monitor 啟用追蹤指標。',
  });
  assert(cdtId.startsWith('cdt_'), 'Conduit 產生 Traceable id');
  const cdtMsgs = cdt.read('12', 0);
  assert(cdtMsgs.length === 1 && cdtMsgs[0].verified?.pass === true, 'Conduit 點對組投遞 + 收件方反驗 seal pass');
  let cdtBlocked = false;
  try {
    await cdt.send('05', '15', 'gap_05_15', 'x'); // 無 5T 標記 → strict 阻斷
  } catch {
    cdtBlocked = true;
  }
  assert(cdtBlocked, 'Conduit strict 拒絕未過 5T 的訊息');

  // --- 總結 ---
  console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.error(`❌ ${failed} 項失敗`);
    process.exit(1);
  }
  console.log('✅ 全部通過 — §12 六模式 + 增量基礎設施合規');
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
