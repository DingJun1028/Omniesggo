'use client';

// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo Panel
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { OmniBaseCard } from '@/components/omni-base-card';

// ── 類型 ─────────────────────────────────────────────────────

type TodoPriority = 'urgent' | 'high' | 'medium' | 'low';
type TodoStatus = 'pending' | 'in_progress' | 'done' | 'archived';
type TodoCategory =
  | 'esg_carbon'
  | 'esg_compliance'
  | 'esg_report'
  | 'esg_stakeholder'
  | 'general'
  | 'personal'
  | 'work';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  category: TodoCategory;
  tags: string[];
  dueDate?: string;
  esgTaskType?: string;
  companyId?: string;
  subtaskIds: string[];
  parentId?: string;
  notes: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TodoStats {
  total: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  byCategory: Record<TodoCategory, number>;
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
}

// ── 常數 ─────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string; icon: string }> = {
  urgent: { label: '緊急', color: 'var(--accent-purple)', icon: '🔴' },
  high: { label: '高', color: 'var(--accent-gold)', icon: '🟠' },
  medium: { label: '中', color: 'var(--accent-teal)', icon: '🟡' },
  low: { label: '低', color: 'var(--text-secondary)', icon: '🟢' },
};

const STATUS_CONFIG: Record<TodoStatus, { label: string; color: string }> = {
  pending: { label: '待處理', color: 'var(--text-secondary)' },
  in_progress: { label: '進行中', color: 'var(--accent-teal)' },
  done: { label: '已完成', color: 'var(--accent-gold)' },
  archived: { label: '已歸檔', color: 'var(--text-muted)' },
};

const CATEGORY_CONFIG: Record<TodoCategory, { label: string; color: string }> = {
  esg_carbon: { label: '碳排管理', color: 'var(--accent-teal)' },
  esg_compliance: { label: '合規審查', color: 'var(--accent-gold)' },
  esg_report: { label: '報告撰寫', color: 'var(--accent-blue)' },
  esg_stakeholder: { label: '利害關係人', color: 'var(--accent-purple)' },
  general: { label: '一般事項', color: 'var(--text-secondary)' },
  personal: { label: '個人事項', color: 'var(--accent-teal)' },
  work: { label: '工作事項', color: 'var(--accent-gold)' },
};

// ── 主元件 ───────────────────────────────────────────────────

export function OmniTodoPanel() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | TodoStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TodoPriority>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TodoCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ⚡ Bolt: Debounce search query to reduce API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [evolution, setEvolution] = useState({ level: 1, xp: 0, nextXp: 160 });
  const [evolving, setEvolving] = useState(false);

  // ── 新建表單 ──────────────────────────────────────────────
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TodoPriority>('medium');
  const [newCategory, setNewCategory] = useState<TodoCategory>('general');
  const [newDueDate, setNewDueDate] = useState('');

  // ── 載入資料 ──────────────────────────────────────────────
  const loadTodos = useCallback(async () => {
    try {
      const filter: Record<string, unknown> = {};
      if (filterStatus !== 'all') filter.status = [filterStatus];
      if (filterPriority !== 'all') filter.priority = [filterPriority];
      if (filterCategory !== 'all') filter.category = [filterCategory];
      if (debouncedSearchQuery) filter.search = debouncedSearchQuery;

      const res = await fetch('/api/omni-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', filter, pageSize: 50 }),
      });
      const data = await res.json();
      if (data.success) setTodos(data.data.items);
    } catch (err) {
      console.error('Failed to load todos:', err);
    }
  }, [filterStatus, filterPriority, filterCategory, debouncedSearchQuery]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/omni-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' }),
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadTodos(), loadStats()]).finally(() => setLoading(false));
  }, [loadTodos, loadStats]);

  // ── 操作 ──────────────────────────────────────────────────

  const evolveTodoSystem = async () => {
    if (evolving) return;
    setEvolving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setEvolution((prev) => {
        const xp = prev.xp + 30;
        let level = prev.level;
        let nextXp = prev.nextXp;
        while (xp >= nextXp) {
          level += 1;
          nextXp = Math.floor(nextXp * 1.2);
        }
        return { level, xp: xp % nextXp, nextXp };
      });
    } finally {
      setEvolving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await fetch('/api/omni-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory,
          dueDate: newDueDate || undefined,
        }),
      });
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setNewCategory('general');
      setNewDueDate('');
      setShowCreateForm(false);
      await Promise.all([loadTodos(), loadStats()]);
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const handleStatusChange = async (
    id: string,
    action: 'start' | 'complete' | 'archive' | 'reopen',
  ) => {
    try {
      await fetch('/api/omni-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      await Promise.all([loadTodos(), loadStats()]);
      if (selectedTodo?.id === id) {
        const updated = todos.find((t) => t.id === id);
        if (updated) setSelectedTodo(updated);
      }
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此待辦？')) return;
    try {
      await fetch('/api/omni-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setSelectedTodo(null);
      await Promise.all([loadTodos(), loadStats()]);
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  // ── 渲染 ──────────────────────────────────────────────────

  if (loading) {
    return (
      <OmniBaseCard>
        <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          載入中...
        </div>
      </OmniBaseCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── 統計概覽 ──────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <OmniBaseCard>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-teal)' }}>
                {stats.total}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                全部
              </div>
            </div>
          </OmniBaseCard>
          <OmniBaseCard>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                {stats.byStatus.pending + stats.byStatus.in_progress}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                進行中
              </div>
            </div>
          </OmniBaseCard>
          <OmniBaseCard>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>
                {stats.overdue}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                逾期
              </div>
            </div>
          </OmniBaseCard>
          <OmniBaseCard>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-teal)' }}>
                {stats.dueThisWeek}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                本週到期
              </div>
            </div>
          </OmniBaseCard>
        </div>
      )}

      {/* ── ESGGO 無限進化卡 ─────────────────────────────── */}
      <OmniBaseCard>
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--accent-purple)' }}>
              ESGGO 無限進化
            </div>
            <div className="flex gap-3 mt-1">
              <div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  LEVEL
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {evolution.level}
                </div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  XP
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--accent-teal)' }}>
                  {evolution.xp}/{evolution.nextXp}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={evolveTodoSystem}
            disabled={evolving}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
            style={{
              background: 'var(--accent-purple)15',
              color: 'var(--accent-purple)',
              borderColor: 'var(--accent-purple)40',
            }}
          >
            {evolving ? '🧬 進化中...' : '🧬 啟動無限進化'}
          </button>
        </div>
      </OmniBaseCard>

      {/* ── 工具列 ────────────────────────────────────────── */}
      <OmniBaseCard>
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            aria-label="搜尋待辦事項"
            placeholder="搜尋待辦..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />

          <select
            aria-label="依狀態過濾"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | TodoStatus)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">全部狀態</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            aria-label="依優先級過濾"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as 'all' | TodoPriority)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">全部優先級</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            aria-label="依類別過濾"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as 'all' | TodoCategory)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">全部類別</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--accent-teal)',
              color: 'var(--bg-primary)',
            }}
          >
            + 新增待辦
          </button>

          <button
            onClick={() => {
              const csvEscape = (v: string) =>
                v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
              const headers = [
                'id',
                'title',
                'description',
                'priority',
                'status',
                'category',
                'dueDate',
                'createdAt',
              ];
              const rows = todos.map((t) => [
                t.id,
                csvEscape(t.title),
                csvEscape(t.description),
                t.priority,
                t.status,
                t.category,
                t.dueDate || '',
                t.createdAt,
              ]);
              const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `omni-todo-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--accent-gold)',
            }}
            title="匯出 CSV"
          >
            CSV
          </button>

          <button
            onClick={() => {
              const data = { todos, stats, exportedAt: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `omni-todo-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--accent-blue)',
            }}
            title="匯出 JSON"
          >
            JSON
          </button>
        </div>
      </OmniBaseCard>

      {/* ── 新建表單 ──────────────────────────────────────── */}
      {showCreateForm && (
        <OmniBaseCard>
          <div className="p-4 space-y-3">
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              新增待辦事項
            </h3>

            <input
              type="text"
              aria-label="待辦事項標題"
              placeholder="標題 *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />

            <textarea
              aria-label="待辦事項描述"
              placeholder="描述（選填）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />

            <div className="flex gap-3 flex-wrap">
              <select
                aria-label="待辦事項優先級"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TodoPriority)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="待辦事項類別"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TodoCategory)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                aria-label="待辦事項到期日"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: 'var(--accent-teal)',
                  color: 'var(--bg-primary)',
                }}
              >
                建立
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                取消
              </button>
            </div>
          </div>
        </OmniBaseCard>
      )}

      {/* ── 待辦清單 ──────────────────────────────────────── */}
      <OmniBaseCard>
        <div className="p-4">
          {todos.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              暫無待辦事項
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  isSelected={selectedTodo?.id === todo.id}
                  onSelect={() => setSelectedTodo(selectedTodo?.id === todo.id ? null : todo)}
                  _onStart={() => handleStatusChange(todo.id, 'start')}
                  _onComplete={() => handleStatusChange(todo.id, 'complete')}
                  _onArchive={() => handleStatusChange(todo.id, 'archive')}
                  _onReopen={() => handleStatusChange(todo.id, 'reopen')}
                  _onDelete={() => handleDelete(todo.id)}
                />
              ))}
            </div>
          )}
        </div>
      </OmniBaseCard>

      {/* ── 詳情面板 ──────────────────────────────────────── */}
      {selectedTodo && (
        <OmniBaseCard>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                  {selectedTodo.title}
                </h3>
                <div className="flex gap-2 mt-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: PRIORITY_CONFIG[selectedTodo.priority].color + '20',
                      color: PRIORITY_CONFIG[selectedTodo.priority].color,
                    }}
                  >
                    {PRIORITY_CONFIG[selectedTodo.priority].icon}{' '}
                    {PRIORITY_CONFIG[selectedTodo.priority].label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: STATUS_CONFIG[selectedTodo.status].color + '20',
                      color: STATUS_CONFIG[selectedTodo.status].color,
                    }}
                  >
                    {STATUS_CONFIG[selectedTodo.status].label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: CATEGORY_CONFIG[selectedTodo.category].color + '20',
                      color: CATEGORY_CONFIG[selectedTodo.category].color,
                    }}
                  >
                    {CATEGORY_CONFIG[selectedTodo.category].label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTodo(null)}
                className="text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="關閉詳情"
                title="關閉詳情"
              >
                ✕
              </button>
            </div>

            {selectedTodo.description && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedTodo.description}
              </p>
            )}

            {selectedTodo.dueDate && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                📅 截止：{new Date(selectedTodo.dueDate).toLocaleDateString('zh-TW')}
              </div>
            )}

            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              建立：{new Date(selectedTodo.createdAt).toLocaleString('zh-TW')}
              {selectedTodo.completedAt && (
                <> | 完成：{new Date(selectedTodo.completedAt).toLocaleString('zh-TW')}</>
              )}
            </div>

            <div
              className="flex gap-2 flex-wrap pt-2 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              {selectedTodo.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selectedTodo.id, 'start')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'var(--accent-teal)', color: 'var(--bg-primary)' }}
                >
                  ▶ 開始處理
                </button>
              )}
              {(selectedTodo.status === 'pending' || selectedTodo.status === 'in_progress') && (
                <button
                  onClick={() => handleStatusChange(selectedTodo.id, 'complete')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)' }}
                >
                  ✓ 標記完成
                </button>
              )}
              {selectedTodo.status === 'done' && (
                <button
                  onClick={() => handleStatusChange(selectedTodo.id, 'archive')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'var(--text-secondary)', color: 'var(--bg-primary)' }}
                >
                  📦 歸檔
                </button>
              )}
              {(selectedTodo.status === 'done' || selectedTodo.status === 'in_progress') && (
                <button
                  onClick={() => handleStatusChange(selectedTodo.id, 'reopen')}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  🔄 重新開啟
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedTodo.id)}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: 'var(--accent-purple)', color: 'var(--bg-primary)' }}
              >
                🗑 刪除
              </button>
            </div>
          </div>
        </OmniBaseCard>
      )}
    </div>
  );
}

// ── 單一待辦項元件 ───────────────────────────────────────────

function TodoItemRow({
  todo,
  isSelected,
  onSelect,
  _onStart,
  _onComplete,
  _onArchive,
  _onReopen,
  _onDelete,
}: {
  todo: TodoItem;
  isSelected: boolean;
  onSelect: () => void;
  _onStart: () => void;
  _onComplete: () => void;
  _onArchive: () => void;
  _onReopen: () => void;
  _onDelete: () => void;
}) {
  const isOverdue =
    todo.dueDate &&
    new Date(todo.dueDate) < new Date() &&
    todo.status !== 'done' &&
    todo.status !== 'archived';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`選擇待辦事項: ${todo.title}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      style={{
        background: isSelected ? 'var(--accent-teal)10' : 'transparent',
        border: isSelected ? '1px solid var(--accent-teal)' : '1px solid transparent',
      }}
    >
      {/* 優先級指示器 */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: PRIORITY_CONFIG[todo.priority].color }}
      />

      {/* 標題與資訊 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium text-sm truncate"
            style={{
              color: todo.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: todo.status === 'done' ? 'line-through' : 'none',
            }}
          >
            {todo.title}
          </span>
          {isOverdue && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-purple)20', color: 'var(--accent-purple)' }}
            >
              逾期
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: CATEGORY_CONFIG[todo.category].color }}>
            {CATEGORY_CONFIG[todo.category].label}
          </span>
          {todo.dueDate && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📅 {new Date(todo.dueDate).toLocaleDateString('zh-TW')}
            </span>
          )}
          {todo.subtaskIds.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📋 {todo.subtaskIds.length}
            </span>
          )}
        </div>
      </div>

      {/* 狀態標籤 */}
      <span
        className="px-2 py-0.5 rounded text-xs flex-shrink-0"
        style={{
          background: STATUS_CONFIG[todo.status].color + '20',
          color: STATUS_CONFIG[todo.status].color,
        }}
      >
        {STATUS_CONFIG[todo.status].label}
      </span>
    </div>
  );
}
