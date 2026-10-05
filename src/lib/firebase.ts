// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Firebase 相容層 (Supabase Adapter) — GCP Firebase 已停用，改由 Supabase 接手。
 * 
 * 此檔案透過封裝 Supabase JS Client 來模擬 Firebase Firestore 的 API，
 * 讓既有的 23+ 個依賴 Firebase 語法的元件不需大幅重構即可無縫切換到 Supabase Postgres。
 */

import { supabase } from './supabase-client';

type DocData = Record<string, unknown>;

class QueryBuilder {
  constructor(
    public collection: string,
    public wheres: Array<{ field: string; op: string; value: unknown }> = [],
    public order: { field: string; dir: 'asc' | 'desc' } | null = null,
    public lim: number | null = null
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

  async get(): Promise<QuerySnapshot> {
    let q = supabase.from(this.collection).select('*');
    for (const w of this.wheres) {
      if (w.op === '==') q = q.eq(w.field, w.value);
      if (w.op === '!=') q = q.neq(w.field, w.value);
      if (w.op === '>') q = q.gt(w.field, w.value);
      if (w.op === '>=') q = q.gte(w.field, w.value);
      if (w.op === '<') q = q.lt(w.field, w.value);
      if (w.op === '<=') q = q.lte(w.field, w.value);
    }
    if (this.order) {
      q = q.order(this.order.field, { ascending: this.order.dir === 'asc' });
    }
    if (this.lim !== null) {
      q = q.limit(this.lim);
    }

    const { data, error } = await q;
    if (error) {
      console.error(`Supabase query error on ${this.collection}:`, error);
      return new QuerySnapshot([]);
    }

    return new QuerySnapshot((data || []).map((row: any) => ({
      id: row.id,
      data: () => row
    })));
  }
}

class QuerySnapshot {
  constructor(public docs: Array<{ id: string; data: () => DocData }>) {}
  get size(): number { return this.docs.length; }
  get empty(): boolean { return this.docs.length === 0; }
  forEach(cb: (doc: { id: string; data: () => DocData }) => void): void {
    this.docs.forEach(cb);
  }
}

class DocRef {
  constructor(public collection: string, public id: string) {}

  async get(): Promise<{ exists: boolean; id: string; data: () => DocData | null }> {
    const { data, error } = await supabase.from(this.collection).select('*').eq('id', this.id).single();
    if (error || !data) return { exists: false, id: this.id, data: () => null };
    return { exists: true, id: this.id, data: () => data };
  }
  async set(data: DocData, opts?: { merge?: boolean }): Promise<void> {
    if (opts?.merge) {
      await supabase.from(this.collection).update(data).eq('id', this.id);
    } else {
      await supabase.from(this.collection).upsert({ id: this.id, ...data });
    }
  }
  async delete(): Promise<void> {
    await supabase.from(this.collection).delete().eq('id', this.id);
  }
}

class CollectionRef {
  constructor(public name: string) {}
  doc(id: string): DocRef { return new DocRef(this.name, id); }
  
  async add(data: DocData): Promise<{ id: string }> {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await supabase.from(this.name).insert({ id, ...data });
    return { id };
  }
  where(field: string, op: string, value: unknown): QueryBuilder { return new QueryBuilder(this.name).where(field, op, value); }
  orderBy(field: string, dir: 'asc' | 'desc' = 'desc'): QueryBuilder { return new QueryBuilder(this.name).orderBy(field, dir); }
  limit(n: number): QueryBuilder { return new QueryBuilder(this.name).limit(n); }
  async get(): Promise<QuerySnapshot> { return new QueryBuilder(this.name).get(); }
}

export const db = { __local: false, __supabase: true as const };

export function collection(_db: unknown, name: string): CollectionRef { return new CollectionRef(name); }
export function doc(_db: unknown, collectionName: string, id: string): DocRef { return new DocRef(collectionName, id); }

export function query(ref: QueryBuilder | CollectionRef, ...constraints: Array<(r: QueryBuilder) => QueryBuilder>): QueryBuilder {
  let builder = ref instanceof CollectionRef ? new QueryBuilder(ref.name) : ref;
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
  const builder = q instanceof CollectionRef ? new QueryBuilder(q.name) : q;
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
 * onSnapshot — 將 Firestore 的即時監聽映射到 Supabase Realtime Channel
 */
export function onSnapshot(
  ref: QueryBuilder | CollectionRef,
  callback: (snapshot: QuerySnapshot) => void,
  onError?: (error: Error) => void
): () => void {
  const collectionName = ref instanceof CollectionRef ? ref.name : ref.collection;
  const builder = ref instanceof CollectionRef ? new QueryBuilder(ref.name) : ref;
  
  // 初始載入
  builder.get().then(callback).catch(e => onError?.(e));

  // 監聽變更
  const channel = supabase
    .channel(`public:${collectionName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, () => {
      builder.get().then(callback).catch(e => onError?.(e));
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function writeBatch(_db: unknown): {
  set: (ref: DocRef, data: DocData) => void;
  delete: (ref: DocRef) => void;
  commit: () => Promise<void>;
} {
  const ops: Array<() => Promise<void>> = [];
  return {
    set: (ref, data) => { ops.push(async () => { await ref.set(data); }); },
    delete: (ref) => { ops.push(async () => { await ref.delete(); }); },
    commit: async () => {
      for (const op of ops) await op();
    },
  };
}
