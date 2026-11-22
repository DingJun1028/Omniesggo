// 共享記憶層型別 — 供 Next.js 與 Gateway 共同使用
// packages/shared/src/memory/types.ts

export interface SharedMemoryEntry {
  id: string;
  key: string;
  value: string;
  tags?: string[];
  source?: 'web' | 'gateway' | 'cron' | 'agent';
  ttlSeconds?: number;
  createdAt: string;
  updatedAt: string;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { SharedMemoryEntry as MemoryEntry };

export interface MemoryQuery {
  key?: string;
  prefix?: string;
  tags?: string[];
  source?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryStats {
  totalEntries: number;
  totalKeys: number;
  redisConnected: boolean;
  provider: 'redis' | 'memory';
  uptimeSeconds: number;
}

export interface MemoryStore {
  get(key: string): Promise<SharedMemoryEntry | null>;
  set(key: string, value: string, opts?: { tags?: string[]; source?: string; ttlSeconds?: number }): Promise<SharedMemoryEntry>;
  delete(key: string): Promise<boolean>;
  query(q: MemoryQuery): Promise<SharedMemoryEntry[]>;
  stats(): Promise<MemoryStats>;
}
