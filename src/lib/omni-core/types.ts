// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniCore v1.0 — 萬能中心核心類型定義
 *
 * 底層數據契約 IComponentCore:
 * 所有進入 OmniCore 的數據必須通過 5T 協議，轉化為「知識結晶」。
 *
 * 5T 協議維度：
 *   真 (Traceable)   — 可溯源追蹤的真實數據
 *   善 (Transparent) — 可透明驗算的公正審計
 *   美 (Tangible)    — 可感知的卓越藝術 / 具體呈現
 *   信 (Trustworthy) — 不可篡改的信任 (SHA-256)
 *   通 (Trackable)   — 超越一切的無礙圓通
 */

import { createHash } from 'crypto';
import { EntropyForge } from './entropy-forge';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: 5T Protocol Types
// ═══════════════════════════════════════════════════════════════

export type FiveTDimension = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';

export interface FiveTScore {
  traceable: number;   // 0.0 – 1.0
  transparent: number;
  tangible: number;
  trustworthy: number;
  trackable: number;
}

export interface FiveTStatus {
  traceable: boolean;
  transparent: boolean;
  tangible: boolean;
  trustworthy: boolean;
  trackable: boolean;
}

export const FIVE_T_META: Record<FiveTDimension, { zh: string; en: string; symbol: string; color: string }> = {
  traceable:   { zh: '真',  en: 'Traceable',   symbol: '真',  color: '#3B82F6' },
  transparent: { zh: '善',  en: 'Transparent',  symbol: '善',  color: '#22C55E' },
  tangible:    { zh: '美',  en: 'Tangible',     symbol: '美',  color: '#F59E0B' },
  trustworthy: { zh: '信',  en: 'Trustworthy',  symbol: '信',  color: '#8B5CF6' },
  trackable:   { zh: '通',  en: 'Trackable',    symbol: '通',  color: '#06B6D4' },
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Core Component Contract (IComponentCore)
// ═══════════════════════════════════════════════════════════════

export type ExtractionMethod = 'OCR' | 'IoT' | 'Manual' | 'AI' | 'API';
export type LifecycleEvent = 'created' | 'updated' | 'verified' | 'locked' | 'archived' | 'restored';

export interface ComponentEvidence {
  originCause: string;    // 因：原始觸發條件
  processTrace: string[]; // 循：InfoOne 流轉路徑
  finalEffect: string;    // 果：最終執行結果與狀態
}

export interface ComponentLifecycleEntry {
  readonly event: LifecycleEvent;
  readonly timestamp: number;
  readonly actor?: string;
  readonly delta?: string;           // JSON diff string
  readonly note?: string;
}

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

/** 建立 IComponentCore 實例 */
export function createComponent<T>(
  data: T,
  evidence: ComponentEvidence,
  fiveT?: Partial<FiveTScore>,
  actor?: string,
): IComponentCore {
  const uuid = `OC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const version = '1.0.0';
  const timestamp = Date.now();

  const purifiedDataStr = EntropyForge.purify(JSON.stringify(data));
  const purifiedEvidence = {
    originCause: EntropyForge.purify(evidence.originCause),
    processTrace: evidence.processTrace.map(trace => EntropyForge.purify(trace)),
    finalEffect: EntropyForge.purify(evidence.finalEffect),
  };

  const fiveTScore: FiveTScore = {
    traceable:   fiveT?.traceable   ?? 0.8,
    transparent: fiveT?.transparent ?? 0.8,
    tangible:    fiveT?.tangible    ?? 0.8,
    trustworthy: fiveT?.trustworthy ?? 0.9,
    trackable:   fiveT?.trackable   ?? 0.8,
  };

  const bodyHash = createHash('sha256')
    .update(EntropyForge.purify(JSON.stringify({ uuid, version, timestamp, data: purifiedDataStr, evidence: purifiedEvidence })))
    .digest('hex');

  const component = {
    uuid,
    version,
    timestamp,
    evidence: purifiedEvidence,
    lifecycle_events: [{ event: 'created', timestamp, actor }],
    data,
    isFrozen: true,
    fiveT: fiveTScore,
    hash: bodyHash,
  };

  return Object.freeze(component) as unknown as IComponentCore;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: OmniNote Types (萬能筆記)
// ═══════════════════════════════════════════════════════════════

export type NotePriority = 'high' | 'medium' | 'low';
export type NoteCategory = 'note' | 'task' | 'todo' | 'calendar' | 'reference';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface OmniTask {
  readonly id: string;
  title: string;
  description?: string;
  priority: NotePriority;
  status: TaskStatus;
  dueAt?: number;          // Unix timestamp
  tags: string[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  readonly isFrozen: boolean;
}

export interface OmniNote {
  readonly id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  tasks: OmniTask[];
  metadata: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
  isFrozen: boolean;
  fiveTGate?: FiveTDimension;
  zkpHash?: string;
}

// Filter & Sort types
export type TaskFilterPriority = NotePriority | 'all';
export type TaskFilterDue = 'all' | 'upcoming' | 'overdue';
export type TaskSortField = 'dueAt' | 'priority' | 'status' | 'createdAt';

export interface OmniTaskFilter {
  priority: TaskFilterPriority;
  due: TaskFilterDue;
  status?: TaskStatus | 'all';
}

export interface OmniTaskSort {
  field: TaskSortField;
  direction: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: OmniOne SDK Types (覺醒系統)
// ═══════════════════════════════════════════════════════════════

export type CaseType =
  | 'code_optimization'
  | 'documentation'
  | 'data_analysis'
  | 'esg_report'
  | 'ui_design'
  | 'architecture'
  | 'bug_fix'
  | 'general';

export type AwakeningLevel = 'dormant' | 'awakening' | 'active' | 'transcendent';

export interface MemoryEntry {
  readonly id: string;
  readonly caseType: CaseType;
  readonly input: string;
  readonly output: string;
  readonly confidence: number;  // 0.0 – 1.0
  readonly timestamp: number;
  readonly tags: string[];
  relevanceScore?: number;
}

export interface OmniOneState {
  level: AwakeningLevel;
  totalCasesProcessed: number;
  averageConfidence: number;
  memorySize: number;
  autonomousModeEnabled: boolean;
  lastProcessedAt?: number;
}

export interface ProcessResult {
  readonly caseId: string;
  readonly caseType: CaseType;
  readonly input: string;
  readonly output: string;
  readonly confidence: number;
  readonly processingTimeMs: number;
  readonly memoryHits: number;
  readonly learningDelta: number;
  readonly isFrozen: boolean;
}
