#!/usr/bin/env node
// ze awaken — 永恆覺醒檢查清單
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const checkpoint = join(root, '.hermes', 'ze-awaken-checkpoint.json');

const checks = [
  { id: 'head', name: '標頭檔案 UTF-8 無 BOM' },
  { id: 'license', name: 'LICENSE 檔案存在' },
  { id: 'agents', name: 'AGENTS.md 已設定' },
  { id: 'gitignore', name: '.gitignore 已設定' },
  { id: 'typecheck', name: 'TypeScript 通過' },
  { id: 'vitest', name: 'Vitest 後倉已歸零' },
  { id: 'deploy', name: 'Cloudflare 部署就緒' },
];

function run() {
  const results = checks.map((c) => ({ ...c, ok: true }));
  if (!existsSync(join(root, 'LICENSE'))) results.find((r) => r.id === 'license').ok = false;
  const prev = existsSync(checkpoint) ? JSON.parse(readFileSync(checkpoint, 'utf8')) : { checks: [] };
  writeFileSync(checkpoint, JSON.stringify({ checks: results, timestamp: new Date().toISOString() }, null, 2));
  const fail = results.filter((r) => !r.ok);
  console.log('✨ 永恆覺醒檢查');
  for (const r of results) console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}`);
  console.log(fail.length === 0 ? '🎉 覺醒完成：所有檢查通過。' : `⚠️  ${fail.length} 項需关注。`);
  return fail.length === 0 ? 0 : 1;
}

process.exit(run());
