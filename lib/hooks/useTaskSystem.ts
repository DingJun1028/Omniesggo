import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskSystemTaskStatus = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { TaskSystemTaskStatus as TaskStatus };

export interface OmniTask {
  id: string;
  title: string;
  description?: string;
  status: TaskSystemTaskStatus;
  
  // 🔗 萬能連結 (Universal Links)
  contextId?: string;    // 關聯的 ESG 指標 (例如 "Carbon-Scope-1")
  sourceNoteId?: string; // 來自哪則萬能筆記
  
  // ⏳ 時空屬性
  dueDate?: string;      // YYYY-MM-DD
  dueTime?: string;      // HH:mm
  
  // 🧠 智慧屬性
  priority: TaskPriority;
  aiSuggested?: boolean; // 是否由 AI 自動生成
  assignedAgent?: string; // 執行此任務的代理 (例如 EntropyGuard)
  automationId?: string; // 關聯的 Make/Boost.space Webhook
  
  // 🌲 結構屬性
  subTasks: OmniTask[];  // 任務裂變
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface TaskStore {
  tasks: OmniTask[];
  
  // Actions
  addTask: (task: Partial<OmniTask>) => void;
  updateTask: (id: string, updates: Partial<OmniTask>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  
  // Intelligence Queries
  getTasksByContext: (contextId: string) => OmniTask[];
  getOverdueTasks: () => OmniTask[];
}

export const useTaskSystem = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task: Partial<OmniTask>) => set((state: TaskStore) => {
        const newTask: OmniTask = {
          id: crypto.randomUUID(),
          title: task.title || 'Untitled Protocol',
          status: task.status || 'TODO',
          priority: task.priority || 'MEDIUM',
          subTasks: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...task
        } as OmniTask;
        return { tasks: [...state.tasks, newTask] };
      }),

      updateTask: (id: string, updates: Partial<OmniTask>) => set((state: TaskStore) => ({
        tasks: state.tasks.map((t: OmniTask) => t.id === id ? { ...t, ...updates, updatedAt: Da
te.now() } : t)
      })),

      deleteTask: (id: string) => set((state: TaskStore) => ({
        tasks: state.tasks.filter((t: OmniTask) => t.id !== id)
      })),

      completeTask: (id: string) => set((state: TaskStore) => ({
        tasks: state.tasks.map((t: OmniTask) => t.id === id ? { ...t, status: 'DONE', updatedAt: Date.now() } : t)
      })),

      getTasksByContext: (ctxId: string) => get().tasks.filter((t: OmniTask) => t.contextId === ctxId),
      
      getOverdueTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter((t: OmniTask) => t.dueDate && t.dueDate < today && t.status !== 'DONE');
      }
    }),
    { name: 'omni-task-system' }
  )
);
