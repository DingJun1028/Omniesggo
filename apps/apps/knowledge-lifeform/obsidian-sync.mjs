#!/usr/bin/env node
// obsidian-sync.mjs — 把 evolution-engine 經驗鏡像成 vault 筆記 (5T frontmatter, 過質控蜂)
import fs from 'node:fs';
import path from 'node:path';

const ENGINE = 'C:/Project/esggo/apps/evolution-engine';
const VAULT = 'C:/Project/esggo/vault/Agents/context';
fs.mkdirSync(VAULT, { recursive: true });

let exps = [];
try { exps = JSON.parse(fs.readFileSync(path.join(ENGINE, 'experiences.json'), 'utf8')); }
catch { console.log('⚠ experiences.json 不存在，跳過'); process.exit(0); }

let n = 0;
for (const e of exps.slice(-5)) {
  const safe = (e.theme || 'exp').replace(/[^a-z0-9-]/gi, '_');
  const fn = path.join(VAULT, `EXP-${safe}.md`);
  const md = `---
type: experience
source_origin: evolution-engine
co_authors: [evolution-engine]
tag: ${e.tag}
source: ${e.source}
created: ${e.created_at}
---

# ${e.theme}

${e.lesson}
`;
  fs.writeFileSync(fn, md);
  n++;
}
console.log(`✓ 鏡像 ${n} 條經驗到 vault/Agents/context/`);
