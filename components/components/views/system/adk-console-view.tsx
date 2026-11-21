"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TEN_WINGS_APOSTLES, 
  APOSTLE_CLUSTERS, 
  ARCANE_ARTS,
  type ApostleMetadata
} from "@/lib/adk/ten-wings";
import { ViewHeader } from "@/components/ui/view-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenWingsStatus } from "@/components/ui/ten-wings-status";
import { AdkTaskDispatcher } from "@/components/ui/adk-task-dispatcher";
import { useAppContext } from "@/lib/context/app-context";
import { 
  Cpu, Zap, Lock, 
  Activity, Sparkles, Table
} from "lucide-react";


const ARCANE_ART_NUMBERS = ["一", "二", "三", "四", "五", "六"];

export function AdkConsoleView() {
  const { aiProxyMode, lang } = useAppContext();
  const [selectedApostle, setSelectedApostle] = useState<ApostleMetadata | null>(null);
  const [filterCluster, setFilterCluster] = useState<string>("all");
  const [showMatrix, setShowMatrix] = useState(false);
  const [showDispatcher, setShowDispatcher] = useState(false);

  const branding = {
    title: lang === "zh" ? "ADK 十翼使徒 · 奧義指揮台" : "ADK Ten Wings · Arcane Console",
    subtitle: aiProxyMode ? "Omni AI Agent Command" : "Omni Manual Command",
    description: lang === "zh"
      ? "萬能智典X — 終始矩陣。管理、監控並調度十翼使徒的奧義六式運算任務。"
      : "OmniX Canon — Terminal Matrix. Manage, monitor, and dispatch Ten Wings Apostles.",
    icon: Cpu,
    tag: aiProxyMode ? "[自動]" : "[手動]",
  };

  const filteredApostles = filterCluster === "all"
    ? TEN_WINGS_APOSTLES
    : TEN_WINGS_APOSTLES.filter(a => a.cluster === filterCluster);

  const clusterOptions = [
    { id: "all", label: "全部使徒" },
    { id: "Architectural", label: "架構聖殿" },
    { id: "Execution", label: "真善美執行組" },
    { id: "Orchestration", label: "代理織網" },
    { id: "Evolution", label: "進化引擎" },
  ];

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-48">
      <ViewHeader {...branding} aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-3">
            <Badge variant="optimal" styleType="soft" className="px-4 py-2 h-auto font-mono">
              <div className="text-left">
                <div className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">Protocol</div>
                <div className="text-xs text-primary">BenevolentSustainability v2.0</div>
              </div>
            </Badge>
            <Button
              onClick={() => setShowDispatcher(!showDispatcher)}
              className={`h-auto py-2 px-4 text-xs font-black tracking-widest transition-all ${
                showDispatcher 
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-crystal-optimal"
                  : "bg-primary/10 text-primary border border-primary/30"
              }`}
            >
              <Zap className="w-4 h-4 mr-2" />
              {showDispatcher ? "收起指揮台" : "⚡ 下達天使號令"}
            </Button>
          </div>
        }
      />

      {/* ─── Task Dispatcher Panel (Expandable) ─── */}
      <AnimatePresence>
        {showDispatcher && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 border-primary/20 shadow-crystal-optimal">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-1 bg-accent/20 blur-md rounded-full -z-10"
                  />
                </div>
                <div>
                  <h3 className="font-black text-text-main text-sm tracking-wide">天使號令 · 任務指派系統</h3>
                  <p className="text-[9px] text-text-muted">支援三種指派模式 · 奧義律令式 / 單兵召喚 / 矩陣協作</p>
                </div>
              </div>
              <AdkTaskDispatcher />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(APOSTLE_CLUSTERS).map(([cId, cfg]) => {
          const members = TEN_WINGS_APOSTLES.filter(a => a.cluster === cId);
          const avgEntropy = members.reduce((s, a) => s + a.entropyTarget, 0) / members.length;
          return (
            <GlassCard key={cId} className="p-4 space-y-2 border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{cfg.label}</span>
                <Badge variant="optimal" styleType="soft" className="text-[8px]">{members.length}名</Badge>
              </div>
              <p className="text-2xl font-black font-mono text-text-main">{members.length}</p>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ backgroundColor: cfg.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - avgEntropy * 800}%` }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              </div>
              <p className="text-[9px] text-text-muted">{cfg.desc}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Apostle Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filter + View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {clusterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterCluster(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filterCluster === opt.id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-text-muted hover:border-primary/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="ml-auto">
              <Button variant="wireframe" onClick={() => setShowMatrix(!showMatrix)}>
                <Table className="w-4 h-4 mr-2" />
                {showMatrix ? "卡牌視圖" : "矩陣視圖"}
              </Button>
            </div>
          </div>

          {/* Matrix View */}
          {showMatrix ? (
            <GlassCard className="p-0 overflow-hidden border-primary/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg-base/50">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest w-16">ID</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">使徒名稱</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">奧義分配</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">五T支柱</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">目標熵值</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApostles.map((a, i) => {
                    const arcane = ARCANE_ARTS[a.arcane];
                    return (
                      <motion.tr 
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedApostle(selectedApostle?.id === a.id ? null : a)}
                        className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary">[{a.id}]</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-text-main">{a.name}</div>
                          <div className="text-[9px] text-text-muted">{a.nameEn}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                            style={{ color: arcane.color, borderColor: arcane.color + "40", backgroundColor: arcane.color + "15" }}
                          >
                            第{ARCANE_ART_NUMBERS[arcane.art - 1]}式 · {a.arcane}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5 flex-wrap">
                            {a.pillars.map(p => <span key={p} className="text-[8px] font-bold text-primary bg-primary/10 px-1 rounded">【{p}】</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${a.entropyTarget * 200}%` }} />
                            </div>
                            <span className="font-mono text-[9px] text-text-muted">{(a.entropyTarget * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[9px] text-text-muted max-w-[200px]">
                          <span className="line-clamp-2">{a.kpi}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApostles.map((apostle, i) => {
                const arcane = ARCANE_ARTS[apostle.arcane];
                const isSelected = selectedApostle?.id === apostle.id;
                return (
                  <motion.div
                    key={apostle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedApostle(isSelected ? null : apostle)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "border-primary/30 bg-primary/5 shadow-crystal-optimal"
                        : "border-border bg-bg-surface hover:border-primary/20 hover:bg-bg-surface/80"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black font-mono text-white bg-primary rounded-lg px-2 py-1 leading-none">
                          [{apostle.id}]
                        </span>
                        <div>
                          <h5 className="font-bold text-text-main text-sm">{apostle.name}</h5>
                          <p className="text-[9px] text-text-muted">{apostle.nameEn}</p>
                        </div>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-1 rounded-lg border leading-none"
                        style={{ color: arcane.color, borderColor: arcane.color + "40", backgroundColor: arcane.color + "15" }}
                      >
                        {apostle.arcane}
                      </span>
                    </div>

                    <p className="text-[10px] text-text-muted leading-relaxed mb-4 line-clamp-2">{apostle.description}</p>

                    <div className="flex items-center justify-between text-[9px]">
                      <div className="flex gap-1">
                        {apostle.pillars.map(p => (
                          <span key={p} className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">【{p}】</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-text-muted">
                        <Activity className="w-3 h-3" />
                        <span>熵 ≤ {(apostle.entropyTarget * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <div className="p-3 rounded-xl bg-bg-base/60 border border-border">
                              <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1.5">MECE 任務聲明</p>
                              <p className="text-[10px] text-text-main leading-relaxed">{apostle.mandate}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-bg-base/60 border border-border">
                              <p className="text-[9px] font-bold text-accent uppercase tracking-widest mb-1.5">KPI 目標</p>
                              <p className="text-[10px] text-text-main">{apostle.kpi}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-mono">
                              <Lock className="w-3 h-3 text-primary" />
                              <span className="text-text-muted">符文路徑：</span>
                              <code className="text-primary">{apostle.runeFile}</code>
                            </div>
                            {/* Quick Dispatch */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDispatcher(true);
                                setTimeout(() => {
                                  document.getElementById("dispatcher-panel")?.scrollIntoView({ behavior: "smooth" });
                                }, 100);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Zap className="w-3 h-3" /> 召喚此使徒執行任務
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Status Panel */}
        <div className="lg:col-span-4 space-y-6">
          <TenWingsStatus />

          {/* Quick Dispatch Prompt */}
          <GlassCard className="p-5 space-y-4 border-accent/10 bg-gradient-to-br from-bg-surface to-accent/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h4 className="font-bold text-sm text-text-main">指派語法指南</h4>
            </div>
            <div className="space-y-2 text-[9px] font-mono">
              {[
                { label: "奧義律令", example: "啟動奧義六式，目標 ESG GO，核心任務是..." },
                { label: "單兵召喚", example: "召喚 [03] 液態美學家，升級 Impact Nexus 介面..." },
                { label: "矩陣協作", example: "矩陣部署至 OmniAntigravity，主帥 [07]..." },
              ].map((item, i) => (
                <div key={i} className="p-2 rounded-lg bg-bg-base/60 border border-border">
                  <span className="text-primary font-bold">{item.label}：</span>
                  <p className="text-text-muted mt-0.5 leading-relaxed">{item.example}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowDispatcher(true)}
              className="w-full bg-gradient-to-r from-accent to-primary text-white font-black text-xs tracking-widest"
            >
              <Zap className="w-4 h-4 mr-2" />
              開啟任務指派系統
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
