import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OmniNoteLocalApiServer } from "../src/api-server.js";
import { NodeFileSystemDriver } from "../src/storage-adapter.js";
import { UnifiedMatrixEngine } from "../src/matrix-engine.js";

function rawRequest(
  port: number,
  opts: { method?: string; path: string; headers?: Record<string, string>; body?: string },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method: opts.method ?? "GET", path: opts.path, headers: opts.headers ?? {} },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

async function withServer(
  fn: (ctx: { port: number; rootDir: string }) => Promise<void>,
  options: { token?: string } = {},
): Promise<void> {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-sec-"));
  const server = new OmniNoteLocalApiServer({ rootDir, port: 0, ...options });
  const addr = await server.listen();
  try {
    await fn({ port: addr.port, rootDir });
  } finally {
    await server.close();
    await rm(rootDir, { recursive: true, force: true });
  }
}

test("SEC-1 token 未設定時仍拒絕非本機 Host（DNS rebinding 防線）", async () => {
  await withServer(async ({ port }) => {
    const evil = await rawRequest(port, { path: "/api/notes", headers: { Host: "evil.example.com" } });
    assert.equal(evil.status, 403);
    const ok = await rawRequest(port, { path: "/api/notes", headers: { Host: "127.0.0.1:" + port } });
    assert.equal(ok.status, 200);
    const localhost = await rawRequest(port, { path: "/api/notes", headers: { Host: "localhost:" + port } });
    assert.equal(localhost.status, 200);
  });
});

test("SEC-2 Origin 為外部網域時拒絕（即使 Host 是本機）", async () => {
  await withServer(async ({ port }) => {
    const res = await rawRequest(port, {
      path: "/api/notes",
      headers: { Host: "127.0.0.1:" + port, Origin: "http://evil.example.com" },
    });
    assert.equal(res.status, 403);
    const good = await rawRequest(port, {
      path: "/api/notes",
      headers: { Host: "127.0.0.1:" + port, Origin: "http://127.0.0.1:" + port },
    });
    assert.equal(good.status, 200);
  });
});

test("SEC-3 設定 token 後：缺/錯 token 為 401，正確 token為 200，且仍檢查 Host", async () => {
  await withServer(async ({ port }) => {
    const noAuth = await rawRequest(port, { path: "/api/notes", headers: { Host: "127.0.0.1:" + port } });
    assert.equal(noAuth.status, 401);
    const wrong = await rawRequest(port, {
      path: "/api/notes",
      headers: { Host: "127.0.0.1:" + port, Authorization: "Bearer wrong-token" },
    });
    assert.equal(wrong.status, 401);
    const ok = await rawRequest(port, {
      path: "/api/notes",
      headers: { Host: "127.0.0.1:" + port, Authorization: "Bearer secret-token" },
    });
    assert.equal(ok.status, 200);
    const evilHost = await rawRequest(port, {
      path: "/api/notes",
      headers: { Host: "evil.example.com", Authorization: "Bearer secret-token" },
    });
    assert.equal(evilHost.status, 403);
  }, { token: "secret-token" });
});

test("SEC-4 修改狀態的請求必須是 application/json（否則 415）", async () => {
  await withServer(async ({ port }) => {
    const h = { Host: "127.0.0.1:" + port };
    const bad = await rawRequest(port, {
      method: "POST",
      path: "/api/notes",
      headers: { ...h, "Content-Type": "text/plain" },
      body: "hello",
    });
    assert.equal(bad.status, 415);
    const good = await rawRequest(port, {
      method: "POST",
      path: "/api/notes",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "ok" }),
    });
    assert.equal(good.status, 201);
  });
});

test("SEC-5 notes 路由的 id 必須是完整 UUIDv4（否則 400）", async () => {
  await withServer(async ({ port }) => {
    const h = { Host: "127.0.0.1:" + port };
    for (const bad of ["not-a-uuid", "../../etc/passwd", "abc12345", "aaaaaaaa-aaaa-1aaa-8aaa-aaaaaaaaaaaa"]) {
      const res = await rawRequest(port, { path: "/api/notes/" + encodeURIComponent(bad), headers: h });
      assert.equal(res.status, 400, `id=${bad}`);
    }
  });
});

test("SEC-6 storage driver：非法 UUID 直接拒絕，read/delete 以完整 UUID 精確比對", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-driver-"));
  try {
    const driver = new NodeFileSystemDriver(rootDir);
    const a = await UnifiedMatrixEngine.spawnAlphaOrigin("note A", "test");
    const b = await UnifiedMatrixEngine.spawnAlphaOrigin("note B", "test");
    await driver.write(a);
    await driver.write(b);

    await assert.rejects(() => driver.read("../../etc/passwd"), /INVALID_UUID/);
    await assert.rejects(() => driver.delete("not-a-uuid"), /INVALID_UUID/);
    await assert.rejects(() => driver.write({ ...a, uuid: "bad" }), /INVALID_UUID/);

    const readA = await driver.read(a.uuid);
    assert.equal(readA?.uuid, a.uuid);
    await driver.delete(a.uuid);
    assert.equal(await driver.read(a.uuid), null);
    const readB = await driver.read(b.uuid);
    assert.equal(readB?.uuid, b.uuid);
    assert.deepEqual((await driver.listUuids()).sort(), [b.uuid]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
