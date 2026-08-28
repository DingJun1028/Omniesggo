// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniNote v1.0 — 萬能筆記系統
 *
 * 功能：
 * - OmniNote: 知識萃取與策略構思
 * - OmniTask: 跨部門大型專案管理（含優先級、到期日、完成狀態）
 * - OmniTodo: 瑣碎執行項與即時查驗
 * - 過濾 & 排序: 優先級、到期日、狀態、完成狀態
 * - 5T 協議門控: 每筆記對標 ESG 報告維度
 */

import { createHash, randomBytes } from 'crypto';
import { EntropyForge } from './entropy-forge';
import type {
  OmniNote,
  OmniTask,
  NoteCategory,
  NotePriority,
  TaskStatus,
  FiveTDimension,
  OmniTaskFilter,
  OmniTaskSort,
} from './types';
import { OmniEventBus, OMNI_TOPICS } from './omni-kernel';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Task Factory
// ═══════════════════════════════════════════════════════════════

export function createTask(
  title: string,
  opts: {
    description?: string;
    priority?: NotePriority;
    dueAt?: number;
    tags?: string[];
    assignee?: string;
  } = {},
): OmniTask {
  const now = Date.now();
  return Object.freeze({
    id: `OT-${randomBytes(4).toString('hex').toUpperCase()}`,
    title: EntropyForge.purify(title),
    description: opts.description ? EntropyForge.purify(opts.description) : undefined,
    priority: opts.priority ?? 'medium',
    status: 'pending',
    dueAt: opts.dueAt,
    tags: opts.tags ?? [],
    assignee: opts.assignee ? EntropyForge.purify(opts.assignee) : undefined,
    createdAt: now,
    updatedAt: now,
    isFrozen: true,
  });
}

/** Toggle task completion */
export function toggleTaskCompletion(task: OmniTask): OmniTask {
  const now = Date.now();
  if (task.status === 'completed') {
    return Object.freeze({ ...task, status: 'pending', completedAt: undefined, updatedAt: now, isFrozen: true });
  }
  return Object.freeze({ ...task, status: 'completed', completedAt: now, updatedAt: now, isFrozen: true });
}

/** Update task status */
export function updateTaskStatus(task: OmniTask, status: TaskStatus): OmniTask {
  const now = Date.now();
  return Object.freeze({
    ...task,
    status,
    completedAt: status === 'completed' ? now : task.completedAt,
    updatedAt: now,
    isFrozen: true,
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Task Filter & Sort Engine
// ═══════════════════════════════════════════════════════════════

const PRIORITY_ORDER: Record<NotePriority, number> = { high: 0, medium: 1, low: 2 };

export function filterTasks(tasks: OmniTask[], filter: OmniTaskFilter): OmniTask[] {
  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  return tasks.filter(task => {
    // Priority filter
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false;

    // Status filter
    if (filter.status && filter.status !== 'all' && task.status !== filter.status) return false;

    // Due date filter
    if (filter.due !== 'all' && task.dueAt !== undefined) {
      if (filter.due === 'upcoming') {
        if (task.dueAt < now || task.dueAt > now + ONE_WEEK) return false;
      } else if (filter.due === 'overdue') {
        if (task.dueAt >= now) return false;
      }
    } else if (filter.due !== 'all' && task.dueAt === undefined) {
      return false;
    }

    return true;
  });
}

export function sortTasks(tasks: OmniTask[], sort: OmniTaskSort): OmniTask[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    let delta = 0;
    switch (sort.field) {
      case 'dueAt':
        delta = (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity);
        break;
      case 'priority':
        delta = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case 'status': {
        const ORDER: Record<TaskStatus, number> = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
        delta = ORDER[a.status] - ORDER[b.status];
        break;
      }
      case 'createdAt':
        delta = a.createdAt - b.createdAt;
        break;
    }
    return sort.direction === 'asc' ? delta : -delta;
  });
  return sorted;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Note Factory
// ═══════════════════════════════════════════════════════════════

export function createNote(
  title: string,
  content: string,
  opts: {
    category?: NoteCategory;
    tags?: string[];
    tasks?: OmniTask[];
    fiveTGate?: FiveTDimension;
    metadata?: Record<string, string | number | boolean>;
  } = {},
): OmniNote {
  const now = Date.now();
  const id = `ON-${randomBytes(4).toString('hex').toUpperCase()}`;
  const purifiedTitle = EntropyForge.purify(title);
  const purifiedContent = EntropyForge.purify(content);
  const zkpHash = createHash('sha256').update(`${id}:${purifiedTitle}:${purifiedContent}`).digest('hex').slice(0, 16);
  return Object.freeze({
    id,
    title: purifiedTitle,
    content: purifiedContent,
    category: opts.category ?? 'note',
    tags: opts.tags ?? [],
    tasks: opts.tasks ?? [],
    metadata: opts.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    isFrozen: true,
    fiveTGate: opts.fiveTGate,
    zkpHash,
  });
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: OmniNoteManager
// ═══════════════════════════════════════════════════════════════

import { db, collection, doc, setDoc, getDocs, deleteDoc } from '../firebase';
// 2026-08-25: firebase/firestore 已停用 (GCP 移除, 力度 1); 改用本地 shim

export class OmniNoteManager {
  private notes: OmniNote[] = [];
  private dbLoaded = false;

  async loadFromDb(): Promise<void> {
    if (this.dbLoaded) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'omni-notes'));
      const dbNotes: OmniNote[] = querySnapshot.docs.map((doc) => doc.data() as unknown as OmniNote);
      if (dbNotes.length > 0) {
        this.notes = dbNotes;
      }
      this.dbLoaded = true;
    } catch (e) {
      console.error('Failed to load notes from DB', e);
    }
  }

  /** Add or replace a note */
  upsert(note: OmniNote): void {
    const idx = this.notes.findIndex(n => n.id === note.id);
    const updatedNote = Object.freeze(idx >= 0 ? { ...note, updatedAt: Date.now() } : note);

    if (idx >= 0) {
      this.notes[idx] = updatedNote;
    } else {
      this.notes.push(updatedNote);
    }
    OmniEventBus.publish(OMNI_TOPICS.NOTE_CREATED, { id: updatedNote.id, title: updatedNote.title });

    // Async DB write
    setDoc(doc(db, 'omni-notes', updatedNote.id), updatedNote).catch(e =>
      console.error('Failed to sync note to DB', e)
    );
  }

  get(id: string): OmniNote | undefined {
    return this.notes.find(n => n.id === id);
  }

  getAll(): OmniNote[] {
    return [...this.notes];
  }

  getByCategory(category: NoteCategory): OmniNote[] {
    return this.notes.filter(n => n.category === category);
  }

  getByTag(tag: string): OmniNote[] {
    return this.notes.filter(n => n.tags.includes(tag));
  }

  /** Get all tasks across all notes (flattened) */
  getAllTasks(): OmniTask[] {
    return this.notes.flatMap(n => n.tasks);
  }

  /** Toggle task completion by taskId */
  toggleTask(noteId: string, taskId: string): OmniNote | undefined {
    const note = this.get(noteId);
    if (!note) return undefined;
    const updatedTasks = note.tasks.map(t =>
      t.id === taskId ? toggleTaskCompletion(t) : t,
    );
    const updated: OmniNote = Object.freeze({ ...note, tasks: updatedTasks, updatedAt: Date.now() });
    this.upsert(updated);
    const task = updatedTasks.find(t => t.id === taskId);
    if (task?.status === 'completed') {
      OmniEventBus.publish(OMNI_TOPICS.TASK_COMPLETED, { noteId, taskId });
    } else {
      OmniEventBus.publish(OMNI_TOPICS.TASK_STATUS_CHANGED, { noteId, taskId, status: task?.status });
    }
    return updated;
  }

  /** Add a task to a note */
  addTask(noteId: string, task: OmniTask): OmniNote | undefined {
    const note = this.get(noteId);
    if (!note) return undefined;
    const updated: OmniNote = Object.freeze({
      ...note,
      tasks: [...note.tasks, task],
      updatedAt: Date.now(),
    });
    this.upsert(updated);
    OmniEventBus.publish(OMNI_TOPICS.TASK_CREATED, { noteId, taskId: task.id, title: task.title });
    return updated;
  }

  /** Remove a note */
  remove(id: string): boolean {
    const idx = this.notes.findIndex(n => n.id === id);
    if (idx < 0) return false;
    this.notes.splice(idx, 1);

    // Async DB delete
    deleteDoc(doc(db, 'omni-notes', id)).catch(e =>
      console.error('Failed to delete note from DB', e)
    );

    return true;
  }

  count(): number {
    return this.notes.length;
  }

  /** Summary statistics */
  getStats(): {
    totalNotes: number;
    totalTasks: number;
    completedTasks: number;
    highPriorityTasks: number;
    overdueTasks: number;
  } {
    const allTasks = this.getAllTasks();
    const now = Date.now();
    return {
      totalNotes: this.notes.length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      highPriorityTasks: allTasks.filter(t => t.priority === 'high').length,
      overdueTasks: allTasks.filter(
        t => t.dueAt !== undefined && t.dueAt < now && t.status !== 'completed',
      ).length,
    };
  }
}

/** Singleton note manager */
export const omniNoteManager = new OmniNoteManager();

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Demo Seed Data (for showcase)
// ═══════════════════════════════════════════════════════════════

export function seedDemoNotes(): void {
  if (omniNoteManager.count() > 0) return; // Already seeded

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // ESG Strategy Note
  const stratNote = createNote(
    'ESG 永續戰略 2025',
    'Q3 目標：完成碳排放基準年建立、供應鏈 ESG 評估框架設計、GRI 報告框架確認。',
    {
      category: 'note',
      tags: ['ESG', '戰略', '2025'],
      fiveTGate: 'transparent',
      tasks: [
        createTask('碳排放基準年建立', { priority: 'high', dueAt: now + 3 * DAY, tags: ['碳排'] }),
        createTask('供應鏈 ESG 評估框架', { priority: 'high', dueAt: now + 7 * DAY, tags: ['供應鏈'] }),
        createTask('GRI 報告框架確認', { priority: 'medium', dueAt: now + 14 * DAY, tags: ['GRI'] }),
        createTask('5T 協議合規審查', { priority: 'medium', dueAt: now - DAY, tags: ['5T'], description: '需要法務確認' }),
      ],
    },
  );

  // OmniOne 覺醒系統架構
  const devNote = createNote(
    'OmniOne 覺醒系統開發記錄',
    '已完成 AwakeningCore 引擎、MemorySystem、CaseHandler、AutonomousLearning 四大模組。下一步整合 OmniCore 平臺。',
    {
      category: 'note',
      tags: ['OmniOne', '開發', 'AI'],
      fiveTGate: 'trackable',
      tasks: [
        createTask('整合 OmniOne 至 OmniCore', { priority: 'high', dueAt: now + 2 * DAY, tags: ['整合'] }),
        createTask('撰寫 SDK 文檔', { priority: 'medium', dueAt: now + 10 * DAY, tags: ['文檔'] }),
        createTask('自主模式壓測', { priority: 'low', dueAt: now + 21 * DAY, tags: ['測試'] }),
      ],
    },
  );

  // Data Governance
  const govNote = createNote(
    '數據治理 KI 整理',
    '萬能智庫知識項目更新：OmniBase v6.0 Tag 機制、5T 協議最佳實踐、CRDT 同步策略。',
    {
      category: 'reference',
      tags: ['KI', '知識治理', '5T'],
      fiveTGate: 'trustworthy',
      tasks: [
        createTask('OmniBase v6 文檔更新', { priority: 'medium', dueAt: now + 5 * DAY }),
        createTask('CRDT 架構評審', { priority: 'low', dueAt: now + 30 * DAY }),
      ],
    },
  );

  // Mark one task as complete for demo
  devNote.tasks[2] = { ...devNote.tasks[2], status: 'completed', completedAt: now - DAY };

  omniNoteManager.upsert(stratNote);
  omniNoteManager.upsert(devNote);
  omniNoteManager.upsert(govNote);
}
