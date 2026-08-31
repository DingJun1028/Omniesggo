"use client";

import { useState, useMemo, useEffect } from "react";
import { db } from '@lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  query,
} from "@lib/firebase";
import { omniOne } from "../../sdks/omni-one/src";

// ==========================================
// 1. Types & Data
// ==========================================
export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "Completed";

export interface OmniTask {
  id: string;
  title: string;
  priority: Priority;
  dueDate: number; // timestamp
  status: TaskStatus;
  tags: string[];
}

const PRIORITY_MAP: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

// Some dummy data for initialization
const INITIAL_TASKS: OmniTask[] = [
  {
    id: "T1",
    title: "完成 2025 年 ESG 碳排盤查報告",
    priority: "High",
    dueDate: Date.now() + 86400000 * 2,
    status: "Pending",
    tags: ["環境面"],
  },
  {
    id: "T2",
    title: "更新 OmniOne 覺醒核心引擎 MemorySystem",
    priority: "High",
    dueDate: Date.now() - 86400000 * 1,
    status: "Pending",
    tags: ["AI", "架構"],
  },
  {
    id: "T3",
    title: "審核第四季員工福利政策修改",
    priority: "Medium",
    dueDate: Date.now() + 86400000 * 5,
    status: "Pending",
    tags: ["社會面"],
  },
  {
    id: "T4",
    title: "例行性 ZKP 零知識證明金鑰輪替",
    priority: "Medium",
    dueDate: Date.now() + 86400000 * 10,
    status: "Pending",
    tags: ["安全"],
  },
  {
    id: "T5",
    title: "發佈萬能筆記 (OmniNote) 的前端 UI 更新",
    priority: "Low",
    dueDate: Date.now() + 86400000 * 1,
    status: "Pending",
    tags: ["UI/UX"],
  },
];

// ==========================================
// 2. Liquid Glass Styles
// ==========================================
const liquidGlassCard = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  borderTop: "1px solid rgba(255, 255, 255, 0.7)",
  borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
  boxShadow:
    "0 8px 32px 0 rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255,255,255,0.2)",
  borderRadius: "16px",
};

export function WuzuoNoteView() {
  const [tasks, setTasks] = useState<OmniTask[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [learningFeedback, setLearningFeedback] = useState<string | null>(null);

  // Filters
  const [filterPriority, setFilterPriority] = useState<Priority | "All">("All");
  const [filterDueDate, setFilterDueDate] = useState<
    "All" | "Upcoming" | "Overdue"
  >("All");

  // Sorting
  const [sortBy, setSortBy] = useState<"DueDate" | "Priority" | "Status">(
    "DueDate",
  );

  // Firebase Real-time Listener
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "omni_tasks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as OmniTask,
      );
      setTasks(data);
    });
    return () => unsubscribe();
  }, []);

  // Toggle Completion (Firebase + OmniOne)
  const toggleStatus = async (task: OmniTask) => {
    if (!db) return;

    // Optimistic UI update for immediate glass-liquid animation
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: t.status === "Pending" ? "Completed" : "Pending" }
          : t,
      ),
    );

    const newStatus = task.status === "Pending" ? "Completed" : "Pending";
    try {
      await updateDoc(doc(db, "omni_tasks", task.id), { status: newStatus });

      // OmniOne Autonomous Learning Feedback
      if (newStatus === "Completed") {
        const res = await omniOne.process(`任務已完成: ${task.title}`, {
          language: "zh-TW",
          autonomous: false,
        });
        setLearningFeedback(
          `🧠 OmniOne 學習回饋: 信心度提昇至 ${(res.confidence * 100).toFixed(0)}%`,
        );
        setTimeout(() => setLearningFeedback(null), 4000);
      }
    } catch (e) {
      console.error("Failed to update task status or trigger OmniOne", e);
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
      );
    }
  };

  // Seed Data function
  const seedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      for (const t of INITIAL_TASKS) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = t;
        await addDoc(collection(db, "omni_tasks"), rest);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  // ==========================================
  // 3. Filter & Sort Logic Engine
  // ==========================================
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Priority Filter
    if (filterPriority !== "All") {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Due Date Filter
    if (filterDueDate !== "All") {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      if (filterDueDate === "Upcoming") {
        result = result.filter((t) => t.dueDate >= now);
      } else if (filterDueDate === "Overdue") {
        result = result.filter((t) => t.dueDate < now);
      }
    }

    // Sorting
    result.sort((a, b) => {
      // Always put completed tasks at the bottom
      if (a.status !== b.status) {
        return a.status === "Completed" ? 1 : -1;
      }

      if (sortBy === "DueDate") {
        return a.dueDate - b.dueDate;
      } else if (sortBy === "Priority") {
        return PRIORITY_MAP[a.priority] - PRIORITY_MAP[b.priority];
      } else if (sortBy === "Status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return result;
  }, [tasks, filterPriority, filterDueDate, sortBy]);

  // Priority color mapper
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case "High":
        return "text-[#F5222D] bg-[#F5222D]/10 border-[#F5222D]/20";
      case "Medium":
        return "text-[#FA8C16] bg-[#FA8C16]/10 border-[#FA8C16]/20";
      case "Low":
        return "text-[#52C41A] bg-[#52C41A]/10 border-[#52C41A]/20";
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* OmniOne Feedback Toast */}
      {learningFeedback && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
          <div
            style={liquidGlassCard}
            className="px-5 py-3 border border-accentPurple/30 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-accentPurple/20 flex items-center justify-center animate-pulse">
              🤖
            </div>
            <div className="font-semibold text-sm text-textPrimary">
              {learningFeedback}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-lg font-bold text-textPrimary tracking-wide flex items-center gap-2">
            ✅ 萬能任務 (Omni-Task)
          </h2>
          <p className="text-[13px] text-textSecondary mt-1">
            無作妙德版：已連線至 Firebase NCBDB 且具備 OmniOne 自主學習
          </p>
        </div>

        {tasks.length === 0 && (
          <button
            onClick={seedData}
            disabled={isSeeding}
            className="text-[12px] bg-accentTeal text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {isSeeding ? "匯入中..." : "🪄 一鍵匯入展示任務"}
          </button>
        )}
      </div>

      {/* Control Panel: Filters & Sorting */}
      <div
        style={liquidGlassCard}
        className="p-3.5 border border-borderColor/50 dark:border-white/10 dark:bg-slate-800/40"
      >
        <div className="flex flex-wrap gap-4 items-center text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-textSecondary font-semibold">優先級:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | "All")}
              className="bg-primary border border-borderColor rounded-lg px-2 py-1 outline-none focus:border-accentTeal cursor-pointer"
            >
              <option value="All">全部</option>
              <option value="High">高 (High)</option>
              <option value="Medium">中 (Medium)</option>
              <option value="Low">低 (Low)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-textSecondary font-semibold">到期日:</span>
            <select
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value as "All" | "Upcoming" | "Overdue")}
              className="bg-primary border border-borderColor rounded-lg px-2 py-1 outline-none focus:border-accentTeal cursor-pointer"
            >
              <option value="All">全部</option>
              <option value="Upcoming">即將到來</option>
              <option value="Overdue">已逾期</option>
            </select>
          </div>

          <div className="flex-1 min-w-[20px]" />

          <div className="flex items-center gap-2 border-l border-borderColor/50 pl-4">
            <span className="text-textSecondary font-semibold">排序依據:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "DueDate" | "Priority" | "Status")}
              className="bg-primary border border-borderColor rounded-lg px-2 py-1 outline-none focus:border-accentTeal cursor-pointer font-medium text-accentTeal"
            >
              <option value="DueDate">到期日優先</option>
              <option value="Priority">優先級最高</option>
              <option value="Status">完成狀態</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {processedTasks.length === 0 ? (
          <div className="text-center p-8 text-textSecondary text-[13px] border border-dashed border-borderColor rounded-xl">
            沒有符合過濾條件的任務
          </div>
        ) : (
          processedTasks.map((task) => {
            const isCompleted = task.status === "Completed";
            // eslint-disable-next-line react-hooks/purity
            const isOverdue = !isCompleted && task.dueDate < Date.now();
            const dateStr = new Date(task.dueDate).toLocaleDateString("zh-TW", {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={task.id}
                style={liquidGlassCard}
                className={`relative p-4 overflow-hidden transition-all duration-500 ease-out flex items-center gap-3
                  ${isCompleted ? "opacity-50 scale-[0.98]" : "opacity-100 hover:shadow-lg hover:-translate-y-[1px]"}
                  dark:bg-slate-800/40 dark:border-white/10`}
              >
                {/* Custom Checkbox (Liquid Circle) */}
                <button
                  onClick={() => toggleStatus(task)}
                  aria-label={
                    isCompleted
                      ? `標記為未完成: ${task.title}`
                      : `標記為已完成: ${task.title}`
                  }
                  className={`relative w-6 h-6 shrink-0 rounded-full border-2 transition-all duration-300 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal focus-visible:ring-offset-1 focus-visible:ring-offset-primary
                    ${
                      isCompleted
                        ? "border-accentGreen bg-accentGreen"
                        : "border-textSecondary/40 bg-transparent hover:border-accentTeal"
                    }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 text-white transition-all duration-300 ${isCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {/* Title & Tags */}
                  <div className="flex-1">
                    <div
                      className={`font-semibold text-[14px] transition-all duration-300
                      ${isCompleted ? "text-textSecondary line-through" : "text-textPrimary"}`}
                    >
                      {task.title}
                    </div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)} font-bold tracking-wide`}
                      >
                        {task.priority}
                      </span>
                      {task.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-textSecondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Due Date Indicator */}
                  <div className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium">
                    {isCompleted ? (
                      <span className="text-accentGreen">已完成 🎉</span>
                    ) : (
                      <>
                        <span
                          className={
                            isOverdue ? "text-[#F5222D]" : "text-textSecondary"
                          }
                        >
                          {isOverdue ? "⚠️ 逾期" : "⏳ 期限"}: {dateStr}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Left Indicator Strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-500
                  ${isCompleted ? "bg-accentGreen" : isOverdue ? "bg-[#F5222D]" : "bg-transparent"}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
