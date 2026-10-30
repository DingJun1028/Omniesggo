/**
 * OmniTime — 時空裂縫 (維度一: 物理空間與記憶)
 *
 * 事件溯源 (Event Sourcing) + 重放: append-only 事件流, 可依時間區間重放,
 * 支援快照隔離 (細胞分裂 R5 前狀態保存的基礎)。
 */
import { deepFreeze } from '@esggo/omni-core';
import { OmniArchError } from './types';
import type { BusEvent } from './types';

export class OmniTime {
  private readonly stream: readonly BusEvent[] = [];

  append(event: BusEvent): void {
    if (!Number.isFinite(event.timestamp)) {
      throw new OmniArchError('E_INVALID_TIMESTAMP', '事件 timestamp 必須為有限數值');
    }
    (this.stream as BusEvent[]).push(event);
  }

  /** 時間倒流重放: [fromTs, toTs) 區間內的事件, 依發生順序 */
  replay(fromTs: number, toTs = Number.POSITIVE_INFINITY): readonly BusEvent[] {
    return this.stream.filter(
      (event) => event.timestamp >= fromTs && event.timestamp < toTs
    );
  }

  /** 快照: 目前事件流的深凍結副本 (分裂快照隔離的唯讀材料) */
  snapshot(): readonly BusEvent[] {
    return deepFreeze([...this.stream]);
  }

  eventCount(): number {
    return this.stream.length;
  }

  journalUuids(): readonly string[] {
    return this.stream.map((event) => event.uuid);
  }
}