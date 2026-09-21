/**
 * @esggo/omni-memory v1.0.0
 *
 * L0-L3 4 層記憶 + 3 軸持久化 (TencentDB / GBrain / Obsidian Vault)
 * MECE 角色: 記憶層 (Trust Hash Lock 不可篡改)
 *
 * 設計: 純抽象介面 + InMemoryStorage stub (本機可用, 不需真後端)
 *       真實 TencentDB / GBrain / Obsidian 整合需在本機或 VPS 環境
 */

import {
  createComponentCore,
  sealComponentCore,
  type IComponentCore,
} from '@esggo/omni-core';
import type { OmniTag } from '@esggo/omni-tag';

export type MemoryLayer = 'L0' | 'L1' | 'L2' | 'L3';

export interface Memory extends IComponentCore {
  content: string;
  layer: MemoryLayer;
  tags: OmniTag[];
  vector?: number[]; // semantic embedding (optional)
  links?: string[]; // related memory uuids
}

export interface MemoryQuery {
  query: string;
  layers?: MemoryLayer[];
  tags?: OmniTag[];
  limit?: number;
}

/**
 * 抽象 Storage 介面 (Vector + Graph + Temporal 三軸)
 */
export interface IStorage {
  store(memory: Readonly<Memory>): Promise<void>;
  recall(query: MemoryQuery): Promise<Memory[]>;
  link(fromUuid: string, toUuid: string): Promise<void>;
  replay(fromTimestamp: number, toTimestamp: number): Promise<Memory[]>;
}

/**
 * 預設 InMemoryStorage (本機測試 + sandbox 用)
 */
export class InMemoryStorage implements IStorage {
  private memories = new Map<string, Memory>();

  async store(memory: Readonly<Memory>): Promise<void> {
    this.memories.set(memory.uuid, { ...memory });
  }

  async recall(query: MemoryQuery): Promise<Memory[]> {
    let results = [...this.memories.values()];

    if (query.layers) {
      results = results.filter((m) => query.layers!.includes(m.layer));
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((m) =>
        query.tags!.every((qt) => m.tags.some((mt) => mt.namespace === qt.namespace && mt.value === qt.value))
      );
    }

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter((m) => m.content.toLowerCase().includes(q));
    }

    return results.slice(0, query.limit ?? 100);
  }

  async link(fromUuid: string, toUuid: string): Promise<void> {
    const from = this.memories.get(fromUuid);
    if (!from) return;
    from.links = [...(from.links || []), toUuid];
  }

  async replay(fromTimestamp: number, toTimestamp: number): Promise<Memory[]> {
    return [...this.memories.values()].filter(
      (m) => m.timestamp > fromTimestamp && m.timestamp <= toTimestamp
    );
  }
}

/**
 * OmniMemory 高階 API
 */
export class OmniMemory {
  constructor(private storage: IStorage = new InMemoryStorage()) {}

  /**
   * L0-L3 記憶儲存 (自動 seal Trustworthy)
   */
  async store(
    content: string,
    layer: MemoryLayer,
    tags: OmniTag[] = []
  ): Promise<Readonly<Memory>> {
    const core = createComponentCore(`omni-memory://${layer}/store`);
    const sealed = await sealComponentCore(core);

    const memory: Memory = {
      ...sealed,
      content,
      layer,
      tags,
      links: [],
    };

    await this.storage.store(memory);
    return memory;
  }

  /**
   * semantic recall + tag filtering + layer scoping
   */
  async recall(query: MemoryQuery): Promise<Readonly<Memory>[]> {
    return this.storage.recall(query);
  }

  /**
   * Graph link (knowledge association)
   */
  async link(fromUuid: string, toUuid: string): Promise<void> {
    return this.storage.link(fromUuid, toUuid);
  }

  /**
   * Temporal replay (audit log)
   */
  async replay(from: Date, to: Date): Promise<Readonly<Memory>[]> {
    return this.storage.replay(from.getTime(), to.getTime());
  }
}

/**
 * 預設單例 (InMemoryStorage)
 */
export const omniMemory = new OmniMemory();
