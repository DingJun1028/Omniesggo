'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Trash2,
  ShieldCheck,
  Zap,
  Database,
  SearchCode,
  BarChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskSystem, OmniTask, TaskPriority } from '@/lib/hooks/useTaskSystem';
import { esgMetricsApi, EsgMetric } from '@/lib/ncb-service';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TaskAlchemist } from '@/lib/services/TaskAlchemist';

const AGENT_MAP: Record<string, { icon: any; color: string }> = {
  EntropyGuard: { icon: ShieldCheck, color: 'text-amber-500' },
  TaskAlchemist: { icon: Zap, color: 'text-blue-500' },
  DataCurer: { icon: Database, color: 'text-emerald-500' },
  HolyLinter: { icon: SearchCode, color: 'text-rose-500' },
  AgentNexus: { icon: Badge, color: 'text-purple-500' },
};

interface OmniTaskMatrixProps {
  contextFilter?: string;
  className?: string;
}

export const OmniTaskMatrix: React.FC<OmniTaskMatrixProps> = ({ contextFilter, className }) => {
  const { tasks, addTask, completeTask, deleteTask, getTasksByContext } = useTaskSystem();
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAlchemizing, setIsAlchemizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayTasks = contextFilter ? getTasksByContext(contextFilter) : tasks;

  const filteredTasks = displayTasks.filter(
    (t: OmniTask) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contextId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pendingTasks = filteredTasks.filter((t: OmniTask) => t.status !== 'DONE');
  const completedTasks = filteredTasks.filter((t: OmniTask) => t.status === 'DONE');

  const handleSmartAdd = async () => {
    if (!newTaskInput.trim()) return;

    if (newTaskInput.startsWith('/ai')) {
      setIsAlchemizing(true);
      const goal = newTaskInput.replace('/ai', '').trim();

      // Replace mocked subtasks logic with TaskAlchemist.decompose
      const realSubtasks = await TaskAlchemist.decompose(goal);

      addTask({
        title: goal,
        priority: 'HIGH',
        aiSuggested: true,
        contextId: contextFilter,
        assignedAgent: 'TaskAlchemist', // Added assignedAgent for AI tasks
        subTasks: realSubtasks as any,
      });
      setIsAlchemizing(false);
    } else {
      addTask({
        title: newTaskInput,
        contextId: contextFilter,
        priority: 'MEDIUM',
      });
    }
    setNewTaskInput('');
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-bg-surface/50 border border-white/10 rounded-3xl p-6 h-full backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-xl">
            <CheckCircle className="w-5 h-5 text-accent" />
          </div>
          Omni Task Matrix
          {contextFilter && (
            <Badge
              variant="optimal"
              styleType="soft"
              className="ml-2 bg-accent/10 border-accent/20 text-accent"
            >
              CTX: {contextFilter}
            </Badge>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Filter nexus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs text-text-main focus:border-accent outline-none transition-all w-48"
            />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isAlchemizing ? (
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          ) : (
            <Plus className="w-5 h-5 text-text-muted" />
          )}
        </div>
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()}
          placeholder="Command input (e.g., /ai optimize strategy)..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm text-text-main focus:border-accent/50 outline-none transition-all focus:bg-white/10"
        />
        <button
          onClick={handleSmartAdd}
          aria-label="Submit command"
          title="Submit command"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent/10 hover:bg-accent text-accent hover:text-bg-base rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Task List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <CheckCircle className="w-8 h-8 text-text-muted/20" />
              </div>
              <p className="text-sm text-text-muted font-medium">
                All protocols are currently aligned.
              </p>
              <p className="text-xs text-text-muted/50 mt-1">System is in optimal state.</p>
            </div>
          )}

          {pendingTasks.map((task: OmniTask) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 shadow-lg shadow-black/5"
            >
              <button
                onClick={() => completeTask(task.id)}
                aria-label="Complete task"
                title="Complete task"
                className="mt-1 flex-shrink-0 text-text-muted hover:text-status-optimal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-full"
              >
                <Circle className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={cn(
                      'text-[14px] font-bold leading-tight flex items-center gap-2',
                      task.aiSuggested ? 'text-accent' : 'text-text-main',
                    )}
                  >
                    {task.title}
                    {task.contextId && (
                      <div className="flex gap-0.5">
                        {['真', '善', '美', '信', '通'].map((char, i) => (
                          <span
                            key={i}
                            className="text-[9px] w-4 h-4 flex items-center justify-center bg-accent/10 text-accent rounded-sm border border-accent/20 scale-90"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    )}
                  </span>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label="Delete task"
                      title="Delete task"
                      className="p-1 hover:text-status-lethal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-lethal rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {task.priority === 'CRITICAL' && (
                    <Badge variant="lethal" styleType="soft" className="px-1.5 py-0">
                      URGENT
                    </Badge>
                  )}
                  {task.aiSuggested && (
                    <Badge
                      variant="optimal"
                      styleType="soft"
                      className="bg-accent/10 text-accent border-accent/20 px-1.5 py-0 flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> AI FISSION
                    </Badge>
                  )}
                  {task.contextId && (
                    <span className="text-[10px] text-text-muted/60 font-mono uppercase tracking-tighter">
                      CTX: {task.contextId}
                    </span>
                  )}
                  {task.assignedAgent && AGENT_MAP[task.assignedAgent] && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {React.createElement(AGENT_MAP[task.assignedAgent].icon, {
                        className: cn('w-3 h-3', AGENT_MAP[task.assignedAgent].color),
                      })}
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-widest',
                          AGENT_MAP[task.assignedAgent].color,
                        )}
                      >
                        {task.assignedAgent}
                      </span>
                    </div>
                  )}
                </div>

                {/* Decomposed Subtasks */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-accent/20 space-y-2">
                    {task.subTasks.map((sub: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-[11px] text-text-muted flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                        {sub.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Completed Section Separator */}
          {completedTasks.length > 0 && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Crystallized
                </span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
            </div>
          )}

          {completedTasks.map((task: OmniTask) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6, scale: [1, 1.02, 1] }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 shadow-inner"
            >
              <div className="mt-1 flex-shrink-0 text-status-optimal">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] text-text-muted line-through">{task.title}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
