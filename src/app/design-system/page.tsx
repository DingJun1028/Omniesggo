'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Palette, Layers, Type, BrainCircuit, Droplet, Monitor, Sparkles } from 'lucide-react';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'components' | 'colors' | 'typography'>('components');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden p-6 md:p-10">
      {/* Liquid Glass Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
                <Palette className="w-3 h-3 text-sky-400" />
                <span className="text-xs font-semibold text-sky-400 tracking-widest uppercase">Design System</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Liquid Glass Cyan
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-base">
              ESGGO 善向永續 · 視覺核心語彙與元件庫
            </p>
          </div>
          
          <div className="flex gap-4">
             <Link href="/omni" className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">返回 OmniCenter</span>
             </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-slate-800/50 pb-px">
          {[
            { id: 'components', label: '元件 (Components)', icon: Layers },
            { id: 'colors', label: '色彩 (Colors)', icon: Droplet },
            { id: 'typography', label: '字體 (Typography)', icon: Type }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pt-4">
          {activeTab === 'components' && <ComponentsShowcase />}
          {activeTab === 'colors' && <ColorsShowcase />}
          {activeTab === 'typography' && <TypographyShowcase />}
        </div>
      </div>
    </div>
  );
}

function ComponentsShowcase() {
  return (
    <div className="space-y-10">
      
      {/* Cards */}
      <section>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" /> Liquid Glass Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at top right, rgba(6,182,212,0.1), transparent 60%)' }} />
             <h3 className="text-sm font-semibold text-cyan-400 mb-2">Standard Card</h3>
             <p className="text-xs text-slate-400 leading-relaxed">預設的液態玻璃卡片，帶有模糊背景、邊框與微弱的環境反射。</p>
          </div>
          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]">
             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at top right, rgba(16,185,129,0.15), transparent 60%)' }} />
             <h3 className="text-sm font-semibold text-emerald-400 mb-2">Active / Success Card</h3>
             <p className="text-xs text-slate-400 leading-relaxed">用於運行中或驗證成功的狀態，帶有光暈與較亮的邊框。</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-cyan-400" /> Buttons & Interactions
        </h2>
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md flex flex-wrap gap-4 items-center">
           <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-6 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]">
             Primary Action
           </button>
           <button className="bg-slate-800 hover:bg-cyan-900/40 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 font-bold py-2 px-6 rounded-xl transition-all">
             Secondary Outline
           </button>
           <button className="bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-2 px-6 rounded-xl transition-all">
             Ghost Button
           </button>
           <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-2 px-6 rounded-xl transition-all">
             Destructive
           </button>
        </div>
      </section>
      
      {/* Badges */}
      <section>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" /> Status Badges
        </h2>
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md flex flex-wrap gap-3">
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">System Normal</span>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Running
          </span>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Standby</span>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Alert</span>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">Offline</span>
        </div>
      </section>

    </div>
  );
}

function ColorsShowcase() {
  const palettes = [
    { name: 'Cyan (Primary Core)', var: 'cyan', range: [400, 500, 900], hex: ['#22d3ee', '#06b6d4', '#164e63'] },
    { name: 'Emerald (Success/Soul)', var: 'emerald', range: [400, 500, 900], hex: ['#34d399', '#10b981', '#064e3b'] },
    { name: 'Violet (Factory/Logic)', var: 'violet', range: [400, 500, 900], hex: ['#a78bfa', '#8b5cf6', '#4c1d95'] },
    { name: 'Amber (Delegation/Warning)', var: 'amber', range: [400, 500, 900], hex: ['#fbbf24', '#f59e0b', '#78350f'] },
    { name: 'Rose (Parser/Alert)', var: 'rose', range: [400, 500, 900], hex: ['#fb7185', '#f43f5e', '#881337'] },
    { name: 'Slate (Void/Structure)', var: 'slate', range: [400, 800, 950], hex: ['#94a3b8', '#1e293b', '#020617'] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {palettes.map((p) => (
        <div key={p.name} className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-slate-200 mb-4">{p.name}</h3>
          <div className="space-y-3">
            {p.range.map((r, idx) => (
              <div key={r} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg shadow-inner bg-${p.var}-${r}`} style={{ backgroundColor: p.hex[idx] }} />
                <div>
                  <div className="text-xs font-medium text-slate-300">{p.var}-{r}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{p.hex[idx]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographyShowcase() {
  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-md">
       <div className="space-y-8">
         <div>
           <div className="text-[10px] font-mono text-slate-500 mb-1">text-5xl font-extrabold tracking-tight</div>
           <h1 className="text-5xl font-extrabold tracking-tight text-white">無作妙德，圓通無礙</h1>
         </div>
         <div>
           <div className="text-[10px] font-mono text-slate-500 mb-1">text-2xl font-bold</div>
           <h2 className="text-2xl font-bold text-slate-200">ESG 永續數據核心</h2>
         </div>
         <div>
           <div className="text-[10px] font-mono text-slate-500 mb-1">text-base text-slate-300 leading-relaxed</div>
           <p className="text-base text-slate-300 leading-relaxed">
             ESG GO 系統透過 5T 守護協議，確保每一筆環境、社會與治理數據皆具備可溯源、透明、可感知、可信任與可追蹤的特質。
           </p>
         </div>
         <div>
           <div className="text-[10px] font-mono text-slate-500 mb-1">text-xs font-medium text-slate-400 uppercase tracking-widest</div>
           <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
             Traceable · Transparent · Tangible · Trustworthy · Trackable
           </p>
         </div>
       </div>
    </div>
  );
}
