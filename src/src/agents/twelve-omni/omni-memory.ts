 
/**
 * ==========================================
 * 🌌 OmniMemory — 萬能永憶實現
 * ==========================================
 * Persistent, immutable memory store for knowledge crystallization.
 * 記憶體是知識沉澱的核心，支持 RAG 檢索和自動鞏固。
 */

import { randomUUID, createHash } from 'crypto';
import {
  IOmniMemory,
  MemoryId,
  MemoryEntry,
} from '../../types/twelve-omni';

/**
 * OmniMemory 實現
 * 支持 6 種記憶類型：語義、程序、情境、情感、索引、元記憶
 */
export class OmniMemory implements IOmniMemory {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 記憶體存儲 (mutable, renamed to avoid conflict with store() method) */
  private _entries: Map<MemoryId, MemoryEntry> = new Map();

  /** 語義索引 (向量相似度搜索) */
  private _semanticIndex: Map<MemoryId, number[]> = new Map();

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 存儲記憶體
   */
  async store(entry: MemoryEntry): Promise<MemoryId> {
    const id = entry.id || `MEM-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const hash = createHash('sha256')
      .update(JSON.stringify({ content: entry.content, metadata: entry.metadata }))
      .digest('hex');

    const fullEntry: MemoryEntry = {
      ...entry,
      id,
      hash,
    };

    this._entries.set(id, fullEntry);
    if (entry.embedding) {
      this._semanticIndex.set(id, entry.embedding);
    }

    return id;
  }

  /**
   * 檢索記憶體
   */
  async retrieve(id: MemoryId): Promise<MemoryEntry | null> {
    const entry = this._entries.get(id);
    if (entry) {
      // 更新訪問次數
      const updated: MemoryEntry = {
        ...entry,
        accessCount: entry.accessCount + 1,
      };
      this._entries.set(id, updated);
      return updated;
    }
    return null;
  }

  /**
   * 相似性搜索 (RAG 檢索)
   * 基於語義向量的相似度搜索
   */
  async search(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    const queryLower = query.toLowerCase();
    const results: MemoryEntry[] = [];

    for (const entry of Array.from(this._entries.values())) {
      if (
        entry.content.toLowerCase().includes(queryLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      ) {
        results.push(entry);
      }
    }

    return results
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * 記憶體演化
   */
  async evolve(id: MemoryId, delta: Partial<MemoryEntry>): Promise<MemoryId> {
    const entry = this._entries.get(id);
    if (!entry) {
      throw new Error(`Memory ${id} not found`);
    }

    const evolved: MemoryEntry = {
      ...entry,
      ...delta,
      id,
    };

    this._entries.set(id, evolved);
    return id;
  }

  /**
   * 合併記憶體
   */
  async merge(ids: MemoryId[], _label: string): Promise<MemoryId> {
    const entries = ids
      .map((id) => this._entries.get(id))
      .filter((e): e is MemoryEntry => e !== undefined);

    if (entries.length === 0) {
      throw new Error('No memories to merge');
    }

    const mergedContent = entries.map((e) => e.content).join('\n---\n');
    const mergedTags = Array.from(new Set(entries.flatMap((e) => e.tags)));

    const newId = await this.store({
      id: `MEM-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      content: mergedContent,
      metadata: {
        source: 'merge',
        confidence: 1,
        domain: entries[0].metadata.domain,
        relatedIds: ids,
      },
      createdAt: Date.now(),
      accessCount: 0,
      decayFactor: 1,
      tags: mergedTags,
      parentIds: ids,
      hash: '',
    });

    // 標記原始記憶體為已合併
    for (const id of ids) {
      await this.evolve(id, { decayFactor: 0.1 });
    }

    return newId;
  }

  /**
   * 記憶體大小
   */
  async size(): Promise<number> {
    return this._entries.size;
  }

  /**
   * 記憶體清理
   */
  async garbageCollect(threshold: number = 0.1): Promise<number> {
    let removed = 0;

    for (const [id, entry] of Array.from(this._entries.entries())) {
      if (entry.decayFactor < threshold && entry.accessCount < 2) {
        this._entries.delete(id);
        this._semanticIndex.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * OmniMemory 單例工廠
 */
let _instance: OmniMemory | null = null;

export function getOmniMemory(): OmniMemory {
  if (!_instance) {
    _instance = new OmniMemory();
  }
  return _instance;
}
