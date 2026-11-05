/**
 * ============================================================================
 * OmniNoteLocalApiServer — 本機回環 REST API（零依賴 node:http）
 * 供 CLI 工具、機器人與小工具直接將筆記寫入 OmniNote 儲存庫：
 *   捕獲（capture）、讀取、追加區塊、語意搜尋、刪除、匯入匯出、草稿自動存。
 * 零外流承諾：僅綁定 127.0.0.1 / localhost / ::1，違者建構即拒絕。
 * ============================================================================
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { CRDTBlock, UnifiedNode } from "./core-types.js";
import { UnifiedMatrixEngine, computeNodeLockHash, sha256 } from "./matrix-engine.js";
import { sealWithStructuralSharing } from "./perf.js";
import { OmniStorageAdapter } from "./storage-adapter.js";
import { SemanticVectorStore } from "./vector-store.js";
import type { ZeroComputeEmbedder } from "./ollama-embedder.js";
import { exportNotesArchive, serializeArchive, parseArchive, importNotesArchive } from "./import-export.js";
import { DraftStore, type DraftRecord } from "./draft-store.js";

export interface OmniNoteApiOptions {
  /** 筆記儲存根目錄（Markdown 同態儲存庫） */
  readonly rootDir: string;
  /** 綁定埠；0 表示由作業系統分配臨時埠 */
  readonly port?: number;
  /** 綁定位址；僅接受本機回環位址（預設 127.0.0.1） */
  readonly host?: string;
  /** 選用 Bearer Token；設定後所有 /api/* 請求皆須攜帶 Authorization: Bearer <token> */
  readonly token?: string;
  /** 選用零算力嵌入器；提供時自動為捕獲與追加之區塊註冊語意向量 */
  readonly embedder?: ZeroComputeEmbedder;
  /** 請求主體上限（位元組），預設 2 MiB */
  readonly maxBodyBytes?: number;
}

export interface ListenAddress {
  readonly host: string;
  readonly port: number;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const BLOCK_TYPES: ReadonlySet<string> = new Set([
  "paragraph",
  "heading",
  "checklist_item",
  "sketch_vector",
  "audio_transcript",
  "object_attribute_card",
]);
const DRAFT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function bumpPatch(version: string): string {
  const parts = version.split(".");
  return parts[0] + "." + parts[1] + "." + String(Number(parts[2]) + 1);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

async function readBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    total += buf.length;
    if (total > maxBytes) throw new Error("BODY_TOO_LARGE");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/**
 * 本機回環 REST API 伺服器。所有寫入經 UnifiedMatrixEngine / 同態 Codec /
 * OmniStorageAdapter 正規管道落地，與桌面端共用同一套契約與稽核鏈。
 */
export class OmniNoteLocalApiServer {
  readonly storage: OmniStorageAdapter;
  readonly vectorStore: SemanticVectorStore;
  readonly drafts: DraftStore;
  private readonly host: string;
  private readonly port: number;
  private readonly token: string | undefined;
  private readonly embedder: ZeroComputeEmbedder | undefined;
  private readonly maxBodyBytes: number;
  private server: Server | undefined;

  constructor(options: OmniNoteApiOptions) {
    const host = options.host ?? "127.0.0.1";
    if (!LOOPBACK_HOSTS.has(host)) {
      throw new Error("[OmniNoteLocalApiServer] 僅接受本機回環位址（127.0.0.1/localhost/::1），零外流承諾不可違反");
    }
    this.host = host;
    this.port = options.port ?? 0;
    this.token = options.token;
    this.embedder = options.embedder;
    this.maxBodyBytes = options.maxBodyBytes ?? 2 * 1024 * 1024;
    this.storage = OmniStorageAdapter.selectDriver(options.rootDir);
    this.vectorStore = new SemanticVectorStore();
    this.drafts = new DraftStore(options.rootDir);
  }

  /** 啟動監聽；port 為 0 時回傳實際分配之埠 */
  listen(): Promise<ListenAddress> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        void this.handle(req, res).catch((err: unknown) => {
          sendJson(res, 500, { ok: false, error: (err as Error).message });
        });
      });
      server.once("error", reject);
      server.listen(this.port, this.host, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr !== null ? addr.port : this.port;
        this.server = server;
        resolve({ host: this.host, port });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server === undefined) return resolve();
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private authorized(req: IncomingMessage): boolean {
    if (this.token === undefined) return true;
    const header = req.headers.authorization;
    return header === "Bearer " + this.token;
  }

  /** 路由分派：各端點拆分至獨立處理方法，單一方法認知複雜度受控 */
  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = (req.url ?? "/").split("?")[0] ?? "/";
    const method = req.method ?? "GET";

    if (url === "/health") return this.respondHealth(res);
    if (!url.startsWith("/api/")) return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
    if (!this.authorized(req)) return sendJson(res, 401, { ok: false, error: "UNAUTHORIZED" });

    const segments = url.split("/").filter((s) => s.length > 0);

    if (method === "GET" && url === "/api/notes") return this.respondNotesList(res);
    if (method === "POST" && url === "/api/notes") return this.handleNoteCreate(req, res);
    if (method === "GET" && segments.length === 3 && segments[1] === "notes") return this.respondNoteRead(res, segments[2]!);
    if (method === "POST" && segments.length === 4 && segments[1] === "notes" && segments[3] === "blocks") return this.handleBlockAppend(req, res, segments[2]!);
    if (method === "DELETE" && segments.length === 3 && segments[1] === "notes") return this.respondNoteDelete(res, segments[2]!);
    if (method === "POST" && url === "/api/search") return this.handleSearch(req, res);
    if (method === "POST" && url === "/api/drafts") return this.handleDraftSave(req, res);
    if (method === "GET" && url === "/api/drafts") return this.respondDraftsList(res);
    if (segments[1] === "drafts" && segments.length === 3 && (method === "GET" || method === "DELETE")) {
      return this.respondDraftGetOrDelete(res, method, segments[2]!);
    }
    if (method === "POST" && segments.length === 4 && segments[1] === "drafts" && segments[3] === "promote") return this.respondDraftPromote(res, segments[2]!);
    if (method === "GET" && url === "/api/export") return this.respondExport(res);
    if (method === "POST" && url === "/api/import") return this.handleImport(req, res);

    return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
  }

  private async respondHealth(res: ServerResponse): Promise<void> {
    return sendJson(res, 200, {
      ok: true,
      nodes: (await this.storage.listUuids()).length,
      vectors: this.vectorStore.size,
      drafts: (await this.drafts.list()).length,
    });
  }

  private async respondNotesList(res: ServerResponse): Promise<void> {
    return sendJson(res, 200, { ok: true, uuids: await this.storage.listUuids() });
  }

  private async handleNoteCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    const text = typeof body.text === "string" ? body.text : "";
    if (text.trim().length === 0) return sendJson(res, 422, { ok: false, error: "TEXT_REQUIRED" });
    const originTag = typeof body.origin_tag === "string" && body.origin_tag.length > 0 ? body.origin_tag : "api.capture";
    const tags = Array.isArray(body.tags) && body.tags.every((t) => typeof t === "string") && body.tags.length > 0
      ? (body.tags as string[])
      : ["#inbox"];
    const spawned = await UnifiedMatrixEngine.spawnAlphaOrigin(text, originTag);
    const node: UnifiedNode = { ...spawned, topology: { ...spawned.topology, tags } };
    node.lock_hash = await computeNodeLockHash(node);
    const sealed = sealWithStructuralSharing(node) as Readonly<UnifiedNode>;
    await this.storage.write(sealed);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, sealed);
    return sendJson(res, 201, { ok: true, node: sealed });
  }

  private async respondNoteRead(res: ServerResponse, nodeUuid: string): Promise<void> {
    const node = await this.storage.read(nodeUuid);
    if (node === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    return sendJson(res, 200, { ok: true, node });
  }

  private async handleBlockAppend(req: IncomingMessage, res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    const type = typeof body.type === "string" ? body.type : "";
    const content = typeof body.content === "string" ? body.content : "";
    if (!BLOCK_TYPES.has(type)) return sendJson(res, 422, { ok: false, error: "INVALID_BLOCK_TYPE" });
    const maxLamport = existing.blocks.reduce((m, b) => Math.max(m, b.lamport_ts), 0);
    const block: CRDTBlock = {
      block_id: crypto.randomUUID(),
      type: type as CRDTBlock["type"],
      content,
      lamport_ts: maxLamport + 1,
      peer_id: "peer-api",
      deleted: false,
    };
    const next: UnifiedNode = {
      ...existing,
      version: bumpPatch(existing.version),
      timestamp: Date.now(),
      blocks: [...existing.blocks, block],
      evidence: [
        ...existing.evidence,
        {
          source_origin: "API_APPEND(peer-api)",
          captured_at: new Date().toISOString(),
          content_hash: await sha256(content),
          hook_lifecycle: "ON_API_APPEND",
          audit_formula: "SHA-256(content)",
        },
      ],
    };
    next.lock_hash = await computeNodeLockHash(next);
    const sealed = sealWithStructuralSharing(next) as Readonly<UnifiedNode>;
    await this.storage.write(sealed);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, sealed);
    return sendJson(res, 200, { ok: true, node: sealed });
  }

  private async respondNoteDelete(res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    await this.storage.delete(nodeUuid);
    return sendJson(res, 200, { ok: true, deleted: nodeUuid });
  }

  private async handleSearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    const query = typeof body.query === "string" ? body.query : "";
    const topK = typeof body.top_k === "number" && Number.isInteger(body.top_k) ? body.top_k : 5;
    const threshold = typeof body.threshold === "number" ? body.threshold : 0.72;
    if (query.trim().length === 0) return sendJson(res, 422, { ok: false, error: "QUERY_REQUIRED" });
    if (this.embedder === undefined) {
      return sendJson(res, 503, { ok: true, results: [], degraded: true, reason: "EMBEDDER_UNAVAILABLE" });
    }
    const vec = await this.embedder.embed(query);
    if (vec === null) return sendJson(res, 200, { ok: true, results: [], degraded: true, reason: "EMBEDDER_FALLBACK" });
    return sendJson(res, 200, { ok: true, results: this.vectorStore.queryTopK(Array.from(vec), topK, threshold), degraded: false });
  }

  private async handleDraftSave(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    const draftId = typeof body.draft_id === "string" ? body.draft_id : "";
    if (!DRAFT_ID_PATTERN.test(draftId)) return sendJson(res, 422, { ok: false, error: "INVALID_DRAFT_ID" });
    if (typeof body.content !== "string") return sendJson(res, 422, { ok: false, error: "CONTENT_REQUIRED" });
    const patch: { content: string; origin_tag?: string; tags?: string[] } = { content: body.content };
    if (typeof body.origin_tag === "string") patch.origin_tag = body.origin_tag;
    if (Array.isArray(body.tags) && body.tags.every((t) => typeof t === "string")) patch.tags = body.tags as string[];
    const record = await this.drafts.save(draftId, patch);
    return sendJson(res, 200, { ok: true, draft: record });
  }

  private async respondDraftsList(res: ServerResponse): Promise<void> {
    return sendJson(res, 200, { ok: true, drafts: await this.drafts.list() });
  }

  private async respondDraftGetOrDelete(res: ServerResponse, method: string, draftId: string): Promise<void> {
    if (method === "GET") {
      const draft: DraftRecord | null = await this.drafts.get(draftId);
      if (draft === null) return sendJson(res, 404, { ok: false, error: "DRAFT_NOT_FOUND" });
      return sendJson(res, 200, { ok: true, draft });
    }
    const deleted = await this.drafts.delete(draftId);
    if (!deleted) return sendJson(res, 404, { ok: false, error: "DRAFT_NOT_FOUND" });
    return sendJson(res, 200, { ok: true, deleted: draftId });
  }

  private async respondDraftPromote(res: ServerResponse, draftId: string): Promise<void> {
    const node = await this.drafts.promote(draftId, this.storage, this.embedder, this.vectorStore);
    if (node === null) return sendJson(res, 404, { ok: false, error: "DRAFT_NOT_FOUND" });
    return sendJson(res, 201, { ok: true, node });
  }

  private async respondExport(res: ServerResponse): Promise<void> {
    const uuids = await this.storage.listUuids();
    const nodes = (await Promise.all(uuids.map((uuid) => this.storage.read(uuid)))).filter(
      (n): n is UnifiedNode => n !== null,
    );
    let archive;
    try {
      archive = await exportNotesArchive(nodes);
    } catch (err) {
      return sendJson(res, 409, { ok: false, error: "ARCHIVE_INTEGRITY_FAILURE", detail: (err as Error).message });
    }
    const body = serializeArchive(archive);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="omninote-export.json"',
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
    return;
  }

  private async handleImport(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const raw = await readBody(req, this.maxBodyBytes);
    let archive;
    try {
      archive = parseArchive(raw.toString("utf-8"));
    } catch {
      return sendJson(res, 422, { ok: false, error: "INVALID_ARCHIVE" });
    }
    const conflict = (req.url ?? "").includes("conflict=overwrite") ? "overwrite" : "skip";
    const report = await importNotesArchive(this.storage, archive, { conflict });
    if (this.embedder !== undefined) {
      await Promise.all(archive.nodes.map((node) => this.embedder!.registerNodeBlocks(this.vectorStore, node)));
    }
    return sendJson(res, 200, { ok: true, conflict, report });
  }

  private parseJsonOr422(raw: Buffer, res: ServerResponse): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(raw.toString("utf-8"));
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("NOT_OBJECT");
      return parsed as Record<string, unknown>;
    } catch {
      sendJson(res, 422, { ok: false, error: "INVALID_JSON_BODY" });
      return null;
    }
  }
}
