// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * 統一發布原語（深貫廣通 · 全域事件總線單一來源）
 * ==========================================
 *
 * 所有子系統經由此處將事件轉發至 `omni-agent-bus`（`enhancedOmniBus`）：
 * 計算 SHA-256 `hashLock` 溯源，並於指定 topic 發布。委派子系統的
 * `publishDelegationEvent` 與 `omni-gateway.secureForward` 皆委託於此，
 * 確保「全域」不變量——無論何種事件，都走同一條帶 hashLock 的發布路徑，
 * 便於監控 / 分析元件統一訂閱（`external-forward`）。
 */

import { createHash } from 'crypto';
import { enhancedOmniBus } from './omni-agent-bus';
import type { IBusEvent } from './omni-agent-bus';

/**
 * 將事件發布至 omni-agent-bus（含 SHA-256 hashLock 溯源）。
 * @returns 計算出的 hashLock（64 hex）
 */
export function publishBusEvent(topic: string, event: unknown): { hashLock: string } {
  const ev = event as IBusEvent;
  const hashLock = createHash('sha256').update(JSON.stringify(ev)).digest('hex');
  enhancedOmniBus.publish(topic, { ...ev, hashLock } as IBusEvent);
  return { hashLock };
}

// ── 思考頻道（OmniAgentBus 同步思維流） ─────────────────────────
// 把模型 / agent 的推理過程從「最終答案」拆出，發布到專屬頻道，
// 供 UI / 日誌 / 其他 agent 即時訂閱這條同步思考流（對齊 5T hashLock 溯源）。
export interface ThoughtEvent {
  agentId: string;
  runId: string;
  step: number;
  content: string;
}

/**
 * 發布一段「思考」到 OmniAgentBus 頻道 `omni://agent/<agentId>/thought`。
 * @returns 計算出的 hashLock（64 hex）
 */
export function publishThought(opts: ThoughtEvent): { hashLock: string } {
  const topic = `omni://agent/${opts.agentId}/thought`;
  const event = {
    event: 'agent.thought',
    payload: {
      runId: opts.runId,
      step: opts.step,
      content: opts.content,
      agentId: opts.agentId,
    },
    ts: Date.now(),
    uuid: opts.runId,
  };
  return publishBusEvent(topic, event as unknown as IBusEvent);
}

/**
 * 訂閱指定 topic（如思考流頻道），回傳取消訂閱函式。
 */
export function subscribeBusEvent(topic: string, cb: (event: IBusEvent) => void): () => void {
  // enhancedOmniBus.subscribe 使用 omni-agent-bus 的簡易 IBusEvent（非泛型），
  // 與 contracts 的泛型 IBusEvent<T> 名稱相同但型別不同，故內部轉型。
  return enhancedOmniBus.subscribe(topic, cb as (event: any) => void);
}
