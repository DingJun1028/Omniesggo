"use client";

import React, { useState, useEffect } from "react";
import { Search, BrainCircuit, Activity, Trash2, Edit3, ShieldAlert } from "lucide-react";

interface OmniMemory {
  id: string;
  type: string;
  content: string;
  keywords: string;
  confidence: number;
  lastAccessed: string;
}

export default function OmniMemoryDashboard() {
  const [memories, setMemories] = useState<OmniMemory[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMemories = async (searchQuery: string = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/omni-memory?userId=system_admin&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories(query);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 font-sans p-8 relative overflow-hidden">
      {/* Liquid Glass Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 backdrop-blur-md">
              <BrainCircuit className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                OmniMemory Matrix
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                零算力自適應記憶與對齊引擎 (Zero-Compute Alignment Engine)
              </p>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Entropy: Optimal</span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋萬能記憶 (Full-Text Search)..."
            className="w-full bg-slate-900/40 border border-cyan-500/20 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all backdrop-blur-sm"
          />
        </form>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
              <p>無匹配的記憶紀錄</p>
            </div>
          ) : (
            memories.map((mem) => (
              <div 
                key={mem.id} 
                className="group relative flex flex-col bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/40 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                    {mem.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">
                      Confidence:
                    </span>
                    <span className={`text-xs font-bold ${mem.confidence > 0.8 ? 'text-emerald-400' : mem.confidence > 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {(mem.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed flex-grow line-clamp-4">
                  {mem.content}
                </p>
                
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-slate-500">
                    {new Date(mem.lastAccessed).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-400 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded-md text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
