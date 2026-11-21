/**
 * ==========================================
 * 完全代主自行 - 全量日誌 sink（統一持久化）
 * ==========================================
 *
 * 對齊平臺不變量「全量」：將審計條目（audit）與委派事件（event）合併寫入同一份
 * append-only JSONL 日誌（預設 `.audit/delegation-journal.jsonl`），實現不抽樣、
 * 不截斷的全量留存，並以單調序號 `id` 作為 SSE `Last-Event-ID` 斷點續傳遊標。
 *
 * 說明：AuditLogger 的 AuditEntry 未匯出，此處採結構相容的本地介面；事件記錄
 * 相容 IBusEvent 抽取。審計與事件以 `kind` 區分，共用同一序號空間，確保續傳有序。
 */

import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'path';

/** 審計條目（與 AuditLogger.AuditEntry 結構相容） */
export interface AuditEntry {
  type: string;
  timestamp: number;
  [key: string]: unknown;
}

/** 事件記錄（與 IBusEvent 抽取相容） */
export interface BusEventRecord {
  id: number;
  type: string;
  delegationId: string;
  topic: string;
  hashLock: string;
  ts: number;
  source: string;
  payload: Record<string, unknown>;
}

/** 統一日誌記錄（discriminated by kind）；id 為單調序號（斷點續傳遊標） */
export interface JournalRecord {
  kind: 'audit' | 'event';
  id: number;
  ts: number;
  type: string;
  delegationId?: string;
  topic?: string;
  hashLock?: string;
  source?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DelegationJournal {
  /** 寫入一筆（審計或事件），回傳分配的單調序號 id */
  append(rec: Omit<JournalRecord, 'id'>): number;
  /** 讀回全量日誌 */
  readAll(): JournalRecord[];
  /** 依 kind 過濾，可指定 sinceId 只取 id > sinceId（斷點續傳） */
  readSince(kind: 'audit' | 'event', sinceId?: number): JournalRecord[];
}

/**
 * 建立檔案型統一日誌 sink（JSONL，append-only）。
 * - 預設路徑 `.audit/delegation-journal.jsonl`（請加入 .gitignore）。
 * - 路徑可經環境變數 `DELEGATION_JOURNAL_PATH` 覆寫；亦相容舊的
 *   `AUDIT_SINK_PATH` / `EVENT_SINK_PATH`（擇一優先生效）。
 * - 寫入為 best-effort：失敗僅記錄，不拋出。
 * - 序號 id 以現有行數為起始（append-only，行序即序號），保證單調且不重複。
 */
export function createDelegationJournal(
  path: string =
    process.env.DELEGATION_JOURNAL_PATH ||
    process.env.AUDIT_SINK_PATH ||
    process.env.EVENT_SINK_PATH ||
    '.audit/delegation-journal.jsonl'
): DelegationJournal {
  let counter = 0;

  const nextId = (): number => {
    if (counter === 0 && existsSync(path)) {
      const raw = readFileSync(path, 'utf8').trim();
      counter = raw ? raw.split('\n').filter(Boolean).length : 0;
    }
    return ++counter;
  };

  const append = (rec: Omit<JournalRecord, 'id'>): number => {
    const id = nextId();
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      appendFileSync(path, JSON.stringify({ id, ...rec }) + '\n', 'utf8');
    } catch (err) {
      console.error('[DelegationJournal] write failed:', err);
      counter = Math.max(counter - 1, 0);
    }
    return id;
  };

  const readAll = (): JournalRecord[] => {
    try {
      if (!existsSync(path)) return [];
      const raw = readFileSync(path, 'utf8');
      return raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => JSON.parse(l) as JournalRecord);
    } catch (err) {
      console.error('[DelegationJournal] read failed:', err);
      return [];
    }
  };

  const readSince = (kind: 'audit' | 'event', sinceId?: number): JournalRecord[] =>
    readAll().filter(
      (r) => r.kind === kind && (sinceId == null || r.id > sinceId)
    );

  return { append, readAll, readSince };
}

/**
 * 預設日誌 sink 單例（lazy）。publishDelegationEvent 與 SSE 回放共用，
 * 確保寫入與讀取、以及序號空間為同一來源。
 */
let _default: DelegationJournal | null = null;

export function getDefaultJournal(): DelegationJournal {
  if (!_default) _default = createDelegationJournal();
  return _default;
}

/** 供測試置換 / 重置預設 sink（傳 null 回到 lazy 預設）。 */
export function setDefaultJournal(sink: DelegationJournal | null): void {
  _default = sink;
}
