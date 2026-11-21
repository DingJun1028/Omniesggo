#!/usr/bin/env node
// ze learn scan — 自我學習掃描：偵測未固化模式
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const target = join(root, 'lessons', 'unprocessed');
const lessons = join(root, 'lessons', 'confirmed');

const patterns = [
  /console\.warn\("\[.*?\]/g,
  /TODO:.*等待/g,
  /手動尋找相關檔案/g,
  /請人工/g,
];

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

const files = walk(target);
const issues = [];
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  for (const p of patterns) {
    const m = content.match(p);
    if (m) issues.push({ file: relative(root, f), pattern: p.toString(), count: m.length });
  }
}
console.log(`🔍 自我學習掃描：${files.length} 個未固化檔案，${issues.length} 類可固化模式。`);
for (const i of issues.slice(0, 20)) console.log(`  ⚠️  ${i.file}: ${i.pattern.slice(0, 40)} x${i.count}`);
console.log('執行 `ze learn draft` 製作教訓草稿，`ze learn check` 檢查固化結果。');
process.exit(0);
