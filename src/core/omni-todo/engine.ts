/* eslint-disable @typescript-eslint/no-unused-vars */
// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo — 核心引擎
// ═══════════════════════════════════════════════════════════════

import { InMemoryTodoStore } from './store';
import type {
  TodoItem,
  TodoFilter,
  TodoSort,
  TodoPageResult,
  TodoStats,
  TodoPriority,
  TodoStatus,
  TodoCategory,
  TodoRecurrence,
} from './types';

// ── 優先級權重 ─────────────────────────────────────────────
const _PRIORITY_WEIGHT: Record<TodoPriority, number> = {
  urgent: 100,
  high: 75,
  medium: 50,
  low: 25,
};

// ── 類別中文名稱 ────────────────────────────────────────────
export const CATEGORY_LABELS: Record<TodoCategory, string> = {
  esg_carbon: '碳排管理',
  esg_compliance: '合規審查',
  esg_report: '報告撰寫',
  esg_stakeholder: '利害關係人',
  general: '一般事項',
  personal: '個人事項',
  work: '工作事項',
};

// ── 優先級中文名稱 ──────────────────────────────────────────
export const PRIORITY_LABELS: Record<TodoPriority, string> = {
  urgent: '緊急',
  high: '高',
  medium: '中',
  low: '低',
};

// ── 狀態中文名稱 ────────────────────────────────────────────
export const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: '待處理',
  in_progress: '進行中',
  done: '已完成',
  archived: '已歸檔',
};

export class OmniTodoEngine {
  private store: InMemoryTodoStore;

  constructor(store?: InMemoryTodoStore) {
    this.store = store || new InMemoryTodoStore();
  }

  // ── CRUD ──────────────────────────────────────────────────

  /**
   * 建立新待辦事項
   */
  createTodo(input: {
    title: string;
    description?: string;
    priority?: TodoPriority;
    category?: TodoCategory;
    tags?: string[];
    dueDate?: string;
    reminderAt?: string;
    esgTaskType?: string;
    companyId?: string;
    recurrence?: TodoRecurrence;
    parentId?: string;
    createdBy?: string;
  }): TodoItem {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    return this.store.create({
      title: input.title.trim(),
      description: input.description?.trim() || '',
      priority: input.priority || 'medium',
      status: 'pending',
      category: input.category || 'general',
      tags: input.tags || [],
      dueDate: input.dueDate,
      reminderAt: input.reminderAt,
      esgTaskType: input.esgTaskType,
      companyId: input.companyId,
      recurrence: input.recurrence,
      subtaskIds: [],
      parentId: input.parentId,
      attachments: [],
      notes: [],
      createdBy: input.createdBy || 'system',
    });
  }

  /**
   * 更新待辦事項
   */
  updateTodo(id: string, patch: Partial<TodoItem>): TodoItem | undefined {
    return this.store.update(id, patch);
  }

  /**
   * 刪除待辦事項
   */
  deleteTodo(id: string): boolean {
    return this.store.delete(id);
  }

  /**
   * 獲取單一待辦事項
   */
  getTodo(id: string): TodoItem | undefined {
    return this.store.getById(id);
  }

  // ── 狀態變更 ──────────────────────────────────────────────

  /**
   * 開始處理（pending → in_progress）
   */
  startTodo(id: string): TodoItem | undefined {
    const item = this.store.getById(id);
    if (!item || item.status !== 'pending') return undefined;
    return this.store.update(id, { status: 'in_progress' });
  }

  /**
   * 標記完成（in_progress → done）
   */
  completeTodo(id: string): TodoItem | undefined {
    const item = this.store.getById(id);
    if (!item || (item.status !== 'in_progress' && item.status !== 'pending')) return undefined;
    return this.store.update(id, { status: 'done' });
  }

  /**
   * 歸檔（done → archived）
   */
  archiveTodo(id: string): TodoItem | undefined {
    const item = this.store.getById(id);
    if (!item || item.status !== 'done') return undefined;
    return this.store.update(id, { status: 'archived' });
  }

  /**
   * 重新開啟（done/in_progress → pending）
   */
  reopenTodo(id: string): TodoItem | undefined {
    const item = this.store.getById(id);
    if (!item || (item.status !== 'done' && item.status !== 'in_progress')) return undefined;
    return this.store.update(id, { status: 'pending', completedAt: undefined });
  }

  // ── 子任務 ────────────────────────────────────────────────

  /**
   * 新增子任務
   */
  addSubtask(parentId: string, input: {
    title: string;
    description?: string;
    priority?: TodoPriority;
    dueDate?: string;
  }): TodoItem {
    const parent = this.store.getById(parentId);
    if (!parent) throw new Error('Parent not found');

    const subtask = this.store.create({
      title: input.title.trim(),
      description: input.description?.trim() || '',
      priority: input.priority || parent.priority,
      status: 'pending',
      category: parent.category,
      tags: parent.tags,
      dueDate: input.dueDate || parent.dueDate,
      subtaskIds: [],
      parentId,
      attachments: [],
      notes: [],
      createdBy: parent.createdBy,
    });

    this.store.update(parentId, {
      subtaskIds: [...parent.subtaskIds, subtask.id],
    });

    return subtask;
  }

  // ── 附註 ──────────────────────────────────────────────────

  /**
   * 新增附註
   */
  addNote(id: string, note: string): TodoItem | undefined {
    const item = this.store.getById(id);
    if (!item) return undefined;
    return this.store.update(id, {
      notes: [...item.notes, note],
    });
  }

  // ── 查詢 ──────────────────────────────────────────────────

  /**
   * 篩選查詢
   */
  query(filter: TodoFilter, sort?: TodoSort, page?: number, pageSize?: number): TodoPageResult {
    return this.store.query(filter, sort, page, pageSize);
  }

  /**
   * 獲取統計
   */
  getStats(): TodoStats {
    return this.store.getStats();
  }

  /**
   * 獲取逾期事項
   */
  getOverdue(): TodoItem[] {
    const now = new Date().toISOString();
    return this.store.getAll().filter(i =>
      i.dueDate &&
      i.dueDate < now &&
      i.status !== 'done' &&
      i.status !== 'archived'
    );
  }

  /**
   * 獲取本週到期事項
   */
  getDueThisWeek(): TodoItem[] {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const nowStr = now.toISOString();
    const weekEndStr = weekEnd.toISOString();

    return this.store.getAll().filter(i =>
      i.dueDate &&
      i.dueDate >= nowStr &&
      i.dueDate <= weekEndStr &&
      i.status !== 'done' &&
      i.status !== 'archived'
    );
  }

  /**
   * 獲取 ESG 相關待辦
   */
  getESGTodos(companyId?: string): TodoItem[] {
    return this.store.getAll().filter(i =>
      i.category.startsWith('esg_') &&
      (!companyId || i.companyId === companyId)
    );
  }

  // ── 批次操作 ──────────────────────────────────────────────

  /**
   * 批次更新狀態
   */
  batchUpdateStatus(ids: string[], status: TodoStatus): TodoItem[] {
    const results: TodoItem[] = [];
    for (const id of ids) {
      const item = this.store.update(id, { status });
      if (item) results.push(item);
    }
    return results;
  }

  /**
   * 批次刪除
   */
  batchDelete(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.store.delete(id)) count++;
    }
    return count;
  }

  // ── 匯出 ──────────────────────────────────────────────────

  /**
   * 匯出為 JSON
   */
  exportJSON(filter?: TodoFilter): string {
    const items = filter ? this.store.query(filter).items : this.store.getAll();
    return JSON.stringify(items, null, 2);
  }

  /**
   * 匯出為 Markdown
   */
  exportMarkdown(filter?: TodoFilter): string {
    const items = filter ? this.store.query(filter).items : this.store.getAll();
    const lines: string[] = ['# 萬能待辦 OmniTodo 匯出', ''];

    const grouped = {
      pending: items.filter(i => i.status === 'pending'),
      in_progress: items.filter(i => i.status === 'in_progress'),
      done: items.filter(i => i.status === 'done'),
    };

    for (const [status, statusItems] of Object.entries(grouped)) {
      if (statusItems.length === 0) continue;
      lines.push(`## ${STATUS_LABELS[status as TodoStatus]}`);
      for (const item of statusItems) {
        const checkbox = status === 'done' ? '[x]' : '[ ]';
        const priority = PRIORITY_LABELS[item.priority];
        const due = item.dueDate ? ` (due: ${item.dueDate})` : '';
        lines.push(`- ${checkbox} **[${priority}]** ${item.title}${due}`);
        if (item.description) {
          lines.push(`  > ${item.description}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
