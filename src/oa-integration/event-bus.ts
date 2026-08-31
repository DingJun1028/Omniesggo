/**
 * §12.1.1 事件驅動架構 (Event-Driven Architecture)
 * 5T: Traceable (sourceOrigin) + Trackable (eventLog)
 */
import { type FiveT, hashLock, freeze, uuidV4, OA_VERSION } from './types';

export interface DomainEvent<T = unknown> {
  readonly id: string;
  readonly source: string;
  readonly timestamp: number;
  readonly payload: Readonly<T>;
}

type Handler<T = unknown> = (e: DomainEvent<T>) => void | Promise<void>;

export class EventBus {
  private readonly eventLog = new Map<string, DomainEvent>();
  private readonly handlers = new Map<string, Set<Handler>>();

  /** Traceable: 記錄事件來源並凍結 payload (Trustworthy) */
  async publish<T>(topic: string, source: string, payload: T): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = freeze({
      id: uuidV4(),
      source,
      timestamp: Date.now(),
      payload: freeze(payload as object) as T,
    });
    this.eventLog.set(event.id, event);
    const subs = this.handlers.get(topic);
    if (subs) {
      for (const h of subs) await h(event);
    }
    return event;
  }

  subscribe<T>(topic: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler as Handler);
    return () => this.handlers.get(topic)!.delete(handler as Handler);
  }

  /** Trackable: 回放事件流 */
  getStream(): ReadonlyArray<DomainEvent> {
    return freeze([...this.eventLog.values()]);
  }

  verifyFiveT(): FiveT {
    return 'Traceable';
  }
}
