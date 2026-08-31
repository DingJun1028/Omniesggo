/**
 * 5T 合規事件驅動架構 (增量優化版) — 圣典 §12.1.1
 * Traceable: 記錄事件來源 | Trackable: 事件流增量寫入
 * Transparent: 廣播可查 | Trustworthy: Object.freeze 防篡改
 */
import { StreamBuffer, hashLock, generateTraceableId, TraceableRecord } from './stream-buffer.js';

export type DomainEvent<T = unknown> = TraceableRecord & { payload: T };

export class EventBus {
  private readonly eventLog = new StreamBuffer<DomainEvent>();
  private readonly streamBuffer = new StreamBuffer<DomainEvent>();

  async publish<T>(source: string, payload: T): Promise<string> {
    const id = generateTraceableId(source); // Traceable
    const ev: DomainEvent<T> = hashLock({ id, source, timestamp: Date.now(), payload }); // Trustworthy
    this.streamBuffer.append(ev); // Trackable (增量寫入)
    this.eventLog.append(ev);
    return id;
  }

  async getEvents(since: number): Promise<DomainEvent[]> {
    return this.streamBuffer.getDelta(since); // 增量輸出: 僅返回變更事件
  }

  /** Transparent: 廣播事件 (壓縮傳輸由呼叫方處理) */
  getLogSize(): number {
    return this.eventLog.size;
  }
}
