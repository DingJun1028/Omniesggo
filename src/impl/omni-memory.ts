export type ImplMemoryEntry = {
  readonly id: string;
  readonly query: string;
  readonly document: string;
  readonly createdAt: number;
};
// ts-matrix: 對外相容別名 (API 不變)
export type { ImplMemoryEntry as MemoryEntry };

export class OmniMemory {
  private readonly store = new Map<string, ImplMemoryEntry>();
  private readonly index = new Map<string, Set<string>>();
  private counter = 0;

  memorize(query: string, document: string): ImplMemoryEntry {
    this.counter++;
    const id = `mem-${Date.now()}-${this.counter.toString(36)}`;
    const entry = Object.freeze({
      id,
      query,
      document,
      createdAt: Date.now(),
    } as ImplMemoryEntry);

    this.store.set(id, entry);
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    for (const word of words) {
      const bucket = this.index.get(word) ?? new Set<string>();
      bucket.add(id);
      this.index.set(word, bucket);
    }

    return entry;
  }

  recall(query: string, limit = 20): ReadonlyArray<ImplMemoryEntry> {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = new Map<string, number>();

    for (const word of words) {
      const bucket = this.index.get(word);
      if (!bucket) continue;
      bucket.forEach((id: string) => {
        hits.set(id, (hits.get(id) ?? 0) + 1);
      });
    }

    const ranked = Array.from(hits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.store.get(id))
      .filter((entry): entry is ImplMemoryEntry => !!entry);

    return Object.freeze(ranked);
  }
}
