#!/usr/bin/env node
// ze learn check — 檢查未固化模式
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const unprocessed = join(root, 'lessons', 'unprocessed');
const confirmed = join(root, 'lessons', 'confirmed');
const drafts = join(root, 'lessons', 'drafts');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'node_modules' || e === '.git') continue;
      walk(p, out);
    } else if (extname(p) === '.md') {
      out.push(p);
    }
  }
  return out;
}

const unconf = walk(unprocessed);
const conf = walk(confirmed);
const confCount = conf.filter((f) => !readFileSync(f, 'utf8').includes('⬜')).length;
console.log(`🔍 固化檢查：`);
console.log(`  未固化：${unconf.length} 份`);
console.log(`  已固化：${confCount} 份（共 ${conf.length} 份）`);
console.log(`  草稿：${existsSync(drafts) ? walk(drafts).length : 0} 份`);
console.log(conf.length >= 13 ? '🎉 已固化 ≥ 13 條教訓，自我學習閉環就緒。' : `⚠️  覆蓋率 ${Math.round((confCount / 13) * 100)}%`);
process.exit(0);
