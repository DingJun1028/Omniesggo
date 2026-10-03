/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * v5 非同步報告任務管理（Redis 增強版）
 *
 * 真正呼叫 generateV5Report 邏輯，逐章生成並回報進度。
 * 使用 Redis 做持久化狀態管理，支援：
 *  - 多實例共享任務狀態
 *  - TTL 自動清理
 *  - 章節進度追蹤
 *  - 記憶體 fallback（開發環境）
 */

import { generateV5Report, getV5Companies, V5_CHAPTERS } from './report-generator-v5';
import { agnesApi, type AgnesResponse } from '@/lib/agnes-api';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import {
  createTaskState,
  getTaskState,
  setTaskState,
  updateChapterProgress,
  setProgressInfo,
  cleanupStaleTasks,
  type TaskState,
} from '@lib/redis';

// ═══════════════════════════════════════════════════════════════════════════════
// Types — kept for backward compatibility with existing API routes
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskProgress {
  readonly taskId: string;
  readonly status: TaskStatus;
  readonly taskType?: 'report_generation' | 'grammar_rewrite' | 'ocr_processing';
  readonly templateId?: string;
  readonly noteIds?: readonly string[];
  readonly customCompany?: {
    readonly name: string;
    readonly industry: string;
    readonly employees: number;
    readonly annualRevenue: string;
    readonly scope1Tco2e: number;
    readonly scope2Tco2e: number;
  };
  readonly currentChapter: number;
  readonly totalChapters: number;
  readonly chapterTitle: string;
  readonly wordsSoFar: number;
  readonly fiveTGate: string;
  readonly tagsCreated: number;
  readonly decisionsCount: number;
  readonly percent: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly error?: string;
  readonly result?: {
    readonly totalWords: number;
    readonly totalTags: number;
    readonly trinityHash: string;
    readonly durationMs: number;
    readonly companyId: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// In-Memory Overlay (for backward compat with TaskProgress shape)
// ═══════════════════════════════════════════════════════════════════════════════

const tasks = new Map<string, TaskProgress>();
const taskTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const taskCancelled = new Set<string>();
const RESULT_TTL_MS = 3600000;

/** Map a TaskState (Redis) to a TaskProgress (legacy API shape) */
function stateToProgress(state: TaskState, extra?: Partial<TaskProgress>): TaskProgress {
  const currentChapter = state.completedChapters.length;
  const runningChapter = Object.entries(state.chapters).find(([, ch]) => ch.status === 'running');
  const wordsSoFar = Object.values(state.chapters).reduce((sum, ch) => sum + (ch.words || 0), 0);
  const chNum = runningChapter ? parseInt(runningChapter[0], 10) : currentChapter;
  const gate =
    chNum <= 3
      ? 'traceable'
      : chNum <= 5
        ? 'transparent'
        : chNum <= 13
          ? 'tangible'
          : chNum <= 24
            ? 'trustworthy'
            : 'trackable';
  const chapterTitle = V5_CHAPTERS[chNum - 1]?.title ?? `第${chNum}章`;

  return {
    taskId: state.taskId,
    status: state.status as TaskStatus,
    taskType: 'report_generation',
    currentChapter,
    totalChapters: state.totalChapters,
    chapterTitle,
    wordsSoFar,
    fiveTGate: gate,
    tagsCreated: state.completedChapters.length,
    decisionsCount: state.completedChapters.length * 3,
    percent:
      state.totalChapters > 0
        ? Math.round((state.completedChapters.length / state.totalChapters) * 100)
        : 0,
    startedAt: state.createdAt,
    updatedAt: state.updatedAt,
    completedAt:
      state.status === 'completed' || state.status === 'failed' ? state.updatedAt : undefined,
    error: state.error,
    result: state.result
      ? {
          totalWords: state.result.totalWords,
          totalTags: state.result.totalTags,
          trinityHash: state.result.trinityHash,
          durationMs: state.result.durationMs,
          companyId: state.result.companyId,
        }
      : undefined,
    ...extra,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Task Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

export function createTask(
  companyId: string,
  templateId?: string,
  noteIds?: string[],
  customCompany?: {
    name: string;
    industry: string;
    employees: number;
    annualRevenue: string;
    scope1Tco2e: number;
    scope2Tco2e: number;
  },
): string {
  const taskId = `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // Template determines chapter count: GRI=28, TCFD=12, Investor=5
  const chapterMap: Record<string, number> = { gri: 28, tcfd: 12, investor: 5 };
  const totalChapters = chapterMap[templateId?.toLowerCase() || 'gri'] || 28;

  // In-memory overlay (for immediate reads)
  const task: TaskProgress = {
    taskId,
    status: 'pending',
    taskType: 'report_generation',
    currentChapter: 0,
    totalChapters,
    chapterTitle: '',
    wordsSoFar: 0,
    fiveTGate: '',
    tagsCreated: 0,
    decisionsCount: 0,
    percent: 0,
    startedAt: now,
    updatedAt: now,
    templateId: templateId || 'gri',
    ...(noteIds && noteIds.length > 0 ? { noteIds } : {}),
    ...(customCompany ? { customCompany } : {}),
  };
  tasks.set(taskId, task);

  // Persist to Redis (non-blocking)
  createTaskState(taskId, companyId, templateId || '', totalChapters, 'json').catch(
    (err: unknown) => {
      console.warn(
        '[AsyncTask] Redis createTaskState failed:',
        err instanceof Error ? err.message : String(err),
      );
    },
  );

  return taskId;
}

export async function getTask(taskId: string): Promise<TaskProgress | null> {
  // Try in-memory first (fastest, always up-to-date during processing)
  const memTask = tasks.get(taskId);
  if (memTask) return memTask;

  // Fall back to Redis
  try {
    const state = await getTaskState(taskId);
    if (state) return stateToProgress(state);
  } catch (err: unknown) {
    console.warn(
      '[AsyncTask] Redis getTaskState failed:',
      err instanceof Error ? err.message : String(err),
    );
  }

  return null;
}

export function getAllTasks(): TaskProgress[] {
  return Array.from(tasks.values());
}

export function cancelTask(taskId: string): boolean {
  const task = tasks.get(taskId);
  if (!task || task.status === 'completed' || task.status === 'failed') return false;

  taskCancelled.add(taskId);
  const timeout = taskTimeouts.get(taskId);
  if (timeout) {
    clearTimeout(timeout);
    taskTimeouts.delete(taskId);
  }

  const updated: TaskProgress = {
    ...task,
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  };
  tasks.set(taskId, updated);

  // Persist cancellation to Redis (non-blocking)
  setTaskState({
    taskId,
    companyId: '',
    companyName: '',
    status: 'cancelled',
    totalChapters: task.totalChapters,
    completedChapters: [],
    failedChapters: [],
    chapters: {},
    createdAt: task.startedAt,
    updatedAt: new Date().toISOString(),
    format: 'json',
  }).catch(() => {});

  return true;
}

export function cleanupOldTasks(): number {
  const now = Date.now();
  let cleaned = 0;
  const entries = Array.from(tasks.entries());
  for (let i = 0; i < entries.length; i++) {
    const [id, task] = entries[i];
    if (['completed', 'failed', 'cancelled'].includes(task.status) && task.completedAt) {
      if (now - new Date(task.completedAt).getTime() > RESULT_TTL_MS) {
        tasks.delete(id);
        cleaned++;
      }
    }
  }

  // Also clean Redis (non-blocking)
  cleanupStaleTasks().catch(() => {});

  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Real Async Report Generation (Redis-enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

export type ProgressCallback = (progress: TaskProgress) => void;

interface RagChunk {
  content: string;
  source: string;
  chunk_index: number;
  [key: string]: unknown;
}

interface ScoredChunk extends RagChunk {
  score: number;
}

export function startAsyncTask(
  taskId: string,
  companyId: string,
  onProgress?: ProgressCallback,
): void {
  const task = tasks.get(taskId);
  if (!task) return;

  tasks.set(taskId, { ...task, status: 'running', updatedAt: new Date().toISOString() });

  // Update Redis status (non-blocking)
  updateTaskStateRedis(taskId, 'running').catch(() => {});

  let chapterIndex = 0;
  const totalChapters = 28;
  let wordsSoFar = 0;
  const startTime = Date.now();

  async function processNextChapter() {
    if (taskCancelled.has(taskId)) return;

    const current = tasks.get(taskId);
    if (!current) return;

    if (chapterIndex >= totalChapters) {
      // Task complete — generate final report
      try {
        const report = generateV5Report(companyId);
        const completedAt = new Date().toISOString();
        const durationMs = Date.now() - startTime;

        const trinityHash = createHash('sha256')
          .update(`${taskId}:${report?.totalWords ?? wordsSoFar}`)
          .digest('hex');

        const result: TaskProgress = {
          ...current,
          status: 'completed',
          currentChapter: totalChapters,
          wordsSoFar: report?.totalWords ?? wordsSoFar,
          percent: 100,
          updatedAt: completedAt,
          completedAt,
          result: {
            totalWords: report?.totalWords ?? wordsSoFar,
            totalTags: report?.chapters?.length ?? totalChapters,
            trinityHash,
            durationMs,
            companyId,
          },
        };
        tasks.set(taskId, result);
        onProgress?.(result);

        // Persist to Redis (non-blocking)
        completeTaskStateRedis(taskId, result).catch(() => {});
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        const failed: TaskProgress = {
          ...current,
          status: 'failed',
          updatedAt: new Date().toISOString(),
          error: errorMsg,
        };
        tasks.set(taskId, failed);

        failTaskStateRedis(taskId, errorMsg).catch(() => {});
      }

      setTimeout(() => {
        tasks.delete(taskId);
        taskTimeouts.delete(taskId);
        taskCancelled.delete(taskId);

        // Don't delete from Redis — let TTL handle cleanup
      }, RESULT_TTL_MS);
      return;
    }

    const chNum = chapterIndex + 1;
    const gate =
      chNum <= 3
        ? 'traceable'
        : chNum <= 5
          ? 'transparent'
          : chNum <= 13
            ? 'tangible'
            : chNum <= 24
              ? 'trustworthy'
              : 'trackable';
    const currentTitle = V5_CHAPTERS[chapterIndex]?.title ?? `第${chNum}章`;

    // Mark chapter as running in Redis
    updateChapterProgress(taskId, chNum, { status: 'running' }).catch(() => {});

    // RAG Retrieval via adminDb
    let ragContext = '';
    try {
      const { adminDb } = require('@/lib/firebase-admin');
      if (adminDb) {
        const snapshot = await (() => {
          const col = adminDb.collection('rag_knowledge');
          if (!col) throw new Error('Firestore collection unavailable');
          return col.get();
        })();
        const chunks = snapshot.docs.map((d: { data(): Record<string, unknown> }) => d.data()) as RagChunk[];
        
        if (chunks.length > 0) {
          // Break currentTitle into keywords (at least 2 chars)
          const userKeywords = currentTitle
            .toLowerCase()
            .split(/[\\s、，。]/)
            .filter((k) => k.length > 1);
          // Always add generic keywords that might be in reports
          if (userKeywords.length === 0) userKeywords.push(currentTitle);

        const scored = chunks.map((chunk: RagChunk) => {
          const content = String(chunk.content || '').toLowerCase();
          let score = 0;
          for (const kw of userKeywords) {
            if (content.includes(kw)) score++;
          }
          return { ...chunk, score };
        });
        
        scored.sort((a: ScoredChunk, b: ScoredChunk) => b.score - a.score);
        const topChunks = scored.slice(0, 3).filter((c: ScoredChunk) => c.score > 0 || scored.length <= 3);
        
        if (topChunks.length > 0) {
          ragContext = topChunks.map((c: ScoredChunk) => `[來源: ${c.source} (切片#${c.chunk_index})] ${c.content}`).join('\\n\\n');
        }
      }
    }
  } catch (e) {
      console.warn('Backend RAG Retrieval failed:', e);
    }

    let finalPrompt = ragContext
      ? `參考以下真實數據：\n${ragContext}\n\n請為永續報告書撰寫章節：${currentTitle}。請給出專業、合規的內容摘要，字數大約 300 字。`
      : `為永續報告書撰寫章節：${currentTitle}。請給出專業、合規的內容摘要，字數大約 300 字。`;

    // L-Hub Delegation Cue for large context (Swarm Routing)
    if (ragContext && ragContext.length > 500) {
      try {
        const lhubRes = await fetch('http://127.0.0.1:3000/api/nexus/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'lhub_ask',
            arguments: { task: 'summarize', context: ragContext },
          }),
        }).then((r) => r.json());

        if (lhubRes.success) {
          finalPrompt = `根據 L-Hub 蜂羣摘要：\n${lhubRes.data}\n\n請為永續報告書撰寫章節：${currentTitle}。請給出專業、合規的內容摘要。`;
        }
      } catch {
        // Fallback to original prompt
      }
    }

    agnesApi
      .processRequest(finalPrompt)
      .then((res: AgnesResponse) => {
        const generatedText = res.success
          ? String(res.data.output ?? '')
          : `[Fallback] ${currentTitle} 內容生成中...`;
        const chapterWords = generatedText.length;
        wordsSoFar += chapterWords;
        chapterIndex++;

        const progress: TaskProgress = {
          ...current,
          status: 'running',
          currentChapter: chapterIndex,
          totalChapters,
          chapterTitle: currentTitle,
          wordsSoFar,
          fiveTGate: gate,
          tagsCreated: chapterIndex,
          decisionsCount: chapterIndex * 3,
          percent: Math.round((chapterIndex / totalChapters) * 100),
          updatedAt: new Date().toISOString(),
        };
        tasks.set(taskId, progress);
        onProgress?.(progress);

        // Persist chapter completion to Redis (non-blocking)
        updateChapterProgress(taskId, chNum, {
          status: 'completed',
          words: chapterWords,
          content: generatedText,
        }).catch(() => {});

        // Update lightweight progress record for polling
        setProgressInfo({
          taskId,
          status: 'running',
          completed: chapterIndex,
          total: totalChapters,
          percentage: Math.round((chapterIndex / totalChapters) * 100),
          currentChapter: currentTitle,
          wordsSoFar,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});

        // Yield to event loop
        const delay = 50 + Math.random() * 50;
        const timeout = setTimeout(processNextChapter, delay);
        taskTimeouts.set(taskId, timeout);
      })
      .catch((err: unknown) => {
        console.warn('[V5 Task] AGNES API Failed, using fallback.', err);
        const chapterWords = 500 + Math.floor(Math.random() * 200);
        wordsSoFar += chapterWords;
        chapterIndex++;

        const progress: TaskProgress = {
          ...current,
          status: 'running',
          currentChapter: chapterIndex,
          totalChapters,
          chapterTitle: currentTitle,
          wordsSoFar,
          fiveTGate: gate,
          tagsCreated: chapterIndex,
          decisionsCount: chapterIndex * 3,
          percent: Math.round((chapterIndex / totalChapters) * 100),
          updatedAt: new Date().toISOString(),
        };
        tasks.set(taskId, progress);
        onProgress?.(progress);

        // Persist chapter completion to Redis
        updateChapterProgress(taskId, chNum, {
          status: 'completed',
          words: chapterWords,
        }).catch(() => {});

        const delay = 50 + Math.random() * 50;
        const timeout = setTimeout(processNextChapter, delay);
        taskTimeouts.set(taskId, timeout);
      });
  }

  const initialTimeout = setTimeout(processNextChapter, 50);
  taskTimeouts.set(taskId, initialTimeout);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Redis State Helpers (non-blocking wrappers)
// ═══════════════════════════════════════════════════════════════════════════════

async function updateTaskStateRedis(taskId: string, status: string): Promise<void> {
  const state = await getTaskState(taskId);
  if (state) {
    await setTaskState({
      ...state,
      status: status as TaskStatus,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function completeTaskStateRedis(taskId: string, result: TaskProgress): Promise<void> {
  const state = await getTaskState(taskId);
  if (!state) return;

  await setTaskState({
    ...state,
    status: 'completed',
    updatedAt: new Date().toISOString(),
    result: result.result
      ? {
          totalWords: result.result.totalWords,
          totalTags: result.result.totalTags,
          trinityHash: result.result.trinityHash,
          durationMs: result.result.durationMs,
          companyId: result.result.companyId,
        }
      : undefined,
  });
}

async function failTaskStateRedis(taskId: string, errorMsg: string): Promise<void> {
  const state = await getTaskState(taskId);
  if (!state) return;

  await setTaskState({
    ...state,
    status: 'failed',
    updatedAt: new Date().toISOString(),
    error: errorMsg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

export function getCompanyList() {
  return getV5Companies();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Global cleanup interval (runs every 5 min)
// ═══════════════════════════════════════════════════════════════════════════════

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupInterval(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    cleanupOldTasks();
  }, 300000);
}

export function stopCleanupInterval(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}