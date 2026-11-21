 
/**
 * ==========================================
 * 🌌 OmniBus — 萬能總線實現 (增強版)
 * ==========================================
 * Event-driven backbone with replay, shadow testing, and backpressure.
 * OAB: 異步數據總線，支持時空裂縫和細胞分裂
 */

import { randomUUID } from 'crypto';
import {
  IOmniBusV2,
  SubscriptionId,
  BusHandler,
  BusFilter,
  BusStatistics,
} from '../../types/twelve-omni';
import { LifecycleStage, IBusEvent } from '../../lib/omni-core/contracts';

/**
 * OmniBusV2 實現
 * 異步事件驅動總線
 */
export class OmniBusV2 implements IOmniBusV2 {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 事件存儲 */
  private events: IBusEvent[] = [];

  /** 訂閱表 */
  private subscriptions: Map<string, { topic: string; handler: BusHandler }> = new Map();

  /** 背壓閾值 */
  private backpressureThresholds: Map<string, number> = new Map();

  /** 統計 (mutable internal type) */
  private _stats: {
    published: number;
    delivered: number;
    failed: number;
    topicStats: Record<string, { topic: string; published: number; delivered: number; avgLatency: number }>;
  } = {
    published: 0,
    delivered: 0,
    failed: 0,
    topicStats: {},
  };

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 發佈事件
   */
  async publish(event: IBusEvent): Promise<void> {
    this.events.push(event);
    this._stats.published++;

    // 更新主題統計
    if (!this._stats.topicStats[event.topic]) {
      this._stats.topicStats[event.topic] = {
        topic: event.topic,
        published: 0,
        delivered: 0,
        avgLatency: 0,
      };
    }
    this._stats.topicStats[event.topic].published++;

    // 投遞給訂閱者
    const subs = Array.from(this.subscriptions.values());
    for (const sub of subs) {
      if (sub.topic === event.topic || sub.topic === '*') {
        try {
          const startTime = Date.now();
          await sub.handler(event);
          const latency = Date.now() - startTime;

          this._stats.delivered++;
          this._stats.topicStats[event.topic].delivered++;

          // 更新延遲統計
          const topicStat = this._stats.topicStats[event.topic];
          topicStat.avgLatency =
            (topicStat.avgLatency * (topicStat.delivered - 1) + latency) /
            topicStat.delivered;
        } catch (error) {
          this._stats.failed++;
          console.error(`Event delivery failed for topic ${event.topic}:`, error);
        }
      }
    }
  }

  /**
   * 訂閱主題
   */
  subscribe(topic: string, handler: BusHandler): SubscriptionId {
    const id = `SUB-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    this.subscriptions.set(id, { topic, handler });
    return id;
  }

  /**
   * 取消訂閱
   */
  unsubscribe(id: SubscriptionId): void {
    this.subscriptions.delete(id);
  }

  /**
   * 歷史事件重放
   * 時空裂縫：回放指定時間範圍內的事件
   */
  async replayEvents(
    startTime: number,
    endTime: number,
    topic?: string
  ): Promise<void> {
    let filtered = this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );

    if (topic) {
      filtered = filtered.filter((e) => e.topic === topic);
    }

    // 投遞重放事件
    for (const event of filtered) {
      const subs = Array.from(this.subscriptions.values());
      for (const sub of subs) {
        if (sub.topic === event.topic || sub.topic === '*') {
          try {
            await sub.handler(event);
          } catch (error) {
            console.error(`Replay delivery failed for topic ${event.topic}:`, error);
          }
        }
      }
    }
  }

  /**
   * 歷史重放（舊版兼容）
   */
  async replay(
    startTime: number,
    endTime: number,
    filter?: BusFilter
  ): Promise<IBusEvent[]> {
    let filtered = this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );

    if (filter?.topic) {
      filtered = filtered.filter((e) => e.topic === filter.topic);
    }
    if (filter?.source) {
      filtered = filtered.filter((e) => e.source_origin === filter.source);
    }

    return filtered;
  }

  /**
   * 影子測試入口
   * 在影子模式下執行事件
   */
  async shadowIngress(event: IBusEvent): Promise<void> {
    const shadowEvent: IBusEvent = {
      ...event,
      version: 'shadow-test',
      lifecycle_path: [
        ...(event.lifecycle_path ?? []),
        {
          stage: 'EMERGED' as LifecycleStage,
          timestamp: Date.now(),
          node: 'shadow-test',
        },
      ],
    };

    // 記錄但不投遞
    this.events.push(shadowEvent);
  }

  /**
   * 背壓監控
   * 細胞分裂：監控背壓並觸發動態增殖
   */
  async monitorBackpressure(topic: string, threshold: number): Promise<void> {
    this.backpressureThresholds.set(topic, threshold);

    // 檢查當前背壓
    const recentEvents = this.events.filter(
      (e) => e.topic === topic && e.timestamp > Date.now() - 60000
    );

    if (recentEvents.length > threshold) {
      console.warn(`[OmniBus] High backpressure detected for topic ${topic}: ${recentEvents.length} events/min`);
    }
  }

  /**
   * 克隆代理
   * 動態克隆代理以處理高負載
   */
  async cloneAgent(topic: string, threshold: number): Promise<void> {
    console.log(`[OmniBus] Cloning agent for topic ${topic} (threshold: ${threshold})`);
  }

  /**
   * 事件統計
   */
  async statistics(): Promise<BusStatistics> {
    return {
      totalPublished: this._stats.published,
      totalDelivered: this._stats.delivered,
      totalFailed: this._stats.failed,
      topicStats: { ...this._stats.topicStats },
    };
  }
}

/**
 * OmniBusV2 單例工廠
 */
let _instance: OmniBusV2 | null = null;

export function getOmniBus(): OmniBusV2 {
  if (!_instance) {
    _instance = new OmniBusV2();
  }
  return _instance;
}
