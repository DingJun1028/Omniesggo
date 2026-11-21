/**
 * Markdown 同態編解碼器 Round-Trip + 竄改偵測 + 磁碟雙寫（NodeFileSystemDriver）
 */
import test from "node:test";
import assert from "node:assert/strict";
import { rm, mkdir } from "node:fs/promises";
import { LocalMarkdownHomomorphicCodec } from "../src/codec.js";
import { UnifiedMatrixEngine, computeNodeLockHash } from "../src/matrix-engine.js";
import { NodeFileSystemDriver } from "../src/storage-adapter.js";
import type { UnifiedNode } from "../src/core-types.js";

test("serialize → deserialize Round-Trip：雜湊一致、零資訊損失、無竄改", async () => {
  const alpha = await UnifiedMatrixEngine.spawnAlphaOrigin("外勤速記：ESG 標案準備\n\n需要對照 [[企業永續]] 與 [[系統架構]]", "voice/2026-11-03");
  const link = async (name: string) => ({
    target_uuid: await LocalMarkdownHomomorphicCodec.resolveTargetUuid(name),
    wikilink_alias: name,
    resolved: true,
  });
  const sigma = await UnifiedMatrixEngine.transitionToSigmaGraph(alpha as UnifiedNode, [await link("企業永續"), await link("系統架構")], "# ESG 標案準備\n\n對照 [[企業永續]] 與 [[系統架構]]。");
  const omega = await UnifiedMatrixEngine.crystallizeToOmegaObject(sigma as UnifiedNode, "project", { status: "active", deadline: "2026-12-31" });

  const artifact = await LocalMarkdownHomomorphicCodec.serialize(omega);
  assert.ok(artifact.markdownFileContent.startsWith("---\n"));
  assert.ok(artifact.markdownFileContent.includes('"entity_type": "project"'));

  const { node, tampered, lockFromDisk } = await LocalMarkdownHomomorphicCodec.deserialize(artifact.markdownFileContent);
  assert.equal(tampered, false, "Round-Trip 不得誤報竄改");
  assert.equal(lockFromDisk, node.lock_hash);
  assert.equal(node.uuid, omega.uuid);
  assert.equal(node.entity_type, "project");
  assert.equal(node.matrix_phase, "OMEGA_OBJECT_CRYSTAL");
  assert.equal(node.properties.status, "active");
  assert.equal(node.blocks.length, 1);
  assert.equal(node.blocks[0]?.block_id, omega.blocks[0]?.block_id);
  assert.equal(node.topology.outlinks.length, 2);
});

test("竄改偵測：磁碟 frontmatter lock_hash 遭改動 → tampered = true", async () => {
  const node = await UnifiedMatrixEngine.spawnAlphaOrigin("機敏內容", "manual");
  const artifact = await LocalMarkdownHomomorphicCodec.serialize(node);
  const forged = artifact.markdownFileContent.replace(node.lock_hash, "f".repeat(64));
  const { tampered } = await LocalMarkdownHomomorphicCodec.deserialize(forged);
  assert.equal(tampered, true, "竄改後必須被偵測");
});

test("NodeFileSystemDriver 真實磁碟雙寫：.md + attachments/.svg", async () => {
  const root = "/tmp/omninote-fs-driver-test";
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  const driver = new NodeFileSystemDriver(root);

  const node = await UnifiedMatrixEngine.spawnAlphaOrigin("磁碟落地測試", "test");
  const sketchNode: UnifiedNode = JSON.parse(JSON.stringify(node)) as UnifiedNode;
  sketchNode.blocks.push({
    block_id: "11111111-2222-4333-8444-555555555555",
    type: "sketch_vector",
    content: "M10 10 L 40 40",
    lamport_ts: 1,
    peer_id: "peer-local",
    deleted: false,
  });
  sketchNode.lock_hash = await computeNodeLockHash(sketchNode);

  await driver.write(sketchNode);
  const readBack = await driver.read(sketchNode.uuid);
  assert.ok(readBack, "寫入後必須可讀回");
  assert.equal(readBack!.uuid, sketchNode.uuid);
  assert.ok(readBack!.blocks.some((b) => b.type === "sketch_vector"), "手繪向量區塊須保留");
  assert.deepEqual(await driver.listUuids(), [sketchNode.uuid]);
  await driver.delete(sketchNode.uuid);
  assert.equal(await driver.read(sketchNode.uuid), null);
  await rm(root, { recursive: true, force: true });
});
