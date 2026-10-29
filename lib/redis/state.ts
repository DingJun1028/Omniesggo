// [ts-matrix] 重複定義已收斂：改由規範型別提供者（../../src/types/sustain-write）提供，單一真實來源。
import type { TaskResult } from '../../src/types/sustain-write';
/**
 * ESGGO Redis State CRUD Operations
 *
 * Provides typed, production-ready state management for:
 *  - Async report task state (CRUD + TTL)
 *  - Chapter progress tracking
 *  - Report caching
 *
 * Automatically uses Redis when available, falls back to in-memory store.
 */

import {
  getRedis,
  memoryFallback,
  safeParse,
  safeStringify,
} from './client';

// ─── Key Prefix & TTL Configuration ──────────────────────────────────────────

const PREFIX = 'esggo:state:';

/** TTL in seconds for various entity types */
export const TTL = {
  CHAPTER_CACHE: 24 * 60 * 60,    // 24 hours
  TASK_STATE:    7 * 24 * 60 * 60, // 7 days
  PROGRESS:      1 * 60 * 60,      // 1 hour
  REPORT_CACHE:  2 * 60 * 60,      // 2 hours
  LOCK:          30,                // 30 seconds (distributed locks)
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RedisTaskStatus = 'pending' | 'processing' | 'running' | 'completed' | 'failed' | 'cancelled';

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { RedisTaskStatus as TaskStatus };

export interface TaskState {
  taskId: string;
  companyId: string;
  companyName: string;
  status: RedisTaskStatus;
  totalChapters: number;
  completedChapters: number[];
  failedChapters: number[];
  chapters: Record<number, ChapterState>;
  createdAt: string;
  updatedAt: string;
  format: 'json' | 'html' | 'markdown';
  error?: string;
  result?: TaskResult;
}

export interface ChapterState {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  words: number;
  content?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// [ts-matrix] 重複定義已收斂：改由規範型別提供者（../../src/types/sustain-write）提供，單一真實來源。
export type { TaskResult };

export interface ProgressInfo {
  taskId: string;
  status: RedisTaskStatus;
  completed: number;
  total: number;
  percentage: number;
  currentChapter?: string;
  wordsSoFar: number;
  updatedAt: string;
}

// ─── Key Builders ───────────────────────────────────────────────────────────
──

export function taskKey(taskId: string): string {
  return `${PREFIX}task:${taskId}`;
}

export function chapterKey(taskId: string, chapterNum: number): string {
  return `${PREFIX}chapter:${taskId}:${chapterNum}`;
}

export function progressKey(taskId: string): string {
  return `${PREFIX}progress:${taskId}`;
}

export function reportKey(companyId: string, format: string): string {
  return `${PREFIX}report:${companyId}:${format}`;
}

export function lockKey(resource: string): string {
  return `${PREFIX}lock:${resource}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Task State CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new task state entry.
 */
export async function createTaskState(
  taskId: string,
  companyId: string,
  companyName: string,
  totalChapters: number = 28,
  format: 'json' | 'html' | 'markdown' = 'json',
): Promise<TaskState> {
  const now = new Date().toISOString();
  const state: TaskState = {
    taskId,
    companyId,
    companyName,
    status: 'pending',
    totalChapters,
    completedChapters: [],
    failedChapters: [],
    chapters: {},
    createdAt: now,
    updatedAt: now,
    format,
  };
  await setTaskState(state);
  return state;
}

/**
 * Get task state by task ID.
 */
export async function getTaskState(taskId: string): Promise<TaskState | null> {
  const key = taskKey(taskId);
  const redis = await getRedis();

  if (redis) {
    const data = await redis.get(key);
    return safeParse<TaskState>(data);
  }
  return memoryFallback.get(key) as TaskState | null;
}

/**
 * Set (overwrite) task state.
 */
export async function setTaskState(state: TaskState): Promise<void> {
  const key = taskKey(state.taskId);
  const updated = { ...state, updatedAt: new Date().toISOString() };
  const json = safeStringify(updated);

  const redis = await getRedis();
  if (redis) {
    await redis.setex(key, TTL.TASK_STATE, json);
  }
  memo
ryFallback.set(key, updated, TTL.TASK_STATE);
}

/**
 * Update specific fields of a task state (partial update).
 * Merges the provided partial into the existing state.
 */
export async function updateTaskState(
  taskId: string,
  partial: Partial<TaskState>,
): Promise<TaskState | null> {
  const existing = await getTaskState(taskId);
  if (!existing) return null;

  const merged: TaskState = {
    ...existing,
    ...partial,
    taskId: existing.taskId, // never overwrite taskId
    updatedAt: new Date().toISOString(),
  };
  await setTaskState(merged);
  return merged;
}

/**
 * Delete a task state entry.
 */
export async function deleteTaskState(taskId: string): Promise<boolean> {
  const key = taskKey(taskId);
  const redis = await getRedis();

  if (redis) {
    const result = await redis.del(key);
    memoryFallback.del(key);
    return result > 0;
  }
  return memoryFallback.del(key);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chapter Progress Tracking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update (or create) a chapter's progress within a task.
 * Also updates the parent task's completedChapters / failedChapters arrays.
 */
export async function updateChapterProgress(
  taskId: string,
  chapterNum: number,
  chapterUpdate: Partial<ChapterState> & { status: ChapterState['status'] },
): Promise<TaskState | null> {
  const state = await getTaskState(taskId);
  if (!state) return null;

  const now = new Date().toISOString();
  const existing: ChapterState = state.chapters[chapterNum] ?? {
    status: 'pending',
    words: 0,
  };

  const updatedChapter: ChapterState = {
    ...existing,
    ...chapterUpdate,
    startedAt: chapterUpdate.status === 'running' && !existing.startedAt
      ? now
      : existing.startedAt,
    completedAt: chapterUpdate.status === 'completed'
      ? now
      : existing.completedAt,
  };

  state.chapters[chapterNum] = updatedChap
ter;

  // Update completed / failed arrays
  if (updatedChapter.status === 'completed') {
    if (!state.completedChapters.includes(chapterNum)) {
      state.completedChapters.push(chapterNum);
    }
    // Remove from failed if it was previously failed
    state.failedChapters = state.failedChapters.filter(n => n !== chapterNum);
  }

  if (updatedChapter.status === 'failed') {
    if (!state.failedChapters.includes(chapterNum)) {
      state.failedChapters.push(chapterNum);
    }
    // Remove from completed if it was previously completed
    state.completedChapters = state.completedChapters.filter(n => n !== chapterNum);
  }

  // Determine overall task status
  if (state.completedChapters.length === state.totalChapters) {
    state.status = 'completed';
  } else if (state.failedChapters.length + state.completedChapters.length === state.totalChapters) {
    // All chapters are either completed or failed
    state.status = state.failedChapters.length > 0 ? 'failed' : 'completed';
  } else if (state.completedChapters.length > 0 || state.failedChapters.length > 0) {
    state.status = 'processing';
  }

  state.updatedAt = now;

  // Also cache the individual chapter for quick access
  await setChapterCache(taskId, chapterNum, updatedChapter);

  await setTaskState(state);
  return state;
}

/**
 * Get a single chapter's cached state.
 */
export async function getChapterCache(
  taskId: string,
  chapterNum: number,
): Promise<ChapterState | null> {
  const key = chapterKey(taskId, chapterNum);
  const redis = await getRedis();

  if (redis) {
    const data = await redis.get(key);
    return safeParse<ChapterState>(data);
  }
  return memoryFallback.get(key) as ChapterState | null;
}

/**
 * Set a single chapter's cached state.
 */
export async function setChapterCache(
  taskId: string,
  chapterNum: number,
  chapterState: ChapterState,
): Promise<void> {
  const key = chapterKey(taskId, chapterNum);
  const json = safeStringify(chapterState);

  const redis = 
await getRedis();
  if (redis) {
    await redis.setex(key, TTL.CHAPTER_CACHE, json);
  }
  memoryFallback.set(key, chapterState, TTL.CHAPTER_CACHE);
}

/**
 * Get all chapter states for a task by iterating the task state's chapters map.
 */
export async function getAllChapterStates(
  taskId: string,
): Promise<Record<number, ChapterState>> {
  const state = await getTaskState(taskId);
  return state?.chapters ?? {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// Progress Queries
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a progress summary for a task.
 */
export async function getProgress(taskId: string): Promise<ProgressInfo> {
  const state = await getTaskState(taskId);
  if (!state) {
    return {
      taskId,
      status: 'not_found' as unknown as RedisTaskStatus,
      completed: 0,
      total: 28,
      percentage: 0,
      wordsSoFar: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const completed = state.completedChapters.length;
  const total = state.totalChapters;
  const wordsSoFar = Object.values(state.chapters)
    .reduce((sum, ch) => sum + (ch.words || 0), 0);

  // Find current chapter title
  const currentChapterNum = Object.keys(state.chapters)
    .map(Number)
    .find(n => state.chapters[n].status === 'running');

  return {
    taskId,
    status: state.status,
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    currentChapter: currentChapterNum ? `Chapter ${currentChapterNum}` : undefined,
    wordsSoFar,
    updatedAt: state.updatedAt,
  };
}

/**
 * Store a lightweight progress record (for rapid polling).
 */
export async function setProgressInfo(info: ProgressInfo): Promise<void> {
  const key = progressKey(info.taskId);
  const json = safeStringify(info);

  const redis = await getRedis();
  if (redis) {
    await redis.setex(key, TTL.PROGRESS, json);
  }
  memoryFallback.set(key, info, 
TTL.PROGRESS);
}

/**
 * Get the lightweight progress record.
 */
export async function getProgressInfo(taskId: string): Promise<ProgressInfo | null> {
  const key = progressKey(taskId);
  const redis = await getRedis();

  if (redis) {
    const data = await redis.get(key);
    return safeParse<ProgressInfo>(data);
  }
  // Fall back to full state if no lightweight record
  const fromState = await getProgress(taskId);
  if ((fromState.status as string) !== 'not_found') return fromState;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Report Cache
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cache a generated report.
 */
export async function setReportCache(
  companyId: string,
  format: string,
  content: unknown,
): Promise<void> {
  const key = reportKey(companyId, format);
  const json = safeStringify(content);

  const redis = await getRedis();
  if (redis) {
    await redis.setex(key, TTL.REPORT_CACHE, json);
  }
  memoryFallback.set(key, content, TTL.REPORT_CACHE);
}

/**
 * Get a cached report.
 */
export async function getReportCache(
  companyId: string,
  format: string,
): Promise<unknown> {
  const key = reportKey(companyId, format);
  const redis = await getRedis();

  if (redis) {
    const data = await redis.get(key);
    return safeParse(data);
  }
  return memoryFallback.get(key);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bulk Cleanup
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Delete all Redis and memory keys associated with a task.
 */
export async function clearTaskCache(taskId: string): Promise<void> {
  const state = await getTaskState(taskId);

  const redis = await getRedis();

  // Delete chapter keys
  if (state) {
    for (const chapterNum of Object.keys(state.chapters)) {
      const key = chapterKey(taskId, parseInt(chapterNum, 10));
      if 
(redis) await redis.del(key);
      memoryFallback.del(key);
    }
  }

  // Delete task key + progress key
  const tKey = taskKey(taskId);
  const pKey = progressKey(taskId);

  if (redis) {
    await redis.del(tKey);
    await redis.del(pKey);
    // Also delete any chapter keys that might remain (wildcard scan)
    try {
      const pattern = `${PREFIX}chapter:${taskId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch { /* best effort */ }
  }

  memoryFallback.del(tKey);
  memoryFallback.del(pKey);
}

/**
 * Clean up task states that have been completed/failed/cancelled
 * longer than the given TTL.
 */
export async function cleanupStaleTasks(maxAgeSeconds: number = TTL.TASK_STATE): Promise<number> {
  const redis = await getRedis();
  let cleaned = 0;

  if (redis) {
    try {
      const pattern = `${PREFIX}task:*`;
      const keys = await redis.keys(pattern);
      const cutoff = Date.now() - maxAgeSeconds * 1000;

      for (const key of keys) {
        const data = await redis.get(key);
        const state = safeParse<TaskState>(data);
        if (
          state &&
          (state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled')
        ) {
          if (new Date(state.updatedAt).getTime() < cutoff) {
            await clearTaskCache(state.taskId);
            cleaned++;
          }
        }
      }
    } catch (err: unknown) {
      console.warn('[Redis State] Cleanup error:', err instanceof Error ? err.message : err);
    }
  }

  // Also clean memory fallback
  const cutoff = Date.now() - maxAgeSeconds * 1000;
  const memPattern = `${PREFIX}task:*`;
  const memKeys = memoryFallback.keys(memPattern);
  for (const key of memKeys) {
    const state = memoryFallback.get(key) as TaskState | null;
    if (
      state &&
      (state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled')
    ) {
      if (new Date(state.updat
edAt).getTime() < cutoff) {
        memoryFallback.del(key);
        cleaned++;
      }
    }
  }

  return cleaned;
}
