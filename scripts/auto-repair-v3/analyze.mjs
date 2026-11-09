/**
 * Auto-Repair v3 — LLM 驅動錯誤分析
 * 由煉金熵減陣列 (19-24/49-54) 主導
 * 用法: node scripts/auto-repair-v3/analyze.mjs [log-file]
 *       或 pipe: gh run view --log-failed | node scripts/auto-repair-v3/analyze.mjs
 */
import { readFileSync } from 'node:fs';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

async function main() {
  // 讀取錯誤日誌（從檔案或 stdin）
  let log = '';
  if (process.argv[2]) {
    log = readFileSync(process.argv[2], 'utf8');
  } else {
    // stdin
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    log = Buffer.concat(chunks).toString('utf8');
  }

  if (!log.trim()) {
    console.error('❌ 無錯誤日誌輸入');
    process.exit(1);
  }

  // 截斷過長日誌（保留頭尾）
  const MAX = 8000;
  const truncated = log.length > MAX
    ? log.slice(0, MAX / 2) + '\n...[truncated]...\n' + log.slice(-MAX / 2)
    : log;

  const prompt = `你是 Omniesggo 的煉金熵減陣列 (19-24/49-54) 代理。
分析以下 CI 錯誤日誌，輸出 JSON（不要 markdown 包裹）:
{
  "rootCause": "根因描述（中文，50字內）",
  "errorType": "typescript|eslint|test|build|dependency|secret|docker|unknown",
  "fixStrategy": "修復策略（中文，100字內）",
  "confidence": 0.0-1.0,
  "files": ["受影響檔案路徑"],
  "arrayKey": "alchemy",
  "autoFixable": true/false
}
confidence > 0.8 才建議自動 PR；< 0.8 只報告。
只輸出 JSON，不要其他文字。

錯誤日誌：
${truncated}`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama 回應 ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const response = data.response?.trim() ?? '';

    // 嘗試解析 JSON
    let analysis;
    try {
      // 移除可能的 markdown 包裹
      const cleaned = response.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      analysis = JSON.parse(cleaned);
    } catch {
      console.error('⚠️ LLM 輸出非有效 JSON，原始輸出：');
      console.log(response);
      process.exit(2);
    }

    // 輸出結果
    console.log(JSON.stringify(analysis, null, 2));

    // 信心閾值判斷
    if (analysis.confidence >= 0.8 && analysis.autoFixable) {
      console.error('\n✅ 建議自動 PR（confidence >= 0.8 且 autoFixable）');
      process.exit(0);
    } else {
      console.error(`\n⚠️ 僅報告（confidence=${analysis.confidence}, autoFixable=${analysis.autoFixable}）`);
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Ollama 呼叫失敗:', err.message);
    console.error('   確認 Ollama 已啟動: ollama serve');
    process.exit(1);
  }
}

await main();
