// vps/junaikey/service-resolver.test.mjs
// 眾鑰之首 service resolver 單測 — 無金鑰環境下驗證免費模組自動接續
// 跑法: node --test service-resolver.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServiceResolver } from './service-resolver.mjs';

test('service-resolver: tts 無金鑰 → 自動接續 edge-tts (免費模組)', async () => {
  const r = await createServiceResolver({}).resolve('tts');
  assert.equal(r.ok, true, '全鏈應有可用模組');
  assert.equal(r.selectedProvider, 'edge-tts');
  assert.equal(r.service, 'tts');
  // probeChain 軌跡: 鏈首成功即停 (edge-tts 可用 → 不探 elevenlabs)
  assert.equal(r.probeChain.length, 1);
  assert.equal(r.probeChain[0].provider, 'edge-tts');
  assert.equal(r.probeChain[0].ok, true);
  assert.ok(Object.isFrozen(r), '結果必須 Object.freeze (Trustworthy)');
});

test('service-resolver: preferred=elevenlabs (無 key) → 接續 edge-tts', async () => {
  const r = await createServiceResolver({}).resolve('tts', { preferred: 'elevenlabs' });
  assert.equal(r.probeChain[0].provider, 'elevenlabs');
  assert.equal(r.probeChain[0].ok, false);
  assert.match(r.probeChain[0].error, /ELEVENLABS_API_KEY/, '必須是「無 key」錯誤, 非「未知 provider」');
  assert.equal(r.selectedProvider, 'edge-tts', '偏好不可用時自動接續免費模組');
});

test('service-resolver: visual → pillow (免費, 鏈首成功即停)', async () => {
  const r = await createServiceResolver({}).resolve('visual');
  assert.equal(r.ok, true);
  assert.equal(r.selectedProvider, 'pillow');
  assert.equal(r.probeChain.length, 1);
  assert.equal(r.probeChain[0].provider, 'pillow');
  assert.equal(r.probeChain[0].ok, true);
});

test('service-resolver: preferred=runway (無 key) → 接續 pillow', async () => {
  const r = await createServiceResolver({}).resolve('visual', { preferred: 'runway' });
  assert.equal(r.probeChain[0].provider, 'runway');
  assert.equal(r.probeChain[0].ok, false);
  assert.match(r.probeChain[0].error, /RUNWAY_API_SECRET/);
  assert.equal(r.selectedProvider, 'pillow', '偏好不可用時自動接續免費模組');
});

test('service-resolver: storage → local-fs 可寫 (真實探測)', async () => {
  const r = await createServiceResolver({}).resolve('storage');
  assert.equal(r.ok, true);
  assert.equal(r.selectedProvider, 'local-fs');
  assert.equal(r.probeChain[0].provider, 'local-fs');
  assert.equal(r.probeChain[0].ok, true);
});

test('service-resolver: llm 委派 model-resolver → 真實 ollama 端到端', async () => {
  const r = await createServiceResolver({}).resolve('llm');
  assert.equal(r.ok, true);
  assert.equal(r.service, 'llm');
  assert.equal(r.selectedProvider, 'ollama', 'llm 服務經眾鑰之首 L3 選定本地模型');
  assert.equal(r.selectedModel, 'qwen2.5:3b-64k');
});

test('service-resolver: 未知服務拋錯', async () => {
  await assert.rejects(
    () => createServiceResolver({}).resolve('nope'),
    /未知 service/,
  );
});
