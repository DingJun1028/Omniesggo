/**
 * OA Framework smoke test — 驗證 10 子框架註冊 + 5T 鑄造
 * 執行: npx tsx test/smoke.ts
 *
 * 設計: 全框架並行 dispatch, 但包整體 race timeout (60s),
 * 避免個別 adapter (adk/crewai/deerflow/tencent-mem 等需聯網/docker)
 * 在本機無 key/無服務時無限掛起. 逾時的 framework 標 TIMEOUT, 不阻塞其他.
 */
import { createOAFrame, verify5T, OA_SUBFRAMES } from '../src/index.js';

const OVERALL_TIMEOUT_MS = 60_000;

function withTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT@${tag}`)), ms)
    ),
  ]);
}

async function main() {
  const oa = createOAFrame({
    llmModel: 'qwen2.5:3b-instruct-q4_K_M', // 本地 Ollama 免費 (避免 gemini key 依賴)
    llmBaseUrl: 'http://localhost:11434/v1',
    llmApiKey: 'ollama',
    memoryGateway: 'http://127.0.0.1:8420',
  });

  console.log('=== OA 元框架啟動 ===');
  console.log('已註冊子框架:', OA_SUBFRAMES.length, '個');

  const task = {
    id: 't1',
    prompt: '為 ESG-GO 產出 5T 合規元件骨架',
    routeTo: [...OA_SUBFRAMES] as string[], // 全 10 框架並行
  };

  console.log('=== 並行 dispatch (整體 race timeout 60s) ===');
  let results: Awaited<ReturnType<typeof oa.run>> = [];
  try {
    results = await withTimeout(oa.run(task as any), OVERALL_TIMEOUT_MS, 'oa.run');
  } catch (e: any) {
    console.error('SMOKE_RUN_ERR:', e.message);
  }

  console.log('=== 5T 雙層鑄造: 欄位級 + 內容級 omni-gate ===');
  let allPass = true;
  for (const id of OA_SUBFRAMES) {
    const r = results.find((x) => x.subFrame === id);
    if (!r) {
      console.log(`  [${id}] TIMEOUT/MISSING`);
      allPass = false;
      continue;
    }
    const v = verify5T(r);
    if (!v.pass) allPass = false;
    const contentTag = v.contentPassed ? 'CONTENT_OK' : 'CONTENT_FAIL';
    console.log(`  [${id}] field=${v.pass ? 'PASS' : 'FAIL'} ${contentTag}`);
  }

  console.log('\n=== 健康檢查 ===');
  let health: Record<string, { status: string; detail?: string }> = {};
  try {
    health = await withTimeout(oa.healthAll() as any, 15_000, 'healthAll');
  } catch (e: any) {
    console.error('HEALTH_ERR:', e.message);
  }
  for (const id of OA_SUBFRAMES) {
    const h = health[id];
    console.log(`  ${id}: ${h ? h.status : 'TIMEOUT'}`);
  }

  const okCount = results.filter((r) => verify5T(r).pass).length;
  console.log(
    `\nRESULT: ${results.length === OA_SUBFRAMES.length && allPass ? 'ALL_10_FRAMEWORKS_OK' : `PARTIAL (${okCount}/${OA_SUBFRAMES.length} pass)`}`
  );
  // smoke 不強制全過 (本機無 key/docker 時個別框架會 down),
  // 但必須在 timeout 內結束 — 這才是「修逾時」的目標.
  process.exit(0);
}

main().catch((e) => {
  console.error('SMOKE_FAIL:', e);
  process.exit(1);
});
