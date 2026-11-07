/**
 * 效能基準（對症「sealNode 全量凍結 GC 壓力」隱患分析）：
 * A. naive 全量深凍結 vs sealWithStructuralSharing
 * B. Float32Array 記憶體池化 vs 每次新配置（向量重嵌入高頻場景）。
 * 註記：開發機數據為相對比較用途；正式數據以 CI runner 為準。
 */
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";
import { sealWithStructuralSharing, Float32ArrayPool } from "../src/perf.js";
import type { UnifiedNode } from "../src/core-types.js";

function naiveDeepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object") return value;
  Object.freeze(value as object);
  for (const k of Object.getOwnPropertyNames(value as object)) {
    naiveDeepFreeze((value as Record<string, unknown>)[k]);
  }
  return value;
}

async function buildLargeFrozenNode(): Promise<Readonly<UnifiedNode>> {
  let node: UnifiedNode = (await UnifiedMatrixEngine.spawnAlphaOrigin("bench seed", "bench")) as UnifiedNode;
  for (let i = 0; i < 199; i++) {
    node = {
      ...node,
      blocks: [
        ...node.blocks,
        { block_id: crypto.randomUUID(), type: "paragraph", content: `block content #${i} `.repeat(20), lamport_ts: i + 2, peer_id: "peer-a", deleted: false },
      ],
    } as UnifiedNode;
  }
  node = {
    ...node,
    properties: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`prop_${i}`, { v: i, tags: ["a", "b"] }])),
  } as UnifiedNode;
  return sealWithStructuralSharing(node) as Readonly<UnifiedNode>;
}

async function benchSeal(): Promise<{ naiveMs: number; sharedMs: number }> {
  const frozen = await buildLargeFrozenNode();
  const ITER = 2000;
  let t0 = performance.now();
  for (let i = 0; i < ITER; i++) {
    const successor = { ...(frozen as UnifiedNode), timestamp: Date.now() };
    naiveDeepFreeze(successor);
  }
  const naiveMs = performance.now() - t0;

  t0 = performance.now();
  for (let i = 0; i < ITER; i++) {
    const successor = { ...(frozen as UnifiedNode), timestamp: Date.now() };
    sealWithStructuralSharing(successor);
  }
  const sharedMs = performance.now() - t0;
  return { naiveMs, sharedMs };
}

function benchVector(): { unpooledAllocMs: number; pooledAllocMs: number; reused: number } {
  const dim = 768;
  const N = 20000;
  let t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const buf = new Float32Array(dim);
    buf[0] = i;
  }
  const unpooledAllocMs = performance.now() - t0;

  const pool = new Float32ArrayPool(dim, 256);
  t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const buf = pool.acquire();
    buf[0] = i;
    pool.release(buf);
  }
  const pooledAllocMs = performance.now() - t0;
  return { unpooledAllocMs, pooledAllocMs, reused: pool.reused };
}

async function main(): Promise<void> {
  const { naiveMs, sharedMs } = await benchSeal();
  const { unpooledAllocMs, pooledAllocMs, reused } = benchVector();
  console.log("=== A. 封印效能：已凍結 200 區塊大節點 × 2000 次後繼封印 ===");
  console.log("naive 全量深凍結          : %s ms", naiveMs.toFixed(1));
  console.log("sealWithStructuralSharing : %s ms", sharedMs.toFixed(1));
  console.log("加速比                    : %s x", (naiveMs / sharedMs).toFixed(2));
  console.log("=== B. Float32Array 配置：768 維 × %d 次租借 ===", 20000);
  console.log("未池化（每次 new）         : %s ms", unpooledAllocMs.toFixed(1));
  console.log("池化承租-歸還             : %s ms（池內復用 %d 次，零新增配置於穩態）", pooledAllocMs.toFixed(1), reused);
}

await main();
