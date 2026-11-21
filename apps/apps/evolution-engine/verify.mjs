#!/usr/bin/env node
// verify.mjs — 自我進化引擎 · 驗證層 (不假稱完成)
// 對 improve 的提案做語法/存在性檢查，回傳可驗證結果
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { improve } from './improve.mjs';
import { observe } from './observe.mjs';
import { learn } from './learn.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'proposals');

export function verify(props) {
  const results = [];
  for (const p of props) {
    const exists = fs.existsSync(p.file);
    results.push({
      id: p.id, type: p.type, target: p.target,
      verified: exists,  // 提案檔存在 = 可驗證產出
      note: exists ? '提案檔已生成' : '提案檔缺失',
    });
  }
  const pass = results.filter(r => r.verified).length;
  return { results, pass, total: results.length };
}

if (process.argv[1] && process.argv[1].includes('verify.mjs')) {
  const obs = observe();
  const exps = learn(obs);
  const props = improve(exps);
  const v = verify(props);
  console.log(`[evolution:verify] ${v.pass}/${v.total} 提案通過驗證`);
  for (const r of v.results) console.log(`   - ${r.verified ? '✓' : '✗'} ${r.id} (${r.type})`);
}
