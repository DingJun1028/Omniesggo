#!/usr/bin/env node
// ze reach-agent — ReachAgent 完整 pipeline 狀態
import { existsSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const checks = [
  ['ReachAgent 目錄', path.join(root, 'apps', 'reach-agent')],
  ['.env 入口', path.join(root, 'apps', 'reach-agent', '.env')],
  ['reach-agent package.json', path.join(root, 'apps', 'reach-agent', 'package.json')],
  ['.gitignore', path.join(root, '.gitignore')]
];
console.log('🕸️  ReachAgent 狀態');
let ok = true;
for (const [name, p] of checks) {
  const exists = existsSync(p);
  if (exists) { console.log(`  ✅ ${name}（${p}）`); if (!p.includes('reach-agent') && p === path.join(root, '.env')) {} }
  else { console.log(`  ❌ ${name}（${p}）`); ok = false; }
}
console.log(ok ? '✅ ReachAgent pipeline 就緒' : '⚠️  部分項目缺失');
