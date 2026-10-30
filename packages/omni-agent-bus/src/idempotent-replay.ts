/**
 * idempotent-replay — R4 冪等重放 (時空裂縫零副作用)
 *
 * 設計哲學 (承接 @esggo/omni-core v2 PR #106 R4 缺口結論):
 *   - append-only journal: 訊息入庫即深凍結 (刻印不可篡改)
 *   - 冪等去重: 同 id 訊息重發 / 重放零副作用 (handler 恰執行一次)
 *   - 影子測試: reprocessReplayed 選項允許重放件再次執行 (隔離區盲測)
 *
 * 5T 對應: Trackable (重放軌跡可追蹤) / Trustworthy (journal 深凍結不可篡改)
 * 模組自持 (共用原語來自 ./internal/freeze.js), 不新增 workspace 依賴。
 */
import { clone, deepFreeze } from './internal/freeze.js';
import type { BusHandlerFn, BusMessage } from './types.js';

/** 重放訊息的附加標記 */
export interface ReplayedMessage<T = unknown> extends BusMessage<T> {
  /** 時空裂縫重放件: true 代表此訊息來自 replay, 而非原始流 */
  replayed: boolean;
}

export interface ReplayOptions {
  /**
   * 影子測試模式: 預設 false (已處理過的 id 重放時跳過, 零副作用);
   * true 時重放件一律執行 (隔離區盲測 / 新版 Agent 對同一數據源並行驗算)。
   */
  reprocessReplayed?: boolean;
}

/**
 * 冪等重放日誌 (append-only journal)
 *
 * - append: 刻印即深凍結, 後續對凍結件寫入會 throw (strict mode)
 * - replay: 於時間窗 [startTime, endTime] (含端點) 內重放, 可選 topic 過濾
 * - duplicateRate: 為 EntropyLedger (@esggo/omni-core R3) 提供重複事件率原始數據
 */
export class IdempotentJournal<T = unknown> {
  private readonly entries: BusMessage<T>[] = [];
  private readonly processed = new Set<string>();

  /** 訊息入庫: 深複製後凍結, 與原始可變訊息完全隔離 */
  append(msg: BusMessage<T>): Readonly<BusMessage<T>> {
    const snapshot = deepFreeze(clone(msg));
    this.entries.push(snapshot as BusMessage<T>);
    return snapshot;
  }

  /** 標記 id 已處理 (冪等去重狀態由呼叫端同步) */
  markProcessed(id: string): void {
    this.processed.add(id);
  }

  isProcessed(id: string): boolean {
    return this.processed.has(id);
  }

  /**
   * 時空裂縫重放: 預設跳過已處理 id (零副作用);
   * opts.reprocessReplayed = true 時一律執行 (影子測試)。
   * 回傳實際執行的重放件數。
   */
  async replay(
    startTime: number,
    endTime: number,
    onReplay: (msg: ReplayedMessage<T>) => void | Promise<void>,
    opts?: ReplayOptions
  ): Promise<number>;

  async replay(
    startTime: number,
    endTime: number,
    topic: string,
    onReplay: (msg: ReplayedMessage<T>) => void | Promise<void>,
    opts?: ReplayOptions
  ): Promise<number>;

  async replay(
    startTime: number,
    endTime: number,
    topicOrHandler: string | ((msg: ReplayedMessage<T>) => void | Promise<void>),
    maybeHandler?: (msg: ReplayedMessage<T>) => void | Promise<void> | ReplayOptions,
    maybeOpts?: ReplayOptions
  ): Promise<number> {
    const topic = typeof topicOrHandler === 'string' ? topicOrHandler : undefined;
    const onReplay =
      typeof topicOrHandler === 'function'
        ? topicOrHandler
        : (maybeHandler as (msg: ReplayedMessage<T>) => void | Promise<void>);
    const opts = typeof topicOrHandler === 'function' ? (maybeHandler as ReplayOptions) : maybeOpts;
    const reprocessReplayed = opts?.reprocessReplayed === true;

    let count = 0;
    for (const frozen of this.entries) {
      if (frozen.timestamp < startTime || frozen.timestamp > endTime) continue;
      if (topic !== undefined && frozen.topic !== topic) continue;
      if (!reprocessReplayed && this.processed.has(frozen.id)) continue;
      this.processed.add(frozen.id);
      const replayMsg = clone(frozen) as ReplayedMessage<T>;
      replayMsg.replayed = true;
      // 重放必須按刻印順序逐一執行 (時空軸還原語義), 故意循序 await
      await onReplay(replayMsg); // NOSONAR
      count += 1;
    }
    return count;
  }

  /** 重複事件率 (重複 id 佔比, 0 最佳) — EntropyLedger R3 的原始數據源 */
  duplicateRate(): number {
    const seen = new Set<string>();
    let duplicates = 0;
    for (const entry of this.entries) {
      if (seen.has(entry.id)) {
        duplicates += 1;
      } else {
        seen.add(entry.id);
      }
    }
    return this.entries.length === 0 ? 0 : duplicates / this.entries.length;
  }

  size(): number {
    return this.entries.length;
  }
}

/**
 * 冪等 handler 包裝器: 同 id 的 BusMessage 只執行一次。
 * 與 OmniAgentBus.subscribe 直接相容:
 *   bus.subscribe('topic', wrapIdempotent(handler))
 * reprocessReplayed = true 時, 重放件 (msg.replayed === true) 允許再次執行。
 */
export function wrapIdempotent<T = unknown>(
  handler: BusHandlerFn<T>,
  opts?: ReplayOptions
): BusHandlerFn<T> {
  const processed = new Set<string>();
  return async (msg: BusMessage<T>) => {
    const isReplay = (msg as ReplayedMessage<T>).replayed === true;
    const key = opts?.reprocessReplayed && isReplay ? `${msg.id}#replay` : msg.id;
    if (processed.has(key)) return;
    processed.add(key);
    await handler(msg);
  };
}
