// ═══════════════════════════════════════════════════════════════
// 萬能待辦 OmniTodo Page
// ═══════════════════════════════════════════════════════════════

import { Metadata } from 'next';
import { OmniTodoPanel } from '@/components/omni-todo-panel';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: '萬能待辦 OmniTodo | ESGGO',
  description: 'ESGGO 萬能待辦系統：統一管理 ESG 任務、工作事項、個人待辦',
};

export default function OmniTodoPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* 頁面標題 */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-cyan-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-tight">
              萬能待辦 OmniTodo ∞ Evolution
            </h1>
            <p className="text-sm text-cyan-100/60 font-medium mt-1">
              統一管理 ESG 任務、工作事項、個人待辦 · 永續發展無限進化
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 bg-slate-950/50 backdrop-blur-md border border-cyan-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-cyan-400">
          <ShieldCheck size={14} /> 5T ZKP 同步中
        </div>
      </div>

      {/* OmniTodo Panel */}
      <OmniTodoPanel />
    </div>
  );
}
