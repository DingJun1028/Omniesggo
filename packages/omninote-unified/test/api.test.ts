import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OmniNoteLocalApiServer } from "../src/api-server.js";
import { ZeroComputeEmbedder } from "../src/ollama-embedder.js";

interface TestCtx {
  server: OmniNoteLocalApiServer;
  port: number;
  rootDir: string;
}

async function withServer(
  fn: (ctx: TestCtx) => Promise<void>,
  options: { token?: string; embedder?: ZeroComputeEmbedder } = {},
): Promise<void> {
  const rootDir = await mkdtemp(join(tmpdir(), "omninote-api-"));
  const server = new OmniNoteLocalApiServer({ rootDir, port: 0, ...options });
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

test("API-1 健康檢查與非回環位址建構即拒絕", async () => {
  assert.throws(() => new OmniNoteLocalApiServer({ rootDir: ".", host: "0.0.0.0" }));
  assert.throws(() => new OmniNoteLocalApiServer({ rootDir: ".", host: "example.com" }));
  await withServer(async ({ port }) => {
    const res = await fetch(base(port) + "/health");
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; nodes: number; vectors: number };
    assert.ok(body.ok);
    assert.equal(body.nodes, 0);
  });
});

test("API-2 捕獲筆記：正規管道落地並可讀回", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "機器人捕獲之測試筆記", origin_tag: "cli.capture", tags: ["#robot"] }),
    });
    assert.equal(create.status, 201);
    const created = (await create.json()) as { ok: boolean; node: { uuid: string; matrix_phase: string; topology: { tags: string[] } } };
    assert.ok(created.ok);
    assert.match(created.node.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(created.node.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.deepEqual(created.node.topology.tags, ["#robot"]);

    const read = await fetch(base(port) + "/api/notes/" + created.node.uuid);
    assert.equal(read.status, 200);
    const fetched = (await read.json()) as { node: { blocks: unknown[]; evidence: unknown[] } };
    assert.equal(fetched.node.blocks.length, 1);
    assert.ok(fetched.node.evidence.length >= 1);

    const listed = await fetch(base(port) + "/api/notes");
    const listBody = (await listed.json()) as { uuids: string[] };
    assert.equal(listBody.uuids.length, 1);
  });
});

test("API-3 追加區塊：證據鏈延伸且 lock_hash 重算", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "主段落" }),
    });
    const created = (await create.json()) as { node: { uuid: string; lock_hash: string } };
    const before = created.node.lock_hash;

    const append = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "heading", content: "API 追加之標題" }),
    });
    assert.equal(append.status, 200);
    const appended = (await append.json()) as { node: { blocks: { type: string }[]; lock_hash: string; evidence: { hook_lifecycle: string }[] } };
    assert.equal(appended.node.blocks.length, 2);
    assert.equal(appended.node.blocks[1]!.type, "heading");
    assert.match(appended.node.lock_hash, /^[a-f0-9]{64}$/);
    assert.notEqual(appended.node.lock_hash, before);
    assert.ok(appended.node.evidence.some((e) => e.hook_lifecycle === "ON_API_APPEND"));

    const badType = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "unknown_type", content: "x" }),
    });
    assert.equal(badType.status, 422);
  });
});

test("API-4 Token 道閘：未攜帶或錯誤憑證一律 401", async () => {
  await withServer(
    async ({ port }) => {
      const denied = await fetch(base(port) + "/api/notes");
      assert.equal(denied.status, 401);
      const wrong = await fetch(base(port) + "/api/notes", {
        headers: { Authorization: "Bearer wrong-token" },
      });
      assert.equal(wrong.status, 401);
      const granted = await fetch(base(port) + "/api/notes", {
        headers: { Authorization: "Bearer secret-token" },
      });
      assert.equal(granted.status, 200);
    },
    { token: "secret-token" },
  );
});

test("API-5 刪除筆記後讀取回 404", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "即將刪除" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };
    const del = await fetch(base(port) + "/api/notes/" + created.node.uuid, { method: "DELETE" });
    assert.equal(del.status, 200);
    const missing = await fetch(base(port) + "/api/notes/" + created.node.uuid);
    assert.equal(missing.status, 404);
  });
});

test("API-6 語意搜尋降級：嵌入端點不可用時零結果且標記 degraded", async () => {
  const embedder = new ZeroComputeEmbedder({
    fetchImpl: (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch,
  });
  await withServer(
    async ({ port }) => {
      const create = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "可搜尋之內容" }),
      });
      assert.equal(create.status, 201);
      const search = await fetch(base(port) + "/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "內容" }),
      });
      assert.equal(search.status, 200);
      const body = (await search.json()) as { results: unknown[]; degraded: boolean };
      assert.equal(body.results.length, 0);
      assert.ok(body.degraded);
    },
    { embedder },
  );
});

test("API-7 LATERAL_REBASE 同態分支：同相位 SyncDeltaPacket 生成，節點不變", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "同態分支測試筆記" }),
    });
    assert.equal(create.status, 201);
    const created = (await create.json()) as {
      node: { uuid: string; lock_hash: string; version: string; matrix_phase: string };
    };

    const rebase = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patch: [{ op: "replace", path: "/blocks/0/content", value: "同態重基底後內容" }],
        clock_vector: { "peer-cli": 3 },
      }),
    });
    assert.equal(rebase.status, 200);
    const body = (await rebase.json()) as {
      ok: boolean;
      packet: {
        packet_id: string;
        node_uuid: string;
        from_phase: string;
        to_phase: string;
        vector: string;
        clock_vector: Record<string, number>;
        patch: Array<{ op: string; path: string; value?: unknown }>;
        state_signature: string;
      };
    };
    assert.ok(body.ok);
    assert.equal(body.packet.node_uuid, created.node.uuid);
    assert.equal(body.packet.vector, "LATERAL_REBASE");
    assert.equal(body.packet.from_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.equal(body.packet.to_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.deepEqual(body.packet.clock_vector, { "peer-cli": 3 });
    assert.deepEqual(body.packet.patch, [{ op: "replace", path: "/blocks/0/content", value: "同態重基底後內容" }]);
    assert.equal(body.packet.state_signature, created.node.lock_hash);

    const reread = await fetch(base(port) + "/api/notes/" + created.node.uuid);
    const after = ((await reread.json()) as { node: { version: string; lock_hash: string; blocks: Array<{ content: string }> } }).node;
    assert.equal(after.version, created.node.version);
    assert.equal(after.lock_hash, created.node.lock_hash);
    assert.notEqual(after.blocks[0]?.content, "同態重基底後內容");
  });
});

test("API-8 LATERAL_REBASE 道閘：404、跨相位 422、缺 patch 422、非法 op 422、預設時脈", async () => {
  await withServer(async ({ port }) => {
    const missing = await fetch(base(port) + "/api/notes/00000000-0000-4000-8000-000000000000/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [] }),
    });
    assert.equal(missing.status, 404);

    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "道閘測試" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };

    const crossPhase = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_phase: "SIGMA_GRAPH_SYNTHESIS", patch: [{ op: "add", path: "/tags" }] }),
    });
    assert.equal(crossPhase.status, 422);
    assert.equal(((await crossPhase.json()) as { error: string }).error, "NOT_SAME_PHASE");

    const noPatch = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(noPatch.status, 422);
    assert.equal(((await noPatch.json()) as { error: string }).error, "PATCH_REQUIRED");

    const badOp = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [{ op: "copy", path: "/blocks/0/content" }] }),
    });
    assert.equal(badOp.status, 422);
    assert.equal(((await badOp.json()) as { error: string }).error, "INVALID_PATCH_OP");

    const badClock = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [{ op: "remove", path: "/blocks/0" }], clock_vector: { p: "not-a-number" } }),
    });
    assert.equal(badClock.status, 422);
    assert.equal(((await badClock.json()) as { error: string }).error, "INVALID_CLOCK_VECTOR");

    const defaults = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [{ op: "move", path: "/blocks/0", value: 1 }] }),
    });
    assert.equal(defaults.status, 200);
    const packet = ((await defaults.json()) as { packet: { clock_vector: Record<string, number> } }).packet;
    assert.equal(packet.clock_vector["peer-api"], 2);
  });
});
