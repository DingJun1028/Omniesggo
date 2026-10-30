/**
 * evolution — 自我學習與無限進化閉環 (R3 / R6 / R7)
 *
 * R3 EntropyLedger: 「每週自動熵減」可量化、可驗收 — 重複事件率 / 合併批次 /
 *    技術債加權指標 (0 最佳), 消除「10% 技術債」無基準不可驗收的缺口。
 * R6 PrefetchGate: 先知矩陣 (意圖預判三重宇宙預算) 成本為 3 倍運算,
 *    以歷史命中率門檻決定啟用, 避免閒置運算浪費。
 * R7 LearningLoop + ChaosEngine: 失敗簽名 -> 聖典模板庫命中復用 (觸類旁通);
 *    未命中由混沌自癒修復並 crystallize 沉澱新模板, 形成無限進化飛輪。
 */

// ── R3: 可量化熵減 ──────────────────────────────────────────

export interface EntropyMetrics {
  /** 重複事件率 (journal 內重複 uuid 佔比, 0 最佳) */
  readonly duplicateEventRate: number;
  /** 累計合併批次數 (本質提純: 碎片化事件合併去重) */
  readonly mergedBatchCount: number;
  /** 技術債加權綜合指標 (目前 = duplicateEventRate * 0.6, 0 最佳) */
  readonly technicalDebtIndex: number;
}

/**
 * 熵減帳本: 每週由 journal (append-only) 的 uuid 序列計算熵指標。
 * journalUuidProvider 由呼叫端注入 (總線/時空裂縫 registry), 保持模組解耦。
 */
export class EntropyLedger {
  private mergedBatches = 0;

  constructor(private readonly journalUuidProvider: () => readonly string[]) {}

  weeklyReduce(): EntropyMetrics {
    const uuids = this.journalUuidProvider();
    const seen = new Set<string>();
    let duplicates = 0;
    for (const uuid of uuids) {
      if (seen.has(uuid)) {
        duplicates += 1;
      } else {
        seen.add(uuid);
      }
    }
    const duplicateEventRate = uuids.length === 0 ? 0 : duplicates / uuids.length;
    this.mergedBatches += duplicates;
    const technicalDebtIndex = Number((duplicateEventRate * 0.6).toFixed(4));
    return { duplicateEventRate, mergedBatchCount: this.mergedBatches, technicalDebtIndex };
  }
}

// ── R6: 先知預判成本閘門 ────────────────────────────────────

/**
 * 命中率閘門: 歷史命中率 < minHitRate 時停用預判, 省 3 倍運算。
 * 首次 (attempts === 0) 允許探測, 之後純以數據說話。
 */
export class PrefetchGate {
  private hits = 0;
  private attempts = 0;

  constructor(private readonly minHitRate: number) {}

  shouldPrefetch(): boolean {
    return this.attempts === 0 || this.hitRate() >= this.minHitRate;
  }

  record(hit: boolean): void {
    this.attempts += 1;
    if (hit) {
      this.hits += 1;
    }
  }

  hitRate(): number {
    return this.attempts === 0 ? 0 : this.hits / this.attempts;
  }
}

// ── R7: 自我學習閉環 ────────────────────────────────────────

/** 聖典修復模板: 同類失敗直接復用, 免重複驗算 */
export interface RepairTemplate {
  readonly failureSignature: string;
  readonly remedy: (cause: unknown) => Promise<unknown>;
  successCount: number;
}

/**
 * 學習閉環: handleFailure 先查模板庫 (觸類旁通), 命中即復用;
 * 修復成功的方案以 crystallize 沉澱為可復用資產。
 */
export class LearningLoop {
  private readonly templates = new Map<string, RepairTemplate>();

  /** 命中即套用修復模板; 未命中回傳 false, 交由混沌自癒記錄 */
  async handleFailure(failureSignature: string, cause: unknown): Promise<boolean> {
    const template = this.templates.get(failureSignature);
    if (!template) {
      return false;
    }
    await template.remedy(cause);
    template.successCount += 1;
    return true;
  }

  /** 知識沉澱: 修復方案結晶為聖典模板 (同名簽名覆蓋舊版) */
  crystallize(
    failureSignature: string,
    remedy: (cause: unknown) => Promise<unknown>
  ): void {
    this.templates.set(failureSignature, { failureSignature, remedy, successCount: 0 });
  }

  templateCount(): number {
    return this.templates.size;
  }
}

/**
 * 混沌引擎: 主動突變測試。probe 模擬帶缺陷注入的運行路徑:
 * - 通過 -> 'passed' (容錯邊界內)
 * - 失敗且模板庫已有方案 -> 'learned' (舊知識復用)
 * - 失敗且無模板 -> 'crystallized' (自癒後沉澱新模板)
 */
export class ChaosEngine {
  constructor(
    private readonly learning: LearningLoop,
    private readonly onQuarantined?: (failureSignature: string) => void
  ) {}

  async injectMutation(
    probe: () => Promise<void>,
    failureSignature: string
  ): Promise<'passed' | 'learned' | 'crystallized'> {
    try {
      await probe();
      return 'passed';
    } catch (error) {
      const reused = await this.learning.handleFailure(failureSignature, error);
      if (reused) {
        return 'learned';
      }
      this.learning.crystallize(failureSignature, async () => ({
        quarantined: true,
        policy: 'isolate-and-report',
      }));
      this.onQuarantined?.(failureSignature);
      return 'crystallized';
    }
  }
}
