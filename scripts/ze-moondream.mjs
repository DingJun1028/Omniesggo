#!/usr/bin/env node
// ze moondream — 視覺能力：Moondream (Ollama)
import { spawnSync } from 'node:child_process';
const action = process.argv[2] || 'status';
console.log('👁️  視覺能力：Moondream');
if (action === 'status') {
  const r = spawnSync('curl', ['-s', 'http://localhost:11434/api/tags'], { stdio: 'pipe' });
  const out = r.stdout?.toString() || '';
  const hasMd = out.includes('moondream');
  console.log(`  Moondream：${hasMd ? '✅ 已安裝' : '❌ 缺失'}`);
  console.log(`  Ollama：${out ? '✅ 執行中' : '❌ 未啟動'}`);
} else if (action === 'ask') {
  const image = process.argv[3];
  if (!image) { console.log('用法：ze moondream ask <圖片路徑> [問題]'); process.exit(1); }
  const question = process.argv[4] || '描述這張圖片的內容';
  const r = spawnSync('curl', ['-s', '-X', 'POST', 'http://localhost:11434/api/generate', '-H', 'Content-Type: application/json', '-d', JSON.stringify({ model: 'moondream', prompt: question, stream: false })], { stdio: 'pipe' });
  console.log(r.stdout?.toString() || '無回應');
}
