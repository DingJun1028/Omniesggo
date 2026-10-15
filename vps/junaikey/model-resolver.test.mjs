// vps/junaikey/model-resolver.test.mjs
// 眾鑰之首 model resolver 單測 (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModelResolver } from './model-resolver.mjs';

// 假 ollama: 用 fake url 讓 /api/tags fetch 失敗 → 全鏈不可用
test('全鏈不可用 → ok:false, probeChain 全記', async () => {
  const r = createModelResolver({
    chain: [
      { backend: 'ollama', model: 'x', kind: 'local', url: 'http://127.0.0.1:9/none' }, // port 9 discard → 連不上
      { backend: 'nous', model: 'upstage/solar-mini4:free', kind: 'cloud-free' }, // 無 key
    ],
    timeoutMs: 1500,
  });
  const res = await r.resolve();
  assert.equal(res.ok, false);
  assert.equal(res.selectedBackend, null);
  assert.equal(res.probeChain.length, 2);
  assert.ok(res.probeChain.every(p => p.ok === false));
  // Trustworthy: 結果凍結
  assert.ok(Object.isFrozen(res));
});

test('preferred 排在最前 (眾鑰之首優先序)', async () => {
  const r = createModelResolver({
    chain: [{ backend: 'ollama', model: 'x', kind: 'local', url: 'http://127.0.0.1:9/none' }],
    timeoutMs: 1000,
  });
  const res = await r.resolve('nous'); // preferred, 但無 key → 仍失敗, 但應排第一被試
  assert.equal(res.ok, false);
  assert.equal(res.probeChain[0].backend, 'nous'); // preferred 先試
});

test('真實 ollama 可用 → 選定 ollama (端到端)', async () => {
  // timeoutMs 30000: 冷載入需 ≥30s (modelkey-coldload-timeout 教訓 — 8s 會撞逾時+retry 雙倍耗時)
  const r = createModelResolver({ chain: [{ backend: 'ollama', model: 'qwen2.5:3b-64k', kind: 'local', url: 'http://localhost:11434' }], timeoutMs: 30000 });
  const res = await r.resolve();
  // 本機 ollama 在跑且裝了 qwen2.5:3b-64k (前置已驗證) → 應選定
  assert.equal(res.ok, true, `probeChain=${JSON.stringify(res.probeChain)}`);
  assert.equal(res.selectedBackend, 'ollama');
  assert.ok(res.selectedModel.startsWith('qwen2.5'));
  assert.ok(Object.isFrozen(res));
});
