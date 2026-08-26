/**
 * OA-Team 30 · §15.5 增量輸出優化引擎 (Incremental Output Optimization)
 * 對齊 soul.md:
 *   - §1.1 5T 協議 (Traceable / Trackable / Tangible / Transparent / Trustworthy)
 *   - §15.5 增量輸出優化: 每次輸出僅遞增變更區, 附 source_origin 與 Hash Lock
 *   - §18.1 5T 驗證閘: Hash Lock + Object.freeze() 不可篡改
 *
 * 設計鐵律:
 *   1. 不整檔重寫 -> 只產出 diff 變更區 (line-level)
 *   2. 每筆產物掛 source_origin (Traceable)
 *   3. 寫入即 Hash Lock + Object.freeze() (Trustworthy)
 *   4. 可觀測生命週期 hook (Trackable)
 */

export type FiveT =
  | 'Traceable'
  | 'Trackable'
  | 'Tangible'
  | 'Transparent'
  | 'Trustworthy';

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

export interface DeltaOp {
  /** 行號 (1-based); 負值表示刪除該行, 正值表示插入/替換 */
  line: number;
  type: 'insert' | 'delete' | 'replace';
  content: string;
  /** 溯源起點 (Traceable) */
  sourceOrigin: string;
}

export interface IncrementalArtifact extends IComponentCore {
  readonly baseVersion: string;
  readonly ops: ReadonlyArray<DeltaOp>;
  readonly frozen: true;
}

/** 簡易 FNV-1a 32-bit hash (零依賴, 可驗證) */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 5T 驗證閘: 五項全過方出閘, 否則拋錯 (對齊 §18.2 閘門鐵律)
 */
export function verifyFiveTGate(artifact: IncrementalArtifact): void {
  const checks: Record<FiveT, boolean> = {
    Traceable: !!artifact.sourceOrigin,
    Trackable: Array.isArray(artifact.ops) && artifact.ops.length > 0,
    Tangible: artifact.frozen === true,
    Transparent: artifact.hashLock.length === 8,
    Trustworthy: Object.isFrozen(artifact) === true,
  };
  const failed = (Object.keys(checks) as FiveT[]).filter((k) => !checks[k]);
  if (failed.length > 0) {
    throw new Error(`5T GATE FAILED: ${failed.join(', ')} not satisfied`);
  }
}

/**
 * 增量輸出優化器: 主類
 */
export class IncrementalOutputOptimizer {
  private readonly version = '0.7.3';
  private lifecycleHooks: Array<{ ts: number; event: string }> = [];

  private emit(event: string): void {
    // Trackable: 生命週期記錄
    this.lifecycleHooks.push({ ts: Date.now(), event });
  }

  /**
   * 對基礎文本套用增量 ops, 產生新文本 (line-level).
   * 這是「避免全量重寫」的核心: 只動變更區.
   */
  applyDelta(baseText: string, ops: DeltaOp[]): string {
    this.emit('applyDelta:start');
    const lines = baseText.split('\n');
    // 從後往前套用, 避免行號漂移
    const sorted = [...ops].sort((a, b) => b.line - a.line);
    for (const op of sorted) {
      const idx = op.line - 1;
      if (op.type === 'insert') {
        lines.splice(idx, 0, op.content);
      } else if (op.type === 'delete') {
        lines.splice(idx, 1);
      } else {
        lines[idx] = op.content;
      }
    }
    this.emit('applyDelta:end');
    return lines.join('\n');
  }

  /**
   * 封存為不可篡改產物 (Hash Lock + freeze)
   */
  seal(
    ops: DeltaOp[],
    baseVersion: string,
    fiveT: FiveT,
    sourceOrigin: string,
  ): IncrementalArtifact {
    this.emit('seal:start');
    const payload = JSON.stringify({ ops, baseVersion, fiveT, sourceOrigin });
    const hashLock = fnv1a(payload);
    const artifact: IncrementalArtifact = Object.freeze({
      uuid: uuidV4(),
      version: this.version,
      timestamp: Date.now(),
      sourceOrigin,
      fiveT,
      hashLock,
      baseVersion,
      ops: Object.freeze([...ops]),
      frozen: true as const,
    });
    verifyFiveTGate(artifact); // §18.1 閘門
    this.emit('seal:end');
    return artifact;
  }

  getLifecycle(): ReadonlyArray<{ ts: number; event: string }> {
    return Object.freeze([...this.lifecycleHooks]);
  }
}

export default IncrementalOutputOptimizer;
