/**
 * ESGGO Redis Cache Layer — Barrel Export
 *
 * Usage:
 *   import { getRedis, getTaskState, updateChapterProgress } from '@lib/redis';
 */

// Client
export {
  getRedis,
  isRedisReady,
  getRedisHealth,
  shutdownRedis,
  memoryFallback,
  safeParse,
  safeStringify,
} from './client';

// State CRUD
export {
  TTL,
  taskKey,
  chapterKey,
  progressKey,
  reportKey,
  lockKey,
  createTaskState,
  getTaskState,
  setTaskState,
  updateTaskState,
  deleteTaskState,
  updateChapterProgress,
  getChapterCache,
  setChapterCache,
  getAllChapterStates,
  getProgress,
  setProgressInfo,
  getProgressInfo,
  setReportCache,
  getReportCache,
  clearTaskCache,
  cleanupStaleTasks,
} from './state';

// Re-export types
export type {
  TaskStatus,
  TaskState,
  ChapterState,
  TaskResult,
  ProgressInfo,
} from './state';
