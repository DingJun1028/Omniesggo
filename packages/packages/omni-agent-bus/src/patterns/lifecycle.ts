/**
 * LifecycleTracker — 熵減 + 跨組配對率埋點 (§24 P2 gap closure)
 *
 * 對齊 soul.md §十 10.6 / §24.2 缺口 #4 #5:
 *   - entropy: 每週目標收斂 < 0.1, 每筆事件帶入 entropy_delta (負=熵減)
 *   - cross_unit_pairing: 跨組任務雙簽率, 記錄每筆 cross_unit 任務是否雙簽
 *
 * 設計哲學 (無作妙德圓通無礙):
 *   - 未初始化 / 空資料 靜默回傳預設, 不報錯
 *   - 所有記錄過 5T 欄位閘 (source 結構化溯源標籤) 才納入統計
 *   - 純記憶體 ring buffer, 不依賴外部存儲 (free-local)
 */

export interface LifecycleEvent {
  taskId: string;
  crossUnit: boolean; // 是否跨組任務
  dualSigned: boolean; // 是否跨組雙簽 (配對完成)
  entropyDelta: number; // 負值=熵減, 正值=熵增
  source?: string;
}

export interface LifecycleSnapshot {
  totalEvents: number;
  crossUnitEvents: number;
  dualSigned: number;
  pairingRate: number; // cross_unit_pairing % (§十 目標 100%)
  entropy: number; // 當前累積熵 (§十 目標 < 0.1)
  weeklyEntropyReduction: number; // 本週熵減幅度
}

const ENTROPY_FLOOR = 0.0;
const ENTROPY_CEIL = 1.0;
const WEEKLY_TARGET_REDUCTION = 0.03; // §十 每週 -3%

export class LifecycleTracker {
  private events: LifecycleEvent[] = [];
  private _entropy = 1.0; // 起始高熵, 逐事件收斂
  private _weeklyStartEntropy = 1.0;

  /** 記錄一筆生命週期事件 (過 5T 欄位閘才納入) */
  record(ev: LifecycleEvent): boolean {
    // 欄位級溯源: source 必須是結構化溯源標籤 (含 ':' 如 esggo:src/...)
    // 或含中英文溯源關鍵字, 否則視為不可溯源, 靜默略過 (graceful)
    const src = ev.source;
    const traceable = !!src && typeof src === "string" && (
      src.includes(":") || /來源|引用|source|origin/i.test(src)
    );
    if (!traceable) {
      return false;
    }
    this.events.push(ev);
    // 熵更新: 累積 entropyDelta, 夾在 [floor, ceil]
    this._entropy = Math.min(
      ENTROPY_CEIL,
      Math.max(ENTROPY_FLOOR, this._entropy + ev.entropyDelta),
    );
    return true;
  }

  /** 本週熵減結算 (對齊 §十 每週 -3% 儀式) */
  closeWeek(): number {
    const reduction = this._weeklyStartEntropy - this._entropy;
    this._weeklyStartEntropy = this._entropy;
    return Math.max(0, reduction);
  }

  snapshot(): LifecycleSnapshot {
    const cross = this.events.filter((e) => e.crossUnit);
    const signed = cross.filter((e) => e.dualSigned).length;
    const pairingRate = cross.length
      ? Math.round((signed / cross.length) * 1000) / 10
      : 0;
    return {
      totalEvents: this.events.length,
      crossUnitEvents: cross.length,
      dualSigned: signed,
      pairingRate, // %
      entropy: Math.round(this._entropy * 1000) / 1000,
      weeklyEntropyReduction: Math.round((this._weeklyStartEntropy - this._entropy) * 1000) / 1000,
    };
  }

  /** 是否符合 §十 進化目標 (pairing 100% + entropy < 0.1) */
  meetsTargets(): boolean {
    const s = this.snapshot();
    return s.pairingRate >= 100.0 && s.entropy < 0.1;
  }

  /** 診斷缺口 (對齊 §24.2) */
  gaps(): string[] {
    const s = this.snapshot();
    const out: string[] = [];
    if (s.pairingRate < 100.0) out.push(`cross_unit_pairing=${s.pairingRate}% < 100% (pairingRate gap)`);
    if (s.entropy >= 0.1) out.push(`entropy=${s.entropy} >= 0.1`);
    if (s.weeklyEntropyReduction < WEEKLY_TARGET_REDUCTION)
      out.push(`weekly_reduction=${s.weeklyEntropyReduction} < ${WEEKLY_TARGET_REDUCTION}`);
    return out;
  }
}

export function createLifecycleTracker(): LifecycleTracker {
  return new LifecycleTracker();
}
