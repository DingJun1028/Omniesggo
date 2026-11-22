/**
 * OmniProphet — 先知矩陣 (九大奇效 #8: 意圖預判 + 多重宇宙並行 + 0ms 響應)
 *
 * 設計哲學 (正典 §7 下階段編排, 本 PR 落地):
 *   - 多重宇宙: foresee() 對候選意圖參數平行 fork 多個宇宙 (bounded:
 *     maxUniverses 上限), 同一 handler 於各宇宙先行運算。
 *   - 0ms 響應: 真實請求 ask() 命中已完成宇宙 → 直接回傳預運算結果,
 *     響應近零延遲; 未命中 → 現算並記 miss。
 *   - 成本閘門: 復用 @esggo/omni-core R6 PrefetchGate — 先知預判成本為
 *     3 倍運算, 歷史命中率低於 minHitRate 時停用預判 (閒置運算不浪費);
 *     replenish() 於閘門重開時補 fork (可由 OmniEngine heartbeat 呼叫)。
 *
 * 5T 對應: Tangible (命中/命中率/宇宙數可驗收) / Trustworthy (閘門數據說話)
 * MECE: 意圖重複註冊 fail-fast; 未知意圖拒絕猜測執行。
 */
import { computeHash, PrefetchGate } from '@esggo/omni-core';
import { OmniArchError } from './types';

export interface ProphetOptions {
  /** 歷史命中率門檻 (R6 PrefetchGate), 低於則停用多重宇宙預判 */
  readonly minHitRate?: number;
  /** 平行宇宙數上限 (bounded 並行), 預設 8 */
  readonly maxUniverses?: number;
}

type ProphetIntent = {
  readonly handler: (args: unknown) => Promise<unknown>;
  readonly candidates: readonly unknown[];
};

/**
 * 先知矩陣: 意圖預判 + 多重宇宙平行預運算 + 0ms 命中路徑。
 *
 * @example
 * ```typescript
 * const prophet = new OmniProphet({ minHitRate: 0.5, maxUniverses: 4 });
 * prophet.foresee('esg.carbon.check', async (a: { kwh: number }) => a.kwh * 0.509, [
 *   { kwh: 1200 },
 * ]);
 * const kgco2e = await prophet.ask<{ kwh: number }, number>('esg.carbon.check', { kwh: 1200 }); // 0ms 命中
 * ```
 */
export class OmniProphet {
  private readonly gate: PrefetchGate;
  private readonly maxUniverses: number;
  private readonly intents = new Map<string, ProphetIntent>();
  /** intent → (argsHash → 預運算 promise) */
  private readonly universes = new Map<string, Map<string, Promise<unknown>>>();

  constructor(options: ProphetOptions = {}) {
    this.gate = new PrefetchGate(options.minHitRate ?? 0.5);
    this.maxUniverses = options.maxUniverses ?? 8;
  }

  /** 意圖預判註冊: 閘門開啟時立即平行 fork 候選宇宙; 重複註冊 fail-fast */
  foresee<A>(intent: string, handler: (args: A) => Promise<unknown>, candidates: readonly A[]): void {
    if (this.intents.has(intent)) {
      throw new OmniArchError('E_PROPHET_INTENT_DUPLICATE', `意圖 ${intent} 已預判註冊, MECE 禁止重複`);
    }
    this.intents.set(intent, {
      handler: handler as (args: unknown) => Promise<unknown>,
      candidates,
    });
    if (this.gate.shouldPrefetch()) {
      this.forkUniverses(intent);
    }
  }

  /**
   * 真實請求: 命中已完成宇宙 → gate.record(hit) 並回傳預運算結果 (0ms 路徑);
   * 未命中 → gate.record(miss) 現算。未知意圖拒絕猜測 (fail-fast)。
   */
  async ask<A, R>(intent: string, args: A): Promise<R> {
    const entry = this.intents.get(intent);
    if (!entry) {
      throw new OmniArchError('E_PROPHET_UNKNOWN_INTENT', `未知意圖 ${intent}, 先知拒絕猜測執行`);
    }
    const key = computeHash(args);
    const universe = this.universes.get(intent)?.get(key);
    if (universe) {
      this.gate.record(true);
      return (await universe) as R;
    }
    this.gate.record(false);
    return (await entry.handler(args)) as R;
  }

  /** 閘門重開時補 fork 全部已註冊意圖 (閘門關閉時為 no-op); 回傳實補宇宙數 */
  replenish(): number {
    if (!this.gate.shouldPrefetch()) {
      return 0;
    }
    let added = 0;
    for (const intent of this.intents.keys()) {
      const before = this.universes.get(intent)?.size ?? 0;
      this.forkUniverses(intent);
      added += (this.universes.get(intent)?.size ?? 0) - before;
    }
    return added;
  }

  gateOpen(): boolean {
    return this.gate.shouldPrefetch();
  }

  hitRate(): number {
    return this.gate.hitRate();
  }

  /** 已 fork 宇宙總數 (bounded 並行可驗收) */
  universeCount(): number {
    let total = 0;
    for (const space of this.universes.values()) {
      total += space.size;
    }
    return total;
  }

  /** 平行 fork: 候選宇宙經 maxUniverses 截斷後平行運算, 並預掛 catch 防未處理拒絕 */
  private forkUniverses(intent: string): void {
    const entry = this.intents.get(intent);
    if (!entry) {
      return;
    }
    const space = this.universes.get(intent) ?? new Map<string, Promise<unknown>>();
    this.universes.set(intent, space);
    for (const args of entry.candidates.slice(0, this.maxUniverses)) {
      const key = computeHash(args);
      if (space.has(key)) {
        continue;
      }
      const running = entry.handler(args);
      running.catch(() => undefined);
      space.set(key, running);
    }
  }
}
