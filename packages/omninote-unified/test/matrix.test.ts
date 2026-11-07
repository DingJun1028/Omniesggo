/**
 * 三態躍遷鏈 + CRDT LWW + SyncDelta + 熵減 — 全鏈路契約測試
 */
import test from "node:test";
import assert from "node:assert/strict";
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";
import { LocalMarkdownHomomorphicCodec } from "../src/codec.js";
import type { CRDTBlock, UnifiedNode } from "../src/core-types.js";

const mkBlock = (id: string, ts: number, peer: string, content = "x"): CRDTBlock => ({
  block_id: id,
  type: "paragraph",
  content,
  lamport_ts: ts,
  peer_id: peer,
  deleted: false,
});

test("ALPHA → SIGMA → OMEGA → REVERSE 全鏈躍遷與封印不可變性", async () => {
  const alpha = await UnifiedMatrixEngine.spawnAlphaOrigin("第一現場速記", "voice/2026-11-03");
  assert.equal(alpha.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
  assert.equal(alpha.version, "1.0.0");
  assert.equal(alpha.topology.tags[0], "#inbox");
  assert.ok(Object.isFrozen(alpha));

  const link = { target_uuid: await LocalMarkdownHomomorphicCodec.resolveTargetUuid("企業永續"), wikilink_alias: "企業永續", resolved: true };
  const sigma = await UnifiedMatrixEngine.transitionToSigmaGraph(alpha as UnifiedNode, [link], "# 合併後長文\n\n[[企業永續]] 雙鏈熔煉");
  assert.equal(sigma.matrix_phase, "SIGMA_GRAPH_SYNTHESIS");
  assert.equal(sigma.version, "1.1.0");
  assert.equal(sigma.evidence.length, 2);

  const omega = await UnifiedMatrixEngine.crystallizeToOmegaObject(sigma as UnifiedNode, "project", { status: "active", owner: "DingJun" });
  assert.equal(omega.matrix_phase, "OMEGA_OBJECT_CRYSTAL");
  assert.equal(omega.entity_type, "project");
  assert.equal(omega.version, "2.0.0");
  assert.equal(omega.properties.owner, "DingJun");

  const reversed = await UnifiedMatrixEngine.projectReverseToCapture(omega as UnifiedNode);
  assert.equal(reversed.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
  assert.equal(reversed.evidence.length, 4);
  assert.ok(Object.isFrozen(reversed));

  const hooks = [...reversed.evidence].map((e) => e.hook_lifecycle);
  assert.deepEqual(hooks, ["ON_ALPHA_CAPTURE", "ON_SIGMA_SYNTHESIS", "ON_OMEGA_CRYSTALLIZE", "ON_REVERSE_PROJECT"]);
});

test("Block-Level LWW-Element-Set：Lamport 優先、同值比 peer_id、deleted 過濾", () => {
  const local = [mkBlock("b1", 3, "peer-a", "old"), mkBlock("b2", 1, "peer-a"), mkBlock("b3", 1, "peer-a")];
  const remote = [mkBlock("b1", 5, "peer-b", "new"), mkBlock("b2", 1, "peer-z"), mkBlock("b3", 1, "peer-b", "del")];
  remote[2]!.deleted = true;
  const merged = UnifiedMatrixEngine.mergeCRDTBlocks(local, remote);
  const b1 = merged.find((b) => b.block_id === "b1");
  const b2 = merged.find((b) => b.block_id === "b2");
  assert.equal(b1?.content, "new");
  assert.equal(b2?.peer_id, "peer-z");
  assert.equal(merged.find((b) => b.block_id === "b3"), undefined);
});

test("SyncDeltaPacket 未過契約即刻拒絕（零幻覺道閘）", async () => {
  const node = await UnifiedMatrixEngine.spawnAlphaOrigin("t", "o");
  const good = UnifiedMatrixEngine.generateSyncDelta(node as UnifiedNode, "SIGMA_GRAPH_SYNTHESIS", "FORWARD_PROMOTE", { "peer-a": 1 }, [{ op: "replace", path: "/blocks/0/content", value: "y" }]);
  assert.ok(Object.isFrozen(good));
  assert.throws(() =>
    UnifiedMatrixEngine.generateSyncDelta(node as UnifiedNode, "INVALID_PHASE" as never, "FORWARD_PROMOTE", { p: 1 }, [])
  );
});

test("熵減自癒：懸空死鏈標註與 entropy_score 計算", async () => {
  const node = await UnifiedMatrixEngine.spawnAlphaOrigin("entropy probe", "o");
  const links = [
    { target_uuid: "00000000-0000-4000-8000-000000000001", wikilink_alias: "存在", resolved: true },
    { target_uuid: "00000000-0000-4000-8000-000000000002", wikilink_alias: "死鏈", resolved: true },
  ];
  const sigma = await UnifiedMatrixEngine.transitionToSigmaGraph(node as UnifiedNode, links, "body");
  const purified = await UnifiedMatrixEngine.purifyAndReduceEntropy(sigma as UnifiedNode, new Set(["00000000-0000-4000-8000-000000000001"]));
  assert.equal(purified.topology.outlinks[1]?.resolved, false);
  assert.ok((purified.entropy_score ?? 0) > 0);
});
