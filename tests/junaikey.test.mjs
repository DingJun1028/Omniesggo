// tests/junaikey.test.mjs
// ============================================================
// JunAikey 內建測試 (零外部依賴,使用 Node assert)
// 執行: node tests/junaikey.test.mjs
// ============================================================
import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { isoToMysql, toNCBPayload, parseJSONField, filterEntries, parseProgress } from '../vps/junaikey/util.mjs';
import { MANTRA, SKILL_TRAITS, NCB_TABLES } from '../vps/junaikey/schema.mjs';
import { createLocalBackend } from '../vps/junaikey/backends/local.mjs';
import { createNcbBackend } from '../vps/junaikey/backends/ncb.mjs';
import { createDispatcher } from '../vps/junaikey/dispatcher.mjs';
import { createOperations } from '../vps/junaikey/operations.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;

const test = (name, fn) => async () => {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
};

const group = (name, tests) => async () => {
  console.log(`\n── ${name} ──`);
  for (const t of tests) await t();
};

// ── util tests ──────────────────────────────────────────────
const testUtil = group('util.mjs', [
  test('isoToMysql: ISO 8601 → MySQL DATETIME', () => {
    assert.equal(isoToMysql('2026-10-08T10:03:59.439Z'), '2026-10-08 10:03:59');
    assert.equal(isoToMysql('2026-10-08T10:03:59Z'), '2026-10-08 10:03:59');
    assert.equal(isoToMysql('not-a-date'), 'not-a-date');
    assert.equal(isoToMysql(null), null);
  }),
  test('toNCBPayload: 遞迴轉換所有 ISO 字串', () => {
    const in_ = { ts: '2026-10-08T10:00:00Z', nested: { ts2: '2026-10-08T10:00:00Z', arr: ['2026-10-08T10:00:00Z'] }, plain: 'hi' };
    const out = toNCBPayload(in_);
    assert.equal(out.ts, '2026-10-08 10:00:00');
    assert.equal(out.nested.ts2, '2026-10-08 10:00:00');
    assert.equal(out.nested.arr[0], '2026-10-08 10:00:00');
    assert.equal(out.plain, 'hi');
  }),
  test('parseJSONField: NCB string 自動 parse', () => {
    assert.deepEqual(parseJSONField('["a","b"]'), ['a', 'b']);
    assert.deepEqual(parseJSONField('{"k":1}'), { k: 1 });
    assert.equal(parseJSONField('plain'), 'plain');
    assert.equal(parseJSONField(null), null);
    assert.deepEqual(parseJSONField(['a']), ['a']);  // 已為 array 保持
  }),
  test('filterEntries: 4 種 filter 都正確', () => {
    const data = [
      { ts: '2026-10-01', event: 'awaken', tags: ['audit'] },
      { ts: '2026-10-02', event: 'reflect', tags: ['grow'] },
      { ts: '2026-10-03', event: 'remember', tags: ['audit', 'grow'] },
    ];
    assert.equal(filterEntries(data, { event: 'awaken' }).length, 1);
    assert.equal(filterEntries(data, { tag: 'grow' }).length, 2);
    assert.equal(filterEntries(data, { since: '2026-10-02' }).length, 2);
    assert.equal(filterEntries(data, { limit: 2 }).length, 2);
  }),
  test('parseProgress: 解析 ## Active / ## Notes', () => {
    const md = `# Title\n\n## Active\n\nfoo\n\n## Notes\n\nbar\n`;
    const { active, notes } = parseProgress(md);
    assert.equal(active, 'foo');
    assert.equal(notes, 'bar');
  }),
]);

// ── local backend tests ─────────────────────────────────────
const testLocal = group('local backend', [
  test('readSkills/writeSkills 對稱', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-test-'));
    const PATHS = {
      home: tmp,
      skills: path.join(tmp, 'skills.md'),
      memory: path.join(tmp, 'memory.jsonl'),
      progress: path.join(tmp, 'progress.md'),
      journal: path.join(tmp, 'journal.jsonl'),
    };
    const be = createLocalBackend(tmp, PATHS);
    await be.writeSkills([
      { name: 'alpha', body: 'first', traits: ['永恆'] },
      { name: 'beta', body: 'second', traits: ['被動', '共享'] },
    ]);
    const skills = await be.readSkills();
    assert.equal(skills.length, 2);
    assert.equal(skills[0].name, 'alpha');
    assert.deepEqual(skills[0].traits, ['永恆']);
    assert.equal(skills[1].body, 'second');
    await fs.rm(tmp, { recursive: true });
  }),
  test('forgetSkill 刪除存在的', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-test-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm'), progress: path.join(tmp, 'p'), journal: path.join(tmp, 'j') };
    const be = createLocalBackend(tmp, PATHS);
    await be.writeSkills([{ name: 'x', body: '', traits: [] }, { name: 'y', body: '', traits: [] }]);
    assert.equal(await be.forgetSkill('x'), true);
    assert.equal((await be.readSkills()).length, 1);
    assert.equal(await be.forgetSkill('nonexistent'), false);
    await fs.rm(tmp, { recursive: true });
  }),
  test('pruneMemory 限制 maxRecords', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-test-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p'), journal: path.join(tmp, 'j') };
    const be = createLocalBackend(tmp, PATHS);
    for (let i = 0; i < 10; i++) {
      await be.appendMemory({ ts: `2026-10-${String(i+1).padStart(2,'0')} 00:00:00`, event: 'test', n: i });
    }
    const removed = await be.pruneMemory({ maxRecords: 5 });
    assert.equal(removed, 5);
    const remaining = await be.readMemory();
    assert.equal(remaining.length, 5);
    assert.equal(remaining[0].n, 5);  // 保留最後 5 個
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── integration: dispatcher + operations ────────────────────
const testOps = group('operations (local mode)', [
  test('awaken → grow → recall → reflect → prune', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-test-'));
    const JUNAKEY_HOME = tmp;
    const PATHS = { home: JUNAKEY_HOME, skills: path.join(JUNAKEY_HOME, 'skills.md'), memory: path.join(JUNAKEY_HOME, 'm.jsonl'), progress: path.join(JUNAKEY_HOME, 'p.md'), journal: path.join(JUNAKEY_HOME, 'j.jsonl') };
    // 用 fake env 強制 local
    const localBackend = createLocalBackend(JUNAKEY_HOME, PATHS);
    const ncbBackend = createNcbBackend({ base: '', token: '', project: '' });  // 無 token → 不會被選
    const dispatcher = createDispatcher({ localBackend, ncbBackend, NCB_TOKEN: '', NCB_PROJECT: '' });
    // 強制選 local
    dispatcher.select = async () => localBackend;
    const ops = createOperations({ dispatcher, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME });

    // awaken
    const a = await ops.awaken({ silent: true });
    assert.equal(a.backend, 'local');
    assert.equal(a.skillsCount, 0);
    // grow
    const rec = await ops.growSkill('test-skill', 'hello', ['永恆']);
    assert.equal(rec.name, 'test-skill');
    // recall
    const got = await ops.recallSkill('test-skill');
    assert.equal(got.body, 'hello');
    // reflect
    await ops.reflect('test summary', ['test-skill']);
    const mems = await ops.recall({ limit: 5 });
    assert.ok(mems.some(m => m.event === 'reflect'));
    // forget
    assert.equal(await ops.forgetSkill('test-skill'), true);
    assert.equal(await ops.recallSkill('test-skill'), null);
    // prune
    for (let i = 0; i < 5; i++) await ops.remember({ event: 'bulk', n: i });
    const removed = await ops.pruneMemory({ maxRecords: 3 });
    assert.ok(removed >= 2);
    await fs.rm(tmp, { recursive: true });
  }),
  test('setProgress → getProgress roundtrip', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-test-'));
    const localBackend = createLocalBackend(tmp, { home: tmp, skills: path.join(tmp, 's'), memory: path.join(tmp, 'm'), progress: path.join(tmp, 'p'), journal: path.join(tmp, 'j') });
    const ncbBackend = createNcbBackend({ base: '', token: '', project: '' });
    const dispatcher = createDispatcher({ localBackend, ncbBackend, NCB_TOKEN: '', NCB_PROJECT: '' });
    dispatcher.select = async () => localBackend;
    const ops = createOperations({ dispatcher, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });

    await ops.setProgress('doing X', 'with notes');
    const got = await ops.getProgress();
    assert.ok(got.includes('doing X'));
    assert.ok(got.includes('with notes'));
    await fs.rm(tmp, { recursive: true });
  }),
]);

// ── 執行 ──────────────────────────────────────────────────
console.log('JunAikey 內建測試 (零依賴)\n');
const all = [testUtil, testLocal, testOps];
for (const t of all) await t();

console.log(`\n${'='.repeat(50)}`);
console.log(`結果: ${pass} 通過 / ${fail} 失敗`);
console.log(`${'='.repeat(50)}`);
process.exit(fail === 0 ? 0 : 1);
