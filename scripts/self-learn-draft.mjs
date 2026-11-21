#!/usr/bin/env node
// ze learn draft — 產生教訓草稿
import { mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, extname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const target = join(root, 'lessons', 'unprocessed');
const lessons = join(root, 'lessons', 'confirmed');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'node_modules' || e === '.git') continue;
      walk(p, out);
    } else if (extname(p) === '.md' || extname(p) === '.mjs') {
      out.push(p);
    }
  }
  return out;
}
import { statSync } from 'node:fs';

const files = walk(target);
mkdirSync(lessons, { recursive: true });
const date = new Date().toISOString().slice(0, 10);
const used = new Set(files.map(f => relative(root, f)));
for (const f of files.slice(0, 5)) {
  const rel = relative(root, f);
  const name = basename(f, extname(f)).replace(/[^a-zA-Z0-9-]+/g, '-');
  const draft = join(root, 'lessons', 'drafts', `${date}-${name}.md`);
  mkdirSync(join(root, 'lessons', 'drafts'), { recursive: true });
  writeFileSync(draft, `# 教訓草稿：${name}\n\n## 來源\n- ${rel}\n\n## 可固化模式\n- 請提取重複發現的修復、經驗與新本能。\n\n## 狀態\n⬜ 待固化\n`);
  console.log(`✍️  草稿：${relative(root, draft)}`);
}
console.log('📝 教訓草稿已產生，固化後使用 `ze learn check`。');
process.exit(0);
