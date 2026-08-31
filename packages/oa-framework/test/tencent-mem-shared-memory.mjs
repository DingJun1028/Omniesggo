// OA-Team 雙蜂跨代理共享記憶 smoke test (正式)
//
// 對齊 packages/oa-framework/src/adapters/tencent-mem.ts 的真實路由:
//   寫入: POST /v3/conversation/add
//   召回: POST /v3/conversation/search
//
// 環境變數:
//   TDAI_GATEWAY_URL        (default http://127.0.0.1:8420)
//   TDAI_GATEWAY_API_KEY    Bearer; 本機 local 模式 = apps/tencentdb-memory/.admin-key 內容
//   TDAI_SERVICE_ID         (default oa-team-swarm)
//   OA_MEMORY_TEST_TIMEOUT_MS (default 30000)
//
// 行為:
//   - core 不可達            → 印 SKIP, exit 0 (CI 在無 docker/ollama 環境不紅)
//   - core 可達但無 API Key  → 印 SKIP, exit 0 (避免無 key 時誤報 FAIL)
//   - core 可達且有 Key      → 模擬 Bee-07 編碼蜂 + Bee-03 分析蜂 寫入同一 session,
//                              彼此召回, 驗證跨代理共享; 任一斷言失敗 → exit 1
//
// 執行: node test/tencent-mem-shared-memory.mjs
import process from 'node:process';

const CORE = process.env.TDAI_GATEWAY_URL ?? 'http://127.0.0.1:8420';
const KEY = process.env.TDAI_GATEWAY_API_KEY ?? '';
const SVC = process.env.TDAI_SERVICE_ID ?? 'oa-team-swarm';
const USER = 'admin';
const TIMEOUT_MS = Number(process.env.OA_MEMORY_TEST_TIMEOUT_MS ?? 30000);

function authHeaders() {
  const h = { 'content-type': 'application/json' };
  if (KEY) h['authorization'] = `Bearer ${KEY}`;
  if (SVC) h['x-tdai-service-id'] = SVC;
  return h;
}

async function ping() {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);
  try {
    const r = await fetch(`${CORE}/health`, { signal: ac.signal });
    if (!r.ok) return false;
    const d = await r.json().catch(() => null);
    return d?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function capture(sessionId, agent, content) {
  const res = await fetch(`${CORE}/v3/conversation/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      service_id: SVC,
      user_id: USER,
      session_id: sessionId,
      messages: [{ role: 'user', content: `[${agent}] ${content}` }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, code: data.code, ids: data.data?.accepted_ids };
}

async function recall(sessionId, query) {
  const res = await fetch(`${CORE}/v3/conversation/search`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ service_id: SVC, user_id: USER, session_id: sessionId, query }),
  });
  const data = await res.json().catch(() => ({}));
  return data.data?.messages ?? [];
}

async function withTimeout(p, ms, tag) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT@${tag}`)), ms)),
  ]);
}

async function main() {
  console.log(`# OA-Team 雙蜂共享記憶 smoke test (core=${CORE}, svc=${SVC})`);

  const healthy = await ping();
  if (!healthy) {
    console.log(`SKIP: core 不可達 (${CORE}) — 跳過 (無 docker/ollama 環境不紅)`);
    process.exit(0);
  }
  if (!KEY) {
    console.log(`SKIP: core 可達但無 TDAI/ADMIN Key — 跳過 (避免無 key 誤報)`);
    process.exit(0);
  }

  const SHARED = `oa-swarm-shared-${Date.now()}`;
  const w1 = await withTimeout(
    capture(SHARED, 'Bee-07 編碼蜂', 'AI Station 7 模組生產線 ffmpeg 渲染路徑為 /tmp/render, 輸出 H.264'),
    TIMEOUT_MS,
    'capture-07',
  );
  const w2 = await withTimeout(
    capture(SHARED, 'Bee-03 分析蜂', '生產線瓶頸在語音合成步驟, edge-tts 平均延遲 10s, 建議批次處理'),
    TIMEOUT_MS,
    'capture-03',
  );
  const r1 = await withTimeout(recall(SHARED, 'AI Station 生產線'), TIMEOUT_MS, 'recall-03');
  const r2 = await withTimeout(recall(SHARED, '語音合成 瓶頸'), TIMEOUT_MS, 'recall-07');

  const bee07SeesBee03 = r2.some((m) => m.content.includes('Bee-03'));
  const bee03SeesBee07 = r1.some((m) => m.content.includes('Bee-07'));
  const PASS =
    w1.ok && w2.ok && r1.length >= 2 && r2.length >= 1 && bee07SeesBee03 && bee03SeesBee07;

  console.log(`[Bee-07 寫入] ${JSON.stringify(w1)}`);
  console.log(`[Bee-03 寫入] ${JSON.stringify(w2)}`);
  console.log(`[Bee-03 召回] ${r1.length} 條`);
  console.log(`[Bee-07 召回] ${r2.length} 條`);
  console.log(`Bee-07 可見 Bee-03 寫入: ${bee07SeesBee03}`);
  console.log(`Bee-03 可見 Bee-07 寫入: ${bee03SeesBee07}`);
  console.log(`\nRESULT: ${PASS ? 'PASS ✅ 雙蜂跨代理共享記憶成功' : 'FAIL ❌'}`);
  process.exit(PASS ? 0 : 1);
}

main().catch((e) => {
  console.error('SMOKE_FAIL:', e.message);
  process.exit(1);
});
