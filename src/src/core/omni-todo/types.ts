// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo — 類型定義
// ═══════════════════════════════════════════════════════════════

/**
 * OmniTodo 優先級
 * - urgent: 緧急（需立即處理）
 * - high: 高（本週內完成）
 * - medium: 中（本月內完成）
 * - low: 低（可排程處理）
 */
export type TodoPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * OmniTodo 狀態
 * - pending: 待處理
 * - in_progress: 進行中
 * - done: 已完成
 * - archived: 已歸檔
 */
export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'archived';

/**
 * OmniTodo 類別（ESG 整合）
 * - esg_carbon: 碳排相關
 * - esg_compliance: 合規相關
 * - esg_report: 報告相關
 * - esg_stakeholder: 利害關係人
 * - general: 一般事項
 * - personal: 個人事項
 * - work: 工作事項
 */
export type TodoCategory =
  | 'esg_carbon'
  | 'esg_compliance'
  | 'esg_report'
  | 'esg_stakeholder'
  | 'general'
  | 'personal'
  | 'work';

/**
 * OmniTodo 重複規則
 */
export interface TodoRecurrence {
  /** 重複類型 */
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** 間隔（每 N 天/週/月/年） */
  interval: number;
  /** 結束日期（可選） */
  endDate?: string;
  /** 每週重複的星期幾（可選） */
  daysOfWeek?: number[];
}

/**
 * OmniTodo 標籤
 */
export interface TodoTag {
  id: string;
  name: string;
  color: string;
}

/**
 * OmniTodo 核心資料結構
 */
export interface TodoItem {
  /** 唯一識別碼 */
  id: string;
  /** 標題 */
  title: string;
  /** 描述 */
  description: string;
  /** 優先級 */
  priority: TodoPriority;
  /** 狀態 */
  status: TodoStatus;
  /** 類別 */
  category: TodoCategory;
  /** 標籤 IDs */
  tags: string[];
  /** 截止日期 (ISO 8601) */
  dueDate?: string;
  /** 提醒時間 (ISO 8601) */
  reminderAt?: string;
  /** 關聯的 ESG skill task type */
  esgTaskType?: string;
  /** 關聯的 company */
  companyId?: string;
  /** 重複規則 */
  recurrence?: TodoRecurrence;
  /** 子任務 IDs */
  subtaskIds: string[];
  /** 父任務 ID */
  parentId?: string;
  /** 附件 URLs */
  attachments: string[];
  /** 備註 */
  notes: string[];
  /** 完成時間 (ISO 8601) */
  completedAt?: string;
  /** 歸檔時間 (ISO 8601) */
  archivedAt?: string;
  /** 建立時間 (ISO 8601) */
  createdAt: string;
  /** 更新時間 (ISO 8601) */
  updatedAt: string;
  /** 建立者 */
  createdBy: string;
}

/**
 * OmniTodo 篩選條件
 */
export interface TodoFilter {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  category?: TodoCategory[];
  tags?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  companyId?: string;
  esgTaskType?: string;
}

/**
 * OmniTodo 排序選項
 */
export interface TodoSort {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

/**
 * OmniTodo 統計資訊
 */
export interface TodoStats {
  total: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  byCategory: Record<TodoCategory, number>;
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
}

/**
 * OmniTodo 分頁結果
 */
export interface TodoPageResult {
  items: TodoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * OmniTodo 儲存介面
 */
export interface TodoStore {
  getAll(): TodoItem[];
  getById(id: string): TodoItem | undefined;
  create(item: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem;
  update(id: string, patch: Partial<TodoItem>): TodoItem | undefined;
  delete(id: string): boolean;
  getStats(): TodoStats;
  query(filter: TodoFilter, sort?: TodoSort, page?: number, pageSize?: number): TodoPageResult;
}
