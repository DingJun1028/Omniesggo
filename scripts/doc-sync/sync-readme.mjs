/**
 * 文件同步 — README 模組列表自動更新
 * 由智庫聖所陣列 (01-06/31-36) 主導
 * 用法: node scripts/doc-sync/sync-readme.mjs
 * 輸出: 更新 README.md 的模組列表區段
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const README = 'README.md';

function main() {
  // 掃描 packages/ 和 apps/ 目錄
  const packages = readdirSync('packages', { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const apps = readdirSync('apps', { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  // 讀取 README
  let readme = readFileSync(README, 'utf8');

  // 生成模組列表
  const moduleList = [
    '## 自動生成模組列表（由 doc-sync 產出）',
    '',
    '### packages/',
    ...packages.map(p => `- \`${p}\``),
    '',
    '### apps/',
    ...apps.map(a => `- \`${a}\``),
    '',
    `> 最後更新: ${new Date().toISOString()}`,
  ].join('\n');

  // 替換或追加
  const marker = '<!-- AUTO-MODULE-LIST -->';
  if (readme.includes(marker)) {
    const start = readme.indexOf(marker);
    const end = readme.indexOf(marker, start + marker.length) + marker.length;
    readme = readme.slice(0, start) + marker + '\n' + moduleList + '\n' + marker + readme.slice(end);
  } else {
    readme += '\n\n' + marker + '\n' + moduleList + '\n' + marker + '\n';
  }

  writeFileSync(README, readme);
  console.log(`✅ README.md 已更新（${packages.length} packages, ${apps.length} apps）`);
}
