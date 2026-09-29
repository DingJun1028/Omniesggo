// 5T-Traceable: source_origin=lib/types/oab-types.ts (OAB 契約正典)
import { randomUUID } from 'node:crypto';

// OAB (OmniAgentBus) TypeScript Core Interfaces & Contracts
// -----------------------------------------------------------
// This file defines the public contract for the OmniAgentBus (OAB) layer.
// It is used by all OmniAgents (OA) and the OmniAgentGateway (OAG) to
// communicate, register lifecycle hooks and interact with the blackboard.
// The design follows the "Trackable" principle – every piece of data
// flowing through the bus is an IComponentCore (immutable, self‑describing).

/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
export interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

/**
 * Black‑board entry – a persisted snapshot of a component that can be
 * queried later.  It adds origin information and tag classification.
 */
export interface IBlackboardEntry extends IComponentCore {
  /** The origin that generated this entry (OA name, OAG, external system) */
  source_origin: string;
  /** Tag list for quick filtering – e.g. ['task','request','error','heal'] */
  tags: string[];
  /** Payload specific to the concrete entry (task spec, error details…) */
  payload: unknown;
}

/**
 * Hook signature – a lifecycle observer receives the raw event object.
 * The hook may be async; any unhandled rejection is logged by the bus.
 */
export type OABHook = (event: IBusEvent) => Promise<void> | void;

/**
 * Full bus event – carries the component and a logical event name.
 */
export interface IBusEvent {
  /** Unique event id (different from component uuid) */
  readonly eventId: string;
  /** Event name – e.g. 'task:created', 'system:error', 'managed:mutation' */
  readonly name: string;
  /** Timestamp of the event emission */
  readonly timestamp: number;
  /** The payload is always an IComponentCore (or a subclass) */
  readonly payload: IComponentCore;
}

/**
 * Public contract exposed by the bus.
 */
export interface IOmniBus {
  /** Publish an event onto the bus. Returns the generated IBusEvent. */
  publish(name: string, payload: IComponentCore): IBusEvent;

  /** Register a lifecycle hook that will receive every emitted event. */
  registerHook(hook: OABHook): void;

  /** Write a blackboard entry – persists the component and broadcasts it. */
  writeEntry(entry: IBlackboardEntry): void;

  /** Retrieve a blackboard entry by its component UUID. */
  readEntry(uuid: string): IBlackboardEntry | undefined;

  /** Query the blackboard – simple in‑memory filter (tag, origin, time). */
  queryBlackboard(filter: {
    tags?: string[];
    source_origin?: string;
    from?: number; // epoch ms
    to?: number;   // epoch ms
  }): IBlackboardEntry[];

  /** Register a self‑healing hook – special hook that reacts to
   *  'system:error' or 'managed:mutation' events and produces a HealingAction.
   */
  registerSelfHealHook(handler: (errorEvent: IBusEvent) => Promise<void> | void): void;
}

/**
 * Example concrete component types used throughout the ecosystem.
 */
export interface ITaskSpec extends IComponentCore {
  /** Human‑readable name of the task (e.g. 'carbon-report') */
  readonly name: string;
  /** Arbitrary parameters for the task */
  readonly params: Record<string, unknown>;
}

export interface IMutationSpec extends IComponentCore {
  /** Target of the mutation – 'http' | 'fs' | 'exec' | 'env' */
  readonly target: string;
  /** Action type – 'delay' | 'fail' | 'corrupt' | 'kill' */
  readonly action: string;
  /** Probability (0‑1) that the mutation will be applied */
  readonly probability: number;
  readonly params?: Record<string, unknown>;
}

export interface IHealingAction extends IComponentCore {
  /** Healing operation – 'restart' | 'rollback' | 'retry' | 'notify' | 'dynamicPatch' */
  readonly action: string;
  /** Target of the healing (service name, file path, agent id, …) */
  readonly target: string;
  /** Optional additional details */
  readonly detail?: Record<string, unknown>;
}

/**
 * Utility function – generates a fresh IComponentCore with UUID & timestamp.
 */
export function createComponentCore<T extends Partial<IComponentCore>>(
  base: T
): IComponentCore {
  // 不使用 require('uuid')：該套件已從依賴移除，執行期會直接拋錯。
  const uuid = randomUUID();
  const timestamp = Date.now();
  // 5T-Trustworthy: 呼叫端提供的 evidence 在此為證據的原始來源（此函式負責
  // 建立元件，尚未封存），故予以保留並僅補齊缺漏欄位。
  // 封存階段的不可覆寫語意由 oag-types 的 sealAndForward 負責，兩者職責不同。
  return {
    ...base,
    uuid,
    version: base.version ?? '1.0.0',
    timestamp,
    evidence: {
      ...(base.evidence ?? {}),
      originCause: base.evidence?.originCause ?? 'unknown',
      processTrace: base.evidence?.processTrace ?? [],
      finalEffect: base.evidence?.finalEffect ?? 'unknown',
    },
  } as IComponentCore;
}

// -----------------------------------------------------------
// End of OAB contract definitions.
