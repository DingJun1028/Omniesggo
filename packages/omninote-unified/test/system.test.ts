/**
 * 向量檢索 Top-K + 池化統計 + 稽核封印 + 結構共享正確性
 */
import test from "node:test";
import assert from "node:assert/strict";
import { SemanticVectorStore } from "../src/vector-store.js";
import { EvidenceAuditBundleExporter } from "../src/audit-exporter.js";
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";
import { sealWithStructuralSharing, Float32ArrayPool } from "../src/perf.js";
import type { UnifiedNode } from "../src/core-types.js";

test("SemanticVectorStore Top-K：餘弦相似度（歸一化點積）檢索與門檻過濾", () => {
  const store = new SemanticVectorStore();
  const dim = 8;
  const axis = (i: number) => Array.from({ length: dim }, (_, j) => (j === i ? 1 : 0));
  store.registerVector("node-a", "block-a", axis(0));
  store.registerVector("node-b", "block-b", axis(1));
  store.registerVector("node-c", "block-c", axis(0));
  const hits = store.queryTopK(axis(0), 5, 0.72);
  assert.equal(hits.length, 2);
  assert.equal(hits[0]?.score, 1);
  const none = store.queryTopK(Array(dim).fill(1).map((v) => v / Math.SQRT2), 5, 0.9);
  assert.equal(none.length, 0);
});

test("Float32ArrayPool：租借歸還復用統計正確", () => {
  const pool = new Float32ArrayPool(4, 0); // 零預分配：首兩次必然新配置（rented），歸還後第三次必復用（reused）
  const a = pool.acquire();
  const b = pool.acquire();
  pool.release(a);
  const c = pool.acquire(); // 應復用 a
  assert.equal(c, a);
  assert.equal(pool.reused, 1);
  assert.equal(pool.rented, 2);
  assert.notEqual(b, undefined);
});

test("5T 稽核封印：完整躍遷鏈後 manifest = PASSED；竄改後 = COMPROMISED", async () => {
  const alpha = await UnifiedMatrixEngine.spawnAlphaOrigin("audit chain", "o");
  const omega = await UnifiedMatrixEngine.crystallizeToOmegaObject(alpha as UnifiedNode, "standard", { iso: "14064" });
  const passed = await EvidenceAuditBundleExporter.generateProofManifest(omega as UnifiedNode);
  assert.equal(passed.verification_status, "PASSED");
  assert.equal(passed.evidence_chain.length, 2);
  assert.ok(Object.isFrozen(passed));

  const tamperedNode: UnifiedNode = { ...(omega as UnifiedNode), properties: { iso: "14064-TAMPERED" } };
  const failed = await EvidenceAuditBundleExporter.generateProofManifest(tamperedNode);
  assert.equal(failed.verification_status, "COMPROMISED");
});

test("結構共享封印：未變動子樹零拷貝共享（引用相等）", async () => {
  const alpha = await UnifiedMatrixEngine.spawnAlphaOrigin("structural sharing", "o");
  const omega = await UnifiedMatrixEngine.crystallizeToOmegaObject(alpha as UnifiedNode, "project", { status: "active" });
  assert.equal((omega as UnifiedNode).blocks, (alpha as UnifiedNode).blocks);
  assert.equal((omega as UnifiedNode).topology, (alpha as UnifiedNode).topology);
  assert.equal((omega as UnifiedNode).evidence[0], (alpha as UnifiedNode).evidence[0]);
  assert.equal((omega as UnifiedNode).properties.status, "active");
});

test("sealWithStructuralSharing：已凍結且未變動 → 原樣共享；巢狀新建分支全凍結", () => {
  const frozenInner = Object.freeze({ deep: Object.freeze([1, 2, 3]) });
  const source = Object.freeze({ a: frozenInner, b: { c: 1 } });
  const sealed = sealWithStructuralSharing(source);
  assert.equal(sealed.a, frozenInner, "未變動已凍結子樹必須引用共享");
  assert.ok(Object.isFrozen(sealed.b));
});
