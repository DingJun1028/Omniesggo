// 真實憑證接線測試 (模擬 tencent-mem.ts adapter 的核心邏輯)
// 對齊 /opt/esggo/packages/oa-framework/src/adapters/tencent-mem.ts 實測路由
const CORE = process.env.TDAI_GATEWAY_URL ?? 'http://127.0.0.1:8420';
const KEY = process.env.TDAI_GATEWAY_API_KEY ?? '';
const SVC = process.env.TDAI_SERVICE_ID ?? 'oa-team-swarm';

function authHeaders() {
  const h = { 'content-type': 'application/json' };
  if (KEY) h['authorization'] = `Bearer ${KEY}`;
  if (SVC) h['x-tdai-service-id'] = SVC;
  return h;
}

async function captureConversation(sessionId, messages) {
  const res = await fetch(`${CORE}/v3/conversation/add`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ sessionId, messages }),
  });
  if (!res.ok) return { ok: false, status: res.status, body: await res.text() };
  const data = await res.json();
  return { ok: true, ids: data.data?.accepted_ids };
}

async function recallConversation(sessionId, query) {
  const res = await fetch(`${CORE}/v3/conversation/search`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ sessionId, query }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.messages ?? [];
}

(async () => {
  const sid = `oa-live-${Date.now()}`;
  console.log('== capture ==');
  const saved = await captureConversation(sid, [{ role: 'user', content: 'OA-Team 蜂群 adapter 接線實測' }]);
  console.log(JSON.stringify(saved));
  // 召回用同一 session 但不同 query 仍應命中 (BM25)
  console.log('== recall ==');
  const ctx = await recallConversation(sid, '蜂群 adapter');
  console.log(JSON.stringify(ctx, null, 2));
  console.log('== RESULT ==', saved.ok && ctx.length > 0 ? 'PASS' : 'FAIL');
})();
