'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Sparkles, ShieldCheck, Flame, Cpu, Hash, Award, RefreshCw } from 'lucide-react';
import type { IUltimateAwakeningState } from '@/lib/junaikey/ultimate-awakening';

export function JunAiUltimatePanel() {
  const [state, setState] = useState<IUltimateAwakeningState | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [trace, setTrace] = useState<string[]>([]);
  const [intentInput, setIntentInput] = useState('');

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/junaikey/ultimate-awakening');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setState(json.state);
      }
    } catch (err) {
      console.error('Failed to load ultimate awakening state', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleTriggerUltimate = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/junaikey/ultimate-awakening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intentInput.trim() || '全域超覺醒自我成長與 5T 熵減優化',
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();

      if (json.success) {
        setState(json.updatedState);
        setTrace(json.executionTrace || []);
        setIntentInput('');
      }
    } catch (err) {
      setTrace((prev) => [...prev, `❌ 終極奧義觸發失敗: ${(err as Error).message}`]);
    } finally {
      setExecuting(false);
    }
  };

  const xpProgress = state ? Math.min(100, Math.round((state.xp / state.nextXp) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-950 via-[#1a1508] to-slate-950 p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.12)] space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                萬能元鑰 JunAiKey · 超覺醒終極奧義 (Self-Evolving Ultimate Skill)
              </h2>
              <span className="text-[10px] font-mono bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/30">
                78 SKILLS CONVERGED
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono">
              四重演化循環 (觀 ➔ 覺 ➔ 練 ➔ 印)，具備自動學習、自我修復與 5T 雜湊鎖密封能力
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-right font-mono">
            <div className="text-[10px] text-amber-400/80">ULTIMATE LEVEL</div>
            <div className="text-2xl font-bold text-yellow-300 flex items-center gap-1 justify-end">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30 animate-pulse" />
              LV.{state?.level || 10}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & 4-Stage Loop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* XP Bar */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/20 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">超覺醒經驗值 (XP)</span>
            <span className="text-yellow-400 font-bold">{state?.xp || 0} / {state?.nextXp || 1000} XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden border border-amber-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 text-right">升級時自動解鎖新系統知識資產 (KI)</div>
        </div>

        {/* 4-Stage Cycle */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/20 md:col-span-2 flex flex-col justify-between space-y-2">
          <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> 奧義四重修煉循環 (The 4-Stage Cycle)
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              1. 觀 (Observe)
            </div>
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              2. 覺 (Awaken)
            </div>
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
              3. 練 (Learn)
            </div>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              4. 印 (Seal)
            </div>
          </div>
        </div>
      </div>

      {/* 5 Sacred Pillars Matrix */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-amber-300 font-bold border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-400" /> 終極奧義五重神聖柱石矩陣 (5 Sacred Pillars Matrix)</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">100% OPERATIONAL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold block">1. Sovereign Core</span>
            <span className="text-[11px] text-slate-200 block">OmniAgent + JunAiKey</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-cyan-400 font-bold block">2. Swarm Intelligence</span>
            <span className="text-[11px] text-slate-200 block">10 OpenCode Skills</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold block">3. Causal Engineering</span>
            <span className="text-[11px] text-slate-200 block">OmniJules 9-Step Karma</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold block">4. Local AI Engine</span>
            <span className="text-[11px] text-slate-200 block">Ollama Zero-Cloud AI</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-yellow-400 font-bold block">5. Crypto Trust</span>
            <span className="text-[11px] text-slate-200 block">5T Lock + ZKP Seal</span>
          </div>
        </div>
      </div>

      {/* Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={intentInput}
          onChange={(e) => setIntentInput(e.target.value)}
          placeholder="輸入系統修練意圖（例如：對齊 5T 協議、修復架構熵值、更新 2024 碳盤查...）"
          disabled={executing}
          className="flex-1 bg-slate-950 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none font-mono"
        />
        <button
          onClick={handleTriggerUltimate}
          disabled={executing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
          {executing ? '奧義修練與自我成長中...' : '發動萬能元鑰·超覺醒終極奧義'}
        </button>
      </div>

      {/* Execution Trace Terminal */}
      {trace.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 font-mono text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4" /> 終極奧義修練執行軌跡 (Execution Trace)
          </div>
          <div className="space-y-1.5 text-slate-300">
            {trace.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-amber-500">›</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self-Grown Knowledge Items (KIs) */}
      {state && state.knowledgeItems.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-slate-200 text-xs font-mono flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            自我成長知識資產庫 (Self-Grown Knowledge Items)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.knowledgeItems.map((ki) => (
              <div key={ki.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>{ki.topic}</span>
                  <span className="text-[10px] font-mono text-slate-500">{new Date(ki.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{ki.insight}</p>
                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 pt-1">
                  <Hash className="w-3 h-3 text-cyan-400" /> Hash Lock: {ki.hashLock.substring(0, 20)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
