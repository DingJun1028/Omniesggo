// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo — 記憶體儲存
// ═══════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import type {
  TodoItem,
  TodoStore,
  TodoStats,
  TodoFilter,
  TodoSort,
  TodoPageResult,
  TodoStatus,
  TodoPriority,
  TodoCategory,
} from './types';

export class InMemoryTodoStore implements TodoStore {
  private items: Map<string, TodoItem> = new Map();

  getAll(): TodoItem[] {
    return Array.from(this.items.values());
  }

  getById(id: string): TodoItem | undefined {
    return this.items.get(id);
  }

  create(input: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    const now = new Date().toISOString();
    const item: TodoItem = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, patch: Partial<TodoItem>): TodoItem | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    const updated: TodoItem = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Auto-set completedAt/archivedAt
    if (patch.status === 'done' && existing.status !== 'done') {
      updated.completedAt = new Date().toISOString();
    }
    if (patch.status === 'archived' && existing.status !== 'archived') {
      updated.archivedAt = new Date().toISOString();
    }

    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  getStats(): TodoStats {
    const items = this.getAll();
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(now);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const byStatus: Record<TodoStatus, number> = {
      pending: 0, in_progress: 0, done: 0, archived: 0,
    };
    const byPriority: Record<TodoPriority, number> = {
      urgent: 0, high: 0, medium: 0, low: 0,
    };
    const byCategory: Record<TodoCategory, number> = {
      esg_carbon: 0, esg_compliance: 0, esg_report: 0, esg_stakeholder: 0,
      general: 0, personal: 0, work: 0,
    };
    let overdue = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;

    for (const item of items) {
      byStatus[item.status]++;
      byPriority[item.priority]++;
      byCategory[item.category]++;

      if (item.dueDate && item.status !== 'done' && item.status !== 'archived') {
        const due = new Date(item.dueDate);
        if (due < now) overdue++;
        else if (due <= weekEnd) dueThisWeek++;
        else if (due <= monthEnd) dueThisMonth++;
      }
    }

    return {
      total: items.length,
      byStatus,
      byPriority,
      byCategory,
      overdue,
      dueThisWeek,
      dueThisMonth,
    };
  }

  query(
    filter: TodoFilter,
    sort?: TodoSort,
    page: number = 1,
    pageSize: number = 20
  ): TodoPageResult {
    let items = this.getAll();

    // Apply filters
    if (filter.status?.length) {
      items = items.filter(i => filter.status!.includes(i.status));
    }
    if (filter.priority?.length) {
      items = items.filter(i => filter.priority!.includes(i.priority));
    }
    if (filter.category?.length) {
      items = items.filter(i => filter.category!.includes(i.category));
    }
    if (filter.tags?.length) {
      items = items.filter(i => filter.tags!.some(t => i.tags.includes(t)));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.notes.some(n => n.toLowerCase().includes(q))
      );
    }
    if (filter.dueDateFrom) {
      items = items.filter(i => i.dueDate && i.dueDate >= filter.dueDateFrom!);
    }
    if (filter.dueDateTo) {
      items = items.filter(i => i.dueDate && i.dueDate <= filter.dueDateTo!);
    }
    if (filter.companyId) {
      items = items.filter(i => i.companyId === filter.companyId);
    }
    if (filter.esgTaskType) {
      items = items.filter(i => i.esgTaskType === filter.esgTaskType);
    }

    // Sort
    if (sort) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const aVal = a[sort.field] ?? '';
        const bVal = b[sort.field] ?? '';
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      });
    } else {
      // Default sort: priority (urgent first), then dueDate, then createdAt
      const priorityOrder: Record<TodoPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      items.sort((a, b) => {
        const pa = priorityOrder[a.priority];
        const pb = priorityOrder[b.priority];
        if (pa !== pb) return pa - pb;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return { items: paged, total, page, pageSize, totalPages };
  }
}
