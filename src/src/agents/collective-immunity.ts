// 奇效五：集體免疫 - 接收全域戒嚴令
// ------------------------------------------------------------
// 此模組負責在 OmniAgent (OA) 層面監聽全域戒嚴事件 (eventName: 'global.lockdown')
// 並在收到戒嚴指令後，將其寫入共享黑板 (IBlackboard) 以供全系統感知。
// 其他模組可依照 blackboard 中的 `lockdown` 條目做出相應的防護或停機措施。

import { IOmniAgent, IBusEvent } from "../types/omni-agent";
import { IBlackboard } from "../types/blackboard-types";

/**
 * 設定集體免疫機制。
 *
 * @param agent      OA 代理實例（已建立但尚未啟動）
 * @param blackboard 共享黑板實例，用於寫入全域狀態
 */
export function setupCollectiveImmunity(agent: IOmniAgent, blackboard: IBlackboard): void {
  // 在事件被廣播到 OMNI Bus 的 EMERGED 階段先檢測是否為全域戒嚴指令
  agent.registerHook(LifecycleStage.EMERGED, async ({ spec, error: _error }) => {
    // 此 hook 只關注來自 Bus 的原始事件，若是直接 call execute(spec) 則不會有 event
    // 因此我們同時支援 `spec` 為 IBusEvent 的情況（使用者可自行轉換）
    const maybeEvent = (spec as unknown) as IBusEvent;
    if (!maybeEvent || typeof maybeEvent.eventName !== "string") {
      return;
    }

    if (maybeEvent.eventName === "global.lockdown") {
      // 把戒嚴訊號寫入黑板的 `system` 命名空間
      await blackboard.write("system", {
              eventName: maybeEvent.eventName,
              payload: maybeEvent.payload ?? { active: true },
              source_origin: maybeEvent.source_origin ?? "OA",
              stage: maybeEvent.stage ?? "EMERGED",
              note: "\u5168\u57df\u6212\u56b4\u5df2\u555f\u52d5",
            } as Record<string, unknown>);

      console.debug(`[CollectiveImmunity] Received global lockdown event – written to blackboard`);
    }
  });
}
