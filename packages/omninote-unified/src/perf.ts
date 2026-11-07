/**
 * ============================================================================
 * 效能工程模組 — 針對「sealNode 全量凍結 GC 壓力」對症設計
 * 1. sealWithStructuralSharing：僅凍結「新建/變動分支」，未變動子樹原樣共享（零拷貝）
 * 2. Float32ArrayPool：向量記憶體池化，消除高頻註冊/查詢的 GC 抖動
 * ============================================================================
 */

/** 本引擎自行封印產物之登記表（WeakSet）：僅對登記在冊之深凍結子樹啟用 O(1) 快捷共享 */
const deepSealedRegistry = new WeakSet<object>();

/** 結構共享式深層凍結：回傳與 input 盡量共享未變動子樹的凍結版本 */
export function sealWithStructuralSharing<T>(value: T): Readonly<T> {
  return sealNode(value, new Map<unknown, unknown>());
}

function sealNode(value: any, seen: Map<unknown, unknown>): any {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  // 不變量：登記在冊者必為本引擎產出之深層凍結子樹 → 直接共享（O(1)，零走訪零配置）。
  if (Object.isFrozen(value) && deepSealedRegistry.has(value)) {
    seen.set(value, value);
    return value;
  }
  if (Array.isArray(value)) return sealArray(value, seen);
  return sealObject(value, seen);
}

function sealArray(value: readonly unknown[], seen: Map<unknown, unknown>): any {
  const out: unknown[] = [];
  let changed = !Object.isFrozen(value);
  for (const child of value) {
    const sealedChild = sealNode(child, seen);
    out.push(sealedChild);
    if (sealedChild !== child) changed = true;
  }
  const result = changed || !Object.isFrozen(value) ? Object.freeze(out) : value;
  deepSealedRegistry.add(result);
  seen.set(value, result);
  return result;
}

function sealObject(value: any, seen: Map<unknown, unknown>): any {

  const keys = Object.keys(value);
  const sealedEntries: Record<string, unknown> = {};
  let changed = !Object.isFrozen(value);
  for (const k of keys) {
    const sealedChild = sealNode(value[k], seen);
    sealedEntries[k] = sealedChild;
    if (sealedChild !== value[k]) changed = true;
  }
  // 完全未變動且已凍結 → 共享原物件（零拷貝、零 GC）
  if (!changed) {
    deepSealedRegistry.add(value);
    seen.set(value, value);
    return value;
  }
  const result = Object.freeze(sealedEntries);
  deepSealedRegistry.add(result);
  seen.set(value, result);
  return result;
}

/**
 * Float32Array 記憶體池：向量註冊時向池承租，淘汰時歸還復用。
 * 避免高頻 Top-K 查詢與重嵌入時 TypedArray 反覆配置觸發 GC。
 */
export class Float32ArrayPool {
  private readonly pool: Float32Array[] = [];
  private readonly live = new Set<Float32Array>();
  rented = 0;
  reused = 0;

  constructor(public readonly dim: number, prealloc = 64) {
    for (let i = 0; i < prealloc; i++) this.pool.push(new Float32Array(dim));
  }

  acquire(): Float32Array {
    const buf = this.pool.pop();
    if (buf) { this.reused++; this.live.add(buf); return buf; }
    const fresh = new Float32Array(this.dim);
    this.rented++;
    this.live.add(fresh);
    return fresh;
  }

  release(buf: Float32Array): void {
    if (this.live.delete(buf)) { buf.fill(0); this.pool.push(buf); }
  }
}
