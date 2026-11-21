// Backpressure Monitor – 奇效七補充：監聽指定 Bus 主題的負載背壓
// ------------------------------------------------------------
// 此模組提供 `monitorBackpressure`，用於監控 OmniAgent Bus 上特定 topic
// 的事件累積量（背壓）。若在統計間隔內接收到的事件數量超過
// 使用者提供的 `threshold`，將在 console 中發出警告，並可結合
// 先前的細胞分裂機制自行調整實例數量。
//
// 使用方式（範例）：
//   import { monitorBackpressure } from "./backpressure-monitor";
//   import { omniBus } from "../agents/omni-agent-bus-instance"; // 取得已建立的 bus 實例
//   monitorBackpressure(omniBus, "data.update", 100);
//
// 目前實作僅依賴於 `IOmniAgentBus` 介面的 `subscribe` 方法，
// 因此不需要額外的外部依賴或 PM2 操作。若需要更進階的
// 動態擴容，可在警告觸發時呼叫 `cellular-division` 模組的
// `monitorAndScale` 或自行實作擴容邏輯。

import { IOmniAgentBus, IBusEvent } from "../types/omni-agent-bus";

/**
 * 監聽指定 Bus 主題的背壓（事件累積量）。
 *
 * @param bus       已建立的 OmniAgent Bus 實例
 * @param topic     需要監控的事件主題（topic）
 * @param threshold 在統計間隔內允許的最大事件數量；超過時會在
 *                  console.warn 中輸出警告訊息。
 */
export function monitorBackpressure(
  bus: IOmniAgentBus,
  topic: string,
  threshold: number
): void {
  // 事件計數器 – 每個統計窗口內累積
  let eventCount = 0;

  // 訂閱指定 topic，收到事件即遞增計數
  bus.subscribe(topic, async (_event: IBusEvent) => {
    eventCount++;
    // 此處可根據需要額外處理 event，例如寫入黑板或記錄統計
  });

  // 每 5 秒檢查一次累積量，若超過閾值則警告
  const intervalMs = 5_000;
  const timer = setInterval(() => {
    if (eventCount > threshold) {
      console.warn(
        `[Backpressure] Topic "${topic}" received ${eventCount} events ` +
          `within ${intervalMs / 1000}s, exceeding threshold ${threshold}`
      );
    }
    // 重置計數，開始新一輪統計
    eventCount = 0;
  }, intervalMs);

  // 為了避免程式結束時留下計時器，提供簡易的清理函式
  // 使用者可自行呼叫返回的清理函式；若不需要，可忽略。
  // 返回值僅為方便測試與手動停止。
  const stop = () => {
    clearInterval(timer);
    console.debug(`[Backpressure] Monitoring for topic "${topic}" stopped`);
  };

  // 暴露 stop 方法於函式屬性（非必要，但方便使用）
   
  (monitorBackpressure as Record<string, unknown>).stop = stop;
}
