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
  /** 靜態路由表：方法 + 完整路徑 → 處理函式 */
  private static readonly FIXED_ROUTES: Readonly<
    Record<string, (self: OmniNoteLocalApiServer, req: IncomingMessage, res: ServerResponse) => Promise<void>>
  > = {
    "GET /api/notes": (self, _req, res) => self.respondNotesList(res),
    "POST /api/notes": (self, req, res) => self.handleNoteCreate(req, res),
    "POST /api/search": (self, req, res) => self.handleSearch(req, res),
    "POST /api/drafts": (self, req, res) => self.handleDraftSave(req, res),
    "GET /api/drafts": (self, _req, res) => self.respondDraftsList(res),
    "GET /api/export": (self, _req, res) => self.respondExport(res),
    "POST /api/import": (self, req, res) => self.handleImport(req, res),
  };
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

  /** 路由分派：靜態路由表 + 動態段路由，單一方法認知複雜度受控 */
  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = (req.url ?? "/").split("?")[0] ?? "/";
    const method = req.method ?? "GET";

    if (url === "/health") return this.respondHealth(res);
    if (!url.startsWith("/api/")) return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
    if (!this.authorized(req)) return sendJson(res, 401, { ok: false, error: "UNAUTHORIZED" });

    const fixed = OmniNoteLocalApiServer.FIXED_ROUTES[method + " " + url];
    if (fixed !== undefined) return fixed(this, req, res);

    const segments = url.split("/").filter((s) => s.length > 0);
    const dynamic = this.routeDynamic(method, segments, req, res);
    if (dynamic !== undefined) return dynamic;

    return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
  }

  /** 動態段路由（notes/:id、notes/:id/blocks、drafts/:id、drafts/:id/promote） */
  private routeDynamic(
    method: string,
    segments: string[],
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> | undefined {
    const resource = segments[1];
    const id = segments[2];
    if (resource === "notes" && id !== undefined && segments.length === 3) {
      if (method === "GET") return this.respondNoteRead(res, id);
      if (method === "DELETE") return this.respondNoteDelete(res, id);
    }
    if (method === "POST" && resource === "notes" && segments.length === 4 && segments[3] === "blocks") {
      return this.handleBlockAppend(req, res, id!);
    }
    if (resource === "notes" && id !== undefined && segments.length === 5 && segments[3] === "blocks") {
      if (method === "PATCH") return this.handleBlockEdit(req, res, id, segments[4]!);
      if (method === "DELETE") return this.respondBlockSoftDelete(res, id, segments[4]!);
    }
    if (method === "POST" && resource === "notes" && id !== undefined && segments.length === 4 && segments[3] === "purify") {
      return this.respondNotePurify(res, id);
    }
    if (method === "POST" && resource === "notes" && id !== undefined && segments.length === 4 && segments[3] === "sigma") {
      return this.respondNoteSigmaFuse(res, id);
    }
    if (method === "POST" && resource === "notes" && id !== undefined && segments.length === 4 && segments[3] === "crystallize") {
      return this.handleNoteCrystallize(req, res, id);
    }
    if (method === "POST" && resource === "notes" && id !== undefined && segments.length === 4 && segments[3] === "reverse") {
      return this.respondNoteReverseProject(res, id);
    }
    if (resource === "drafts" && id !== undefined && segments.length === 3 && (method === "GET" || method === "DELETE")) {
      return this.respondDraftGetOrDelete(res, method, id);
    }
    if (method === "POST" && resource === "drafts" && segments.length === 4 && segments[3] === "promote") {
      return this.respondDraftPromote(res, id!);
    }
    return undefined;
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
    node.topology = {
      ...node.topology,
      outlinks: UnifiedMatrixEngine.deriveOutlinks(node.blocks, await this.buildUniverse(), await this.buildAliasIndex()),
    };
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
      topology: {
        ...existing.topology,
        outlinks: UnifiedMatrixEngine.deriveOutlinks(
          [...existing.blocks, block],
          await this.buildUniverse(),
          await this.buildAliasIndex(),
        ),
      },
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

  /** 拓撲宇宙：現存節點 uuid 集合，供 outlinks 熔合重建時判定 resolved */
  private async buildUniverse(): Promise<ReadonlySet<string>> {
    return new Set(await this.storage.listUuids());
  }

  /** 別名索引：以各節點第一個非墓碑文字區塊之完整內容為標題別名（同題先建者優先），供 [[文字別名]] → uuid 解析 */
  private async buildAliasIndex(): Promise<ReadonlyMap<string, string>> {
    const uuids = await this.storage.listUuids();
    const nodes = (await Promise.all(uuids.map((uuid) => this.storage.read(uuid)))).filter(
      (n): n is UnifiedNode => n !== null,
    );
    const index = new Map<string, string>();
    for (const node of nodes) {
      const first = node.blocks.find((b) => !b.deleted && (b.type === "paragraph" || b.type === "heading"));
      const alias = first?.content.trim();
      if (alias !== undefined && alias.length > 0 && !index.has(alias)) index.set(alias, node.uuid);
    }
    return index;
  }

  /** 熵減自癒：對現存宇宙重標註死鏈並計算 entropy_score（ON_ENTROPY_PURIFICATION 證據入鏈） */
  private async respondNotePurify(res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const purified = await UnifiedMatrixEngine.purifyAndReduceEntropy(existing, await this.buildUniverse());
    await this.storage.write(purified);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, purified);
    return sendJson(res, 200, { ok: true, node: purified });
  }

  /** ALPHA → SIGMA 躍遷：非墓碑區塊內容熔合為單一長文，outlinks 同步熔合重建 */
  private async respondNoteSigmaFuse(res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const active = existing.blocks.filter((b) => !b.deleted);
    if (active.length === 0) return sendJson(res, 422, { ok: false, error: "NO_ACTIVE_BLOCKS" });
    const universe = await this.buildUniverse();
    const mergedMarkdown = active.map((b) => b.content).join("\n\n");
    const sigma = await UnifiedMatrixEngine.transitionToSigmaGraph(
      existing,
      UnifiedMatrixEngine.deriveOutlinks(existing.blocks, universe, await this.buildAliasIndex()),
      mergedMarkdown,
    );
    await this.storage.write(sigma);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, sigma);
    return sendJson(res, 200, { ok: true, node: sigma });
  }

  /** SIGMA → OMEGA 躍遷：強型別物件結晶（entity_type 注入 + 屬性併入） */
  private async handleNoteCrystallize(req: IncomingMessage, res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    const entityType = typeof body.entity_type === "string" ? body.entity_type.trim() : "";
    if (entityType.length === 0) return sendJson(res, 422, { ok: false, error: "ENTITY_TYPE_REQUIRED" });
    const properties =
      typeof body.properties === "object" && body.properties !== null && !Array.isArray(body.properties)
        ? (body.properties as Record<string, unknown>)
        : {};
    const omega = await UnifiedMatrixEngine.crystallizeToOmegaObject(existing, entityType, properties);
    await this.storage.write(omega);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, omega);
    return sendJson(res, 200, { ok: true, node: omega });
  }

  /** OMEGA → ALPHA 逆向投影：結晶實體回流為捕獲態 */
  private async respondNoteReverseProject(res: ServerResponse, nodeUuid: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const reversed = await UnifiedMatrixEngine.projectReverseToCapture(existing);
    await this.storage.write(reversed);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, reversed);
    return sendJson(res, 200, { ok: true, node: reversed });
  }

  private async handleBlockEdit(req: IncomingMessage, res: ServerResponse, nodeUuid: string, blockId: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const body = this.parseJsonOr422(await readBody(req, this.maxBodyBytes), res);
    if (body === null) return;
    if (typeof body.content !== "string") return sendJson(res, 422, { ok: false, error: "CONTENT_REQUIRED" });
    const updated = await this.applyBlockOp(res, existing, blockId, (node, universe, aliasIndex) =>
      UnifiedMatrixEngine.editBlock(node, blockId, body.content as string, universe, aliasIndex),
    );
    if (updated === null) return;
    return this.persistBlockOp(res, updated);
  }

  private async respondBlockSoftDelete(res: ServerResponse, nodeUuid: string, blockId: string): Promise<void> {
    const existing = await this.storage.read(nodeUuid);
    if (existing === null) return sendJson(res, 404, { ok: false, error: "NODE_NOT_FOUND" });
    const updated = await this.applyBlockOp(res, existing, blockId, (node, universe, aliasIndex) =>
      UnifiedMatrixEngine.softDeleteBlock(node, blockId, universe, aliasIndex),
    );
    if (updated === null) return;
    return this.persistBlockOp(res, updated);
  }

  /** 引擎區塊操作統一道閘：BLOCK_NOT_FOUND / BLOCK_TOMBSTONED 對應 404，其餘 500 */
  private async applyBlockOp(
    res: ServerResponse,
    node: UnifiedNode,
    _blockId: string,
    op: (node: UnifiedNode, universe: ReadonlySet<string>, aliasIndex: ReadonlyMap<string, string>) => Promise<Readonly<UnifiedNode>>,
  ): Promise<Readonly<UnifiedNode> | null> {
    try {
      return await op(node, await this.buildUniverse(), await this.buildAliasIndex());
    } catch (err) {
      const message = (err as Error).message;
      if (message === "BLOCK_NOT_FOUND" || message === "BLOCK_TOMBSTONED") {
        sendJson(res, 404, { ok: false, error: message });
        return null;
      }
      throw err;
    }
  }

  private async persistBlockOp(res: ServerResponse, updated: Readonly<UnifiedNode>): Promise<void> {
    await this.storage.write(updated);
    if (this.embedder !== undefined) await this.embedder.registerNodeBlocks(this.vectorStore, updated);
    return sendJson(res, 200, { ok: true, node: updated });
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
