// OmniAgentBus (OAB) — 型別重導出薄層 (re-export shim)
//
// ── 為何本檔不再持有實作 ──────────────────────────────────────────
// 本檔過去是 Bus 的第二份完整實作（副檔名為 .ts，內容卻是純 CommonJS：
// require / module.exports、零型別標註）。那份副本的 API 與正典 .js 不相容
// —— 沒有 writeEntry / readEntry / queryBlackboard / 註冊自癒 Hook，
// 而且它自身在嚴格型別下產生 46 個 tsc 錯誤（隱式 any、class 屬性不存在）。
//
// 呼叫端追蹤證據（grep，lib/ app/ src/ tests/ scripts/）：
//   · lib/agents/knowledge-collector.js         require('./omni-agent-bus')
//   · lib/agents/omni-agent-bus-autonomy.js     require('./omni-agent-bus')
//   · lib/agents/omni-agent-bus-hook.js         require('./omni-agent-bus')
//   三者皆解析到同目錄的 .js（Node CJS 解析不認 .ts），零呼叫端 import 本 .ts。
//
// 因此正典 = lib/agents/omni-agent-bus.js，本檔退化成帶型別的重導出，
// 讓「契約」與「實作」之間只有一條可稽核的路徑。
//
// ── 啟動注意 ──────────────────────────────────────────────────────
// scripts/start-orchestrator.sh 過去執行 `node lib/agents/omni-agent-bus.ts`。
// 由於 require.main 會是本 shim 而非 .js，.js 內的 `require.main === module`
// 守衛不會觸發，autonomy 心跳不會啟動、行程立刻結束。該腳本已改指 .js。

import type { IBlackboardEntry, IBusEvent, IComponentCore, IOmniBus, OABHook } from '../types/oab-types';

/**
 * 正典 .js 額外提供、但不在 IOmniBus 契約內的方法。
 * 契約描述最小必要介面；實際類別較寬，此處如實反映差異以免誤導。
 */
export interface IOmniBusExtras {
  subscribe(event: string, cb: (payload: unknown) => void): () => void;
  unregisterBroadcastHook(hook: OABHook): void;
  getEvents(filter?: {
    limit?: number;
    event?: string;
    afterTs?: number;
  }): Array<IBusEvent & { ts?: number }>;
  broadcastGlobalNotification(msg: string, context?: unknown): void;
  startAutonomy(intervalMs?: number): void;
  stopAutonomy(): void;
  idleDuration(): number;
  decideHealing(err: { type?: string; target?: string; message?: string }): {
    action: string;
    target?: string;
    detail: Record<string, unknown>;
  };
  blackboard: Map<string, IBlackboardEntry>;
}

/** 正典 Bus 實例：同時滿足契約與實作擴充。 */
export type OmniBusInstance = IOmniBus & IOmniBusExtras;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const busModule = require('./omni-agent-bus.js') as {
  OmniAgentBus: new () => OmniBusInstance;
  omniBus: OmniBusInstance;
};

export const OmniAgentBus = busModule.OmniAgentBus;
export const omniBus: OmniBusInstance = busModule.omniBus;

export type { IBlackboardEntry, IBusEvent, IComponentCore, IOmniBus, OABHook };
export default omniBus;
