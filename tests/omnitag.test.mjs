// tests/omnitag.test.mjs
// ============================================================
// OmniTag 整合測試
// ============================================================
import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { parseTag, validateOmniTag, detectConflicts, normalizeTag, getValuesByKey, matchPrefix, filterTags, aggregateTags, OMNITAG_DIMENSIONS } from '../vps/junaikey/tags.mjs';
import { createLocalBackend } from '../vps/junaikey/backends/local.mjs';
import { createNcbBackend } from '../vps/junaikey/backends/ncb.mjs';
import { createDispatcher } from '../vps/junaikey/dispatcher.mjs';
import { createOperations } from '../vps/junaikey/operations.mjs';

let pass = 0, fail = 0;
const test = (name, fn) => async () => {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}\n    ${e.message}`); }
};
const group = (name, tests) => async () => {
  console.log(`\n── ${name} ──`);
  for (const t of tests) await t();
};

const g1 = group('tags.mjs 基礎', [
  test('parseTag: 標準 OmniTag', () => {
    const p = parseTag('security:public');
    assert.equal(p.key, 'security');
    assert.equal(p.value, 'public');
    assert.equal(p.isOmni, true);
  }),
  test('parseTag: free-form (無 :)', () => {
    const p = parseTag('my-custom-tag');
    assert.equal(p.key, null);
    assert.equal(p.value, 'my-custom-tag');
    assert.equal(p.isOmni, false);
  }),
  test('validateOmniTag: 合法值', () => {
    const r = validateOmniTag('agent:13');
    assert.equal(r.valid, true);
    assert.equal(r.parsed.key, 'agent');
  }),
  test('validateOmniTag: 非法值', () => {
    const r = validateOmniTag('security:topsecret');
    assert.equal(r.valid, false);
    assert.match(r.reason, /not in security/);
  }),
  test('validateOmniTag: 自由標籤 (非 Omni)', () => {
    const r = validateOmniTag('project-x');
    assert.equal(r.valid, true);
    assert.match(r.note, /custom/);
  }),
  test('detectConflicts: 公開 + 限制', () => {
    const c = detectConflicts(['security:public', 'security:restricted']);
    assert.equal(c.length, 1);
    assert.deepEqual(c[0].tags.sort(), ['security:public', 'security:restricted']);
    assert.ok(c[0].reason);  // 任何 reason 都行
  }),
  test('detectConflicts: p0 + p3', () => {
    const c = detectConflicts(['p0', 'p3']);
    assert.equal(c.length, 1);
    assert.deepEqual(c[0].tags.sort(), ['p0', 'p3']);
    assert.ok(c[0].reason);
  }),
  test('detectConflicts: 覺醒 + 草稿', () => {
    const c = detectConflicts(['best-practice:awakened', 'lifecycle:draft']);
    assert.equal(c.length, 1);
    assert.match(c[0].reason, /覺醒不可為草稿/);
  }),
  test('normalizeTag: 標準化空白', () => {
    assert.equal(normalizeTag('  security : public '), 'security:public');
    assert.equal(normalizeTag('agent:13'), 'agent:13');
  }),
  test('getValuesByKey: 提取多個值', () => {
    const v = getValuesByKey(['agent:13', 'squad:智庫聖所', 'agent:14', 'p0'], 'agent');
    assert.deepEqual(v, ['13', '14']);
  }),
  test('matchPrefix: wildcard', () => {
    assert.equal(matchPrefix('agent:13', 'agent:1*'), true);
    assert.equal(matchPrefix('agent:25', 'agent:1*'), false);
    assert.equal(matchPrefix('agent:13', 'agent:13'), true);
    assert.equal(matchPrefix('p0', 'agent:1*'), false);
  }),
  test('filterTags: 支援 wildcard + 字串前綴', () => {
    const tags = ['agent:13', 'agent:14', 'squad:智庫聖所', 'p0', 'p1'];
    assert.deepEqual(filterTags(tags, 'agent:1*').sort(), ['agent:13', 'agent:14']);
    assert.deepEqual(filterTags(tags, 'p').sort(), ['p0', 'p1']);
  }),
  test('aggregateTags: 計數排序 (alphabetical tiebreaker)', () => {
    const r = aggregateTags([
      { tags: ['p0', 'agent:13'] },
      { tags: ['p0', 'agent:13'] },
      { tags: ['p1', 'agent:14'] },
    ]);
    // count=2 的有 p0, agent:13 → 按字母排序 agent:13 排第一
    assert.equal(r[0].tag, 'agent:13');
    assert.equal(r[0].count, 2);
    assert.equal(r.find(x => x.tag === 'p0').count, 2);
  }),
  test('OMNITAG_DIMENSIONS: 6 大維度齊全', () => {
    assert.equal(Object.keys(OMNITAG_DIMENSIONS).length >= 6, true);
    assert.ok(OMNITAG_DIMENSIONS.security.includes('public'));
    assert.ok(OMNITAG_DIMENSIONS.lifecycle.includes('active'));
    assert.ok(OMNITAG_DIMENSIONS['best-practice'].includes('awakened'));
  }),
]);

const g2 = group('operations + OmniTag (local)', [
  test('tagSkill 新增/合併 tags', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'omnitag-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
    const lb = createLocalBackend(tmp, PATHS);
    const nb = createNcbBackend({ base: '', token: '', project: '' });
    const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
    d.select = async () => lb;
    const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
    await ops.growSkill('oracle-bv', 'Oracle boot volume as data volume', ['永恆']);
    // 第一次 tag
    let r = await ops.tagSkill('oracle-bv', ['agent:13', 'security:internal', 'platform:vps']);
    assert.deepEqual(r.traits.sort(), ['agent:13', 'platform:vps', 'security:internal', '永恆'].sort());
    // 第二次合併
    r = await ops.tagSkill('oracle-bv', ['lifecycle:active', 'p1']);
    assert.ok(r.traits.includes('lifecycle:active'));
    assert.ok(r.traits.includes('p1'));
    // 第三次重複 tag (不應重複)
    r = await ops.tagSkill('oracle-bv', ['agent:13', 'p2']);
    assert.equal(r.traits.filter(t => t === 'agent:13').length, 1);
    assert.ok(r.traits.includes('p2'));
    await fs.rm(tmp, { recursive: true });
  }),
  test('untagSkill 移除', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'omnitag-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
    const lb = createLocalBackend(tmp, PATHS);
    const nb = createNcbBackend({ base: '', token: '', project: '' });
    const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
    d.select = async () => lb;
    const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
    await ops.growSkill('s1', 'test', []);
    await ops.tagSkill('s1', ['agent:13', 'p0', 'security:internal']);
    const ok = await ops.untagSkill('s1', 'p0');
    assert.equal(ok, true);
    const got = await ops.recallSkill('s1');
    assert.ok(!got.traits.includes('p0'));
    assert.ok(got.traits.includes('agent:13'));
    await fs.rm(tmp, { recursive: true });
  }),
  test('findByTag 跨 skills + memory', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'omnitag-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
    const lb = createLocalBackend(tmp, PATHS);
    const nb = createNcbBackend({ base: '', token: '', project: '' });
    const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
    d.select = async () => lb;
    const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
    await ops.growSkill('oracle-bv', 'Oracle boot volume', ['永恆']);
    await ops.tagSkill('oracle-bv', ['agent:13', 'platform:vps']);
    await ops.remember({ event: 'oci-action', tags: ['agent:13', 'p0'] });
    await ops.remember({ event: 'ssh-fix', tags: ['agent:14'] });
    const r = await ops.findByTag('agent:13');
    assert.equal(r.skills.length, 1);
    assert.equal(r.skills[0].name, 'oracle-bv');
    assert.equal(r.memory.length, 1);
    assert.equal(r.memory[0].event, 'oci-action');
    // wildcard
    const r2 = await ops.findByTag('agent:1*');
    assert.equal(r2.skills.length, 1);
    assert.equal(r2.memory.length, 2);
    await fs.rm(tmp, { recursive: true });
  }),
  test('listTags 計數排序', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'omnitag-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
    const lb = createLocalBackend(tmp, PATHS);
    const nb = createNcbBackend({ base: '', token: '', project: '' });
    const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
    d.select = async () => lb;
    const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
    await ops.growSkill('a', 'x', []); await ops.tagSkill('a', ['p0', 'agent:13']);
    await ops.growSkill('b', 'y', []); await ops.tagSkill('b', ['p0', 'agent:14']);
    await ops.growSkill('c', 'z', []); await ops.tagSkill('c', ['p1', 'agent:13']);
    const list = await ops.listTags();
    // p0 出現 2 次最高,agent:13 出現 2 次次高
    const top2 = list.slice(0, 2).map(x => x.tag).sort();
    assert.deepEqual(top2, ['agent:13', 'p0']);
    assert.equal(list.find(x => x.tag === 'p0').count, 2);
    await fs.rm(tmp, { recursive: true });
  }),
  test('checkTagConflicts + validateTag', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'omnitag-'));
    const PATHS = { home: tmp, skills: path.join(tmp, 's.md'), memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'), journal: path.join(tmp, 'j.jsonl') };
    const lb = createLocalBackend(tmp, PATHS);
    const nb = createNcbBackend({ base: '', token: '', project: '' });
    const d = createDispatcher({ localBackend: lb, ncbBackend: nb, NCB_TOKEN: '', NCB_PROJECT: '', JUNAKEY_BACKEND: 'local' });
    d.select = async () => lb;
    const ops = createOperations({ dispatcher: d, NCB_BASE: '', NCB_PROJECT: '', JUNAKEY_HOME: tmp });
    assert.equal(ops.validateTag('security:public').valid, true);
    assert.equal(ops.validateTag('security:nonsense').valid, false);
    const c1 = ops.checkTagConflicts(['security:public', 'security:restricted']);
    assert.ok(c1.length >= 1);
    const c2 = ops.checkTagConflicts(['p0', 'lifecycle:active']);
    assert.equal(c2.length, 0);  // 合法組合
    await fs.rm(tmp, { recursive: true });
  }),
]);

(async () => {
  console.log('OmniTag 整合測試\n');
  await g1();
  await g2();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`結果: ${pass} 通過 / ${fail} 失敗`);
  console.log(`${'='.repeat(50)}`);
  process.exit(fail === 0 ? 0 : 1);
})();
