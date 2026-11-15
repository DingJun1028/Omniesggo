/**
 * OmniMemory — 群體知識聖所 (維度一: 物理空間與記憶)
 *
 * 群體層記憶 (與 OmniUserRegistry 個體層互補): 每筆記憶以 IComponentCore
 * 刻印 + sealComponentCore Hash Lock 封存, 之後不可篡改 (5T Trustworthy)。
 */
import {
  createComponentCore,
  sealComponentCore,
  type IComponentCore,
} from '@esggo/omni-core';

export interface MemoryRecord {
  readonly core: IComponentCore;
  readonly value: unknown;
  readonly tags: readonly string[];
}

export class OmniMemory {
  private readonly records: MemoryRecord[] = [];

  async remember(
    source_origin: string,
    value: unknown,
    tags: readonly string[] = []
  ): Promise<Readonly<MemoryRecord>> {
    const core = createComponentCore(source_origin);
    const sealed = await sealComponentCore(core);
    const record: MemoryRecord = Object.freeze({
      core: sealed,
      value,
      tags: Object.freeze([...tags]),
    });
    this.records.push(record);
    return record;
  }

  recall(predicate: (record: Readonly<MemoryRecord>) => boolean): readonly MemoryRecord[] {
    return this.records.filter(predicate);
  }

  byTag(tag: string): readonly MemoryRecord[] {
    return this.records.filter((record) => record.tags.includes(tag));
  }

  size(): number {
    return this.records.length;
  }
}