// =====================================================================
// src/lib/rag/rag.test.ts — 契約測試（vitest）
// 手法：模擬 fetch（vi.stubGlobal），不觸網路、不需要 Ollama/Weaviate 實例
// 覆蓋：fail-fast、確定性 ID（R4 冪等）、端到端流程順序、檢索過濾
// =====================================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildIndexedEvent,
  embed,
  ensureClass,
  indexDocument,
  loadRagConfigFromEnv,
  search,
  type RagChunk,
  type RagClientConfig,
  type SupabaseChunkRepo,
} from "./index";

const CONFIG: RagClientConfig = {
  weaviateUrl: "http://127.0.0.1:8080",
  weaviateApiKey: "test-key",
  ollamaUrl: "http://127.0.0.1:11434",
  embeddingModel: "nomic-embed-text",
  className: "OmniChunk",
  timeoutMs: 8000,
};

const CHUNK: RagChunk = {
  docId: "11111111-1111-1111-1111-111111111111",
  ownerId: "22222222-2222-2222-2222-222222222222",
  chunkIndex: 0,
  content: "ISO-14064-1 碳盤查：1200 kWh × 0.509 = 610.8 kgCO2e",
};

interface MockCall {
  url: string;
  init?: RequestInit;
}

const calls: MockCall[] = [];
let responses: Array<{ status: number; body: unknown }> = [];

function queueResponses(...items: Array<{ status: number; body: unknown }>): void {
  responses = [...items];
}

beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const next = responses.shift() ?? { status: 200, body: {} };
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        json: async () => next.body,
      } as Response;
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadRagConfigFromEnv", () => {
  it("缺 WEAVIATE_API_KEY 時拋出 fail-fast 錯誤", () => {
    expect(() => loadRagConfigFromEnv({})).toThrow(/WEAVIATE_API_KEY/);
  });

  it("提供金鑰時回傳完整設定（含預設值）", () => {
    const cfg = loadRagConfigFromEnv({ WEAVIATE_API_KEY: "k" });
    expect(cfg.weaviateApiKey).toBe("k");
    expect(cfg.embeddingModel).toBe("nomic-embed-text");
    expect(cfg.className).toBe("OmniChunk");
  });
});

describe("deterministic idempotency（R4 冪等重放）", () => {
  it("兩次寫入同一 chunk 產生相同 Weaviate 物件 UUID", async () => {
    const savedRefs: string[] = [];
    const repo: SupabaseChunkRepo = {
      saveVectorRef: async (_d, _c, ref) => {
        savedRefs.push(ref);
      },
    };
    for (const _ of [1, 2]) {
      queueResponses(
        { status: 404, body: {} },
        { status: 200, body: { embedding: [0.5] } },
        { status: 201, body: {} }
      );
      await indexDocument(CONFIG, repo, [CHUNK]);
    }
    expect(savedRefs[0]).toBe(savedRefs[1]);
    expect(savedRefs[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

describe("indexDocument", () => {
  it("依序呼叫 schema → ollama → weaviate → repo，並發射 rag.indexed", async () => {
    const saveVectorRef = vi.fn();
    const repo: SupabaseChunkRepo = { saveVectorRef };
    queueResponses(
      { status: 404, body: {} },
      { status: 200, body: { embedding: [0.1, 0.2] } },
      { status: 201, body: {} }
    );

    const event = await indexDocument(CONFIG, repo, [CHUNK]);

    expect(calls.map((c) => c.url)).toEqual([
      `${CONFIG.weaviateUrl}/v1/schema/${CONFIG.className}`,
      `${CONFIG.weaviateUrl}/v1/schema`,
      `${CONFIG.ollamaUrl}/api/embeddings`,
      `${CONFIG.weaviateUrl}/v1/objects`,
    ]);
    expect(saveVectorRef).toHaveBeenCalledTimes(1);
    expect(event.type).toBe("rag.indexed");
    expect(event.docId).toBe(CHUNK.docId);
    expect(event.chunkCount).toBe(1);
    expect(event.model).toBe("nomic-embed-text");
    expect(event.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("schema 已存在時不重複建立", async () => {
    queueResponses(
      { status: 200, body: {} },
      { status: 200, body: { embedding: [0.1] } },
      { status: 201, body: {} }
    );
    await indexDocument(CONFIG, { saveVectorRef: async () => {} }, [CHUNK]);
    const schemaPosts = calls.filter(
      (c) => c.url === `${CONFIG.weaviateUrl}/v1/schema` && c.init?.method === "POST"
    );
    expect(schemaPosts).toHaveLength(0);
  });

  it("Weaviate 回 500 時拋出 WEAVIATE_UPSERT_FAILED", async () => {
    queueResponses(
      { status: 200, body: {} },
      { status: 200, body: { embedding: [0.1] } },
      { status: 500, body: {} }
    );
    await expect(
      indexDocument(CONFIG, { saveVectorRef: async () => {} }, [CHUNK])
    ).rejects.toThrow(/WEAVIATE_UPSERT_FAILED/);
  });

  it("ensureClass 回 404 後建立失敗時拋出 WEAVIATE_SCHEMA_CREATE_FAILED", async () => {
    queueResponses(
      { status: 404, body: {} },
      { status: 500, body: {} }
    );
    await expect(ensureClass(CONFIG)).rejects.toThrow(/WEAVIATE_SCHEMA_CREATE_FAILED/);
  });
});

describe("search", () => {
  it("先嵌入查詢字串，GraphQL body 含 ownerId 過濾與向量", async () => {
    queueResponses(
      { status: 200, body: { embedding: [0.4, 0.5, 0.6] } },
      {
        status: 200,
        body: {
          data: {
            Get: {
              OmniChunk: [
                {
                  content: "碳盤查原文",
                  docId: CHUNK.docId,
                  chunkIndex: 0,
                  _additional: { id: "abc", distance: "0.123" },
                },
              ],
            },
          },
        },
      }
    );

    const results = await search(CONFIG, "碳盤查", CHUNK.ownerId);

    expect(calls[0].url).toBe(`${CONFIG.ollamaUrl}/api/embeddings`);
    expect(calls[1].url).toBe(`${CONFIG.weaviateUrl}/v1/graphql`);
    const gql = JSON.parse(String(calls[1].init?.body)).query as string;
    expect(gql).toContain(`valueString: "${CHUNK.ownerId}"`);
    expect(gql).toContain("0.4,0.5,0.6");
    expect(results).toEqual([
      { docId: CHUNK.docId, chunkIndex: 0, content: "碳盤查原文", distance: 0.123 },
    ]);
  });

  it("GraphQL errors 時拋出 WEAVIATE_GRAPHQL_ERRORS", async () => {
    queueResponses(
      { status: 200, body: { embedding: [0.1] } },
      { status: 200, body: { errors: [{ message: "boom" }] } }
    );
    await expect(search(CONFIG, "q", CHUNK.ownerId)).rejects.toThrow(
      /WEAVIATE_GRAPHQL_ERRORS/
    );
  });

  it("Ollama 嵌入失敗時拋出 OLLAMA_EMBED_FAILED", async () => {
    queueResponses({ status: 503, body: {} });
    await expect(embed(CONFIG, "q")).rejects.toThrow(/OLLAMA_EMBED_FAILED/);
  });
});

describe("buildIndexedEvent", () => {
  it("事件欄位完整且 docId 作為冪等鍵", () => {
    const e = buildIndexedEvent("doc-1", 3, "nomic-embed-text");
    expect(e).toEqual({
      type: "rag.indexed",
      docId: "doc-1",
      chunkCount: 3,
      model: "nomic-embed-text",
      at: expect.any(String),
    });
  });
});
