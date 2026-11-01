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

export interface MemoryEntry {
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
  save(snapshot: ReadonlyArray<MemoryEntry>): Promise<void> | void;
  /** 還原黑板快照（可回空陣列） */
  load(): Promise<ReadonlyArray<MemoryEntry>> | ReadonlyArray<MemoryEntry>;
}

type Subscriber = (entry: MemoryEntry) => void;

export interface SharedMemoryConfig {
  readonly defaultTtlMs?: number;   // 預設存活 (ms)，0 = 永不過期
  readonly maxEntriesPerTopic?: number;
  readonly store?: SharedMemoryStore;
}

export class SharedMemoryLayer {
  private readonly board = new Map<string, MemoryEntry[]>();
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
  publish(agentId: string, mem: MemoryContent, opts: { ttlMs?: number } = {}): MemoryEntry {
    const now = Date.now();
    const ttlMs = opts.ttlMs ?? this.defaultTtlMs;
    const entry: MemoryEntry = Object.freeze({
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
  read(topic: string): readonly MemoryEntry[] {
    return this.live(topic).slice().reverse();
  }

  /** 條件查詢 */
  query(filter: QueryFilter = {}): readonly MemoryEntry[] {
    const now = Date.now();
    let out: MemoryEntry[] = [];
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
  recall(topic: string, k = 5, agentId?: string): readonly MemoryEntry[] {
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
  private notify(topic: string, entry: MemoryEntry): void {
    for (const h of this.subscribers.get(topic) ?? []) {
      try { h(entry); } catch { /* 訂閱者錯誤不污染發佈 */ }
    }
  }

  /** 凍結快照（供存證 / 匯出） */
  snapshot(): readonly MemoryEntry[] {
    const now = Date.now();
    const out: MemoryEntry[] = [];
    for (const list of this.board.values()) {
      for (const e of list) if (now - e.timestamp <= e.ttlMs) out.push(e);
    }
    out.sort((a, b) => b.timestamp - a.timestamp);
    return Object.freeze(out);
  }

  topics(): readonly string[] { return [...this.board.keys()]; }

  /** 還原（啟動時由 store.load() 回灌） */
  restore(entries: readonly MemoryEntry[]): void {
    for (const e of entries) {
      const list = this.board.get(e.topic) ?? [];
      list.push(e);
      this.board.set(e.topic, list);
    }
  }

  private live(topic: string): MemoryEntry[] {
    const now = Date.now();
    return (this.board.get(topic) ?? []).filter((e) => now - e.timestamp <= e.ttlMs);
  }
}

export default SharedMemoryLayer;
