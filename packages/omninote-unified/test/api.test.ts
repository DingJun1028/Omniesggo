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

test("API-19 全域熵值總覽：purify 後聚合 avg/max/min 與 highest 排序", async () => {
  await withServer(async ({ port }) => {
    const post = (text: string) =>
      fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    // 建立標的與來源，硬刪標的後 purify 產生 entropy_score
    const resB = await post("標的筆記");
    const uuidB = ((await resB.json()) as { node: UnifiedNode }).node.uuid;
    const resA = await post(`指向 [[${uuidB}]] 的來源筆記甲`);
    const uuidA = ((await resA.json()) as { node: UnifiedNode }).node.uuid;
    const resC = await post("未淨化筆記乙");
    await fetch(`${base(port)}/api/notes/${uuidB}`, { method: "DELETE" });
    const resPurify = await fetch(`${base(port)}/api/notes/${uuidA}/purify`, { method: "POST" });
    assert.equal(resPurify.status, 200);

    const res = await fetch(base(port) + "/api/entropy/stats");
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      total_notes: number;
      with_entropy: number;
      without_entropy: number;
      avg_entropy: number | null;
      max_entropy: number | null;
      min_entropy: number | null;
      highest: Array<{ uuid: string; entropy_score: number }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total_notes, 2, "刪除標的後餘兩節點");
    assert.equal(body.with_entropy, 1);
    assert.equal(body.without_entropy, 1);
    const score = body.highest[0]?.entropy_score ?? -1;
    assert.ok(score > 0, "purify 後 entropy_score 應為正");
    assert.equal(body.avg_entropy, score, "僅一具值節點時 avg 等於該值");
    assert.equal(body.max_entropy, score);
    assert.equal(body.min_entropy, score);
    assert.deepEqual(body.highest, [{ uuid: uuidA, entropy_score: score }]);
  });
});

test("API-20 全域熵值總覽道閘：空庫與未淨化節點回 null 聚合", async () => {
  await withServer(async ({ port }) => {
    const empty = await fetch(base(port) + "/api/entropy/stats");
    assert.equal(empty.status, 200);
    const emptyBody = (await empty.json()) as {
      total_notes: number;
      with_entropy: number;
      avg_entropy: number | null;
      max_entropy: number | null;
      min_entropy: number | null;
      highest: unknown[];
    };
    assert.equal(emptyBody.total_notes, 0);
    assert.equal(emptyBody.with_entropy, 0);
    assert.equal(emptyBody.avg_entropy, null, "無具值節點時 avg 應為 null");
    assert.equal(emptyBody.max_entropy, null);
    assert.equal(emptyBody.min_entropy, null);
    assert.deepEqual(emptyBody.highest, []);

    await fetch(base(port) + "/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "未淨化筆記" }),
    });
    const res = await fetch(base(port) + "/api/entropy/stats");
    const body = (await res.json()) as {
      total_notes: number;
      with_entropy: number;
      without_entropy: number;
      avg_entropy: number | null;
      highest: unknown[];
    };
    assert.equal(body.total_notes, 1);
    assert.equal(body.with_entropy, 0, "未 purify 之節點不應具 entropy_score");
    assert.equal(body.without_entropy, 1);
    assert.equal(body.avg_entropy, null);
    assert.deepEqual(body.highest, []);
  });
});

test("API-21 批次標籤操作：附加去重、移除、unchanged 計數與 missing 如實回報", async () => {
  await withServer(async ({ port }) => {
    const post = (text: string, tags: string[]) =>
      fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tags }),
      });
    const a = ((await (await post("批次甲", ["alpha"])).json()) as { node: UnifiedNode }).node;
    const b = ((await (await post("批次乙", ["beta"])).json()) as { node: UnifiedNode }).node;
    const res = await fetch(base(port) + "/api/notes/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuids: [a.uuid, b.uuid, "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d"],
        add: ["esg", "alpha"],
        remove: ["beta"],
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      updated: Array<{ uuid: string; tags: string[] }>;
      missing: string[];
      unchanged: number;
      total: number;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total, 3);
    assert.equal(body.updated.length, 2);
    assert.deepEqual(body.missing, ["9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d"]);
    assert.equal(body.unchanged, 0);
    const updA = body.updated.find((u) => u.uuid === a.uuid);
    const updB = body.updated.find((u) => u.uuid === b.uuid);
    assert.ok(updA && updA.tags.includes("alpha") && updA.tags.includes("esg"), "alpha 應去重保留且附加 esg");
    assert.ok(updB && !updB.tags.includes("beta") && updB.tags.includes("esg"), "beta 應移除且附加 esg");
    // 後續讀回驗證落地
    const reread = (await (await fetch(`${base(port)}/api/notes/${b.uuid}`)).json()) as { node: UnifiedNode };
    assert.ok(!reread.node.topology.tags.includes("beta"));
    // 冪等重跑：無 add/remove 變化之節點計入 unchanged
    const again = await fetch(base(port) + "/api/notes/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [a.uuid], add: ["esg"] }),
    });
    const againBody = (await again.json()) as { updated: unknown[]; unchanged: number };
    assert.equal(againBody.updated.length, 0, "同標籤重附加應無變更");
    assert.equal(againBody.unchanged, 1);
  });
});

test("API-22 批次標籤操作道閘：空 uuids、無 add/remove、非字串成員皆 422", async () => {
  await withServer(async ({ port }) => {
    const cases: unknown[] = [
      { uuids: [], add: ["x"] },
      { uuids: ["9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d"] },
      { uuids: ["9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d"], add: [], remove: [] },
      { uuids: "not-array", add: ["x"] },
      { uuids: ["9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d"], add: [1] },
    ];
    for (const body of cases) {
      const res = await fetch(base(port) + "/api/notes/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, 422, `應 422：${JSON.stringify(body)}`);
      const j = (await res.json()) as { ok: boolean; error: string };
      assert.equal(j.error, "INVALID_BATCH_TAGS");
    }
  });
});

test("API-23 伺服器端圖譜投影：節點排序與別名、拓撲權威邊、刪除後未解析重標註", async () => {
  await withServer(async ({ port }) => {
    const empty = await fetch(base(port) + "/api/graph");
    assert.equal(empty.status, 200);
    const emptyBody = (await empty.json()) as {
      ok: boolean; total_nodes: number; total_edges: number; unresolved_edges: number; nodes: unknown[]; edges: unknown[];
    };
    assert.equal(emptyBody.ok, true);
    assert.equal(emptyBody.total_nodes, 0);
    assert.equal(emptyBody.total_edges, 0);
    assert.equal(emptyBody.unresolved_edges, 0);
    assert.deepEqual(emptyBody.nodes, []);
    assert.deepEqual(emptyBody.edges, []);

    const post = async (text: string) => {
      const r = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const b = (await r.json()) as { node: { uuid: string } };
      return b.node.uuid;
    };
    const targetUuid = await post("圖譜目標節點");
    const sourceUuid = await post("連結 [[圖譜目標節點]]");

    const res = await fetch(base(port) + "/api/graph");
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      total_nodes: number;
      total_edges: number;
      unresolved_edges: number;
      nodes: Array<{ uuid: string; matrix_phase: string; alias: string | null; tags: string[] }>;
      edges: Array<{ source: string; target: string; wikilink_alias: string; resolved: boolean }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total_nodes, 2);
    // 節點依 uuid 升冪穩定排序，別名取第一個非墓碑文字區塊
    const sorted = [...body.nodes.map((n) => n.uuid)].sort();
    assert.deepEqual(body.nodes.map((n) => n.uuid), sorted, "nodes 應依 uuid 升冪穩定排序");
    const sourceNode = body.nodes.find((n) => n.uuid === sourceUuid);
    assert.ok(sourceNode !== undefined);
    assert.equal(sourceNode.alias, "連結 [[圖譜目標節點]]");
    assert.equal(sourceNode.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
    // 拓撲權威邊：source 節點之 outlink 解析為 target uuid
    assert.equal(body.total_edges, 1);
    assert.equal(body.unresolved_edges, 0);
    assert.deepEqual(body.edges, [
      { source: sourceUuid, target: targetUuid, wikilink_alias: "圖譜目標節點", resolved: true },
    ]);

    // 目標節點刪除後：現存宇宙即時成員判定，邊降為未解析（resolved 與儲存值相異屬如實投影）
    const del = await fetch(base(port) + "/api/notes/" + targetUuid, { method: "DELETE" });
    assert.equal(del.status, 200);
    const after = await fetch(base(port) + "/api/graph");
    const afterBody = (await after.json()) as {
      total_nodes: number; total_edges: number; unresolved_edges: number;
      edges: Array<{ source: string; target: string; resolved: boolean }>;
    };
    assert.equal(afterBody.total_nodes, 1);
    assert.equal(afterBody.total_edges, 1);
    assert.equal(afterBody.unresolved_edges, 1);
    assert.equal(afterBody.edges[0]?.resolved, false, "刪除後邊應即時重標註為未解析");
  });
});

test("API-24 圖譜標籤子圖：tag 精確限縮 nodes、filter_tag 如實標示、resolved 依全體宇宙判定", async () => {
  await withServer(async ({ port }) => {
    const post = async (text: string, tags: string[]) => {
      const r = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tags }),
      });
      const b = (await r.json()) as { node: { uuid: string } };
      return b.node.uuid;
    };
    const targetUuid = await post("子圖目標節點", ["axis"]);
    const inUuid = await post("子圖內節點 [[子圖目標節點]]", ["axis"]);
    await post("子圖外節點 [[子圖目標節點]]", ["other"]);

    // 無 tag：全量投影，filter_tag 為 null（如實標示）
    const full = await fetch(base(port) + "/api/graph");
    const fullBody = (await full.json()) as { filter_tag: string | null; total_nodes: number };
    assert.equal(fullBody.filter_tag, null);
    assert.equal(fullBody.total_nodes, 3);

    // tag=axis：nodes 限縮為含該標籤之二節點
    const res = await fetch(base(port) + "/api/graph?tag=axis");
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean; filter_tag: string | null; total_nodes: number;
      nodes: Array<{ uuid: string; tags: string[] }>;
      edges: Array<{ source: string; target: string; resolved: boolean }>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.filter_tag, "axis");
    assert.equal(body.total_nodes, 2, "tag 限縮僅保留含該標籤之節點");
    assert.ok(body.nodes.every((n) => n.tags.includes("axis")));
    // 邊：子圖內節點之 outlink 解析為子圖內目標（resolved=true）
    assert.equal(body.edges.length, 1);
    assert.equal(body.edges[0]?.source, inUuid);
    assert.equal(body.edges[0]?.target, targetUuid);
    assert.equal(body.edges[0]?.resolved, true);
    // 子圖外節點之邊不列入（source 不在子圖）
    assert.ok(body.edges.every((e) => e.source !== body.nodes.find((n) => n.uuid !== inUuid && n.uuid !== targetUuid)?.uuid));

    // 不存在之標籤：空子圖
    const none = await fetch(base(port) + "/api/graph?tag=no-such-tag");
    const noneBody = (await none.json()) as { filter_tag: string | null; total_nodes: number; total_edges: number; nodes: unknown[] };
    assert.equal(noneBody.filter_tag, "no-such-tag");
    assert.equal(noneBody.total_nodes, 0);
    assert.equal(noneBody.total_edges, 0);
    assert.deepEqual(noneBody.nodes, []);
  });
});

test("API-25 批次相位躍遷：SIGMA 批次熔合、冪等 unchanged、OMEGA 與 missing 如實分類", async () => {
  await withServer(async ({ port }) => {
    const post = async (text: string) => {
      const r = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const b = (await r.json()) as { node: { uuid: string } };
      return b.node.uuid;
    };
    const a1 = await post("批次熔合一");
    const a2 = await post("批次熔合二");
    // 結晶一節點為 OMEGA
    const omegaUuid = await post("結晶實體");
    await fetch(base(port) + "/api/notes/" + omegaUuid + "/crystallize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_type: "entity" }),
    });

    const res = await fetch(base(port) + "/api/notes/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [a1, a2, omegaUuid, "00000000-0000-4000-8000-000000000000"], to_phase: "SIGMA_GRAPH_SYNTHESIS" }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      updated: Array<{ uuid: string; matrix_phase: string }>;
      missing: string[];
      skipped: Array<{ uuid: string; reason: string }>;
      unchanged: number;
      total: number;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total, 4);
    assert.equal(body.updated.length, 2);
    assert.ok(body.updated.every((u) => u.matrix_phase === "SIGMA_GRAPH_SYNTHESIS"));
    assert.ok(body.updated.some((u) => u.uuid === a1) && body.updated.some((u) => u.uuid === a2));
    assert.deepEqual(body.skipped, [{ uuid: omegaUuid, reason: "OMEGA_OBJECT_CRYSTAL" }]);
    assert.deepEqual(body.missing, ["00000000-0000-4000-8000-000000000000"]);
    assert.equal(body.unchanged, 0);

    // 落地讀回：相位與版本遞增
    const read1 = await fetch(base(port) + "/api/notes/" + a1);
    const n1 = ((await read1.json()) as { node: { matrix_phase: string; version: string } }).node;
    assert.equal(n1.matrix_phase, "SIGMA_GRAPH_SYNTHESIS");

    // 冪等重跑：已在 SIGMA 者 unchanged 零寫入
    const rerun = await fetch(base(port) + "/api/notes/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [a1, a2], to_phase: "SIGMA_GRAPH_SYNTHESIS" }),
    });
    const rerunBody = (await rerun.json()) as { updated: unknown[]; unchanged: number };
    assert.equal(rerunBody.updated.length, 0);
    assert.equal(rerunBody.unchanged, 2);

    // 道閘：空 uuids、非 SIGMA 目標皆 422
    for (const payload of [
      { uuids: [], to_phase: "SIGMA_GRAPH_SYNTHESIS" },
      { uuids: [a1] },
      { uuids: [a1], to_phase: "OMEGA_OBJECT_CRYSTAL" },
      { uuids: [a1], to_phase: "LATERAL_REBASE" },
    ]) {
      const gate = await fetch(base(port) + "/api/notes/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await gate.json()) as { ok: boolean; error: string };
      assert.equal(gate.status, 422);
      assert.equal(j.error, "INVALID_BATCH_PHASE");
    }
  });
});

test("API-27 批次逆向投影（四十一期）：OMEGA 與 SIGMA 逐節點回流 ALPHA、冪等 unchanged、證據入鏈", async () => {
  await withServer(async ({ port }) => {
    const post = async (text: string) => {
      const r = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const b = (await r.json()) as { node: { uuid: string } };
      return b.node.uuid;
    };
    const alphaUuid = await post("原生捕獲節點");
    const sigmaUuid = await post("批次熔合節點");
    const omegaUuid = await post("批次結晶節點");
    // 備妥相位：sigma 熔合、omega 結晶
    await fetch(base(port) + "/api/notes/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [sigmaUuid], to_phase: "SIGMA_GRAPH_SYNTHESIS" }),
    });
    await fetch(base(port) + "/api/notes/" + omegaUuid + "/crystallize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_type: "entity" }),
    });

    const res = await fetch(base(port) + "/api/notes/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [sigmaUuid, omegaUuid, alphaUuid, "00000000-0000-4000-8000-000000000000"], to_phase: "ALPHA_ORIGIN_CAPTURE" }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      updated: Array<{ uuid: string; matrix_phase: string }>;
      missing: string[];
      skipped: Array<{ uuid: string; reason: string }>;
      unchanged: number;
      total: number;
    };
    assert.equal(body.ok, true);
    assert.equal(body.total, 4);
    assert.equal(body.updated.length, 2, "OMEGA 與 SIGMA 各一，原生 ALPHA 不入 updated");
    assert.ok(body.updated.every((u) => u.matrix_phase === "ALPHA_ORIGIN_CAPTURE"));
    assert.ok(body.updated.some((u) => u.uuid === sigmaUuid) && body.updated.some((u) => u.uuid === omegaUuid));
    assert.deepEqual(body.skipped, []);
    assert.equal(body.unchanged, 1, "原生 ALPHA 冪等零寫入");
    assert.deepEqual(body.missing, ["00000000-0000-4000-8000-000000000000"]);

    // 落地讀回：相位回流 ALPHA，證據鏈含 ON_REVERSE_PROJECT
    const read = await fetch(base(port) + "/api/notes/" + omegaUuid);
    const n = ((await read.json()) as {
      node: { matrix_phase: string; evidence: Array<{ hook_lifecycle: string }> };
    }).node;
    assert.equal(n.matrix_phase, "ALPHA_ORIGIN_CAPTURE");
    assert.ok(n.evidence.some((e) => e.hook_lifecycle === "ON_REVERSE_PROJECT"));

    // 冪等重跑：三個存在節點全數 unchanged
    const rerun = await fetch(base(port) + "/api/notes/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuids: [sigmaUuid, omegaUuid, alphaUuid], to_phase: "ALPHA_ORIGIN_CAPTURE" }),
    });
    const rerunBody = (await rerun.json()) as { updated: unknown[]; unchanged: number; skipped: unknown[] };
    assert.equal(rerunBody.updated.length, 0);
    assert.equal(rerunBody.unchanged, 3);
    assert.deepEqual(rerunBody.skipped, []);

    // 道閘：非批次目標（crystallize 語義與未知相位）皆 422
    for (const payload of [
      { uuids: [alphaUuid], to_phase: "OMEGA_OBJECT_CRYSTAL" },
      { uuids: [alphaUuid], to_phase: "REVERSE" },
      { uuids: [] },
    ]) {
      const gate = await fetch(base(port) + "/api/notes/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, to_phase: payload.to_phase ?? "" }),
      });
      const j = (await gate.json()) as { ok: boolean; error: string };
      assert.equal(gate.status, 422);
      assert.equal(j.error, "INVALID_BATCH_PHASE");
    }
  });
});


test("API-26 全域證據時間軸：跨節點彙整、captured_at 升冪、hook 精確過濾、分頁與道閘", async () => {
  await withServer(async ({ port }) => {
    // 道閘先於資料彙整：空庫亦如實回零列
    const empty = await fetch(base(port) + "/api/evidence");
    assert.equal(empty.status, 200);
    const emptyBody = (await empty.json()) as { ok: boolean; total: number; offset: number; limit: number; entries: unknown[] };
    assert.equal(emptyBody.ok, true);
    assert.equal(emptyBody.total, 0);
    assert.equal(emptyBody.limit, 50);
    assert.deepEqual(emptyBody.entries, []);

    const post = async (text: string) => {
      const r = await fetch(base(port) + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const b = (await r.json()) as { node: { uuid: string; version: string; lock_hash: string; evidence: Array<{ hook_lifecycle: string; captured_at: string }> } };
      return b.node;
    };
    const n1 = await post("時間軸一");
    const n2 = await post("時間軸二");

    const res = await fetch(base(port) + "/api/evidence?limit=500");
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean; total: number; offset: number; limit: number;
      entries: Array<{ uuid: string; node_version: string; lock_hash: string; entry: { hook_lifecycle: string; captured_at: string } }>;
    };
    assert.equal(body.total, n1.evidence.length + n2.evidence.length);
    assert.ok(body.entries.length >= 2);
    // captured_at 字串升冪穩定排序
    const times = body.entries.map((e) => e.entry.captured_at);
    const sorted = [...times].sort();
    assert.deepEqual(times, sorted, "entries 應依 captured_at 字串升冪排序");
    // 每筆附 node_version 與 lock_hash 綁定
    for (const e of body.entries) {
      assert.ok(typeof e.uuid === "string" && typeof e.node_version === "string" && typeof e.lock_hash === "string");
    }

    // 分頁：offset+limit 切窗
    const page = await fetch(base(port) + "/api/evidence?limit=1&offset=1");
    const pageBody = (await page.json()) as { total: number; entries: unknown[] };
    assert.equal(pageBody.total, body.total);
    assert.equal(pageBody.entries.length, 1);

    // hook 精確過濾
    const hooked = await fetch(base(port) + "/api/evidence?hook=ON_ALPHA_CAPTURE");
    const hookedBody = (await hooked.json()) as { total: number; entries: Array<{ entry: { hook_lifecycle: string } }> };
    assert.ok(hookedBody.entries.every((e) => e.entry.hook_lifecycle === "ON_ALPHA_CAPTURE"));

    // 道閘：非法 limit/offset、空 hook 皆 422
    for (const qs of ["limit=0", "limit=501", "limit=abc", "offset=-1", "hook=%20"]) {
      const gate = await fetch(base(port) + "/api/evidence?" + qs);
      const j = (await gate.json()) as { ok: boolean; error: string };
      assert.equal(gate.status, 422);
      assert.equal(j.error, "INVALID_QUERY");
    }
  });
});
