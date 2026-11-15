import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { DraftStore, DraftAutoSaver } from "../src/draft-store.js";
import { OmniStorageAdapter, NodeFileSystemDriver } from "../src/storage-adapter.js";
import { OmniNoteLocalApiServer } from "../src/api-server.js";

test("DRAFT-1 冪等 upsert：重複儲存覆寫且 revision 遞增", async () => {
  const dir = await mkdtemp(join(tmpdir(), "omninote-draft-"));
  try {
    const store = new DraftStore(dir);
    const first = await store.save("cli-idea", { content: "第一版進度" });
    assert.equal(first.revision, 1);
    assert.equal(first.origin_tag, "draft.autosave");
    const second = await store.save("cli-idea", { content: "第二版進度", tags: ["#draft", "#idea"] });
    assert.equal(second.revision, 2);
    assert.equal(second.content, "第二版進度");
    assert.deepEqual(second.tags, ["#draft", "#idea"]);
    assert.equal(second.created_at, first.created_at);

    const fetched = await store.get("cli-idea");
    assert.ok(fetched !== null);
    assert.equal(fetched!.content, "第二版進度");
    const listed = await store.list();
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.draft_id, "cli-idea");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DRAFT-2 draft_id 道閘：非法識別子即刻拒絕", async () => {
  const store = new DraftStore(".");
  await assert.rejects(() => store.save("bad id with space", { content: "x" }), /draft_id/);
  await assert.rejects(() => store.save("../path-traversal", { content: "x" }), /draft_id/);
  await assert.rejects(() => store.save("", { content: "x" }), /draft_id/);
});

test("DRAFT-3 刪除草稿後 get 回 null", async () => {
  const dir = await mkdtemp(join(tmpdir(), "omninote-draft-"));
  try {
    const store = new DraftStore(dir);
    await store.save("temp-note", { content: "拋棄式草稿" });
    assert.equal(await store.delete("temp-note"), true);
    assert.equal(await store.get("temp-note"), null);
    assert.equal(await store.delete("temp-note"), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DRAFT-4 晉升：草稿轉 ALPHA 正規節點且草稿移除", async () => {
  const dir = await mkdtemp(join(tmpdir(), "omninote-draft-"));
  try {
    const store = new DraftStore(dir);
    const storage = new OmniStorageAdapter(new NodeFileSystemDriver(dir));
    await store.save("to-promote", { content: "即將晉升之進度", origin_tag: "draft.promote", tags: ["#promoted"] });
    const node = await store.promote("to-promote", storage);
    assert.ok(node !== null);
    assert.equal(node.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.equal(node.blocks[0]!.content, "即將晉升之進度");
    assert.deepEqual(node.topology.tags, ["#promoted"]);
    const persisted = await storage.read(node.uuid);
    assert.ok(persisted !== null);
    assert.equal(persisted!.evidence[0]!.source_origin, "draft.promote");
    assert.equal(await store.get("to-promote"), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DRAFT-5 晉升不存在之草稿回 null", async () => {
  const dir = await mkdtemp(join(tmpdir(), "omninote-draft-"));
  try {
    const store = new DraftStore(dir);
    const storage = new OmniStorageAdapter(new NodeFileSystemDriver(dir));
    assert.equal(await store.promote("ghost", storage), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DRAFT-6 防抖自動存：touch 後閒置才落盤、flush 立即落盤", async () => {
  const dir = await mkdtemp(join(tmpdir(), "omninote-draft-"));
  try {
    const store = new DraftStore(dir);
    const saver = new DraftAutoSaver(store, 20);
    saver.touch("autosave-1", { content: "進度 A" });
    assert.equal(saver.pendingIds.length, 1);
    assert.equal(await store.get("autosave-1"), null); // 防抖期間未落盤
    await sleep(60);
    assert.equal(saver.pendingIds.length, 0);
    const persisted = await store.get("autosave-1");
    assert.ok(persisted !== null);
    assert.equal(persisted!.content, "進度 A");

    saver.touch("autosave-2", { content: "進度 B" });
    saver.touch("autosave-2", { content: "進度 B2" }); // 高頻覆寫僅一次落盤
    await saver.flush();
    const b = await store.get("autosave-2");
    assert.ok(b !== null);
    assert.equal(b!.content, "進度 B2");
    assert.equal(b!.revision, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DRAFT-7 API 草稿端點：隨時存、列表、讀取、晉升、刪除", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-api3-"));
  const server = new OmniNoteLocalApiServer({ rootDir, port: 0 });
  const addr = await server.listen();
  try {
    const base = "http://127.0.0.1:" + String(addr.port);
    const save1 = await fetch(base + "/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: "bot-progress", content: "機器人第一段" }),
    });
    assert.equal(save1.status, 200);
    const rec1 = (await save1.json()) as { draft: { revision: number } };
    assert.equal(rec1.draft.revision, 1);
    const save2 = await fetch(base + "/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: "bot-progress", content: "機器人第二段" }),
    });
    const rec2 = (await save2.json()) as { draft: { revision: number; content: string } };
    assert.equal(rec2.draft.revision, 2);

    const badId = await fetch(base + "/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: "bad id", content: "x" }),
    });
    assert.equal(badId.status, 422);

    const list = await fetch(base + "/api/drafts");
    const listBody = (await list.json()) as { drafts: { draft_id: string }[] };
    assert.equal(listBody.drafts.length, 1);

    const promote = await fetch(base + "/api/drafts/bot-progress/promote", { method: "POST" });
    assert.equal(promote.status, 201);
    const promoted = (await promote.json()) as { node: { uuid: string; blocks: { content: string }[] } };
    assert.equal(promoted.node.blocks[0]!.content, "機器人第二段");

    const note = await fetch(base + "/api/notes/" + promoted.node.uuid);
    assert.equal(note.status, 200);

    const gone = await fetch(base + "/api/drafts/bot-progress");
    assert.equal(gone.status, 404);

    const del = await fetch(base + "/api/drafts/never-exist", { method: "DELETE" });
    assert.equal(del.status, 404);
  } finally {
    await server.close();
    await rm(rootDir, { recursive: true, force: true });
  }
});
