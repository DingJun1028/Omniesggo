import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";
import { OmniStorageAdapter, NodeFileSystemDriver } from "../src/storage-adapter.js";
import { OmniNoteLocalApiServer } from "../src/api-server.js";
import {
  exportNotesArchive,
  serializeArchive,
  parseArchive,
  importNotesArchive,
} from "../src/import-export.js";

async function withStorage(fn: (storage: OmniStorageAdapter, dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "omninote-ie-"));
  const storage = new OmniStorageAdapter(new NodeFileSystemDriver(dir));
  try {
    await fn(storage, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("IE-1 匯出與解析 Round-Trip：格式標頭、節點數、lock_hash 全數一致", async () => {
  await withStorage(async () => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("第一則", "test");
    const b = await UnifiedMatrixEngine.spawnAlphaOrigin("第二則", "test");
    const archive = await exportNotesArchive([a, b]);
    assert.equal(archive.format, "omninote-archive");
    assert.equal(archive.format_version, "1.0.0");
    assert.equal(archive.nodes.length, 2);
    const parsed = parseArchive(serializeArchive(archive));
    assert.equal(parsed.nodes.length, 2);
    assert.deepEqual(parsed.nodes.map((n) => n.uuid).sort(), [a.uuid, b.uuid].sort());
    for (const n of parsed.nodes) assert.match(n.lock_hash, /^[a-f0-9]{64}$/);
  });
});

test("IE-2 匯出稽核：lock_hash 遭竄改之節點即刻拒絕匯出", async () => {
  await withStorage(async () => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("正規節點", "test");
    const tamperedNode = JSON.parse(JSON.stringify(a)) as typeof a;
    tamperedNode.lock_hash = "0".repeat(64);
    await assert.rejects(() => exportNotesArchive([a, tamperedNode]), /lock_hash 驗算不符/);
  });
});

test("IE-3 匯入空儲存庫：全數落地並可讀回", async () => {
  await withStorage(async (storage) => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("匯入內容", "test");
    const archive = await exportNotesArchive([a]);
    const report = await importNotesArchive(storage, archive);
    assert.equal(report.imported, 1);
    assert.equal(report.tampered, 0);
    const restored = await storage.read(a.uuid);
    assert.ok(restored !== null);
    assert.equal(restored.blocks[0]!.content, "匯入內容");
  });
});

test("IE-4 衝突策略 skip：相同 lock_hash 與相異版本皆不覆寫", async () => {
  await withStorage(async (storage) => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("原始", "test");
    await storage.write(a);
    const evolved = await UnifiedMatrixEngine.crystallizeToOmegaObject(a, "note.book", { title: "演化" });
    await storage.write(evolved);
    const archive = await exportNotesArchive([a]);
    const identical = await importNotesArchive(storage, archive);
    assert.equal(identical.skipped, 1);
    assert.equal(identical.imported, 0);
    const fresh = await UnifiedMatrixEngine.spawnAlphaOrigin("第三則", "test");
    await storage.write(fresh);
    const archive2 = await exportNotesArchive([a, fresh]);
    const report = await importNotesArchive(storage, archive2, { conflict: "skip" });
    assert.equal(report.skipped, 2);
    const onDisk = await storage.read(a.uuid);
    assert.equal(onDisk!.matrix_phase, "OMEGA_OBJECT_CRYSTAL");
  });
});

test("IE-5 衝突策略 overwrite：相異版本覆寫回歸檔版本", async () => {
  await withStorage(async (storage) => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("原始", "test");
    await storage.write(a);
    const archive = await exportNotesArchive([a]);
    const evolved = await UnifiedMatrixEngine.crystallizeToOmegaObject(a, "note.book", { title: "演化" });
    await storage.write(evolved);
    const report = await importNotesArchive(storage, archive, { conflict: "overwrite" });
    assert.equal(report.overwritten, 1);
    const onDisk = await storage.read(a.uuid);
    assert.equal(onDisk!.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.equal(onDisk!.entity_type, "note.ephemeral");
  });
});

test("IE-6 匯入稽核：竄改節點計入 tampered 且不落地", async () => {
  await withStorage(async (storage) => {
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("正規", "test");
    const tamperedNode = JSON.parse(JSON.stringify(a)) as typeof a;
    tamperedNode.lock_hash = "0".repeat(64);
    const archive = parseArchive(serializeArchive({ format: "omninote-archive", format_version: "1.0.0", exported_at: "", nodes: [a, tamperedNode] }));
    const report = await importNotesArchive(storage, archive);
    assert.equal(report.imported, 1);
    assert.equal(report.tampered, 1);
    // 竄改節點與正規節點同 uuid：竄改版本不得落地，磁碟應保留正規節點（lock_hash 與 a 一致）。
    const onDiskAfterTamper = await storage.read(tamperedNode.uuid);
    assert.notEqual(onDiskAfterTamper, null);
    assert.equal(onDiskAfterTamper!.lock_hash, a.lock_hash);
    assert.notEqual(onDiskAfterTamper!.lock_hash, tamperedNode.lock_hash);
  });
});

test("IE-7 解析道閘：非 JSON、缺標頭、契約不符皆即刻拋出", async () => {
  assert.throws(() => parseArchive("not-json"), /非 JSON/);
  assert.throws(() => parseArchive("{}"), /缺少 format/);
  assert.throws(() => parseArchive(JSON.stringify({ format: "omninote-archive", format_version: "1.0.0" })), /缺少 nodes/);
  const bad = parseArchive;
  const malformed = JSON.stringify({ format: "omninote-archive", format_version: "1.0.0", nodes: [{ uuid: "not-a-uuid" }] });
  assert.throws(() => bad(malformed), /UnifiedNode 契約/);
});

test("IE-8 API 匯出匯入：/api/export 全量封存、/api/import 復原已刪節點", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-api2-"));
  const server = new OmniNoteLocalApiServer({ rootDir, port: 0 });
  const addr = await server.listen();
  try {
    const base = "http://127.0.0.1:" + String(addr.port);
    for (const text of ["筆記一", "筆記二"]) {
      const res = await fetch(base + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      assert.equal(res.status, 201);
    }
    const exportRes = await fetch(base + "/api/export");
    assert.equal(exportRes.status, 200);
    assert.match(exportRes.headers.get("content-disposition") ?? "", /attachment/);
    const archiveJson = await exportRes.text();
    const archive = parseArchive(archiveJson);
    assert.equal(archive.nodes.length, 2);
    const firstUuid = archive.nodes[0]!.uuid;
    const del = await fetch(base + "/api/notes/" + firstUuid, { method: "DELETE" });
    assert.equal(del.status, 200);

    const importRes = await fetch(base + "/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: archiveJson,
    });
    assert.equal(importRes.status, 200);
    const report = (await importRes.json()) as { ok: boolean; report: { imported: number; skipped: number; tampered: number } };
    assert.ok(report.ok);
    assert.equal(report.report.imported, 1);
    assert.equal(report.report.skipped, 1);
    assert.equal(report.report.tampered, 0);

    const restored = await fetch(base + "/api/notes/" + firstUuid);
    assert.equal(restored.status, 200);

    const badImport = await fetch(base + "/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    assert.equal(badImport.status, 422);
  } finally {
    await server.close();
    await rm(rootDir, { recursive: true, force: true });
  }
});
