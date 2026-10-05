'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DelegationEventStream from '@/components/delegation/DelegationEventStream';
import DelegationMetricsOverview from '@/components/delegation/DelegationMetricsOverview';
import { Network, BrainCircuit, Activity, ChevronRight } from 'lucide-react';

/**
 * ==========================================
 * 委派事件總線 · 即時觀測頁面 (Liquid Glass Cyan)
 * ==========================================
 */

export default function DelegationEventsPage() {
  const [connectedId, setConnectedId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('delegationId') ?? '';
    }
    return '';
  });
  const [input, setInput] = useState<string>(connectedId);

  const connect = (id: string) => {
    const trimmed = id.trim();
    setConnectedId(trimmed);
    const params = new URLSearchParams(window.location.search);
    if (trimmed) params.set('delegationId', trimmed);
    else params.delete('delegationId');
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden p-6 md:p-10">
      {/* Liquid Glass Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Network className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 tracking-widest uppercase">Delegation Engine</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                委派事件總線
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-base">
              OmniAgent 蜂群委派 · 即時生命週期追蹤 (SSE)
            </p>
          </div>
          
          <div className="flex gap-4">
             <Link href="/omni" className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">返回 OmniCenter</span>
             </Link>
          </div>
        </header>

        {/* Connection Panel */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
               style={{ background: 'radial-gradient(circle at 10% 50%, rgba(6,182,212,0.05), transparent 70%)' }} />
          
          <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            事件通道綁定 (Delegation ID)
          </label>
          <div className="flex gap-3 flex-col sm:flex-row relative z-10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') connect(input);
              }}
              placeholder="輸入 Delegation ID..."
              className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono text-sm"
            />
            <button
              onClick={() => connect(input)}
              className="bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              連線 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {connectedId ? (
          <div className="space-y-6">
            <DelegationMetricsOverview delegationId={connectedId} />
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
              <DelegationEventStream delegationId={connectedId} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <DelegationMetricsOverview />
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-dashed border-slate-700/50 rounded-2xl">
              <Network className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
              <p className="text-slate-400 text-sm">等待委派通道連線中...</p>
              <p className="text-slate-500 text-xs mt-1">請輸入 ID 或從任務中自動跳轉</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
