// vps/junaikey/model-resolver.test.mjs
// Offline model resolver unit tests (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModelResolver } from './model-resolver.mjs';
const rejectNetwork = async () => { throw new Error('network disabled in offline test'); };

test('全鏈不可用 → ok:false, probeChain 全記', async () => {
  const r = createModelResolver({ chain: [
    { backend: 'ollama', model: 'x', kind: 'local', url: 'http://offline.invalid' },
    { backend: 'nous', model: 'upstage/solar-mini4:free', kind: 'cloud-free' },
  ], fetchImpl: rejectNetwork, env: {} });
  const res = await r.resolve();
  assert.equal(res.ok, false);
  assert.equal(res.selectedBackend, null);
  assert.equal(res.probeChain.length, 2);
  assert.ok(res.probeChain.every((p) => p.ok === false));
  assert.ok(Object.isFrozen(res));
});

test('preferred 排在最前且無 key 時繼續備援鏈', async () => {
  const r = createModelResolver({ chain: [{ backend: 'ollama', model: 'x', kind: 'local', url: 'http://offline.invalid' }], fetchImpl: rejectNetwork, env: {} });
  const res = await r.resolve('nous');
  assert.equal(res.ok, false);
  assert.equal(res.probeChain[0].backend, 'nous');
  assert.equal(res.probeChain[0].ok, false);
});

test('Ollama tags 與 generate 流程可用離線 fixture 驗證', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.endsWith('/api/tags')) return { ok: true, json: async () => ({ models: [{ name: 'qwen2.5:3b-64k' }] }) };
    if (url.endsWith('/api/generate')) {
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'qwen2.5:3b-64k');
      assert.equal(body.prompt, 'OK');
      return { ok: true, json: async () => ({ response: 'OK' }) };
    }
    throw new Error(`unexpected request: ${url}`);
  };
  const r = createModelResolver({ chain: [{ backend: 'ollama', model: 'qwen2.5:3b-64k', kind: 'local', url: 'http://fixture' }], fetchImpl, env: {} });
  const res = await r.resolve();
  assert.equal(res.ok, true);
  assert.equal(res.selectedBackend, 'ollama');
  assert.equal(res.selectedModel, 'qwen2.5:3b-64k');
  assert.deepEqual(requests.map((request) => new URL(request.url).pathname), ['/api/tags', '/api/generate']);
  assert.ok(Object.isFrozen(res));
});

test('真實 Ollama 可用 → 選定 Ollama (opt-in integration test)', { skip: process.env.JUNAKEY_LIVE_OLLAMA_TESTS !== '1' }, async () => {
  const r = createModelResolver({ chain: [{ backend: 'ollama', model: 'qwen2.5:3b-64k', kind: 'local', url: 'http://localhost:11434' }], timeoutMs: 30000 });
  const res = await r.resolve();
  assert.equal(res.ok, true, `probeChain=${JSON.stringify(res.probeChain)}`);
  assert.equal(res.selectedBackend, 'ollama');
  assert.ok(res.selectedModel.startsWith('qwen2.5'));
  assert.ok(Object.isFrozen(res));
});
