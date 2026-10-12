// OmniLive 限流 / 併發閘測試 (node --test)
//
// 背景: 站台部署在公開網域 (omnilivetranslation.esggo.co) 且
// OMNILIVE_HOST_KEY 未設定 → POST /api/* 完全不驗證。其中
// /api/course 實測單次要跑數分鐘本地 LLM，/api/transcribe 雖有
// sttInflight 單飛守護，但那只擋併發、不擋速率 —— 攻擊者每 13 秒
// 送一個請求即可永久霸佔唯一的 STT worker。
//
// 5T: Trustworthy — 未授權流量不得無限消耗主機資源。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, clientIp } from '../lib/rate-limit.mjs';

test('速率閘: 視窗內超過上限即拒絕', () => {
  const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
  for (let i = 0; i < 3; i++) {
    assert.equal(rl.acquire('1.1.1.1').allowed, true, `第 ${i + 1} 次應放行`);
    rl.release('1.1.1.1');
  }
  const denied = rl.acquire('1.1.1.1');
  assert.equal(denied.allowed, false, '第 4 次應被拒');
  assert.equal(denied.reason, 'rate');
  assert.ok(denied.retryAfterMs > 0, '應告知重試等待時間');
});

test('速率閘: 不同來源彼此獨立', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 60_000 });
  for (let i = 0; i < 2; i++) { rl.acquire('a'); rl.release('a'); }
  assert.equal(rl.acquire('a').allowed, false, 'a 應已達上限');
  assert.equal(rl.acquire('b').allowed, true, 'b 不應受 a 影響');
});

test('滑動視窗: 過期後名額歸還', async () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 60 });
  assert.equal(rl.acquire('x').allowed, true);
  assert.equal(rl.acquire('x').allowed, false, '視窗內第二次應被拒');
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(rl.acquire('x').allowed, true, '視窗過後應恢復');
});

test('併發閘: 同一時間不得超過 maxConcurrent', () => {
  const rl = createRateLimiter({ limit: 100, windowMs: 60_000, maxConcurrent: 2 });
  assert.equal(rl.acquire('c').allowed, true);
  assert.equal(rl.acquire('c').allowed, true);
  const d = rl.acquire('c');
  assert.equal(d.allowed, false, '第 3 個同時請求應被拒');
  assert.equal(d.reason, 'concurrent');
  rl.release('c');
  assert.equal(rl.acquire('c').allowed, true, '釋放後應可再取得');
});

test('全域併發閘: 跨來源總量有上限', () => {
  const rl = createRateLimiter({ limit: 100, windowMs: 60_000, globalMax: 2 });
  assert.equal(rl.acquire('a').allowed, true);
  assert.equal(rl.acquire('b').allowed, true);
  const d = rl.acquire('c');
  assert.equal(d.allowed, false, '跨來源總量應有上限');
  assert.equal(d.reason, 'global');
});

test('記憶體: 閒置 key 會被回收 (防止 IP 型 Map 無上限增長)', async () => {
  const rl = createRateLimiter({ limit: 5, windowMs: 60_000, idleMs: 30 });
  for (let i = 0; i < 200; i++) rl.acquire(`10.0.0.${i}`);
  const grown = rl._stats().keys;
  await new Promise((r) => setTimeout(r, 80));
  // sweep 為延遲策略（只在 acquire 觸發），故此處顯式呼叫 ——
  // 這正是生產環境排程清理會走的路徑。
  rl.sweep();
  assert.ok(rl._stats().keys < grown, `閒置 key 應被回收 (${grown} -> ${rl._stats().keys})`);
});

test('記憶體: 併發名額洩漏也不會永久釘住 key', () => {
  // 刻意 acquire 卻不 release —— 模擬例外路徑忘記 finally。
  // 若 sweep 以 active===0 為前提，這些 key 會永遠留在 Map 裡，
  // 限流器自己就成了洩漏源。
  const rl = createRateLimiter({ limit: 5, windowMs: 60_000, idleMs: 20, globalMax: 100 });
  for (let i = 0; i < 50; i++) rl.acquire(`172.16.0.${i}`);
  assert.equal(rl._stats().keys, 50);
  const busy = Date.now() + 40;
  while (Date.now() < busy) { /* 等待超過 idleMs */ }
  rl.sweep();
  assert.equal(rl._stats().keys, 0, '遺棄的併發名額應一併沒收');
  assert.equal(rl._stats().globalActive, 0, '全域計數不可殘留洩漏');
});

test('clientIp: 預設信任 XFF 最左項', () => {
  const req = { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, socket: { remoteAddress: '9.9.9.9' } };
  assert.equal(clientIp(req, true), '1.2.3.4');
  assert.equal(clientIp(req, false), '9.9.9.9', '不信任代理時應用 socket 位址');
});

test('負向對照: 限流器必須「有能力變紅」', () => {
  // 若限流根本沒生效（例如 acquire 永遠回 allowed=true），
  // 上面所有案例都會失敗。這個案例反過來證明：把 limit 設成
  // 極大值時就應放行 —— 確認上限確實是決定拒絕與否的參數。
  const permissive = createRateLimiter({ limit: 1_000_000, windowMs: 60_000 });
  for (let i = 0; i < 500; i++) assert.equal(permissive.acquire('z').allowed, true);
});
