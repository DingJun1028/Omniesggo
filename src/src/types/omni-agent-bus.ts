// OAB: 代理數據總線契約 (整合細胞分裂與時空裂縫)
// ------------------------------------------------------------
// 此介面定義 OA、OAB、OAG 三層之間的總線交互規範，
// 包含事件發布/訂閱、全域戒嚴 (Martial Law) 機制，
// 以及時空裂縫 (Replay) 用於歷史事件重放。

import { IBusEvent } from "./bus-event";

/**
 * IOmniAgentBus – 數據總線抽象介面
 *
 * - `publish(event)`  : 將 IBusEvent 廣播至 Bus，所有訂閱者皆會收到。
 * - `subscribe(topic, handler)` : 以 topic 為篩選條件註冊異步處理函式。
 * - `replayEvents(startTime, endTime, topic?)` : 於指定時間範圍內重新播送歷史事件，
 *   用於時空裂縫 (Temporal Rift) 之事件回溯與重演。
 */
export interface IOmniAgentBus {
  /** 基礎事件發佈 */
  publish(event: IBusEvent): Promise<void>;

  /** 事件訂閱 */
  subscribe(topic: string, handler: (event: IBusEvent) => Promise<void>): void;

  /**
   * 時空裂縫 – 歷史事件重放
   * @param startTime 起始 Unix 時間戳 (ms)
   * @param endTime   結束 Unix 時間戳 (ms)
   * @param topic     可選過濾條件，僅重放符合 topic 的事件
   */
  replayEvents(startTime: number, endTime: number, topic?: string): Promise<void>;
}
