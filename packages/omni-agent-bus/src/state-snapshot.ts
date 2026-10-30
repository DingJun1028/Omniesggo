/**
 * state-snapshot — R5 細胞分裂前狀態快照隔離
 *
 * 設計哲學 (承接 @esggo/omni-core v2 PR #106 R5 缺口結論):
 *   - 有狀態代理分裂前必須先快照, 否則分身與母體互相污染 (寫入衝突)
 *   - capture: 深複製後深凍結儲存 (快照本身不可篡改)
 *   - restore: 回傳新的深複製副本 (分身可自由寫入, 母體與快照皆不受影響)
 *
 * 5T 對應: Trustworthy (快照凍結) / Tangible (隔離結果可驗證: 副本互不相干)
 * 模組自持 (共用原語來自 ./internal/freeze.js), 不新增 workspace 依賴。
 */
import { clone, deepFreeze } from './internal/freeze.js';
import type { BusMessage } from './types.js';

/** 快照識別: snap_{agentId}_{序號}_{時間戳} */
export type SnapshotId = string;

/**
 * 狀態快照庫: 細胞分裂 (Agent Fission) 的前置隔離設施。
 *
 * @example
 * ```typescript
 * const store = new StateSnapshotStore();
 * const snapId = store.capture('OA-Carbon-1', parentAgent.state);
 * const child = seed.germinateAgent('OA-Carbon-1-v2', logic, store.restore(snapId));
 * // parent.state 後續任何變更, child.state 與 snapId 皆不受影響
 * ```
 */
export class StateSnapshotStore {
  private counter = 0;
  private readonly snapshots = new Map<SnapshotId, Readonly<object>>();

  /** 捕獲母體狀態: 深複製 + 深凍結後入庫, 回傳快照 id */
  capture<T extends object>(agentId: string, state: T): SnapshotId {
    const id = `snap_${agentId}_${this.counter++}_${Date.now()}`;
    this.snapshots.set(id, deepFreeze(clone(state)));
    return id;
  }

  /** 還原快照: 回傳新的可寫副本; 快照 id 不存在回傳 undefined */
  restore<T extends object>(snapshotId: SnapshotId): T | undefined {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot === undefined ? undefined : (clone(snapshot) as T);
  }

  has(snapshotId: SnapshotId): boolean {
    return this.snapshots.has(snapshotId);
  }

  size(): number {
    return this.snapshots.size;
  }
}

/** 便捷型別: 分裂分身的注入狀態 (BusMessage 流轉計數等) */
export type FissionState = Partial<BusMessage<unknown>>;
