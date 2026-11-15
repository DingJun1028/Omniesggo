/**
 * OmniBus — 總線 + 背壓監聽 (維度三: 動態驅動通訊)
 *
 * OAB 事件中樞的模組級實作: 發佈/訂閱 + 背壓監聽 (高水位策略:
 * drop-oldest 或 reject), 出口事件經 egressLock Hash Lock 封裝。
 * journal 提供 uuid 序列供 OmniEvolution (R3 EntropyLedger) 計算熵指標。
 */
import { egressLock, type EgressSeal } from '@esggo/omni-core';
import { OmniArchError } from './types';
import type { BusEvent } from './types';

export type BackpressureStrategy = 'drop-oldest' | 'reject';

export interface BusOptions {
  readonly highWaterMark?: number;
  readonly strategy?: BackpressureStrategy;
}

export interface PublishResult {
  readonly delivered: number;
  readonly dropped: boolean;
  readonly seal: EgressSeal<BusEvent>;
}

type Handler = (event: Readonly<BusEvent>) => void | Promise<void>;

export class OmniBus {
  private readonly subscribers = new Map<string, Set<Handler>>();
  private readonly journal: string[] = [];
  private readonly inflight = new Map<string, number>();
  private droppedCount = 0;
  private readonly highWaterMark: number;
  private readonly strategy: BackpressureStrategy;

  constructor(options: BusOptions = {}) {
    this.highWaterMark = options.highWaterMark ?? 64;
    this.strategy = options.strategy ?? 'drop-oldest';
  }

  subscribe(topic: string, handler: Handler): () => void {
    const set = this.subscribers.get(topic) ?? new Set<Handler>();
    set.add(handler);
    this.subscribers.set(topic, set);
    return () => set.delete(handler);
  }

  async publish(event: BusEvent): Promise<PublishResult> {
    const pending = this.inflight.get(event.topic) ?? 0;
    if (pending >= this.highWaterMark) {
      if (this.strategy === 'reject') {
        throw new OmniArchError('E_BUS_SATURATED', `topic ${event.topic} 超越高水位 ${this.highWaterMark}`);
      }
      this.droppedCount += 1;
      const droppedSeal = egressLock({ ...event }, '5T-PROOF');
      return { delivered: 0, dropped: true, seal: droppedSeal };
    }
    const seal = egressLock({ ...event }, '5T-PROOF');
    this.journal.push(event.uuid);
    this.inflight.set(event.topic, pending + 1);
    try {
      const handlers = this.subscribers.get(event.topic) ?? new Set<Handler>();
      for (const handler of handlers) {
        await handler(seal.sealed);
      }
      return { delivered: handlers.size, dropped: false, seal };
    } finally {
      this.inflight.set(event.topic, (this.inflight.get(event.topic) ?? 1) - 1);
    }
  }

  journalUuids(): readonly string[] {
    return [...this.journal];
  }

  droppedEvents(): number {
    return this.droppedCount;
  }

  topicInflight(topic: string): number {
    return this.inflight.get(topic) ?? 0;
  }
}