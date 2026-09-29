/**
 * source_origin: 萬能奧義「每個工作項目都有 TASK ID，分身修復自動跟隨」
 *
 * cli/oa-cli/src/task-watcher.ts — 萬能分身修復任務線監看器（TASK ID 追蹤）
 *
 * 目的（萬能奧義：每個工作項目都有 TASK ID，分身修復自動跟隨）：
 *   `.hermes/auto-repair/clone-tracker.py` 會為每個修復任務產生
 *   `TASK-XXXXXXXX`，並把狀態寫進 tracker-state.json / tracker-log.jsonl。
 *   但既有追蹤器只「記錄」，沒有「監看」—— 步驟卡住不會有人發現，
 *   「完成」也不保證真的修復成功。
 *
 * 本模組是**唯讀觀測層**：只讀上述兩個檔案，做健康判定，不寫回、不重跑。
 * 寫入與重跑屬 clone-tracker.py 的職責，兩者分離以免誤改狀態。
 *
 * 與 §20 OmniTag 契約的關係：
 *   TASK ID 是「哪一個修復任務」的身分，OmniTag 是「該任務歸誰、走哪個陣列、
 *   優先序為何」的路由。本模組產出 `omniTag` 建議欄位，兩者可串接。
 *
 * [agent:27][squad:5T驗算][lifecycle:active][p1][platform:esggo][best-practice:结界]
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { OmniTagSet, SquadName } from './omnitag.js';

// ── 資料形狀（對齊 clone-tracker.py 寫出的 JSON）─────────────

export interface TrackedStep {
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface TrackerTask {
  description: string;
  steps: string[];
  current_step: number;
  status: 'running' | string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  final_output?: string;
}

export interface TrackerState {
  active_tasks: Record<string, TrackerTask>;
  completed_tasks: Record<string, TrackerTask>;
  failed_tasks: Record<string, TrackerTask>;
}

export interface TrackerLogEntry {
  task_id: string;
  timestamp: string;
  event: 'CREATED' | 'STEP_START' | 'STEP_DONE' | 'STEP_FAILED' | 'COMPLETED' | 'FAILED';
  detail: string;
}

// ── 健康判定結果 ──────────────────────────────────────────────

/**
 * stale  — 宣稱在跑，但已超過門檻未更新（可能崩潰／被遺忘）
 * silent — 宣稱在跑，但日誌完全沒有對應進度（任務在第一步就死掉）
 * fake   — 宣稱成功，但缺乏任何實際輸出（不可視為真的修好了）
 * healthy— 有推進中的進度，或有實質輸出
 */
export type HealthVerdict = 'healthy' | 'stale' | 'silent' | 'fake';

export interface TaskHealth {
  taskId: string;
  description: string;
  status: string;
  verdict: HealthVerdict;
  reasons: string[];
  stepsTotal: number;
  stepsDone: number;
  lastActivityAt: string | null;
  ageMinutes: number;
  /** 建議的 OmniTag 路由（哪個陣列該接手這個任務） */
  omniTag: OmniTagSet;
  squad: SquadName | null;
}

export interface WatchReport {
  checkedAt: string;
  tasks: TaskHealth[];
  summary: {
    total: number;
    healthy: number;
    stale: number;
    silent: number;
    fake: number;
  };
}

// ── 預設設定 ─────────────────────────────────────────────────

export interface WatchOptions {
  /** 多久沒推進就判定為 stale（分鐘）。預設 30。 */
  staleAfterMinutes?: number;
  /** 判定 healthy/fake 時，final_output 至少要有這麼多非空白字元。預設 1。 */
  minOutputChars?: number;
  /** 相對 nowMs（測試注入用）。 */
  nowMs?: number;
}

const DEFAULT_STALE_MINUTES = 30;

// ── 內部工具 ─────────────────────────────────────────────────

function parseTime(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * 依 task_id 分組日誌，並回推每個任務實際完成的步驟數。
 */
function groupLog(log: TrackerLogEntry[]): Map<string, TrackerLogEntry[]> {
  const m = new Map<string, TrackerLogEntry[]>();
  for (const e of log) {
    const arr = m.get(e.task_id);
    if (arr) arr.push(e);
    else m.set(e.task_id, [e]);
  }
  return m;
}

/**
 * 從日誌推導實際進度。
 * 回傳 { lastTs, doneSteps, sawAnyProgress }
 */
function deriveProgress(entries: TrackerLogEntry[] | undefined): {
  lastTs: string | null;
  doneSteps: number;
  sawAnyProgress: boolean;
} {
  if (!entries || entries.length === 0) {
    return { lastTs: null, doneSteps: 0, sawAnyProgress: false };
  }
  let lastTs: string | null = null;
  let doneSteps = 0;
  let sawAnyProgress = false;
  for (const e of entries) {
    if (!lastTs || Date.parse(e.timestamp) > Date.parse(lastTs)) lastTs = e.timestamp;
    if (e.event === 'STEP_DONE') {
      doneSteps += 1;
      sawAnyProgress = true;
    } else if (e.event === 'STEP_START' || e.event === 'STEP_FAILED') {
      sawAnyProgress = true;
    }
  }
  return { lastTs, doneSteps, sawAnyProgress };
}

/**
 * 依任務性質推斷 OmniTag 建議值。
 * 目前以關鍵字啟發式對應到 5 大陣列；agent 編號取該陣列的守衛位。
 */
export function suggestOmniTag(taskId: string, description: string): {
  omniTag: OmniTagSet;
  squad: SquadName | null;
} {
  const d = description.toLowerCase();

  // 修復任務屬主陣列：光之羽翼(部署/自動化代行) 或 煉金熵減(重構/熵減)
  // 依內容決定。agent 27（守衛組·5T驗算）為修復類任務的預設接手者。
  let squad: SquadName = '5T驗算';
  if (/deploy|部署|cron|pm2|nginx|vps|restart|reload|重啟/.test(d)) squad = '光之羽翼';
  else if (/refactor|重構|lint|rename|遷移|rename|entropy|熵減/.test(d)) squad = '煉金熵減';
  else if (/vuln|漏洞|dependabot|security|安全|audit|稽核/.test(d)) squad = '5T驗算';
  else if (/type|型別|api|contract|契約/.test(d)) squad = '符文契約';
  else if (/memory|召回|記憶|knowledge|知識/.test(d)) squad = '智庫聖所';

  const AGENT_BY_SQUAD: Record<SquadName, string> = {
    智庫聖所: 'agent:03',
    符文契約: 'agent:09',
    光之羽翼: 'agent:15',
    煉金熵減: 'agent:21',
    '5T驗算': 'agent:27',
  };

  return {
    omniTag: {
      agent: AGENT_BY_SQUAD[squad],
      squad,
      lifecycle: 'active',
      priority: 'p1',
      platform: 'esggo',
      bestPractice: '结界',
    },
    squad,
  };
}

/**
 * 判定單一任務的健康狀態（純函式，無 I/O）。
 */
export function assessTask(
  taskId: string,
  task: TrackerTask,
  entries: TrackerLogEntry[] | undefined,
  opts: WatchOptions = {},
): TaskHealth {
  const staleAfterMs = (opts.staleAfterMinutes ?? DEFAULT_STALE_MINUTES) * 60_000;
  const minOutput = opts.minOutputChars ?? 1;
  const now = opts.nowMs ?? Date.now();

  const reasons: string[] = [];
  const { lastTs, doneSteps, sawAnyProgress } = deriveProgress(entries);

  const isActive = task.status === 'running';
  const isSuccess = task.status === 'success';

  // 參考時間點：成功看 completed_at，否則看日誌最後活動，再退回 updated_at
  const refTs =
    parseTime(task.completed_at) ?? parseTime(lastTs) ?? parseTime(task.updated_at) ?? parseTime(task.created_at);
  const ageMinutes = refTs === null ? Number.POSITIVE_INFINITY : Math.max(0, (now - refTs) / 60_000);

  let verdict: HealthVerdict = 'healthy';

  if (isActive) {
    if (entries === undefined || entries.length === 0) {
      verdict = 'silent';
      reasons.push('任務狀態為 running，但日誌無任何紀錄（建立後即失聯）');
    } else if (!sawAnyProgress) {
      verdict = 'silent';
      reasons.push('任務狀態為 running，但只有 CREATED 事件，從未開始任何步驟');
    } else if (refTs !== null && now - refTs > staleAfterMs) {
      verdict = 'stale';
      reasons.push(`超過 ${opts.staleAfterMinutes ?? DEFAULT_STALE_MINUTES} 分鐘未更新（最後活動 ${lastTs}）`);
    }
  } else if (isSuccess) {
    const out = (task.final_output ?? '').trim();
    if (out.length < minOutput) {
      verdict = 'fake';
      reasons.push('標記為 success，但 final_output 為空 —— 無證據顯示修復真的生效');
    }
  } else if (task.status === 'failed') {
    verdict = 'healthy'; // 失敗是誠實回報，不算異常
    reasons.push('任務已標記為 failed（誠實回報，非假成功）');
  }

  const { omniTag, squad } = suggestOmniTag(taskId, task.description ?? '');

  return {
    taskId,
    description: task.description ?? '',
    status: task.status,
    verdict,
    reasons,
    stepsTotal: task.steps?.length ?? 0,
    stepsDone: doneSteps,
    lastActivityAt: lastTs,
    ageMinutes: Number.isFinite(ageMinutes) ? Math.round(ageMinutes) : -1,
    omniTag,
    squad,
  };
}

/**
 * 讀取 tracker 狀態與日誌並產出完整報告。
 *
 * `dir` 預設為專案內 `.hermes/auto-repair`（該目錄被 .gitignore 排除，
 * 屬本機執行期狀態；本模組只讀不寫，故不需納入版控）。
 */
export function watchTasks(dir: string, opts: WatchOptions = {}): WatchReport {
  const statePath = join(dir, 'tracker-state.json');
  const logPath = join(dir, 'tracker-log.jsonl');

  let state: TrackerState = { active_tasks: {}, completed_tasks: {}, failed_tasks: {} };
  if (existsSync(statePath)) {
    state = JSON.parse(readFileSync(statePath, 'utf-8')) as TrackerState;
  }

  let log: TrackerLogEntry[] = [];
  if (existsSync(logPath)) {
    log = readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as TrackerLogEntry);
  }

  const grouped = groupLog(log);
  const tasks: TaskHealth[] = [];

  for (const [taskId, task] of Object.entries(state.active_tasks ?? {})) {
    tasks.push(assessTask(taskId, task, grouped.get(taskId), opts));
  }
  for (const [taskId, task] of Object.entries(state.completed_tasks ?? {})) {
    tasks.push(assessTask(taskId, task, grouped.get(taskId), opts));
  }
  for (const [taskId, task] of Object.entries(state.failed_tasks ?? {})) {
    tasks.push(assessTask(taskId, task, grouped.get(taskId), opts));
  }

  const summary = {
    total: tasks.length,
    healthy: tasks.filter((t) => t.verdict === 'healthy').length,
    stale: tasks.filter((t) => t.verdict === 'stale').length,
    silent: tasks.filter((t) => t.verdict === 'silent').length,
    fake: tasks.filter((t) => t.verdict === 'fake').length,
  };

  return { checkedAt: new Date(opts.nowMs ?? Date.now()).toISOString(), tasks, summary };
}

/**
 * 人類可讀的文字報告。
 */
export function formatReport(report: WatchReport): string {
  const lines: string[] = [];
  lines.push(`萬能分身修復任務線監看報告  ${report.checkedAt}`);
  lines.push(
    `總計 ${report.summary.total}｜健康 ${report.summary.healthy}｜卡住 ${report.summary.stale}｜失聯 ${report.summary.silent}｜假成功 ${report.summary.fake}`,
  );
  lines.push('');
  if (report.tasks.length === 0) {
    lines.push('（無追蹤中的任務）');
    return lines.join('\n');
  }
  for (const t of report.tasks) {
    const mark =
      t.verdict === 'healthy' ? '✅' : t.verdict === 'stale' ? '⏳' : t.verdict === 'silent' ? '🔇' : '⚠️';
    lines.push(`${mark} [${t.taskId}] ${t.description}`);
    lines.push(`   verdict=${t.verdict}  status=${t.status}  步驟 ${t.stepsDone}/${t.stepsTotal}  陣列=${t.squad ?? '-'}`);
    for (const r of t.reasons) lines.push(`   · ${r}`);
  }
  return lines.join('\n');
}
