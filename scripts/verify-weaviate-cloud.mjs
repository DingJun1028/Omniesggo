#!/usr/bin/env node
// =====================================================================
// scripts/verify-weaviate-cloud.mjs — Weaviate Cloud 免費沙箱驗證工具
// 零依賴（Node 22 原生 fetch）；對齊 src/lib/rag/client.ts 之契約
// （Authorization: Bearer、REST /v1/schema、/v1/objects、
//  REST Search /v1/search/{class}/near-vector — GraphQL 已棄用，
//  見 docs/vault-canon/RAG-VECTOR-LAYER.md §7.2）。
// 用法：
//   WEAVIATE_URL=https://<cluster-id>.weaviate.network WEAVIATE_API_KEY=... \
//     node scripts/verify-weaviate-cloud.mjs [ready|meta|schema|e2e]
// e2e 子命令會建立（若缺席）RAG_WEAVIATE_CLASS、寫入一筆可辨識測試物件
// （明確向量、vectorizer: none），以 nearVector 查詢驗證後刪除，不留殘留。
// =====================================================================
const [cmd = "e2e"] = process.argv.slice(2);

const env = process.env;
const url = (env.WEAVIATE_URL || "").replace(/\/+$/, "");
const key = env.WEAVIATE_API_KEY || "";
const className = env.RAG_WEAVIATE_CLASS || "OmniChunk";
const dim = Number(env.RAG_EMBEDDING_DIM || 768); // nomic-embed-text 維度

if (!url || !key) {
  console.error("FAIL: WEAVIATE_URL 與 WEAVIATE_API_KEY 皆為必填（Tier 2，經 .env.secrets / OTS 注入，永不入 repo）");
  process.exit(2);
}
if (!/^https:\/\//.test(url)) {
  console.error("FAIL: WEAVIATE_URL 必須為 https:// WCD 叢集位址");
  process.exit(2);
}

const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const testId = "00000000-0000-4000-8000-000000000001";

async function call(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function ready() {
  const r = await call("/v1/.well-known/ready");
  console.log(`ready -> HTTP ${r.status}${r.status === 200 ? " (OK)" : " " + r.body.slice(0, 120)}`);
  process.exit(r.status === 200 ? 0 : 1);
}

async function meta() {
  const r = await call("/v1/meta");
  console.log(`meta -> HTTP ${r.status}`);
  if (r.status === 200) console.log(r.body.slice(0, 400));
  process.exit(r.status === 200 ? 0 : 1);
}

async function schema() {
  const r = await call("/v1/schema");
  console.log(`schema -> HTTP ${r.status}`);
  if (r.status !== 200) { console.log(r.body.slice(0, 300)); process.exit(1); }
  const j = JSON.parse(r.body);
  for (const c of j.classes || []) {
    console.log(`- ${c.class}（vectorizer: ${c.vectorizer}）`);
  }
  process.exit(0);
}

async function e2e() {
  // 1) schema（缺席則建立，vectorizer none + 明確向量）
  const s = await call("/v1/schema");
  if (s.status !== 200) { console.error(`FAIL schema GET: HTTP ${s.status}`); process.exit(1); }
  let exists = (JSON.parse(s.body).classes || []).some((c) => c.class === className);
  if (!exists) {
    const create = await call("/v1/schema", {
      method: "POST",
      body: JSON.stringify({
        class: className,
        vectorizer: "none",
        properties: [
          { name: "docId", dataType: ["text"] },
          { name: "chunkIndex", dataType: ["int"] },
          { name: "content", dataType: ["text"] },
          { name: "ownerId", dataType: ["text"] },
        ],
      }),
    });
    if (create.status !== 200 && create.status !== 201) {
      console.error(`FAIL schema POST: HTTP ${create.status} ${create.body.slice(0, 200)}`);
      process.exit(1);
    }
    console.log(`PASS schema 建立 ${className}（vectorizer: none）`);
  } else {
    console.log(`PASS schema 已存在 ${className}`);
  }

  // 2) upsert 測試物件（明確向量；與 R4 確定性 UUID 精神一致之固定 ID）
  const vector = Array.from({ length: dim }, (_, i) => ((i % 7) - 3) / 10);
  const up = await call(`/v1/objects`, {
    method: "POST",
    body: JSON.stringify({
      class: className,
      id: testId,
      properties: { docId: "verify-weaviate-cloud-e2e", chunkIndex: 0, content: "Weaviate Cloud 免費沙箱端到端驗證測試物件", ownerId: "verify" },
      vector,
    }),
  });
  if (up.status !== 200 && up.status !== 201) {
    console.error(`FAIL upsert: HTTP ${up.status} ${up.body.slice(0, 200)}`);
    process.exit(1);
  }
  console.log("PASS upsert 測試物件（明確向量寫入）");

  // 3) nearVector 查詢（REST Search API：對齊 client.ts 之檢索形態）
  const q = await call(`/v1/search/${className}/near-vector`, {
    method: "POST",
    body: JSON.stringify({
      vector,
      limit: 3,
      returnProperties: ["docId", "content", "ownerId"],
    }),
  });
  if (q.status !== 200) { console.error(`FAIL rest search: HTTP ${q.status} ${q.body.slice(0, 200)}`); process.exit(1); }
  const found = (JSON.parse(q.body)?.results || []).some((o) => o.properties?.docId === "verify-weaviate-cloud-e2e");
  if (!found) { console.error("FAIL nearVector 查詢未尋回測試物件"); process.exit(1); }
  console.log("PASS nearVector 檢索尋回測試物件");

  // 4) 清理（不留殘留，保護免費沙箱額度）
  const del = await call(`/v1/objects/${className}/${testId}`, { method: "DELETE" });
  console.log(del.status === 200 || del.status === 204 ? "PASS 清理測試物件" : `WARN 清理回 HTTP ${del.status}`);
  console.log("E2E_ALL_PASS");
  process.exit(0);
}

const commands = { ready, meta, schema, e2e };
if (!commands[cmd]) {
  console.error(`未知子命令：${cmd}（可用：ready | meta | schema | e2e）`);
  process.exit(2);
}
commands[cmd]().catch((e) => { console.error("FAIL: " + e.message); process.exit(1); });
