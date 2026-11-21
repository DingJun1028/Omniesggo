/**
 * 真實實跑 OneRingAI adapter — 本地 Ollama 免費路徑
 * 驗證: 安裝 @everworker/oneringai 後, OA 任務經 OneRingAI Agent.run() 取得真實模型輸出,
 * 並經 forgeT5 鑄造 5T (欄位級 + 內容級).
 */
import { createOAFrame, verify5T } from '../src/index.js';
import type { OATask } from '../src/core/types.js';

async function main() {
  // 本地 Ollama (免費) — 預設 gemma4:26b 已確認安裝
  const oa = createOAFrame({
    llmBaseUrl: 'http://localhost:11434/v1',
    llmApiKey: 'ollama',
    llmModel: 'qwen2.5:3b-instruct-q4_K_M',
    enforce5T: true,
  });

  const task: OATask = {
    id: 'real-1',
    prompt: '用一句話說明什麼是永續發展，並舉一個日常例子。',
    routeTo: ['oneringai'],
    requireT5: true,
  };

  console.log('=== 提交 OneRingAI 任務 (Ollama 本地免費) ===');
  const results = await oa.run(task);

  for (const r of results) {
    const v = verify5T(r);
    console.log(`\n[${r.subFrame}] 真實輸出:`);
    console.log(r.output);
    console.log(`\n5T 欄位: ${JSON.stringify(r.t5)}`);
    console.log(`Hash Lock: ${r.hashLock}`);
    console.log(`5T 驗證: ${v.pass ? 'PASS' : 'FAIL'} ${v.reasons?.join('; ') ?? ''}`);
    if (!v.pass) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('REAL RUN ERROR:', e);
  process.exit(1);
});
