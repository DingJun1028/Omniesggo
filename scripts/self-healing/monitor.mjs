/**
 * 自癒系統 — Sentry/Datadog Webhook → Agent 分析
 * 由 5T 驗算陣列 (25-30/55-60) 主導合規驗證
 * 用法: node scripts/self-healing/monitor.mjs
 * 環境: SENTRY_WEBHOOK_SECRET, OLLAMA_URL
 */
import { createServer } from 'http';

const PORT = process.env.SELF_HEALING_PORT || 8900;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());

  console.log('🚨 收到錯誤報告:', body.event?.title || body.message || 'unknown');

  // 分析錯誤
  const analysis = await analyzeError(body);

  console.log('📋 分析結果:', JSON.stringify(analysis, null, 2));

  if (analysis.confidence >= 0.8 && analysis.autoFixable) {
    console.log('✅ 建議自動修復（需人類 approve PR）');
    // TODO: 觸發 auto-repair-v3 pipeline
  } else {
    console.log('⚠️ 僅報告，需人工介入');
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'received', analysis }));
});

async function analyzeError(errorBody) {
  const prompt = `你是 Omniesggo 的自癒系統代理（5T 驗算陣列 25-30/55-60）。
分析以下生產錯誤，輸出 JSON:
{
  "rootCause": "根因（中文，50字內）",
  "errorType": "runtime|logic|config|infra",
  "fixStrategy": "修復策略（中文，100字內）",
  "confidence": 0.0-1.0,
  "autoFixable": true/false,
  "severity": "P0|P1|P2|P3",
  "affectedFiles": ["檔案路徑"]
}

錯誤報告:
${JSON.stringify(errorBody, null, 2).slice(0, 4000)}`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen2.5-coder:7b', prompt, stream: false }),
    });
    const data = await res.json();
    const cleaned = data.response?.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  } catch (err) {
    return { rootCause: '分析失敗', errorType: 'unknown', fixStrategy: '需人工介入', confidence: 0, autoFixable: false, severity: 'P1', affectedFiles: [] };
  }
}

server.listen(PORT, () => {
  console.log(`🛡️ 自癒系統監聽中: http://localhost:${PORT}/webhook`);
});
