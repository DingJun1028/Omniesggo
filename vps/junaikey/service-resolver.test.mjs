// vps/junaikey/service-resolver.test.mjs
// Offline service resolver tests — all probes use deterministic fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServiceResolver } from './service-resolver.mjs';
const offlineOptions = {
  env: {},
  probePythonModuleFn: async (mod) => ({ version: `fixture-${mod}` }),
  probeLocalFsFn: async (dir) => ({ dir: dir || 'fixture-storage' }),
  modelResolverFactory: () => ({ resolve: async () => Object.freeze({ ok: true, selectedBackend: 'ollama', selectedModel: 'qwen2.5:3b-64k', probeChain: Object.freeze([]) }) }),
};

test('service-resolver: tts → edge-tts fixture (免費模組)', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('tts');
  assert.equal(r.ok, true); assert.equal(r.selectedProvider, 'edge-tts'); assert.equal(r.service, 'tts');
  assert.equal(r.probeChain.length, 1); assert.equal(r.probeChain[0].provider, 'edge-tts'); assert.equal(r.probeChain[0].ok, true);
  assert.ok(Object.isFrozen(r));
});
test('service-resolver: preferred ElevenLabs 無 key → 接續 edge-tts', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('tts', { preferred: 'elevenlabs' });
  assert.equal(r.probeChain[0].provider, 'elevenlabs'); assert.equal(r.probeChain[0].ok, false);
  assert.match(r.probeChain[0].error, /ELEVENLABS_API_KEY/); assert.equal(r.selectedProvider, 'edge-tts');
});
test('service-resolver: visual → Pillow fixture', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('visual');
  assert.equal(r.ok, true); assert.equal(r.selectedProvider, 'pillow'); assert.equal(r.probeChain.length, 1); assert.equal(r.probeChain[0].provider, 'pillow');
});
test('service-resolver: preferred Runway 無 key → 接續 Pillow', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('visual', { preferred: 'runway' });
  assert.equal(r.probeChain[0].provider, 'runway'); assert.equal(r.probeChain[0].ok, false);
  assert.match(r.probeChain[0].error, /RUNWAY_API_SECRET/); assert.equal(r.selectedProvider, 'pillow');
});
test('service-resolver: storage → local-fs fixture', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('storage');
  assert.equal(r.ok, true); assert.equal(r.selectedProvider, 'local-fs'); assert.equal(r.probeChain[0].provider, 'local-fs'); assert.equal(r.probeChain[0].ok, true);
});
test('service-resolver: llm delegates to model resolver factory', async () => {
  const r = await createServiceResolver(offlineOptions).resolve('llm');
  assert.equal(r.ok, true); assert.equal(r.service, 'llm'); assert.equal(r.selectedProvider, 'ollama'); assert.equal(r.selectedModel, 'qwen2.5:3b-64k'); assert.ok(Object.isFrozen(r));
});
test('service-resolver: 未知服務拋錯', async () => {
  await assert.rejects(() => createServiceResolver(offlineOptions).resolve('nope'), /未知 service/);
});
test('service-resolver: 真實 Ollama llm integration (opt-in)', { skip: process.env.JUNAKEY_LIVE_OLLAMA_TESTS !== '1' }, async () => {
  const r = await createServiceResolver().resolve('llm');
  assert.equal(r.ok, true); assert.equal(r.service, 'llm'); assert.equal(r.selectedProvider, 'ollama'); assert.equal(r.selectedModel, 'qwen2.5:3b-64k');
});
