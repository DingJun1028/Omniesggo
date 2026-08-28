// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Firebase 相容層 (本地模式, 零 fs 依賴) — GCP Firebase/Firestore 已停用 (力度 1, 2026-08-25)。
 *
 * 設計:
 *  - 提供與 firebase/firestore 函數式 API 相容的本地 shim:
 *    collection(db,name) / doc(...) / getDocs / getDoc / query / where / orderBy / limit
 *    / addDoc / setDoc / deleteDoc / onSnapshot / writeBatch
 *  - 儲存層: client 用 localStorage, server 用 globalThis 記憶體 (Next.js route 間共享)。
 *  - 零 fs 依賴 → 可被 client component 安全 import (不進 client bundle 的 node 原生模組)。
 *  - onSnapshot 用簡易訂閱 + BroadcastChannel (client) / EventEmitter (server) 模擬即時監聽。
 *
 * 目的: 讓 nexus / rag / omni-center 等現有 route 與 client 元件零改動切換到本地。
 */

type DocData = Record<string, unknown>;

// ── 儲存後端 ──────────────────────────────────────────────────
const isServer = typeof window === 'undefined';

function getStore(): Map<string, Record<string, DocData>> {
  if (isServer) {
    // @ts-ignore - globalThis 在 server 端持久
    if (!globalThis.__esggoLocalStore) globalThis.__esggoLocalStore = new Map();
    // @ts-ignore
    return globalThis.__esggoLocalStore as Map<string, Record<string, DocData>>;
  }
  return memoryFallback;
}

// client 端若 localStorage 不可用則用記憶體
const memoryFallback = new Map<string, Record<string, DocData>>();

function readCollection(name: string): Record<string, DocData> {
  const store = getStore();
  if (isServer) return store.get(name) ?? {};
  // client: 嘗試 localStorage
  try {
    const raw = window.localStorage.getItem(`esggo_db_${name}`);
    return raw ? (JSON.parse(raw) as Record<string, DocData>) : {};
  } catch {
    return store.get(name) ?? {};
  }
}

function writeCollection(name: string, data: Record<string, DocData>): void {
  const store = getStore();
  store.set(name, data);
  if (!isServer) {
    try {
      window.localStorage.setItem(`esggo_db_${name}`, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
  emitChange(name);
}

// ── 變更通知 ──────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function emitChange(name: string): void {
  listeners.get(name)?.forEach((cb) => cb());
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('esggo_db');
    ch.postMessage({ collection: name });
    ch.close();
  }
}

function subscribe(name: string, cb: Listener): () => void {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(cb);
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('esggo_db');
    const handler = (e: MessageEvent) => {
      if (e.data?.collection === name) cb();
    };
    ch.addEventListener('message', handler);
    return () => {
      ch.removeEventListener('message', handler);
      ch.close();
      listeners.get(name)?.delete(cb);
    };
  }
  return () => listeners.get(name)?.delete(cb);
}

// ── 查詢建構器 ───────────────────────────────────────────────
class QueryBuilder {
  constructor(
    private collection: string,
    private wheres: Array<{ field: string; op: string; value: unknown }> = [],
    private order: { field: string; dir: 'asc' | 'desc' } | null = null,
    private lim: number | null = null
  ) {}

  where(field: string, op: string, value: unknown): QueryBuilder {
    return new QueryBuilder(this.collection, [...this.wheres, { field, op, value }], this.order, this.lim);
  }
  orderBy(field: string, dir: 'asc' | 'desc' = 'desc'): QueryBuilder {
    return new QueryBuilder(this.collection, this.wheres, { field, dir }, this.lim);
  }
  limit(n: number): QueryBuilder {
    return new QueryBuilder(this.collection, this.wheres, this.order, n);
  }

  private matches(doc: DocData): boolean {
    return this.wheres.every(({ field, op, value }) => {
      const v = doc[field];
      switch (op) {
        case '==': return v === value;
        case '!=': return v !== value;
        case '>': return (v as number) > (value as number);
        case '>=': return (v as number) >= (value as number);
        case '<': return (v as number) < (value as number);
        case '<=': return (v as number) <= (value as number);
        default: return false;
      }
    });
  }

  async get(): Promise<QuerySnapshot> {
    let rows = Object.entries(readCollection(this.collection))
      .filter(([, doc]) => this.matches(doc))
      .map(([id, doc]) => ({ id, data: () => doc }));

    if (this.order) {
      const { field, dir } = this.order;
      rows.sort((a, b) => {
        const av = a.data()[field] as string | number | undefined;
        const bv = b.data()[field] as string | number | undefined;
        if (av === bv) return 0;
        const cmp = av! < bv! ? -1 : 1;
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    if (this.lim !== null) rows = rows.slice(0, this.lim);
    return new QuerySnapshot(rows);
  }
}

class QuerySnapshot {
  constructor(public docs: Array<{ id: string; data: () => DocData }>) {}
  get size(): number {
    return this.docs.length;
  }
  get empty(): boolean {
    return this.docs.length === 0;
  }
  forEach(cb: (doc: { id: string; data: () => DocData }) => void): void {
    this.docs.forEach(cb);
  }
}

// ── DocRef ────────────────────────────────────────────────────
class DocRef {
  constructor(public collection: string, public id: string) {}

  async get(): Promise<{ exists: boolean; id: string; data: () => DocData | null }> {
    const all = readCollection(this.collection);
    const doc = all[this.id];
    return { exists: !!doc, id: this.id, data: () => (doc ? doc : null) };
  }
  async set(data: DocData, _opts?: { merge?: boolean }): Promise<void> {
    const all = readCollection(this.collection);
    all[this.id] = data;
    writeCollection(this.collection, all);
  }
  async delete(): Promise<void> {
    const all = readCollection(this.collection);
    delete all[this.id];
    writeCollection(this.collection, all);
  }
}

// ── CollectionRef ─────────────────────────────────────────────
class CollectionRef {
  constructor(public name: string) {}
  doc(id: string): DocRef {
    return new DocRef(this.name, id);
  }
  async add(data: DocData): Promise<{ id: string }> {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const all = readCollection(this.name);
    all[id] = data;
    writeCollection(this.name, all);
    return { id };
  }
  where(field: string, op: string, value: unknown): QueryBuilder {
    return new QueryBuilder(this.name).where(field, op, value);
  }
  orderBy(field: string, dir: 'asc' | 'desc' = 'desc'): QueryBuilder {
    return new QueryBuilder(this.name).orderBy(field, dir);
  }
  limit(n: number): QueryBuilder {
    return new QueryBuilder(this.name).limit(n);
  }
  async get(): Promise<QuerySnapshot> {
    return new QueryBuilder(this.name).get();
  }
}

// ── 匯出相容 API ──────────────────────────────────────────────
export const db = { __local: true as const };

export function collection(_db: unknown, name: string): CollectionRef {
  return new CollectionRef(name);
}
export function doc(_db: unknown, collectionName: string, id: string): DocRef {
  return new DocRef(collectionName, id);
}
export function query(ref: QueryBuilder | CollectionRef, ...constraints: Array<(r: QueryBuilder) => QueryBuilder>): QueryBuilder {
  const builder = ref instanceof CollectionRef ? (ref as unknown as QueryBuilder) : ref;
  return constraints.reduce((acc, c) => c(acc), builder);
}
export function where(field: string, op: string, value: unknown): (r: QueryBuilder) => QueryBuilder {
  return (r: QueryBuilder) => r.where(field, op, value);
}
export function orderBy(field: string, dir: 'asc' | 'desc' = 'desc'): (r: QueryBuilder) => QueryBuilder {
  return (r: QueryBuilder) => r.orderBy(field, dir);
}
export function limit(n: number): (r: QueryBuilder) => QueryBuilder {
  return (r: QueryBuilder) => r.limit(n);
}

export async function getDocs(q: QueryBuilder | CollectionRef): Promise<QuerySnapshot> {
  const builder = q instanceof CollectionRef ? (q as unknown as QueryBuilder) : q;
  return builder.get();
}
export async function getDoc(ref: DocRef): Promise<{ exists: boolean; id: string; data: () => DocData | null }> {
  return ref.get();
}
export async function addDoc(ref: CollectionRef, data: DocData): Promise<{ id: string }> {
  return ref.add(data);
}
export async function setDoc(ref: DocRef, data: DocData): Promise<void> {
  return ref.set(data);
}
export async function updateDoc(ref: DocRef, data: DocData): Promise<void> {
  return ref.set(data, { merge: true });
}
export async function deleteDoc(ref: DocRef): Promise<void> {
  return ref.delete();
}

/**
 * onSnapshot — 模擬即時監聽 (輪詢 + BroadcastChannel)
 */
export function onSnapshot(
  ref: QueryBuilder | CollectionRef,
  callback: (snapshot: QuerySnapshot) => void,
  onError?: (error: Error) => void
): () => void {
  const builder = ref instanceof CollectionRef ? (ref as unknown as QueryBuilder) : ref;
  let stopped = false;
  const run = async () => {
    if (stopped) return;
    try {
      const snap = await builder.get();
      callback(snap);
    } catch (e) {
      onError?.(e as Error);
    }
  };
  run();
  const interval = setInterval(run, 2000) as unknown as number;
  const unsub = subscribe((builder as unknown as { collection: string }).collection, () => run());
  return () => {
    stopped = true;
    clearInterval(interval);
    unsub();
  };
}

/**
 * writeBatch — 批次寫入
 */
export function writeBatch(_db: unknown): {
  set: (ref: DocRef, data: DocData) => void;
  delete: (ref: DocRef) => void;
  commit: () => Promise<void>;
} {
  const ops: Array<() => void> = [];
  return {
    set: (ref, data) => ops.push(() => void ref.set(data)),
    delete: (ref) => ops.push(() => void ref.delete()),
    commit: async () => {
      ops.forEach((op) => op());
    },
  };
}
