import { performance } from 'perf_hooks';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
// Use the model defined in the model router
const MODEL = 'qwen2.5:3b'; 

const CONCURRENT_REQUESTS = 5;
const TOTAL_REQUESTS = 20;

const testPrompts = [
  "請簡述 ISO-14064 溫室氣體盤查的三大範疇 (Scope 1, 2, 3) 定義。",
  "什麼是 TCFD 氣候相關財務揭露？請用 50 字說明。",
  "如何制定企業的淨零排放 (Net Zero) 藍圖？",
  "ESG 報告中的 GRI 準則與 CSRD 指令有何差異？",
  "請解釋碳權 (Carbon Credit) 與碳交易市場的基本運作方式。"
];

async function makeRequest(id: number) {
  const prompt = testPrompts[id % testPrompts.length];
  const startTime = performance.now();
  
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          num_predict: 256,
          temperature: 0.7,
        }
      }),
      // signal: AbortSignal.timeout(60000) // Node 18+ only, fallback to setTimeout below if needed
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      console.error(`[Task ${id}] 失敗: HTTP ${response.status} - 耗時 ${Math.round(duration)}ms`);
      return { id, success: false, duration, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log(`[Task ${id}] 成功: 耗時 ${Math.round(duration)}ms, 生成 ${data.eval_count || 0} tokens (${((data.eval_count || 0) / (duration/1000)).toFixed(1)} tokens/sec)`);
    return { id, success: true, duration, tokens: data.eval_count, tokensPerSec: (data.eval_count || 0) / (duration/1000) };
  } catch (error: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`[Task ${id}] 異常: ${error.message} - 耗時 ${Math.round(duration)}ms`);
    return { id, success: false, duration, error: error.message };
  }
}

async function runStressTest() {
  console.log(`🚀 開始 Ollama 效能壓力測試`);
  console.log(`- 端點: ${OLLAMA_URL}`);
  console.log(`- 模型: ${MODEL}`);
  console.log(`- 並發數: ${CONCURRENT_REQUESTS}`);
  console.log(`- 總請求數: ${TOTAL_REQUESTS}\n`);

  const results = [];
  let currentIndex = 0;

  const runBatch = async () => {
    while (currentIndex < TOTAL_REQUESTS) {
      const batch = [];
      for (let i = 0; i < CONCURRENT_REQUESTS && currentIndex < TOTAL_REQUESTS; i++) {
        batch.push(makeRequest(currentIndex++));
      }
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
  };

  const globalStart = performance.now();
  
  // Create worker "threads"
  const workers = [];
  for(let i=0; i < CONCURRENT_REQUESTS; i++) {
    workers.push(runBatch());
  }
  await Promise.all(workers);

  const globalEnd = performance.now();
  const totalDuration = globalEnd - globalStart;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const avgDuration = successful.length > 0 ? successful.reduce((acc, curr) => acc + curr.duration, 0) / successful.length : 0;
  const avgTokens = successful.length > 0 ? successful.reduce((acc, curr) => acc + (curr.tokens || 0), 0) / successful.length : 0;
  const avgTokensPerSec = successful.length > 0 ? successful.reduce((acc, curr) => acc + (curr.tokensPerSec || 0), 0) / successful.length : 0;

  console.log(`\n📊 測試報告總結`);
  console.log(`----------------------------------------`);
  console.log(`總耗時: ${(totalDuration / 1000).toFixed(2)} 秒`);
  console.log(`成功/失敗: ${successful.length} / ${failed.length}`);
  console.log(`平均回應時間: ${Math.round(avgDuration)} ms`);
  console.log(`平均生成 Token 數: ${Math.round(avgTokens)} tokens`);
  console.log(`平均生成速度: ${avgTokensPerSec.toFixed(2)} tokens/sec (單一請求)`);
  console.log(`系統整體吞吐量: ${(successful.reduce((acc, curr) => acc + (curr.tokens || 0), 0) / (totalDuration / 1000)).toFixed(2)} tokens/sec`);
  console.log(`----------------------------------------`);
}

runStressTest().catch(console.error);
