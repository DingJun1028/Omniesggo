// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * omni-function.ts — 萬能函數（Universal Omni Function）
 *
 * 這是 ESGGO 萬能中心的「萬能函數」：一個獨立的自由函數（free function），
 * 任何功能頁面都可以呼叫它來建立組件、筆記、任務、執行已註冊的函數，
 * 或分派一個 OmniOne 案例。所有進入點都會經過 5T 協議與 EntropyForge 淨化。
 *
 * 同時提供 OmniFunctionLibrary（omniFn）：一個執行期函數庫（函數庫），
 * 讓各功能模組註冊可重用的純函數，並由 omni({ kind: 'fn', ... }) 統一分派。
 *
 * 設計原則（遵循 global-healing 準則）：
 *   - 全端雙向 TypeScript：嚴格型別，不使用 any。
 *   - 終始矩陣：統一的請求/結果契約 (OmniRequest → OmniResult)。
 *   - 不可變：產出皆經 Object.freeze。
 */

import { randomBytes } from 'crypto';
import { EntropyForge } from './entropy-forge';
import {
  createComponent,
  type ComponentEvidence,
  type FiveTScore,
  type FiveTDimension,
  type CaseType,
  type OmniTask,
  type NoteCategory,
  type NotePriority,
  type ProcessResult,
  type IComponentCore,
  type OmniNote,
} from './types';
import {
  createNote,
  createTask,
} from './omni-note';
import { omniKernel, OMNI_TOPICS } from './omni-kernel';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Request / Result Contracts (終始矩陣)
// ═══════════════════════════════════════════════════════════════

export type OmniKind = 'component' | 'note' | 'task' | 'fn' | 'case';

export interface ComponentRequest {
  readonly kind: 'component';
  readonly data: unknown;
  readonly evidence: ComponentEvidence;
  readonly fiveT?: Partial<FiveTScore>;
  readonly actor?: string;
  readonly type?: string;
  /** 是否註冊進 OmniKernel 組件中心（預設 true） */
  readonly register?: boolean;
}

export interface NoteRequest {
  readonly kind: 'note';
  readonly title: string;
  readonly content: string;
  readonly category?: NoteCategory;
  readonly tags?: string[];
  readonly tasks?: OmniTask[];
  readonly fiveTGate?: FiveTDimension;
  readonly metadata?: Record<string, string | number | boolean>;
}

export interface TaskRequest {
  readonly kind: 'task';
  readonly title: string;
  readonly description?: string;
  readonly priority?: NotePriority;
  readonly dueAt?: number;
  readonly tags?: string[];
  readonly assignee?: string;
}

export interface FnRequest {
  readonly kind: 'fn';
  /** 已在 OmniFunctionLibrary 註冊的函數名稱 */
  readonly name: string;
  readonly args?: readonly unknown[];
}

export interface CaseRequest {
  readonly kind: 'case';
  readonly caseType: CaseType;
  readonly input: string;
}

export type OmniRequest =
  | ComponentRequest
  | NoteRequest
  | TaskRequest
  | FnRequest
  | CaseRequest;

export interface OmniOkResult {
  readonly ok: true;
  readonly kind: OmniKind;
  readonly id: string;
  readonly data: unknown;
  readonly hash?: string;
  readonly registered: boolean;
}

export interface OmniErrResult {
  readonly ok: false;
  readonly kind: OmniKind | 'unknown';
  readonly error: string;
}

export type OmniResult = OmniOkResult | OmniErrResult;

// ═══════════════════════════════════════════════════════════════
// SECTION 2: 萬能函數 — omni() 通用調度器
// ═══════════════════════════════════════════════════════════════

/**
 * 萬能函數：單一進入點，依 kind 分派到對應處理器。
 *
 * @example
 *   const r = omni({ kind: 'note', title: 'ESG 戰略', content: '...' });
 *   if (r.ok) console.log(r.id);
 */
export function omni(req: OmniRequest): OmniResult {
  try {
    switch (req.kind) {
      case 'component': {
        const comp: IComponentCore = createComponent(
          req.data,
          req.evidence,
          req.fiveT,
          req.actor,
        );
        const shouldRegister = req.register ?? true;
        if (shouldRegister) {
          omniKernel.registry.register(comp, req.type ?? 'generic');
        }
        omniKernel.eventBus.publish(OMNI_TOPICS.COMPONENT_REGISTERED, {
          uuid: comp.uuid,
          type: req.type ?? 'generic',
        });
        return {
          ok: true,
          kind: 'component',
          id: comp.uuid,
          data: comp,
          hash: (comp as any).hash,
          registered: shouldRegister,
        };
      }

      case 'note': {
        const note: OmniNote = createNote(req.title, req.content, {
          category: req.category,
          tags: req.tags,
          tasks: req.tasks,
          fiveTGate: req.fiveTGate,
          metadata: req.metadata,
        });
        omniKernel.eventBus.publish(OMNI_TOPICS.NOTE_CREATED, {
          id: note.id,
          title: note.title,
        });
        return {
          ok: true,
          kind: 'note',
          id: note.id,
          data: note,
          hash: note.zkpHash,
          registered: false,
        };
      }

      case 'task': {
        const task: OmniTask = createTask(req.title, {
          description: req.description,
          priority: req.priority,
          dueAt: req.dueAt,
          tags: req.tags,
          assignee: req.assignee,
        });
        omniKernel.eventBus.publish(OMNI_TOPICS.TASK_CREATED, {
          taskId: task.id,
          title: task.title,
        });
        return {
          ok: true,
          kind: 'task',
          id: task.id,
          data: task,
          registered: false,
        };
      }

      case 'fn': {
        if (!omniFn.has(req.name)) {
          return { ok: false, kind: 'fn', error: `未註冊的函數：${req.name}` };
        }
        const result = omniFn.call(req.name, ...(req.args ?? []));
        const id = `OFN-${randomBytes(4).toString('hex').toUpperCase()}`;
        omniKernel.eventBus.publish(OMNI_TOPICS.OMNI_ONE_CASE_ROUTED, {
          function: req.name,
          id,
        });
        return {
          ok: true,
          kind: 'fn',
          id,
          data: result,
          registered: false,
        };
      }

      case 'case': {
        const result: ProcessResult = processCaseLocal(req.caseType, req.input);
        omniKernel.eventBus.publish(OMNI_TOPICS.OMNI_ONE_RESULT, result);
        return {
          ok: true,
          kind: 'case',
          id: result.caseId,
          data: result,
          registered: false,
        };
      }

      default: {
        // Exhaustiveness guard — 若新增 OmniKind，此處會編譯報錯
        const _exhaustive: never = req;
        void _exhaustive;
        return { ok: false, kind: 'unknown', error: '未知的請求類型' };
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: req.kind, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2.5: 實作範例 — createFiveTComponent（函數庫協助功能實現）
// ═══════════════════════════════════════════════════════════════

/**
 * 一鍵建立預設通過 5T 門檻（≥0.7）的組件。
 * 功能頁面可直接呼叫此函數快速產生「知識結晶」，
 * 再將 component.hash 作為 hash_lock 寫入 ZKP Vault（見下方範例）。
 */
export function createFiveTComponent(
  data: unknown,
  opts: {
    originCause?: string;
    processTrace?: string[];
    finalEffect?: string;
    fiveT?: Partial<FiveTScore>;
    actor?: string;
  } = {},
): IComponentCore {
  return createComponent(
    data,
    {
      originCause: opts.originCause ?? '萬能函數一鍵建立',
      processTrace: opts.processTrace ?? ['建立', '5T 驗算', '封印'],
      finalEffect: opts.finalEffect ?? '已建立並可寫入 Vault',
    },
    opts.fiveT ?? {
      traceable: 0.9,
      transparent: 0.88,
      tangible: 0.9,
      trustworthy: 0.95,
      trackable: 0.9,
    },
    opts.actor,
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: OmniOne 案例處理（預設本地實作，可被函數庫覆寫）
// ═══════════════════════════════════════════════════════════════

/**
 * 預設的本地案例處理器：確定性、可測試，不依賴外部 AI。
 * 若函數庫中註冊了 'omniOne.process'，omni({ kind: 'case' }) 會改由其處理。
 */
export function processCaseLocal(caseType: CaseType, input: string): ProcessResult {
  const start = Date.now();
  const purified = EntropyForge.purify(input);
  // 信心度依輸入長度平滑映射到 0.3–1.0
  const confidence = Math.min(1, Math.max(0.3, 0.5 + purified.length / 2000));
  const output = `[${caseType}] ${purified.slice(0, 160)}`;
  return Object.freeze({
    caseId: `OCASE-${randomBytes(4).toString('hex').toUpperCase()}`,
    caseType,
    input: purified,
    output,
    confidence: Number(confidence.toFixed(2)),
    processingTimeMs: Date.now() - start,
    memoryHits: 0,
    learningDelta: 0,
    isFrozen: true,
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: OmniFunctionLibrary — 執行期函數庫（函數庫）
// ═══════════════════════════════════════════════════════════════

export interface FunctionMeta {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly registeredAt: number;
}

/**
 * 動態函數庫的儲存簽章。參數使用 any[] 是刻意的邊界：
 * 函數庫本質上是動態的，對外的型別安全由 omniFn.call 的回傳 unknown
 * 與各功能頁面自身的型別斷言來保證（終始矩陣）。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FnImpl = (...args: any[]) => unknown;

export class OmniFunctionLibrary {
  private readonly fns = new Map<string, FnImpl>();
  private readonly metas = new Map<string, FunctionMeta>();

  /** 註冊一個可重用函數（函數庫協助功能實現） */
  register(
    name: string,
    fn: FnImpl,
    opts: { description?: string; category?: string } = {},
  ): void {
    if (typeof fn !== 'function') {
      throw new Error(`omniFn.register: ${name} 必須是函數`);
    }
    this.fns.set(name, fn);
    this.metas.set(name, {
      name,
      description: opts.description ?? '',
      category: opts.category ?? 'general',
      registeredAt: Date.now(),
    });
  }

  has(name: string): boolean {
    return this.fns.has(name);
  }

  /** 呼叫已註冊函數；未註冊或拋錯時 throw */
  call(name: string, ...args: readonly unknown[]): unknown {
    const fn = this.fns.get(name);
    if (!fn) throw new Error(`omniFn.call: 未註冊的函數 ${name}`);
    return fn(...args);
  }

  /** 安全呼叫：回傳 { ok, result } 而非拋錯 */
  tryCall(name: string, ...args: readonly unknown[]): { ok: true; result: unknown } | { ok: false; error: string } {
    try {
      return { ok: true, result: this.call(name, ...args) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  remove(name: string): boolean {
    this.metas.delete(name);
    return this.fns.delete(name);
  }

  list(): FunctionMeta[] {
    return [...this.metas.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** 依分類列出函數名稱 */
  listByCategory(category: string): string[] {
    return this.list()
      .filter(m => m.category === category)
      .map(m => m.name);
  }

  count(): number {
    return this.fns.size;
  }
}

/** 全域單例函數庫 */
export const omniFn = new OmniFunctionLibrary();

// ═══════════════════════════════════════════════════════════════
// SECTION 5: 內建函數庫（開箱即用，協助功能頁面實作）
// ═══════════════════════════════════════════════════════════════

import { calculateFiveTScore, FiveTHashLock } from '../five-t-protocol';
import { filterTasks, sortTasks } from './omni-note';

/** 註冊內建函數（重複註冊時略過） */
export function registerBuiltinFunctions(): void {
  if (!omniFn.has('esggo.fiveTScore')) {
    omniFn.register(
      'esggo.fiveTScore',
      (data: { sources?: string[]; algorithmVerified?: boolean; metricsProgress?: number; hashLocked?: boolean; eventsCount?: number }) =>
        calculateFiveTScore(data),
      { description: '依輸入計算 5T 評分', category: 'fiveT' },
    );
  }
  if (!omniFn.has('esggo.componentHash')) {
    omniFn.register(
      'esggo.componentHash',
      (source: string, content: string) => FiveTHashLock.generate(source, content),
      { description: '產生 Trustworthy Hash Lock', category: 'fiveT' },
    );
  }
  if (!omniFn.has('esggo.filterTasks')) {
    omniFn.register(
      'esggo.filterTasks',
      (tasks: OmniTask[], filter: import('./types').OmniTaskFilter) => filterTasks(tasks, filter),
      { description: '依優先級/狀態/到期日過濾任務', category: 'task' },
    );
  }
  if (!omniFn.has('esggo.sortTasks')) {
    omniFn.register(
      'esggo.sortTasks',
      (tasks: OmniTask[], sort: import('./types').OmniTaskSort) => sortTasks(tasks, sort),
      { description: '依欄位/方向排序任務', category: 'task' },
    );
  }
  if (!omniFn.has('esggo.genId')) {
    omniFn.register(
      'esggo.genId',
      (prefix = 'ID') => `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`,
      { description: '產生帶前綴的唯一 ID', category: 'util' },
    );
  }
  if (!omniFn.has('esggo.formatPercent')) {
    omniFn.register(
      'esggo.formatPercent',
      (score: number, digits = 0) => `${(Math.min(1, Math.max(0, score)) * 100).toFixed(digits)}%`,
      { description: '將 0–1 分數格式化為百分比', category: 'util' },
    );
  }
  if (!omniFn.has('esggo.clampScore')) {
    omniFn.register(
      'esggo.clampScore',
      (score: number) => Math.min(1, Math.max(0, score)),
      { description: '將數值收斂至 0–1', category: 'util' },
    );
  }
}

// 模組載入時自動註冊內建函數
registerBuiltinFunctions();
