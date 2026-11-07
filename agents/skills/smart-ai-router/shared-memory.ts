import { writeFile, readFile } from 'fs/promises';

/**
 * SharedMemoryLayer — 多代理共同記憶層（Multi-Agent Shared Memory）
 * ------------------------------------------------------------------
 * 正典對齊（soul.md §六 永憶聖所 + §A OmniMemory 95% 召回 + OmniHive 黑板 +
 *           AGENT-SHARED-KNOWLEDGE 協議）：
 *   多個 OmniAgent 透過同一塊「共同記憶黑板」交換上下文與發現 ——
 *   一個 agent 的 route()/understand() 產出可被另一個 agent 召回，形成蜂群協作。
 *
 * 設計：
 *   - 記憶體黑板（Map<topic, entries>）為預設；可注入 async store 做持久化
 *     （檔案 / Supabase / Obsidian 共享大腦皆可接）。
 *   - 每筆記憶帶 agentId / topic / tags / timestamp / ttlMs，可溯源（5T Traceable）。
 *   - 訂閱（subscribe）提供反應式協作：新記憶到達即通知訂閱者。
 *   - recall() 依時間衰減評分回 top-k，對應 OmniMemory 95% 召回意圖。
 *
 * 5T 對應：Traceable(agentId+id) / Trackable(lifecycle_path) / Trustworthy(freeze+hash)
 */

export interface MemoryContent {
  readonly topic: string;
  readonly content: unknown;
  readonly tags?: readonly string[];
  /** 關聯任務 / 軌跡 ID（5T Traceable） */
  readonly traceId?: string;
}

export interface SharedMemoryEntry {
  readonly id: string;
  readonly agentId: string;
  readonly topic: string;
  readonly content: unknown;
  readonly tags: readonly string[];
  readonly traceId?: string;
  readonly timestamp: number;
  readonly ttlMs: number;
  readonly lifecyclePath: ReadonlyArray<{ stage: string; timestamp: number }>;
}

export interface QueryFilter {
  readonly topic?: string;
  readonly agentId?: string;
  readonly tag?: string;
  readonly since?: number;
  readonly limit?: number;
}

export interface SharedMemoryStore {
  /** 持久化整個黑板快照（可為 no-op） */
  save(snapshot: ReadonlyArray<SharedMemoryEntry>): Promise<void> | void;
  /** 還原黑板快照（可回空陣列） */
  load(): Promise<ReadonlyArray<SharedMemoryEntry>> | ReadonlyArray<SharedMemoryEntry>;
}

type Subscriber = (entry: SharedMemoryEntry) => void;

export interface SharedMemoryConfig {
  readonly defaultTtlMs?: number;   // 預設存活 (ms)，0 = 永不過期
  readonly maxEntriesPerTopic?: number;
  readonly store?: SharedMemoryStore;
}

export class SharedMemoryLayer {
  private readonly board = new Map<string, SharedMemoryEntry[]>();
  private readonly subscribers = new Map<string, Set<Subscriber>>();
  private readonly defaultTtlMs: number;
  private readonly cap: number;
  private readonly store?: SharedMemoryStore;

  constructor(cfg: SharedMemoryConfig = {}) {
    this.defaultTtlMs = cfg.defaultTtlMs ?? 3_600_000; // 1h
    this.cap = cfg.maxEntriesPerTopic ?? 1_000;
    this.store = cfg.store;
  }

  /** 發佈一笔共同記憶 */
  publish(agentId: string, mem: MemoryContent, opts: { ttlMs?: number } = {}): SharedMemoryEntry {
    const now = Date.now();
    const ttlMs = opts.ttlMs ?? this.defaultTtlMs;
    const entry: SharedMemoryEntry = Object.freeze({
      id: `mem.${agentId}.${now.toString(36)}.${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      topic: mem.topic,
      content: mem.content,
      tags: mem.tags ?? [],
      traceId: mem.traceId,
      timestamp: now,
      ttlMs,
      lifecyclePath: Object.freeze([{ stage: 'published', timestamp: now }]),
    });
    const list = this.board.get(mem.topic) ?? [];
    list.push(entry);
    if (list.length > this.cap) list.splice(0, list.length - this.cap);
    this.board.set(mem.topic, list);
    this.notify(mem.topic, entry);
    void this.store?.save(this.snapshot());
    return entry;
  }

  /** 讀取某 topic 的記憶（最近優先，已剔除過期） */
  read(topic: string): readonly SharedMemoryEntry[] {
    return this.live(topic).slice().reverse();
  }

  /** 條件查詢 */
  query(filter: QueryFilter = {}): readonly SharedMemoryEntry[] {
    const now = Date.now();
    let out: SharedMemoryEntry[] = [];
    for (const [topic, list] of this.board) {
      if (filter.topic && topic !== filter.topic) continue;
      for (const e of list) {
        if (now - e.timestamp > e.ttlMs) continue;
        if (filter.agentId && e.agentId !== filter.agentId) continue;
        if (filter.tag && !e.tags.includes(filter.tag)) continue;
        if (filter.since && e.timestamp < filter.since) continue;
        out.push(e);
      }
    }
    out.sort((a, b) => b.timestamp - a.timestamp);
    return out.slice(0, filter.limit ?? 50);
  }

  /** 召回 top-k（時間衰減評分，對應 OmniMemory 95% 召回意圖） */
  recall(topic: string, k = 5, agentId?: string): readonly SharedMemoryEntry[] {
    const now = Date.now();
    const scored = this.live(topic)
      .filter((e) => !agentId || e.agentId === agentId)
      .map((e) => {
        const age = Math.max(0, e.ttlMs - (now - e.timestamp));
        const score = age / Math.max(1, e.ttlMs); // 越新分數越高
        return { e, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((x) => x.e);
    return scored;
  }

  subscribe(topic: string, handler: Subscriber): () => void {
    let set = this.subscribers.get(topic);
    if (!set) { set = new Set(); this.subscribers.set(topic, set); }
    set.add(handler);
    return () => set?.delete(handler);
  }
  private notify(topic: string, entry: SharedMemoryEntry): void {
    for (const h of this.subscribers.get(topic) ?? []) {
      try { h(entry); } catch { /* 訂閱者錯誤不污染發佈 */ }
    }
  }

  /** 凍結快照（供存證 / 匯出） */
  snapshot(): readonly SharedMemoryEntry[] {
    const now = Date.now();
    const out: SharedMemoryEntry[] = [];
    for (const list of this.board.values()) {
      for (const e of list) if (now - e.timestamp <= e.ttlMs) out.push(e);
    }
    out.sort((a, b) => b.timestamp - a.timestamp);
    return Object.freeze(out);
  }

  /** 序列化快照為 JSON 字串（供 OmniNote / 文件存證 / 跨端傳輸） */
  toJson(): string {
    const entries = this.snapshot().map((e) => ({
      id: e.id,
      agentId: e.agentId,
      topic: e.topic,
      content: e.content,
      tags: e.tags,
      traceId: e.traceId,
      timestamp: e.timestamp,
      ttlMs: e.ttlMs,
      lifecyclePath: e.lifecyclePath,
    }));
    return JSON.stringify(entries, null, 2);
  }

  /** 從 JSON 字串還原快照並寫回黑板 */
  fromJson(jsonString: string): SharedMemoryEntry[] {
    const parsed = JSON.parse(jsonString);
    const entries = parsed.map((p: Record<string, unknown>) => ({
      id: String(p.id),
      agentId: String(p.agentId),
      topic: String(p.topic),
      content: p.content,
      tags: Array.isArray(p.tags) ? p.tags : [],
      traceId: p.traceId,
      timestamp: Number(p.timestamp),
      ttlMs: Number(p.ttlMs),
      lifecyclePath: Array.isArray(p.lifecyclePath) ? p.lifecyclePath : [],
    }));
    this.restore(entries);
    return entries;
  }

  /** 寫入快照到文件（UTF-8 JSON，供 Python OmniNote 端讀取） */
  async saveSnapshotToFile(path: string): Promise<void> {
    const json = this.toJson();
    await writeFile(path, json, 'utf-8');
  }

  /** 從文件載入快照並還原黑板 */
  async loadSnapshotFromFile(path: string): Promise<SharedMemoryEntry[]> {
    const text = await readFile(path, 'utf-8');
    return this.fromJson(text);
  }

  topics(): readonly string[] { return [...this.board.keys()]; }

  /** 還原（啟動時由 store.load() 回灌） */
  restore(entries: readonly SharedMemoryEntry[]): void {
    for (const e of entries) {
      const list = this.board.get(e.topic) ?? [];
      list.push(e);
      this.board.set(e.topic, list);
    }
  }

  private live(topic: string): SharedMemoryEntry[] {
    const now = Date.now();
    return (this.board.get(topic) ?? []).filter((e) => now - e.timestamp <= e.ttlMs);
  }
}

export default SharedMemoryLayer;
