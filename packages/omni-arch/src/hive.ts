/**
 * OmniHive — 全知蜂巢 (九大奇效 #6: 共享黑板 Blackboard + 動態競標 Swarm)
 *
 * 設計哲學 (正典 §7 下階段編排, 本 PR 落地):
 *   - 共享黑板: 任何代理可張貼事實/任務, 進板一律 IComponentCore 契約
 *     (OAB BusEvent) + deepFreeze 深凍結刻印, 全體可見, 構成「全知」共同工作記憶。
 *   - 動態競標: 任務上板後由蜂群投標 (score + note), 多輪競標允許
 *     偵察後重新出價 (round 參數), 最高分者得標執行 (平分由先入伍者勝)。
 *   - 得標軌跡: 每次得標經 onAwarded 回呼發佈 hive.awarded 事件
 *     (arch.germinate 接線至 OmniBus + OmniTime), 競標全程公開可追溯。
 *
 * 5T 對應: Transparent (競標全程公開) / Trackable (得標軌跡可追蹤)
 * MECE: uuid 重複、worker 重複一律 fail-fast。
 */
import { deepFreeze } from '@esggo/omni-core';
import { mintEvent, OmniArchError } from './types';
import type { BusEvent } from './types';

/** 蜂巢任務: 進板契約沿用 BusEvent, 另可攜帶競標輪數語義 (由 tender options 提供) */
export interface HiveTask extends BusEvent {
  /** 任務分類語義 (沿用 topic; payload 為任務內容) */
}

/** 投標: score 越高越優, note 為出價說明 (競標透明化) */
export interface HiveBid {
  readonly score: number;
  readonly note?: string;
}

/** 蜂群工作者: bid 出價 (可依 round 動態調整), execute 得標執行 */
export interface HiveWorker {
  readonly id: string;
  /**
   * 對任務投標: 回傳 null 棄標。
   * round ≥ 2 時可依前一輪情報重新出價 (動態 re-bid)。
   */
  bid(
    task: Readonly<HiveTask>,
    blackboard: readonly Readonly<BusEvent>[],
    round: number
  ): Promise<HiveBid | null> | HiveBid | null;
  /** 得標執行: 回傳值即任務結果 */
  execute(
    task: Readonly<HiveTask>,
    blackboard: readonly Readonly<BusEvent>[]
  ): Promise<unknown>;
}

export interface HiveTenderOptions {
  /** 競標輪數, 預設 1; ≥ 2 啟用動態 re-bid */
  readonly rounds?: number;
}

/** 得標軌跡: 誰投了什麼價、誰得標, 全程可追溯 */
export interface HiveAwardRecord {
  readonly taskUuid: string;
  readonly topic: string;
  readonly winnerId: string;
  readonly winningScore: number;
  readonly rounds: number;
  readonly bids: readonly { workerId: string; score: number | null; note?: string }[];
}

type BidEntry = { worker: HiveWorker; bid: HiveBid | null };

/**
 * 全知蜂巢: 共享黑板 + 動態競標調度。
 *
 * @example
 * ```typescript
 * const hive = new OmniHive((event) => bus.publish(event));
 * hive.enlist({ id: 'OA-Carbon-1', bid: (t, b, r) => ({ score: 10 }), execute: async (t) => t.payload });
 * await hive.tender(mintEvent('hive://ops', 'esg.tender', { kwh: 1200 }), { rounds: 2 });
 * ```
 */
export class OmniHive {
  private readonly board: BusEvent[] = [];
  private readonly workers: HiveWorker[] = [];
  private readonly awards = new Map<string, number>();
  private readonly history: HiveAwardRecord[] = [];

  constructor(private readonly onAwarded: (event: BusEvent) => void | Promise<void> = () => {}) {}

  /** 事實/任務上板: 深凍結刻印, uuid 重複拒絕 (MECE) */
  post(entry: BusEvent): Readonly<BusEvent> {
    if (this.board.some((fact) => fact.uuid === entry.uuid)) {
      throw new OmniArchError('E_HIVE_DUPLICATE_UUID', `黑板 uuid ${entry.uuid} 已存在, MECE 禁止重複`);
    }
    const sealed = deepFreeze({ ...entry }) as BusEvent;
    this.board.push(sealed);
    return sealed;
  }

  /** 黑板快照 (全體可見的全知工作記憶) */
  blackboard(): readonly Readonly<BusEvent>[] {
    return [...this.board];
  }

  /** 蜂群入伍: id 重複拒絕 */
  enlist(worker: HiveWorker): void {
    if (this.workers.some((existing) => existing.id === worker.id)) {
      throw new OmniArchError('E_HIVE_WORKER_DUPLICATE', `工作者 ${worker.id} 已入伍`);
    }
    this.workers.push(worker);
  }

  workerCount(): number {
    return this.workers.length;
  }

  awardsOf(workerId: string): number {
    return this.awards.get(workerId) ?? 0;
  }

  tenderHistory(): readonly HiveAwardRecord[] {
    return [...this.history];
  }

  /**
   * 競標調度: 任務上板 → 蜂群多輪投標 → 最高分得標執行 → 得標軌跡上總線。
   * 全員棄標 → fail-fast (E_HIVE_NO_BID), 不靜默吞掉任務。
   */
  async tender(task: BusEvent, options: HiveTenderOptions = {}): Promise<unknown> {
    this.post(task);
    const rounds = Math.max(1, options.rounds ?? 1);
    const finalBids = await this.collectRounds(task, rounds, 1);

    const active = finalBids.filter((entry): entry is { worker: HiveWorker; bid: HiveBid } => entry.bid !== null);
    if (active.length === 0) {
      throw new OmniArchError('E_HIVE_NO_BID', `任務 ${task.uuid} 全員棄標, 流標 fail-fast`);
    }
    // SonarCloud Reliability 規則: reduce() 必須提供初始值, 否則空陣列會拋 TypeError。
    // active 非空已由上方 E_HIVE_NO_BID 保證, 故以 active[0] 為初始值。
    const winner = active.reduce(
      (best, entry) => (entry.bid.score > best.bid.score ? entry : best),
      active[0]
    );

    const result = await winner.worker.execute(task, this.blackboard());
    this.awards.set(winner.worker.id, (this.awards.get(winner.worker.id) ?? 0) + 1);

    const record: HiveAwardRecord = {
      taskUuid: task.uuid,
      topic: task.topic,
      winnerId: winner.worker.id,
      winningScore: winner.bid.score,
      rounds,
      bids: finalBids.map((entry) => ({
        workerId: entry.worker.id,
        score: entry.bid?.score ?? null,
        note: entry.bid?.note,
      })),
    };
    this.history.push(record);
    await this.onAwarded(
      mintEvent('omni-arch://omni-hive', 'hive.awarded', {
        taskUuid: record.taskUuid,
        winnerId: record.winnerId,
        winningScore: record.winningScore,
        rounds: record.rounds,
      })
    );
    return result;
  }

  /** 多輪投標: 遞迴收斂 (round ≥ 2 供 worker 依輪次動態 re-bid) */
  private async collectRounds(task: BusEvent, rounds: number, round: number): Promise<BidEntry[]> {
    const entries = await Promise.all(
      this.workers.map(async (worker): Promise<BidEntry> => ({ worker, bid: await worker.bid(task, this.blackboard(), round) }))
    );
    if (round >= rounds) {
      return entries;
    }
    return this.collectRounds(task, rounds, round + 1);
  }
}
