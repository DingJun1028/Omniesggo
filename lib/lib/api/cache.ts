/**
 * ESGGO v5.1 — Redis 快取層 (向後兼容包裝器)
 * 
 * 用途：
 * 1. 報告生成進度追蹤
 * 2. 單章快取（避免重複生成）
 * 3. Task 狀態管理
 * 
 * 支援 Redis（生產環境）和 Memory Cache（開發環境）
 * 委託給 @lib/redis 統一層，共用 Redis 連線
 */

import {
  getRedis,
  memoryFallback,
  safeParse,
  safeStringify,
} from '../redis/client';

import {
  chapterKey,
  taskKey,
  progressKey,
  getChapterCache as _getChapterCache,
  setChapterCache as _setChapterCache,
  getTaskState as _getTaskState,
  setTaskState as _setTaskState,
  updateChapterProgress as _updateChapterProgress,
  getProgress as _getProgress,
  clearTaskCache as _clearTaskCache,
  TTL,
  type TaskState,
} from '../redis/state';

// ═══════════════════════════════════════════════════════════════════════════════
// 向後兼容的 Key 生成函數
// ═══════════════════════════════════════════════════════════════════════════════

export function chapterCacheKey(taskId: string, chapterNum: number): string {
  return chapterKey(taskId, chapterNum);
}

export function taskCacheKey(taskId: string): string {
  return taskKey(taskId);
}

export function progressCacheKey(taskId: string): string {
  return progressKey(taskId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 重新匯出統一層的操作
// ═══════════════════════════════════════════════════════════════════════════════

export const getChapterCache = _getChapterCache;
export const setChapterCache = _setChapterCache;
export const getTaskState = _getTaskState;
export const setTaskState = _setTaskState;
export const updateChapterProgress = _updateChapterProgress;
export const getProgress = _getProgress;
export const clearTaskCache = _clearTaskCache;

// Re-export types
export type { TaskState };

export default {
  chapterCacheKey,
  taskCacheKey,
  progressCacheKey,
  getChapterCache,
  setChapterCache,
  getTaskState,
  setTaskState,
  updateChapterProgress,
  getProgress,
  clearTaskCache,
};
