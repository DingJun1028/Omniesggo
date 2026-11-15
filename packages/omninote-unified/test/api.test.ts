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

test("API-9 SyncDeltaPacket 對端套用：patch 生效、版本遞增、證據入鏈；重放拒絕 409", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "對端套用測試" }),
    });
    const created = (await create.json()) as {
      node: { uuid: string; version: string; lock_hash: string };
    };

    const rebase = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patch: [
          { op: "replace", path: "/blocks/0/content", value: "重基後內容" },
          { op: "add", path: "/blocks/-", value: { block_id: "00000000-0000-4000-8000-00000000000a", type: "paragraph", content: "追加區塊", lamport_ts: 2, peer_id: "peer-cli", deleted: false } },
        ],
      }),
    });
    assert.equal(rebase.status, 200);
    const { packet } = (await rebase.json()) as { packet: Record<string, unknown> };

    const apply = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
    });
    assert.equal(apply.status, 200);
    const applied = ((await apply.json()) as {
      node: { version: string; blocks: Array<{ content: string }>; evidence: Array<{ hook_lifecycle: string }> };
    }).node;
    assert.equal(applied.blocks[0]?.content, "重基後內容");
    assert.equal(applied.blocks.length, 2);
    assert.equal(applied.blocks[1]?.content, "追加區塊");
    assert.equal(applied.version, "1.0.1");
    assert.ok(applied.evidence.some((e) => e.hook_lifecycle === "ON_SYNC_DELTA_APPLY"));

    const replay = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
    });
    assert.equal(replay.status, 409);
    assert.equal(((await replay.json()) as { error: string }).error, "STATE_SIGNATURE_MISMATCH");
  });
});

test("API-10 對端套用道閘：404、封包形狀 422、uuid 不符 422、非法路徑 422", async () => {
  await withServer(async ({ port }) => {
    const missing = await fetch(base(port) + "/api/notes/00000000-0000-4000-8000-000000000000/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(missing.status, 404);

    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "道閘測試甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };
    const create2 = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "道閘測試乙" }),
    });
    const other = (await create2.json()) as { node: { uuid: string } };

    const badShape = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packet_id: 123 }),
    });
    assert.equal(badShape.status, 422);
    assert.equal(((await badShape.json()) as { error: string }).error, "INVALID_PACKET_SHAPE");

    const rebase = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [{ op: "remove", path: "/blocks/0" }] }),
    });
    const { packet } = (await rebase.json()) as { packet: Record<string, unknown> };

    const wrongNode = await fetch(base(port) + "/api/notes/" + other.node.uuid + "/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
    });
    assert.equal(wrongNode.status, 422);
    assert.equal(((await wrongNode.json()) as { error: string }).error, "PACKET_NODE_MISMATCH");

    const badPath = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/rebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: [{ op: "replace", path: "/nonexistent/0/content", value: "x" }] }),
    });
    const { packet: brokenPacket } = (await badPath.json()) as { packet: Record<string, unknown> };
    const applyBroken = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brokenPacket),
    });
    assert.equal(applyBroken.status, 422);
    assert.equal(((await applyBroken.json()) as { error: string }).error, "INVALID_PATCH_PATH");

    const readBack = await fetch(base(port) + "/api/notes/" + created.node.uuid);
    const after = ((await readBack.json()) as { node: { blocks: Array<{ content: string }> } }).node;
    assert.equal(after.blocks.length, 1);
  });
});

test("API-11 證據鏈查詢：預設全量、hook 過濾、limit/offset 分頁、狀態綁定欄位", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "證據鏈查詢甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };

    // 追加兩個區塊 → 證據鏈 3 筆（ON_ALPHA_CAPTURE + 2×ON_API_APPEND）
    for (const text of ["追加一", "追加二"]) {
      const append = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "paragraph", content: text }),
      });
      assert.equal(append.status, 200);
    }

    const all = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence");
    assert.equal(all.status, 200);
    const allBody = (await all.json()) as {
      ok: boolean;
      uuid: string;
      node_version: string;
      lock_hash: string;
      total: number;
      offset: number;
      limit: number;
      entries: Array<{ hook_lifecycle: string }>;
    };
    assert.equal(allBody.ok, true);
    assert.equal(allBody.uuid, created.node.uuid);
    assert.equal(allBody.total, 3);
    assert.equal(allBody.offset, 0);
    assert.equal(allBody.limit, 50);
    assert.equal(allBody.entries.length, 3);
    assert.match(allBody.lock_hash, /^[0-9a-f]{64}$/);
    // 鏈序：ON_ALPHA_CAPTURE 為首筆
    assert.equal(allBody.entries[0]?.hook_lifecycle, "ON_ALPHA_CAPTURE");
    assert.equal(allBody.entries[2]?.hook_lifecycle, "ON_API_APPEND");

    // hook 過濾
    const filtered = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?hook=ON_API_APPEND");
    const filteredBody = (await filtered.json()) as { total: number; entries: Array<{ hook_lifecycle: string }> };
    assert.equal(filteredBody.total, 2);
    assert.ok(filteredBody.entries.every((e) => e.hook_lifecycle === "ON_API_APPEND"));

    // limit/offset 分頁（查詢字串於路由前綴剝離仍可解析）
    const page = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?limit=2&offset=1");
    const pageBody = (await page.json()) as { total: number; offset: number; limit: number; entries: Array<{ hook_lifecycle: string }> };
    assert.equal(pageBody.total, 3);
    assert.equal(pageBody.offset, 1);
    assert.equal(pageBody.limit, 2);
    assert.equal(pageBody.entries.length, 2);
    assert.equal(pageBody.entries[0]?.hook_lifecycle, "ON_API_APPEND");

    // 逾界 offset 回空陣列、total 不變
    const beyond = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?offset=99");
    const beyondBody = (await beyond.json()) as { total: number; entries: unknown[] };
    assert.equal(beyondBody.total, 3);
    assert.equal(beyondBody.entries.length, 0);
  });
});

test("API-12 證據鏈查詢道閘：404、非法 limit 422、非法 offset 422、空 hook 422", async () => {
  await withServer(async ({ port }) => {
    const missing = await fetch(base(port) + "/api/notes/00000000-0000-4000-8000-000000000000/evidence");
    assert.equal(missing.status, 404);
    assert.equal(((await missing.json()) as { error: string }).error, "NODE_NOT_FOUND");

    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "證據鏈道閘甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };

    const badLimit = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?limit=0");
    assert.equal(badLimit.status, 422);
    assert.equal(((await badLimit.json()) as { error: string }).error, "INVALID_QUERY");

    const hugeLimit = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?limit=501");
    assert.equal(hugeLimit.status, 422);

    const badOffset = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?offset=-1");
    assert.equal(badOffset.status, 422);

    const emptyHook = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?hook=");
    assert.equal(emptyHook.status, 422);

    // 未知 hook：合法查詢，回零筆（如實區分 422 與空結果）
    const unknownHook = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence?hook=ON_NO_SUCH_HOOK");
    assert.equal(unknownHook.status, 200);
    const unknownBody = (await unknownHook.json()) as { total: number; entries: unknown[] };
    assert.equal(unknownBody.total, 0);
  });
});

test("API-13 證據鏈統計：by_hook 聚合、hooks 首現順序、first/last_captured_at、狀態綁定", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "統計測試甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string; version: string } };
    for (const text of ["追加一", "追加二"]) {
      await fetch(base(port) + "/api/notes/" + created.node.uuid + "/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "paragraph", content: text }),
      });
    }
    const stats = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence/stats");
    assert.equal(stats.status, 200);
    const body = (await stats.json()) as {
      ok: boolean;
      uuid: string;
      node_version: string;
      lock_hash: string;
      total: number;
      by_hook: Record<string, number>;
      hooks: string[];
      first_captured_at: string | null;
      last_captured_at: string | null;
    };
    assert.equal(body.ok, true);
    assert.equal(body.uuid, created.node.uuid);
    assert.equal(body.total, 3);
    assert.equal(body.by_hook["ON_ALPHA_CAPTURE"], 1);
    assert.equal(body.by_hook["ON_API_APPEND"], 2);
    assert.deepEqual(body.hooks, ["ON_ALPHA_CAPTURE", "ON_API_APPEND"]);
    assert.notEqual(body.first_captured_at, null);
    assert.notEqual(body.last_captured_at, null);
    assert.match(body.lock_hash, /^[0-9a-f]{64}$/);
  });
});

test("API-14 證據鏈統計道閘：404 未知節點；單證據節點 first===last", async () => {
  await withServer(async ({ port }) => {
    const missing = await fetch(base(port) + "/api/notes/00000000-0000-4000-8000-000000000000/evidence/stats");
    assert.equal(missing.status, 404);
    assert.equal(((await missing.json()) as { error: string }).error, "NODE_NOT_FOUND");

    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "統計道閘甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string } };
    const stats = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence/stats");
    const body = (await stats.json()) as {
      total: number;
      by_hook: Record<string, number>;
      hooks: string[];
      first_captured_at: string | null;
      last_captured_at: string | null;
    };
    assert.equal(body.total, 1);
    assert.deepEqual(body.by_hook, { ON_ALPHA_CAPTURE: 1 });
    assert.deepEqual(body.hooks, ["ON_ALPHA_CAPTURE"]);
    assert.equal(body.first_captured_at, body.last_captured_at);
  });
});

test("API-15 證據鏈匯出：全量入鏈順序、by_hook 聚合一致、快照綁定 node_version 與 lock_hash", async () => {
  await withServer(async ({ port }) => {
    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "匯出測試甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string; version: string; lock_hash: string; evidence: unknown[] } };
    for (const text of ["匯出追加一", "匯出追加二", "匯出追加三"]) {
      await fetch(base(port) + "/api/notes/" + created.node.uuid + "/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "paragraph", content: text }),
      });
    }
    const exp = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence/export");
    assert.equal(exp.status, 200);
    const body = (await exp.json()) as {
      ok: boolean;
      format: string;
      uuid: string;
      node_version: string;
      lock_hash: string;
      total: number;
      by_hook: Record<string, number>;
      hooks: string[];
      entries: Array<{ hook_lifecycle: string; source_origin: string; captured_at: string; content_hash: string; audit_formula: string }>;
      exported_at: string;
    };
    assert.equal(body.ok, true);
    assert.equal(body.format, "evidence_export_v1");
    assert.equal(body.uuid, created.node.uuid);
    assert.notEqual(body.node_version, created.node.version, "追加區塊後版本應已遞增");
    assert.match(body.lock_hash, /^[0-9a-f]{64}$/);
    assert.equal(body.total, 4);
    assert.equal(body.entries.length, 4);
    assert.deepEqual(body.hooks, ["ON_ALPHA_CAPTURE", "ON_API_APPEND"]);
    assert.equal(body.by_hook["ON_ALPHA_CAPTURE"], 1);
    assert.equal(body.by_hook["ON_API_APPEND"], 3);
    assert.deepEqual(
      body.entries.map((e) => e.hook_lifecycle),
      ["ON_ALPHA_CAPTURE", "ON_API_APPEND", "ON_API_APPEND", "ON_API_APPEND"],
      "entries 應為入鏈順序全量",
    );
    for (const e of body.entries) {
      assert.match(e.content_hash, /^[0-9a-f]{64}$/);
      assert.equal(typeof e.captured_at, "string");
      assert.equal(typeof e.source_origin, "string");
      assert.equal(typeof e.audit_formula, "string");
    }
    assert.equal(typeof body.exported_at, "string");
    // 與 stats 端點聚合一致性交叉驗證
    const stats = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence/stats");
    const statsBody = (await stats.json()) as { total: number; by_hook: Record<string, number>; hooks: string[]; lock_hash: string };
    assert.equal(statsBody.total, body.total);
    assert.deepEqual(statsBody.by_hook, body.by_hook);
    assert.deepEqual(statsBody.hooks, body.hooks);
    assert.equal(statsBody.lock_hash, body.lock_hash);
  });
});

test("API-16 證據鏈匯出道閘：404 未知節點；空匯出仍具備完整欄位", async () => {
  await withServer(async ({ port }) => {
    const missing = await fetch(base(port) + "/api/notes/00000000-0000-4000-8000-000000000000/evidence/export");
    assert.equal(missing.status, 404);
    assert.equal(((await missing.json()) as { error: string }).error, "NODE_NOT_FOUND");

    const create = await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "匯出道閘甲" }),
    });
    const created = (await create.json()) as { node: { uuid: string; evidence: unknown[] } };
    const exp = await fetch(base(port) + "/api/notes/" + created.node.uuid + "/evidence/export");
    assert.equal(exp.status, 200);
    const body = (await exp.json()) as {
      total: number;
      entries: unknown[];
      by_hook: Record<string, number>;
      hooks: string[];
      exported_at: string;
    };
    assert.equal(body.total, created.node.evidence.length);
    assert.deepEqual(body.by_hook, { ON_ALPHA_CAPTURE: 1 });
    assert.deepEqual(body.hooks, ["ON_ALPHA_CAPTURE"]);
    assert.equal(typeof body.exported_at, "string");
  });
});

test("API-17 全域標籤彙整：節點計數、字典序排序、untagged 統計、快照欄位", async () => {
  await withServer(async ({ port }) => {
    const post = async (text: string, tags: string[]) =>
      fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tags }),
      });
    await post("標籤甲", ["zeta", "alpha"]);
    await post("標籤乙", ["alpha"]);
    await post("無標籤甲", []);
    const res = await fetch(base(port) + "/api/tags");
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      total_notes: number;
      tagged_nodes: number;
      untagged_nodes: number;
      total_tag_occurrences: number;
      tags: Array<{ tag: string; count: number }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total_notes, 3);
    // spawnAlphaOrigin 之預設拓撲帶 "#inbox"，故空 tags 建立之節點仍屬已標籤節點
    assert.equal(body.tagged_nodes, 3);
    assert.equal(body.untagged_nodes, 0);
    assert.equal(body.total_tag_occurrences, 4);
    assert.deepEqual(body.tags, [
      { tag: "#inbox", count: 1 },
      { tag: "alpha", count: 2 },
      { tag: "zeta", count: 1 },
    ], "tags 應依字典序穩定排序且 count 為含該標籤之節點數");
  });
});

test("API-18 全域標籤彙整道閘：空庫回零；節點內重複標籤去重", async () => {
  await withServer(async ({ port }) => {
    const empty = await fetch(base(port) + "/api/tags");
    assert.equal(empty.status, 200);
    const emptyBody = (await empty.json()) as { total_notes: number; tags: unknown[]; untagged_nodes: number };
    assert.equal(emptyBody.total_notes, 0);
    assert.deepEqual(emptyBody.tags, []);
    assert.equal(emptyBody.untagged_nodes, 0);

    await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "重複標籤甲", tags: ["dup", "dup"] }),
    });
    const res = await fetch(base(port) + "/api/tags");
    const body = (await res.json()) as {
      tagged_nodes: number;
      total_tag_occurrences: number;
      tags: Array<{ tag: string; count: number }>;
    };
    assert.equal(body.tagged_nodes, 1);
    assert.equal(body.total_tag_occurrences, 1, "節點內重複標籤應去重後計數");
    assert.deepEqual(body.tags, [{ tag: "dup", count: 1 }]);
  });
});
