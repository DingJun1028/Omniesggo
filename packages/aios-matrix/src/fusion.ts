/**
 * AIOS 融合矩陣運行層 — 「元件即代理」(Component as Agent) 契約實作。
 *
 * 每個 MECE 維度即一位代理（AiosDimensionAgent），由 AiosFusionMatrix
 * 依藍圖拓撲（5 核心 × 12 維度）進行註冊與調度:
 *   - 註冊時驗證維度存在（1–12）且不可重複註冊。
 *   - dispatch 時驗證意圖歸屬維度，並在軌跡（trail）留痕:
 *     維度 → 所屬核心 之 MECE 歸因（感知/認知/記憶/表達/連結）。
 *   - 軌跡為深凍結紀錄（seq 單調遞增，不依賴時鐘，測試可重現）。
 *
 * source_origin: 《AIOS 系統終極融合矩陣：MECE 協同總表》v5.0
 */
import { AIOS_CORES, AIOS_DIMENSIONS } from './matrix';
import type {
  AiosCore,
  AiosCoreId,
  AiosDimension,
  AiosDimensionId,
} from './matrix';

export class AiosMatrixError extends Error {
  constructor(message: string) {
    super(`[aios-matrix] ${message}`);
    this.name = 'AiosMatrixError';
  }
}

export interface AiosIntent {
  readonly dimension: AiosDimensionId;
  readonly action: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface AiosIntentResult {
  readonly ok: boolean;
  readonly trace: readonly string[];
  readonly detail?: unknown;
}

export type AiosIntentHandler = (
  intent: AiosIntent,
) => AiosIntentResult | Promise<AiosIntentResult>;

export interface AiosDispatchRecord {
  readonly seq: number;
  readonly dimension: AiosDimensionId;
  readonly dimensionZh: string;
  readonly coreId: AiosCoreId;
  readonly coreZh: string;
  readonly action: string;
  readonly ok: boolean;
}

/** 元件即代理：一個 MECE 維度 + 一個意圖處理器 = 一位維度代理。 */
export class AiosDimensionAgent {
  #handler: AiosIntentHandler;

  readonly dimension: AiosDimension;
  readonly core: AiosCore;

  constructor(dimension: AiosDimension, core: AiosCore, handler: AiosIntentHandler) {
    this.dimension = dimension;
    this.core = core;
    this.#handler = handler;
  }

  async act(intent: AiosIntent): Promise<AiosIntentResult> {
    if (intent.dimension !== this.dimension.id) {
      throw new AiosMatrixError(
        `意圖維度 ${intent.dimension} 與代理維度 ${this.dimension.id}（${this.dimension.zh}）不符`,
      );
    }
    const result = await this.#handler(intent);
    if (result.trace.length === 0) {
      throw new AiosMatrixError(`維度 ${this.dimension.zh} 之處理器未留痕（trace 為空）`);
    }
    return Object.freeze({ ...result, trace: Object.freeze([...result.trace]) });
  }
}

/** 融合矩陣：12 維度代理之註冊、調度與 MECE 軌跡。 */
export class AiosFusionMatrix {
  #agents = new Map<AiosDimensionId, AiosDimensionAgent>();
  #records: AiosDispatchRecord[] = [];
  #seq = 0;

  register(dimensionId: AiosDimensionId, handler: AiosIntentHandler): this {
    if (this.#agents.has(dimensionId)) {
      throw new AiosMatrixError(`維度 ${dimensionId} 已註冊，不可重複`);
    }
    const dimension = AIOS_DIMENSIONS.find((d) => d.id === dimensionId);
    if (!dimension) {
      throw new AiosMatrixError(`未知維度 ${dimensionId}（應為 1–12）`);
    }
    const core = AIOS_CORES.find((c) => c.id === dimension.coreId);
    if (!core) {
      throw new AiosMatrixError(`維度 ${dimensionId} 歸屬未知核心 ${dimension.coreId}`);
    }
    this.#agents.set(dimensionId, new AiosDimensionAgent(dimension, core, handler));
    return this;
  }

  has(dimensionId: AiosDimensionId): boolean {
    return this.#agents.has(dimensionId);
  }

  async dispatch(intent: AiosIntent): Promise<AiosDispatchRecord> {
    const agent = this.#agents.get(intent.dimension);
    if (!agent) {
      throw new AiosMatrixError(
        `維度 ${intent.dimension} 未註冊，拒絕調度（元件即代理需先 register）`,
      );
    }
    const result = await agent.act(intent);
    this.#seq += 1;
    const record: AiosDispatchRecord = Object.freeze({
      seq: this.#seq,
      dimension: intent.dimension,
      dimensionZh: agent.dimension.zh,
      coreId: agent.core.id,
      coreZh: agent.core.zh,
      action: intent.action,
      ok: result.ok,
    });
    this.#records.push(record);
    return record;
  }

  trail(): readonly AiosDispatchRecord[] {
    return Object.freeze([...this.#records]);
  }

  /** 查詢維度所屬核心（藍圖拓撲之執行期入口）。 */
  static coreOf(dimensionId: AiosDimensionId): AiosCore {
    const dimension = AIOS_DIMENSIONS.find((d) => d.id === dimensionId);
    if (!dimension) {
      throw new AiosMatrixError(`未知維度 ${dimensionId}（應為 1–12）`);
    }
    const core = AIOS_CORES.find((c) => c.id === dimension.coreId);
    if (!core) {
      throw new AiosMatrixError(`維度 ${dimensionId} 歸屬未知核心 ${dimension.coreId}`);
    }
    return core;
  }
}
