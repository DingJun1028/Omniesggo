/**
 * 零算力嵌入器：道閘、回環限定、Graceful Fallback、成功路徑註冊
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ZeroComputeEmbedder } from "../src/ollama-embedder.js";
import { SemanticVectorStore } from "../src/vector-store.js";
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";
import type { UnifiedNode } from "../src/core-types.js";

test("零外流承諾：非回環端點即刻拒絕", () => {
  assert.throws(() => new ZeroComputeEmbedder({ endpoint: "https://api.openai.com" }));
  assert.throws(() => new ZeroComputeEmbedder({ endpoint: "http://192.168.1.5:11434" }));
  assert.doesNotThrow(() => new ZeroComputeEmbedder({ endpoint: "http://127.0.0.1:11434" }));
  assert.doesNotThrow(() => new ZeroComputeEmbedder({ endpoint: "http://localhost:11434" }));
});

test("端點不可達 → Graceful Fallback 回 null（不拋出）", async () => {
  const embedder = new ZeroComputeEmbedder({
    fetchImpl: (async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch,
    timeoutMs: 200,
  });
  const result = await embedder.embed("測試文字");
  assert.equal(result, null);
  assert.equal(embedder.fallbacks, 1);
  assert.equal(embedder.endpointErrors, 1);
});

test("3.5s 道閘超時 → 計入 timedOut 並降級", async () => {
  const hangFetch = async (_url: string, init?: RequestInit): Promise<never> => {
    return new Promise<never>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")));
    });
  };
  const embedder = new ZeroComputeEmbedder({
    fetchImpl: hangFetch as unknown as typeof fetch,
    timeoutMs: 50,
  });
  const t0 = Date.now();
  const result = await embedder.embed("慢速端點");
  const elapsed = Date.now() - t0;
  assert.equal(result, null);
  assert.equal(embedder.timedOut, 1);
  assert.ok(elapsed >= 40 && elapsed < 1500, `道閘應於超時上限附近觸發，實測 ${elapsed}ms`);
});

test("成功路徑：嵌入回應註冊入向量儲存；畸形回應降級", async () => {
  const emb = [1, 0, 0, 0];
  const okFetch = (async () => new Response(JSON.stringify({ embedding: emb }), { status: 200 })) as unknown as typeof fetch;
  const badFetch = (async () => new Response(JSON.stringify({ error: "boom" }), { status: 200 })) as unknown as typeof fetch;
  const http500 = (async () => new Response("err", { status: 500 })) as unknown as typeof fetch;

  const good = new ZeroComputeEmbedder({ fetchImpl: okFetch });
  const vec = await good.embed("正常嵌入");
  assert.ok(vec instanceof Float32Array);
  assert.equal(vec!.length, 4);
  assert.equal(good.successful, 1);

  const malformed = new ZeroComputeEmbedder({ fetchImpl: badFetch });
  assert.equal(await malformed.embed("畸形回應"), null);
  assert.equal(malformed.endpointErrors, 1);

  const serverError = new ZeroComputeEmbedder({ fetchImpl: http500 });
  assert.equal(await serverError.embed("伺服器錯誤"), null);
  assert.equal(serverError.endpointErrors, 1);
});

test("registerNodeBlocks：成功註冊可嵌入區塊，sketch 與失敗區塊保留 raw", async () => {
  const node = await UnifiedMatrixEngine.spawnAlphaOrigin("可嵌入之語意內容", "voice");
  const sketchNode: UnifiedNode = JSON.parse(JSON.stringify(node)) as UnifiedNode;
  sketchNode.blocks.push({
    block_id: "22222222-3333-4444-8555-666666666666",
    type: "sketch_vector",
    content: "M0 0 L 10 10",
    lamport_ts: 2,
    peer_id: "peer-local",
    deleted: false,
  });

  const okFetch = (async () => new Response(JSON.stringify({ embedding: [0.5, 0.5, 0.5, 0.5] }), { status: 200 })) as unknown as typeof fetch;
  const failFetch = (async () => { throw new Error("down"); }) as unknown as typeof fetch;

  const storeOk = new SemanticVectorStore();
  const embedderOk = new ZeroComputeEmbedder({ fetchImpl: okFetch });
  const registered = await embedderOk.registerNodeBlocks(storeOk, sketchNode);
  assert.equal(registered, 1, "僅 paragraph 區塊可嵌入，sketch_vector 應略過");
  assert.equal(storeOk.size, 1);
  const hits = storeOk.queryTopK([0.5, 0.5, 0.5, 0.5], 5, 0.72);
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.nodeUuid, sketchNode.uuid);

  const storeDown = new SemanticVectorStore();
  const embedderDown = new ZeroComputeEmbedder({ fetchImpl: failFetch });
  const registeredDown = await embedderDown.registerNodeBlocks(storeDown, sketchNode);
  assert.equal(registeredDown, 0, "端點降級時不得註冊任何向量");
  assert.equal(storeDown.size, 0, "raw_note 原樣保留，儲存不受污染");
});
