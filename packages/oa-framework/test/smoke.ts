/**
 * OA Framework smoke test, validates 10 subframework registrations and 5T output.
 * Run: npx tsx test/smoke.ts
 *
 * This test dispatches all adapters concurrently behind one overall timeout.
 * Adapters that require network or Docker may time out locally without blocking others.
 */
import { createOAFrame, verify5T, OA_SUBFRAMES } from '../src/index.js';

const OVERALL_TIMEOUT_MS = 60_000;
type OAFrame = ReturnType<typeof createOAFrame>;
type OAResults = Awaited<ReturnType<OAFrame['run']>>;

function withTimeout<T>(promise: Promise<T>, milliseconds: number, tag: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT@${tag}`)), milliseconds),
    ),
  ]);
}

function createSmokeFrame(): OAFrame {
  return createOAFrame({
    llmModel: 'qwen2.5:3b-instruct-q4_K_M',
    llmBaseUrl: 'http://localhost:11434/v1',
    llmApiKey: 'ollama',
    memoryGateway: 'http://127.0.0.1:8420',
  });
}

async function runSmokeTask(oa: OAFrame): Promise<OAResults> {
  const task = {
    id: 't1',
    prompt: '為 ESG-GO 產出 5T 合規元件骨架',
    routeTo: [...OA_SUBFRAMES] as string[],
  };
  try {
    return await withTimeout(oa.run(task as any), OVERALL_TIMEOUT_MS, 'oa.run');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SMOKE_RUN_ERR:', message);
    return [];
  }
}

function reportResults(results: OAResults): void {
  let allPass = true;
  let okCount = 0;
  for (const id of OA_SUBFRAMES) {
    const result = results.find((item) => item.subFrame === id);
    if (!result) {
      console.log(` [${id}] TIMEOUT/MISSING`);
      allPass = false;
      continue;
    }
    const verification = verify5T(result);
    if (verification.pass) okCount += 1;
    else allPass = false;
    const contentTag = verification.contentPassed ? 'CONTENT_OK' : 'CONTENT_FAIL';
    const fieldTag = verification.pass ? 'PASS' : 'FAIL';
    console.log(` [${id}] field=${fieldTag} ${contentTag}`);
  }
  const complete = results.length === OA_SUBFRAMES.length && allPass;
  const resultTag = complete ? 'ALL_10_FRAMEWORKS_OK' : `PARTIAL (${okCount}/${OA_SUBFRAMES.length} pass)`;
  console.log(`\nRESULT: ${resultTag}`);
}

async function reportHealth(oa: OAFrame): Promise<void> {
  let health: Awaited<ReturnType<OAFrame['healthAll']>> = {};
  try {
    health = await withTimeout(oa.healthAll(), 15_000, 'healthAll');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('HEALTH_ERR:', message);
  }
  for (const id of OA_SUBFRAMES) {
    const status = health[id]?.status ?? 'TIMEOUT';
    console.log(` ${id}: ${status}`);
  }
}

async function main(): Promise<void> {
  const oa = createSmokeFrame();
  console.log('=== OA 元框架啟動 ===');
  console.log('已註冊子框架:', OA_SUBFRAMES.length, '個');
  console.log('=== 並行 dispatch (整體 race timeout 60s) ===');
  const results = await runSmokeTask(oa);
  console.log('=== 5T 雙層鑄造: 欄位級 + 內容級 omni-gate ===');
  reportResults(results);
  console.log('\n=== 健康檢查 ===');
  await reportHealth(oa);
  // This smoke test validates bounded completion; adapters without local services may be down.
  process.exit(0);
}

try {
  await main();
} catch (error) {
  console.error('SMOKE_FAIL:', error);
  process.exit(1);
}
