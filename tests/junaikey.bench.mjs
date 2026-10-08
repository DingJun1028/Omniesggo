// tests/junaikey.bench.mjs
// ============================================================
// JunAikey 效能基準 (零依賴)
// 執行: node tests/junaikey.bench.mjs
// ============================================================
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { createLocalBackend } from '../vps/junaikey/backends/local.mjs';
import { filterEntries, toNCBPayload, parseJSONField } from '../vps/junaikey/util.mjs';

const t0 = Date.now();
const bench = async (name, fn) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  const out = Array.isArray(result) ? `[${result.length} items]`
    : typeof result === 'object' && result && result.name ? `${result.name}`
    : result;
  console.log(`  ${name.padEnd(40)} ${ms.toFixed(2).padStart(8)}ms  ${out || ''}`);
  return ms;
};

(async () => {
  console.log('JunAikey 效能基準 (local backend)\n');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'junaikey-bench-'));
  const PATHS = {
    home: tmp, skills: path.join(tmp, 's.md'),
    memory: path.join(tmp, 'm.jsonl'), progress: path.join(tmp, 'p.md'),
    journal: path.join(tmp, 'j.jsonl'),
  };
  const be = createLocalBackend(tmp, PATHS);
  await be.init();

  console.log('預先填 100 筆 skills + 500 筆 memories...');
  const skills = [];
  for (let i = 0; i < 100; i++) {
    skills.push({ name: `skill-${i}`, body: `body of skill ${i}`, traits: ['永恆'] });
  }
  await be.writeSkills(skills);
  for (let i = 0; i < 500; i++) {
    await be.appendMemory({ ts: `2026-10-08 ${String(i%24).padStart(2,'0')}:00:00`, event: i%5===0?'awaken':'remember', n: i });
  }

  console.log('\n讀取基準:');
  await bench('readSkills (100 筆)', () => be.readSkills());
  await bench('readMemory 全部 (500 筆)', () => be.readMemory());
  await bench('readMemory {limit:10}', () => be.readMemory({ limit: 10 }));
  await bench('readMemory {event:awaken}', () => be.readMemory({ event: 'awaken' }));
  await bench('readMemory {tag filter (none)}', () => be.readMemory({ tag: 'audit' }));

  console.log('\n寫入基準:');
  await bench('writeSkills 100 筆 (delete-all + bulk)', () =>
    be.writeSkills(skills.map(s => ({ ...s, body: 'updated' }))));
  await bench('appendMemory 1 筆', () => be.appendMemory({ event: 'test', n: Date.now() }));
  await bench('forgetSkill 1 筆', () => be.forgetSkill('skill-50'));

  console.log('\n進階基準:');
  await bench('pruneMemory (maxRecords=50)', () => be.pruneMemory({ maxRecords: 50 }));
  await bench('filterEntries 100 筆 (event filter)', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ event: i%2?'a':'b', ts: `2026-10-08 ${i}:00:00` }));
    return filterEntries(data, { event: 'a' });
  });
  await bench('toNCBPayload 500 筆', () => {
    return Array.from({ length: 500 }, (_, i) => toNCBPayload({ ts: `2026-10-08T${String(i%24).padStart(2,'0')}:00:00Z`, n: i }));
  });

  await fs.rm(tmp, { recursive: true });
  console.log(`\n總時間: ${Date.now() - t0}ms`);
})();

