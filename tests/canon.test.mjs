// tests/canon.test.mjs
// ============================================================
// Omniesggo 通典合規測試 (FR-03 / FR-05 / F-04)
// ============================================================
import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { createLocalBackend } from '../vps/junaikey/backends/local.mjs';
import { createNcbBackend } from '../vps/junaikey/backends/ncb.mjs';
import { createDispatcher } from '../vps/junaikey/dispatcher.mjs';
import { createOperations } from '../vps/junaikey/operations.mjs';
import { SEDIMENTATION_LEVELS, SEDIMENTATION_LABELS } from '../vps/junaikey/schema.mjs';

let pass = 0, fail = 0;
const test = (name, fn) => async () => {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}\n    ${e.message}`); }
};
const group = (name, tests) => async () => {
  console.log(`\n── ${name} ──`);
  for (const t of tests) await t();
};

const setupOps = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'canon-'));
  const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
  const lb = createLocalBackend(tmp, PATHS);
  const nb = createNcbBackend({ base: '', token: '', project: '' });
  const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
  d.select = async () => lb;
  const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
  return { tmp, ops, PATHS };
};

// ── FR-05 標籤血緣追蹤 ──
const g1 = group('FR-05 標籤血緣追蹤', [
  test('tagSkill 自動記錄血緣', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('s1', 'test', []);
    await ops.tagSkill('s1', ['agent:13', 'platform:vps']);
    const lin = await ops.getLineage({ target: 's1' });
    assert.equal(lin.length, 2);
    const ops2 = lin.map(l => l.op);
    assert.ok(ops2.every(o => o === 'tag-add'));
    const tags = lin.map(l => l.tag).sort();
    assert.deepEqual(tags, ['agent:13', 'platform:vps']);
    await fs.rm(tmp, { recursive: true });
  }),
  test('untagSkill 記錄 tag-remove', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('s1', 'test', []);
    await ops.tagSkill('s1', ['agent:13']);
    await ops.untagSkill('s1', 'agent:13');
    const lin = await ops.getLineage({ target: 's1' });
    const removes = lin.filter(l => l.op === 'tag-remove');
    assert.equal(removes.length, 1);
    assert.equal(removes[0].tag, 'agent:13');
    await fs.rm(tmp, { recursive: true });
  }),
  test('重複 tag 不重複記錄血緣 (只記錄實際新增的)', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('s1', 'x', []);
    await ops.tagSkill('s1', ['agent:13']);
    await ops.tagSkill('s1', ['agent:13', 'p1']);  // agent:13 重複,p1 新
    const lin = await ops.getLineage({ target: 's1' });
    assert.equal(lin.length, 2);  // 第一次: agent:13, 第二次: 只有 p1
    const tags = lin.map(l => l.tag).sort();
    assert.deepEqual(tags, ['agent:13', 'p1']);
    await fs.rm(tmp, { recursive: true });
  }),
  test('lineage 可依 tag 過濾', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('s1', 'x', []);
    await ops.growSkill('s2', 'y', []);
    await ops.tagSkill('s1', ['agent:13']);
    await ops.tagSkill('s2', ['agent:14']);
    const l1 = await ops.getLineage({ tag: 'agent:13' });
    assert.equal(l1.length, 1);
    assert.equal(l1[0].target, 's1');
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── F-04 知識沉澱 L1-L5 ──
const g2 = group('F-04 知識沉澱框架 L1-L5', [
  test('growSkill 預設 L1,可指定更高', async () => {
    const { tmp, ops } = await setupOps();
    const s1 = await ops.growSkill('s1', 'raw', []);
    assert.equal(s1.level, 'L1');
    const s3 = await ops.growSkill('s3', 'semantic', [], { level: 'L3' });
    assert.equal(s3.level, 'L3');
    await fs.rm(tmp, { recursive: true });
  }),
  test('promoteSkill 提升層級並記錄血緣', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('oracle-bv', 'Oracle boot volume', []);
    const r = await ops.promoteSkill('oracle-bv', 'L3', { reason: '已建立語意索引' });
    assert.equal(r.from, 'L1');
    assert.equal(r.to, 'L3');
    const lin = await ops.getLineage({ target: 'oracle-bv' });
    const promote = lin.find(l => l.op === 'level-promote');
    assert.ok(promote);
    assert.equal(promote.tag, 'L1→L3');
    await fs.rm(tmp, { recursive: true });
  }),
  test('getSedimentationStats 統計各層級', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('s1', 'x', [], { level: 'L1' });
    await ops.growSkill('s2', 'y', [], { level: 'L2' });
    await ops.growSkill('s3', 'z', [], { level: 'L2' });
    await ops.growSkill('s4', 'w', [], { level: 'L3' });
    await ops.growSkill('s5', 'v', []);  // 預設 L1
    await ops.remember({ event: 'test', x: 1 });
    const s = await ops.getSedimentationStats();
    assert.equal(s.skills.L1, 2);
    assert.equal(s.skills.L2, 2);
    assert.equal(s.skills.L3, 1);
    assert.equal(s.memory, 1);
    assert.equal(s.total, 6);
    await fs.rm(tmp, { recursive: true });
  }),
  test('SEDIMENTATION_LEVELS 5 個值', () => {
    assert.equal(SEDIMENTATION_LEVELS.length, 5);
    assert.deepEqual(SEDIMENTATION_LEVELS, ['L1', 'L2', 'L3', 'L4', 'L5']);
    assert.equal(Object.keys(SEDIMENTATION_LABELS).length, 5);
  }),
  test('readSkills 從 markdown 解析 (L1) 與 [traits]', async () => {
    const { tmp, ops, PATHS } = await setupOps();
    await ops.growSkill('oracle-bv', 'test', ['agent:13']);
    await ops.promoteSkill('oracle-bv', 'L2');
    const got = await ops.recallSkill('oracle-bv');
    assert.equal(got.level, 'L2');
    assert.ok(got.traits.includes('agent:13'));
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── FR-03 智慧標籤生成 (LLM) ──
const g3 = group('FR-03 LLM 自動標籤', [
  test('autoTagFromLLM 處理 text 短於閾值', async () => {
    const { tmp, ops } = await setupOps();
    const r = await ops.autoTagFromLLM('hi');
    assert.equal(r.tags.length, 0);
    assert.match(r.reason, /too short/);
    await fs.rm(tmp, { recursive: true });
  }),
  test('autoTagFromLLM 處理 ollama 不可用', async () => {
    const { tmp, ops } = await setupOps();
    const r = await ops.autoTagFromLLM('Oracle boot volume attach operation for OCI instance data migration.', { ollamaUrl: 'http://127.0.0.1:1' });
    assert.equal(r.tags.length, 0);
    assert.ok(r.reason);
    await fs.rm(tmp, { recursive: true });
  }),
  test('autoTagFromLLM 解析 mock LLM 回傳的 tags', async () => {
    const { tmp, ops } = await setupOps();
    const origFetch = global.fetch;
    let capturedPrompt = null;
    global.fetch = async (url, opts) => {
      const body = JSON.parse(opts.body);
      capturedPrompt = body.prompt;
      return { ok: true, json: async () => ({ response: 'agent:13\nlifecycle:active\nplatform:vps\n' }) };
    };
    const r = await ops.autoTagFromLLM('Oracle boot volume attach for OCI instance');
    global.fetch = origFetch;
    assert.ok(capturedPrompt.includes('OmniTag'));
    assert.ok(capturedPrompt.includes('agent:13') || capturedPrompt.includes('agent'));
    assert.ok(r.tags.includes('agent:13'));
    assert.ok(r.tags.includes('lifecycle:active'));
    assert.ok(r.tags.includes('platform:vps'));
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── NFR-01 ≤ 200ms 端到端延遲 ──
const g4 = group('NFR-01 端到端延遲 ≤ 200ms (通典門檻)', [
  test('readMemory 本地 500 筆 ≤ 200ms', async () => {
    const { tmp, ops, PATHS } = await setupOps();
    const lb = createLocalBackend(tmp, PATHS);
    for (let i = 0; i < 500; i++) {
      await lb.appendMemory({ ts: `2026-10-08 ${String(i%24).padStart(2,'0')}:00:00`, event: 'test', n: i });
    }
    const start = Date.now();
    await ops.recall();
    const ms = Date.now() - start;
    assert.ok(ms <= 200, `readMemory 500 筆耗時 ${ms}ms 超過 200ms 門檻`);
    await fs.rm(tmp, { recursive: true });
  }),
  test('tagSkill 本地 ≤ 200ms', async () => {
    const { tmp, ops } = await setupOps();
    await ops.growSkill('perf-test', 'x', []);
    const start = Date.now();
    await ops.tagSkill('perf-test', ['agent:13', 'lifecycle:active', 'platform:vps']);
    const ms = Date.now() - start;
    assert.ok(ms <= 200, `tagSkill 耗時 ${ms}ms 超過 200ms`);
    await fs.rm(tmp, { recursive: true });
  }),
  test('listTags 本地 ≤ 200ms', async () => {
    const { tmp, ops, PATHS } = await setupOps();
    const lb = createLocalBackend(tmp, PATHS);
    for (let i = 0; i < 50; i++) await lb.appendMemory({ ts: '2026-10-08 10:00:00', event: 'test', tags: [`agent:${String(i).padStart(2,'0')}`] });
    const start = Date.now();
    await ops.listTags();
    const ms = Date.now() - start;
    assert.ok(ms <= 200, `listTags 耗時 ${ms}ms 超過 200ms`);
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── 執行 ──
(async () => {
  console.log('Omniesggo 通典合規測試 (FR-03 / FR-05 / F-04 / NFR-01)\n');
  await g1();
  await g2();
  await g3();
  await g4();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`結果: ${pass} 通過 / ${fail} 失敗`);
  console.log(`${'='.repeat(50)}`);
  process.exit(fail === 0 ? 0 : 1);
})();
