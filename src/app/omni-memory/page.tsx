"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain, Database, Sparkles, Clock, Target,
  Trash2, Search, Plus, Sun, Moon, Shield,
  Activity, RefreshCw, X, ChevronDown, Lock
} from "lucide-react";
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from "@/components/omni-base/OmniCard";
import { OmniButton } from "@/components/omni-base/OmniButton";
import { OmniBadge } from "@/components/omni-base/OmniBadge";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MemoryItem {
  id: string;
  type: "claim" | "preference" | "rule" | "thought" | "archived";
  content: string;
  keywords: string[];
  confidence: number;
  lastAccessed: string;
  sourceOrigin?: string;
}

interface NewMemoryForm {
  type: "claim" | "preference" | "rule" | "thought";
  content: string;
  keywords: string;
  confidence: number;
}

const TYPE_META: Record<string, { label: string; light: string; dark: string }> = {
  rule:       { label: "系統規則",  light: "text-red-700 border-red-400 bg-red-50",      dark: "text-red-400 border-red-400 bg-red-400/10" },
  preference: { label: "使用者偏好", light: "text-cyan-700 border-cyan-400 bg-cyan-50",   dark: "text-cyan-400 border-cyan-400 bg-cyan-400/10" },
  claim:      { label: "聲明/事實", light: "text-emerald-700 border-emerald-500 bg-emerald-50", dark: "text-emerald-400 border-emerald-400 bg-emerald-400/10" },
  thought:    { label: "潛意識思考", light: "text-purple-700 border-purple-400 bg-purple-50", dark: "text-purple-400 border-purple-400 bg-purple-400/10" },
  archived:   { label: "已歸檔",   light: "text-slate-500 border-slate-300 bg-slate-100", dark: "text-slate-500 border-slate-700 bg-slate-800/30" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function OmniMemoryDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newMem, setNewMem] = useState<NewMemoryForm>({
    type: "preference", content: "", keywords: "", confidence: 0.9,
  });
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = theme === "dark";
  const bg     = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const card   = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const muted  = isDark ? "text-slate-400" : "text-slate-500";
  const inp    = isDark
    ? "bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600";

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchMemories = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ userId: "junai-key", limit: "100" });
      if (filterType !== "all") params.set("type", filterType);
      if (q !== undefined) params.set("q", q);
      const res = await fetch(`/api/omni-memory?${params}`);
      const json = await res.json();
      if (json.success) setMemories(json.data);
    } catch (e) {
      console.error("Fetch memories failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchMemories(searchQuery), 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [searchQuery, fetchMemories]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newMem.content.trim()) return;
    const res = await fetch("/api/omni-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newMem.type,
        content: newMem.content,
        keywords: newMem.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        confidence: newMem.confidence,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setNewMem({ type: "preference", content: "", keywords: "", confidence: 0.9 });
      setShowAddForm(false);
      fetchMemories();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/omni-memory?id=${id}`, { method: "DELETE" });
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  const handleSynthesis = async () => {
    setIsSynthesizing(true);
    // Trigger low-confidence fade locally (the real nightly job runs server-side)
    await new Promise((r) => setTimeout(r, 1800));
    const lowConf = memories.filter((m) => m.confidence < 0.4);
    for (const m of lowConf) {
      await fetch(`/api/omni-memory?id=${m.id}`, { method: "DELETE" });
    }
    setIsSynthesizing(false);
    fetchMemories();
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const avgConf = memories.length
    ? memories.reduce((s, m) => s + m.confidence, 0) / memories.length
    : 0;
  const ruleCount  = memories.filter((m) => m.type === "rule").length;
  const prefCount  = memories.filter((m) => m.type === "preference").length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bg}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <OmniBadge variant="outline" className={isDark ? "text-cyan-400 border-cyan-700" : "text-cyan-700 border-cyan-400"}>
                A08 · OMNI MEMORY
              </OmniBadge>
              <OmniBadge variant="outline" className={isDark ? "text-purple-400 border-purple-700" : "text-purple-700 border-purple-400"}>
                ALIGNMENT ENGINE
              </OmniBadge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">全通記憶與對齊引擎</h1>
            <p className={`mt-2 max-w-xl text-sm leading-relaxed ${muted}`}>
              具備長期記憶、自動對齊與遺忘機制的動態演進神經網路，賦予 OmniAgent 自我優化的能力。
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Theme Capsule */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isDark
                  ? "border-slate-700 text-slate-300 hover:border-slate-500"
                  : "border-slate-300 text-slate-600 hover:border-slate-500"
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
            <div className="flex gap-2">
              <OmniButton
                onClick={() => setShowAddForm((v) => !v)}
                className={isDark ? "bg-cyan-700 hover:bg-cyan-600 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}
              >
                <Plus className="w-4 h-4 mr-1.5" /> 新增記憶
              </OmniButton>
              <OmniButton
                onClick={handleSynthesis}
                disabled={isSynthesizing}
                className={isDark ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
              >
                {isSynthesizing
                  ? <Activity className="w-4 h-4 mr-1.5 animate-spin" />
                  : <Sparkles className="w-4 h-4 mr-1.5" />}
                {isSynthesizing ? "對齊中..." : "執行夢境合成"}
              </OmniButton>
            </div>
          </div>
        </div>

        {/* ── Add Form ────────────────────────────────────────────── */}
        {showAddForm && (
          <OmniCard className={`mb-6 border ${card}`}>
            <OmniCardHeader className="pb-0 pt-4 px-5">
              <OmniCardTitle className="text-sm font-semibold">新增記憶節點</OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent className="p-5 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-medium block mb-1 ${muted}`}>型態</label>
                  <select
                    className={`w-full border rounded-md px-3 py-2 text-sm outline-none transition-colors ${inp}`}
                    value={newMem.type}
                    onChange={(e) => setNewMem((p) => ({ ...p, type: e.target.value as NewMemoryForm["type"] }))}
                  >
                    <option value="preference">偏好 (Preference)</option>
                    <option value="rule">規則 (Rule)</option>
                    <option value="claim">聲明 (Claim)</option>
                    <option value="thought">思考 (Thought)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${muted}`}>
                    信心度 ({Math.round(newMem.confidence * 100)}%)
                  </label>
                  <input
                    type="range" min={0.1} max={1} step={0.05}
                    value={newMem.confidence}
                    onChange={(e) => setNewMem((p) => ({ ...p, confidence: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-500 mt-2"
                  />
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${muted}`}>內容</label>
                <textarea
                  rows={3}
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none resize-none transition-colors ${inp}`}
                  placeholder="記憶內容..."
                  value={newMem.content}
                  onChange={(e) => setNewMem((p) => ({ ...p, content: e.target.value }))}
                />
              </div>
              <div>
                <label className={`text-xs font-medium block mb-1 ${muted}`}>關鍵字（逗號分隔）</label>
                <input
                  type="text"
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none transition-colors ${inp}`}
                  placeholder="5T, UI, Security..."
                  value={newMem.keywords}
                  onChange={(e) => setNewMem((p) => ({ ...p, keywords: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <OmniButton
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className={muted}
                >
                  取消
                </OmniButton>
                <OmniButton
                  onClick={handleAdd}
                  disabled={!newMem.content.trim()}
                  className={isDark ? "bg-cyan-700 hover:bg-cyan-600 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> 封印記憶節點
                </OmniButton>
              </div>
            </OmniCardContent>
          </OmniCard>
        )}

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "活躍節點", value: memories.length, sub: "隨夢境演化", color: "text-cyan-500" },
            { label: "對齊收斂度", value: `${(avgConf * 100).toFixed(1)}%`, sub: "平均信心度", color: "text-emerald-500" },
            { label: "系統規則", value: ruleCount, sub: "最高優先級", color: "text-red-500" },
            { label: "使用者偏好", value: prefCount, sub: "個人化記憶", color: "text-purple-500" },
          ].map((s) => (
            <OmniCard key={s.label} className={`border ${card}`}>
              <OmniCardContent className="p-5">
                <div className={`text-xs font-medium mb-1 ${muted}`}>{s.label}</div>
                <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className={`text-xs mt-1.5 ${muted}`}>{s.sub}</div>
              </OmniCardContent>
            </OmniCard>
          ))}
        </div>

        {/* ── Filter + Search ─────────────────────────────────────── */}
        <div className={`flex gap-3 mb-6 items-center`}>
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              type="text"
              placeholder="搜尋記憶內容或關鍵字..."
              className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition-colors ${inp}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className={`border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors w-40 ${inp}`}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">全部型態</option>
            <option value="rule">系統規則</option>
            <option value="preference">使用者偏好</option>
            <option value="claim">聲明/事實</option>
            <option value="thought">潛意識思考</option>
          </select>
          <OmniButton
            variant="ghost"
            onClick={() => fetchMemories(searchQuery)}
            className={muted}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </OmniButton>
        </div>

        {/* ── Memory List ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {isLoading && memories.length === 0 && (
            <div className={`text-center py-16 ${muted}`}>
              <Activity className="w-8 h-8 mx-auto mb-3 animate-pulse" />
              <p className="text-sm">載入記憶矩陣中...</p>
            </div>
          )}
          {!isLoading && memories.length === 0 && (
            <div className={`text-center py-16 border border-dashed rounded-xl ${isDark ? "border-slate-800" : "border-slate-200"} ${muted}`}>
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm">記憶庫中沒有符合的節點</p>
              <p className="text-xs mt-1 opacity-60">點擊「新增記憶」開始建立知識資產</p>
            </div>
          )}
          {memories.map((memory) => {
            const meta = TYPE_META[memory.type] ?? TYPE_META.claim;
            const typeClass = isDark ? meta.dark : meta.light;
            return (
              <OmniCard
                key={memory.id}
                className={`border transition-all duration-200 hover:shadow-sm ${card} ${isDark ? "hover:border-slate-700" : "hover:border-slate-300"}`}
              >
                <div className="p-5 flex gap-4 items-start">
                  <Brain className={`w-5 h-5 mt-0.5 flex-shrink-0 ${muted}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2.5">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs border uppercase tracking-wider font-semibold ${typeClass}`}>
                          {meta.label}
                        </span>
                        <span className={`text-xs font-mono ${muted}`}>
                          <Database className="w-3 h-3 inline mr-0.5" />
                          {memory.id.slice(0, 12)}…
                        </span>
                        {memory.sourceOrigin === "DREAMS_ENGINE" && (
                          <span className="text-xs text-purple-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 夢境萃取
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className={`w-3 h-3 ${muted}`} />
                          <span className={muted}>
                            {new Date(memory.lastAccessed).toLocaleDateString("zh-TW")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                memory.confidence >= 0.8
                                  ? "bg-emerald-500"
                                  : memory.confidence >= 0.5
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${Math.round(memory.confidence * 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${muted}`}>
                            {(memory.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(memory.id)}
                          disabled={deletingId === memory.id}
                          className={`text-xs rounded p-1 transition-colors ${
                            isDark
                              ? "text-slate-600 hover:text-red-400 hover:bg-red-400/10"
                              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                        >
                          {deletingId === memory.id
                            ? <Activity className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {memory.content}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {memory.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </OmniCard>
            );
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className={`mt-12 pt-6 border-t text-xs text-center ${isDark ? "border-slate-800" : "border-slate-200"} ${muted}`}>
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          OmniMemory A08 · Dreams Engine 每日 03:00 自動執行遺忘與對齊合成 ·
          <span className="font-mono ml-1">5T Compliant</span>
        </div>
      </div>
    </div>
  );
}
