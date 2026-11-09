/**
 * Auto-Repair v3 — 生成修復 patch
 * 由煉金熵減陣列 (19-24/49-54) 主導
 * 用法: node scripts/auto-repair-v3/generate-fix.mjs <analysis.json>
 * 輸入: analyze.mjs 的 JSON 輸出
 * 輸出: fix.patch（diff 格式）+ 修復說明
 */
import { readFileSync, writeFileSync } from 'node:fs';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

async function main() {
  const analysisFile = process.argv[2];
  if (!analysisFile) {
    console.error('用法: node generate-fix.mjs <analysis.json>');
    process.exit(1);
  }

  const analysis = JSON.parse(readFileSync(analysisFile, 'utf8'));
  console.log('📋 分析結果:', JSON.stringify(analysis, null, 2));

  if (analysis.confidence < 0.8 || !analysis.autoFixable) {
    console.error(`⚠️ 信心不足 (${analysis.confidence}) 或不可自動修復，跳過`);
    process.exit(0);
  }

  // 讀取受影響檔案
  const fileContents = {};
  for (const f of (analysis.files || [])) {
    try {
      fileContents[f] = readFileSync(f, 'utf8');
    } catch {
      console.warn(`⚠️ 無法讀取 ${f}`);
    }
  }

  const prompt = `你是 Omniesggo 的煉金熵減陣列代理。
根據以下分析結果和原始檔案內容，生成修復 patch（unified diff 格式）。
只輸出 diff，不要其他說明。如果無法修復，輸出 "NO_FIX"。

分析：
${JSON.stringify(analysis, null, 2)}

原始檔案內容：
${Object.entries(fileContents).map(([f, c]) => `--- ${f} ---\n${c}`).join('\n\n')}

輸出 unified diff（--- a/file, +++ b/file, @@ -line,count +line,count @@）：`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    });

    const data = await res.json();
    const response = data.response?.trim() ?? '';

    if (response.includes('NO_FIX')) {
      console.error('⚠️ LLM 判斷無法自動修復');
      process.exit(0);
    }

    writeFileSync('fix.patch', response);
    console.log('✅ 修復 patch 已寫入 fix.patch');
    console.log(response);
  } catch (err) {
    console.error('❌ 生成失敗:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ 生成失敗:', err.message);
  process.exitCode = 1;
});
