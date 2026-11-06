import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UnifiedMatrixEngine, sha256, computeNodeLockHash } from "../src/matrix-engine.js";
import { OmniNoteLocalApiServer } from "../src/api-server.js";
import type { CRDTBlock, UnifiedNode } from "../src/core-types.js";

const UUID_A = "0d9b7c1e-4a2b-4c8e-9f1d-3b6a5c7e9a11";
const BID1 = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const BID2 = "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e";
const BID3 = "3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f";
const UUID_B = "5e4a3c2d-1b0f-4d9e-8a7c-6f5e4d3c2b19";
const UUID_UNKNOWN = "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d";

function makeBlock(id: string, content: string, lamportTs = 1): CRDTBlock {
  return { block_id: id, type: "paragraph", content, lamport_ts: lamportTs, peer_id: "peer-local", deleted: false };
}

async function makeNode(blocks: CRDTBlock[], outlinks: UnifiedNode["topology"]["outlinks"] = []): Promise<UnifiedNode> {
  const node: UnifiedNode = {
    uuid: UUID_A,
    version: "1.0.0",
    timestamp: 1,
    matrix_phase: "ALPHA_ORIGIN_CAPTURE",
    entity_type: "note.ephemeral",
    blocks,
    topology: { outlinks, tags: ["#inbox"] },
    properties: {},
    evidence: [
      { source_origin: "test", captured_at: new Date(0).toISOString(), content_hash: await sha256("x"), hook_lifecycle: "ON_ALPHA_CAPTURE", audit_formula: "SHA-256(rawText)" },
    ],
    lock_hash: "0".repeat(64),
  };
  node.lock_hash = await computeNodeLockHash(node);
  return node;
}

test("BLOCK-1 deriveOutlinks：UUID 標的收錄與 resolved 判定、非 UUID 別名排除、墓碑區塊排除、去重", () => {
  const blocks = [
    makeBlock(BID1, `參照 [[${UUID_B}|別名甲]] 與 [[${UUID_UNKNOWN}]]`),
    makeBlock(BID2, `再提 [[${UUID_B}]] 與 [[某文字標的]]`),
    { ...makeBlock(BID3, `墓碑內 [[${UUID_B}]]`), deleted: true },
  ];
  const out = UnifiedMatrixEngine.deriveOutlinks(blocks, new Set([UUID_B]));
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { target_uuid: UUID_B, wikilink_alias: "別名甲", resolved: true });
  assert.deepEqual(out[1], { target_uuid: UUID_UNKNOWN, wikilink_alias: "", resolved: false });
});

test("BLOCK-2 editBlock：內容置換、Lamport 遞增、outlinks 熔合重建、證據鏈 ON_BLOCK_EDIT、lock_hash 重算", async () => {
  const node = await makeNode([makeBlock(BID1, "舊內容")]);
  const next = await UnifiedMatrixEngine.editBlock(node, BID1, `新內容 [[${UUID_B}]]`, new Set([UUID_B]));
  assert.equal(next.blocks[0]!.content, `新內容 [[${UUID_B}]]`);
  assert.equal(next.blocks[0]!.lamport_ts, 2);
  assert.equal(next.blocks[0]!.deleted, false);
  assert.equal(next.topology.outlinks.length, 1);
  assert.equal(next.topology.outlinks[0]!.resolved, true);
  assert.equal(next.evidence[next.evidence.length - 1]!.hook_lifecycle, "ON_BLOCK_EDIT");
  assert.equal(next.version, "1.0.1");
  assert.notEqual(next.lock_hash, node.lock_hash);
});

test("BLOCK-3 softDeleteBlock：CRDT tombstone 保留原文、outlinks 排除墓碑貢獻、重刪與重編輯皆拒絕", async () => {
  const node = await makeNode([makeBlock(BID1, `內文 [[${UUID_B}]]`), makeBlock(BID2, "無鏈結")]);
  const next = await UnifiedMatrixEngine.softDeleteBlock(node, BID1, new Set([UUID_B]));
  assert.equal(next.blocks[0]!.deleted, true);
  assert.equal(next.blocks[0]!.content, `內文 [[${UUID_B}]]`);
  assert.equal(next.blocks[0]!.block_id, BID1);
  assert.equal(next.topology.outlinks.length, 0);
  assert.equal(next.evidence[next.evidence.length - 1]!.hook_lifecycle, "ON_BLOCK_TOMBSTONE");
  await assert.rejects(() => UnifiedMatrixEngine.softDeleteBlock(next, BID1, new Set()), /BLOCK_TOMBSTONED/);
  await assert.rejects(() => UnifiedMatrixEngine.editBlock(next, BID1, "復活", new Set()), /BLOCK_TOMBSTONED/);
  await assert.rejects(() => UnifiedMatrixEngine.editBlock(node, "0d9b7c1e-4a2b-4c8e-9f1d-3b6a5c7e9a99", "x", new Set()), /BLOCK_NOT_FOUND/);
});

interface TestCtx {
  server: OmniNoteLocalApiServer;
  port: number;
  rootDir: string;
}

async function withServer(fn: (ctx: TestCtx) => Promise<void>): Promise<void> {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-blockops-"));
  const server = new OmniNoteLocalApiServer({ rootDir, port: 0 });
  const addr = await server.listen();
  try {
    await fn({ server, port: addr.port, rootDir });
  } finally {
    await server.close();
    await rm(rootDir, { recursive: true, force: true });
  }
}

function base(port: number): string {
  return "http://127.0.0.1:" + String(port);
}

test("BLOCK-4 API：捕獲時熔合產生 outlinks、PATCH 區塊編輯、DELETE 軟刪除與墓碑 404", async () => {
  await withServer(async ({ port }) => {
    // 建立標的筆記 B
    const resB = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "標的筆記 B" }),
    });
    assert.equal(resB.status, 201);
    const bodyB = (await resB.json()) as { node: UnifiedNode };
    const uuidB = bodyB.node.uuid;
    // 捕獲 A，內含 [[uuidB]] → 熔合產生 resolved outlink
    const resA = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `來源筆記，指向 [[${uuidB}]]` }),
    });
    const bodyA = (await resA.json()) as { node: UnifiedNode };
    const nodeA = bodyA.node;
    assert.equal(nodeA.topology.outlinks.length, 1);
    assert.equal(nodeA.topology.outlinks[0]!.target_uuid, uuidB);
    assert.equal(nodeA.topology.outlinks[0]!.resolved, true);
    const blockId = nodeA.blocks[0]!.block_id;
    // PATCH 區塊編輯
    const resPatch = await fetch(`${base(port)}/api/notes/${nodeA.uuid}/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `編輯後內容，仍指向 [[${uuidB}]]` }),
    });
    assert.equal(resPatch.status, 200);
    const patched = ((await resPatch.json()) as { node: UnifiedNode }).node;
    assert.equal(patched.blocks[0]!.content, `編輯後內容，仍指向 [[${uuidB}]]`);
    assert.equal(patched.blocks[0]!.lamport_ts, 2);
    assert.equal(patched.topology.outlinks[0]!.resolved, true);
    // 缺 content → 422；不存在區塊 → 404
    const res422 = await fetch(`${base(port)}/api/notes/${nodeA.uuid}/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res422.status, 422);
    const res404 = await fetch(`${base(port)}/api/notes/${nodeA.uuid}/blocks/0d9b7c1e-4a2b-4c8e-9f1d-3b6a5c7e9a99`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "x" }),
    });
    assert.equal(res404.status, 404);
    // DELETE 軟刪除（tombstone）
    const resDel = await fetch(`${base(port)}/api/notes/${nodeA.uuid}/blocks/${blockId}`, { method: "DELETE" });
    assert.equal(resDel.status, 200);
    const tombstoned = ((await resDel.json()) as { node: UnifiedNode }).node;
    assert.equal(tombstoned.blocks[0]!.deleted, true);
    assert.equal(tombstoned.topology.outlinks.length, 0);
    // 重刪墓碑 → 404 BLOCK_TOMBSTONED
    const resReDel = await fetch(`${base(port)}/api/notes/${nodeA.uuid}/blocks/${blockId}`, { method: "DELETE" });
    assert.equal(resReDel.status, 404);
    assert.equal(((await resReDel.json()) as { error: string }).error, "BLOCK_TOMBSTONED");
    // 落地持久化驗證：重讀節點墓碑仍在
    const resRead = await fetch(`${base(port)}/api/notes/${nodeA.uuid}`);
    const reread = ((await resRead.json()) as { node: UnifiedNode }).node;
    assert.equal(reread.blocks[0]!.deleted, true);
  });
});

test("BLOCK-5 API：追加區塊觸發 outlinks 熔合更新", async () => {
  await withServer(async ({ port }) => {
    const resB = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "標的筆記" }),
    });
    const uuidB = ((await resB.json()) as { node: UnifiedNode }).node.uuid;
    const resA = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "來源筆記" }),
    });
    const uuidA = ((await resA.json()) as { node: UnifiedNode }).node.uuid;
    assert.equal(((await (await fetch(`${base(port)}/api/notes/${uuidA}`)).json()) as { node: UnifiedNode }).node.topology.outlinks.length, 0);
    const resAppend = await fetch(`${base(port)}/api/notes/${uuidA}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "paragraph", content: `補充指向 [[${uuidB}]]` }),
    });
    assert.equal(resAppend.status, 200);
    const appended = ((await resAppend.json()) as { node: UnifiedNode }).node;
    assert.equal(appended.topology.outlinks.length, 1);
    assert.equal(appended.topology.outlinks[0]!.target_uuid, uuidB);
    assert.equal(appended.topology.outlinks[0]!.resolved, true);
  });
});
