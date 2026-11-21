/**
 * ============================================================================
 * DraftStore — 隨時進度草稿自動儲存層
 * 草稿為正式捕獲前之暫存進度（不進 UnifiedNode 契約）：
 *   upsert 冪等儲存（隨時重複呼叫）、防抖自動存（DraftAutoSaver）、
 *   晉升（promote）走引擎正規管道轉為 ALPHA 節點後刪除草稿。
 * ============================================================================
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { UnifiedNode } from "./core-types.js";
import { UnifiedMatrixEngine, computeNodeLockHash } from "./matrix-engine.js";
import { sealWithStructuralSharing } from "./perf.js";
import type { OmniStorageAdapter } from "./storage-adapter.js";
import type { SemanticVectorStore } from "./vector-store.js";
import type { ZeroComputeEmbedder } from "./ollama-embedder.js";

export interface DraftRecord {
  readonly draft_id: string;
  readonly content: string;
  readonly origin_tag: string;
  readonly tags: string[];
  readonly revision: number;
  readonly created_at: string;
  readonly saved_at: string;
}

export interface DraftPatch {
  /** 當前進度內容（允許空字串：剛開始打字即先存） */
  readonly content: string;
  readonly origin_tag?: string;
  readonly tags?: string[];
}

const DRAFT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function assertDraftId(draftId: string): void {
  if (!DRAFT_ID_PATTERN.test(draftId)) {
    throw new Error("[DraftStore] draft_id 僅接受 1-64 字元之英數、底線與連字號");
  }
}

/** 草稿儲存：檔案系統持久化（rootDir/omni-drafts/<draft_id>.json） */
export class DraftStore {
  private readonly dir: string;

  constructor(rootDir: string) {
    this.dir = join(rootDir, "omni-drafts");
  }

  private path(draftId: string): string {
    return join(this.dir, draftId + ".json");
  }

  /** 冪等 upsert：同一 draft_id 重複儲存即覆寫，revision 遞增（隨時進度存檔） */
  async save(draftId: string, patch: DraftPatch): Promise<DraftRecord> {
    assertDraftId(draftId);
    const existing = await this.get(draftId);
    const now = new Date().toISOString();
    const record: DraftRecord = {
      draft_id: draftId,
      content: patch.content,
      origin_tag: patch.origin_tag ?? existing?.origin_tag ?? "draft.autosave",
      tags: patch.tags ?? existing?.tags ?? ["#draft"],
      revision: existing === null ? 1 : existing.revision + 1,
      created_at: existing?.created_at ?? now,
      saved_at: now,
    };
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.path(draftId), JSON.stringify(record, null, 2), "utf-8");
    return record;
  }

  async get(draftId: string): Promise<DraftRecord | null> {
    try {
      return JSON.parse(await readFile(this.path(draftId), "utf-8")) as DraftRecord;
    } catch {
      return null;
    }
  }

  async list(): Promise<DraftRecord[]> {
    try {
      const files = await readdir(this.dir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));
      const contents = await Promise.all(jsonFiles.map((f) => readFile(join(this.dir, f), "utf-8").catch(() => null)));
      const records: DraftRecord[] = [];
      contents.forEach((content) => {
        if (content === null) return;
        try {
          records.push(JSON.parse(content) as DraftRecord);
        } catch { /* 略過無法解析之檔案 */ }
      });
      return records.sort((a, b) => b.saved_at.localeCompare(a.saved_at));
    } catch {
      return [];
    }
  }

  async delete(draftId: string): Promise<boolean> {
    try {
      await rm(this.path(draftId));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 晉升：草稿轉為正式 ALPHA 節點（引擎正規管道：spawnAlphaOrigin →
   * computeNodeLockHash → 結構共享封印 → 落地），成功後刪除草稿。
   * 草稿不存在回 null。
   */
  async promote(
    draftId: string,
    storage: OmniStorageAdapter,
    embedder?: ZeroComputeEmbedder,
    vectorStore?: SemanticVectorStore,
  ): Promise<Readonly<UnifiedNode> | null> {
    const draft = await this.get(draftId);
    if (draft === null) return null;
    const spawned = await UnifiedMatrixEngine.spawnAlphaOrigin(draft.content, draft.origin_tag);
    const node: UnifiedNode = { ...spawned, topology: { ...spawned.topology, tags: draft.tags } };
    node.lock_hash = await computeNodeLockHash(node);
    const sealed = sealWithStructuralSharing(node) as Readonly<UnifiedNode>;
    await storage.write(sealed);
    if (embedder !== undefined && vectorStore !== undefined) {
      await embedder.registerNodeBlocks(vectorStore, sealed);
    }
    await this.delete(draftId);
    return sealed;
  }
}

interface PendingDraft {
  readonly content: string;
  readonly origin_tag?: string;
  readonly tags?: string[];
  readonly timer: ReturnType<typeof setTimeout>;
}

/** 防抖自動存：高頻 touch 僅於閒置 debounceMs 後落盤一次；flush 立即全量落盤 */
export class DraftAutoSaver {
  private readonly store: DraftStore;
  private readonly debounceMs: number;
  private readonly pending = new Map<string, PendingDraft>();

  constructor(store: DraftStore, debounceMs = 800) {
    this.store = store;
    this.debounceMs = debounceMs;
  }

  /** 隨時記錄當前進度：不清空重打，僅重排防抖計時 */
  touch(draftId: string, patch: DraftPatch): void {
    const prev = this.pending.get(draftId);
    if (prev !== undefined) clearTimeout(prev.timer);
    const timer = setTimeout(() => {
      void this.flushKey(draftId);
    }, this.debounceMs);
    timer.unref?.();
    this.pending.set(draftId, {
      content: patch.content,
      ...(patch.origin_tag !== undefined ? { origin_tag: patch.origin_tag } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      timer,
    });
  }

  /** 立即落盤全部待存草稿（關閉前、晉升前呼叫） */
  async flush(): Promise<void> {
    await Promise.all(Array.from(this.pending.keys(), (draftId) => this.flushKey(draftId)));
  }

  get pendingIds(): string[] {
    return [...this.pending.keys()];
  }

  private async flushKey(draftId: string): Promise<void> {
    const p = this.pending.get(draftId);
    if (p === undefined) return;
    clearTimeout(p.timer);
    this.pending.delete(draftId);
    const patch: { content: string; origin_tag?: string; tags?: string[] } = { content: p.content };
    if (p.origin_tag !== undefined) patch.origin_tag = p.origin_tag;
    if (p.tags !== undefined) patch.tags = p.tags;
    await this.store.save(draftId, patch);
  }
}
