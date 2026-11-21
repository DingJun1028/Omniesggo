"use client";

import React, { useState, useMemo } from "react";
import { 
  Heart, 
  ShieldCheck, 
  Users, 
  Leaf, 
  TrendingUp, 
  Search, 
  Info, 
  ArrowRight,
  Code,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { ViewHeader } from "@/components/ui/view-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOmniIndex } from "@/lib/hooks/use-omni-index";
import { cn } from "@/lib/utils";

// Types for the dashboard data
interface ThankfulKPI {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  change: string;
  icon: React.ElementType;
  score5t: number;
}

interface FeedbackItem {
  id: string;
  source: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
  category: string;
}

export default function ThankfulDashboardView() {
  // 1. Omni Index Integration
  // 1. Omni Index Integration
  const omniData = useMemo(() => ({
    version: "3.1.0",
    dimension: "THANKFUL",
    mode: "RWD_OPTIMIZED",
    principles: ["Transparency", "Empathy", "Accountability"]
  }), []);

  const { omniNode: node, evolve } = useOmniIndex(
    "VIEW_THANKFUL_DASHBOARD",
    omniData,
    "THANKFUL_DASHBOARD_VIEW"
  );

  // 2. State Management
  const [activeTab, setActiveTab] = useState<"overview" | "transparency" | "feedback">("overview");

  // 3. Mock Data (Ideally sealed with 5T)
  const kpis: ThankfulKPI[] = [
    { 
      id: "transparency", 
      label: "透明度指數 (Transparency Index)", 
      value: "98.5", 
      unit: "%", 
      trend: "up", 
      change: "+2.1%", 
      icon: ShieldCheck,
      score5t: 0.99
    },
    { 
      id: "satisfaction", 
      label: "員工福祉 (Employee Wellbeing)", 
      value: "4.8", 
      unit: "/5.0", 
      trend: "up", 
      change: "+0.3", 
      icon: Users,
      score5t: 0.95
    },
    { 
      id: "community", 
      label: "社區參與 (Community Engagement)", 
      value: "12.4", 
      unit: "M", 
      trend: "up", 
      change: "+15%", 
      icon: Heart,
      score5t: 0.92
    },
    { 
      id: "environment", 
      label: "再生影響力 (Regenerative Impact)", 
      value: "842", 
      unit: "tCO2e", 
      trend: "down", 
      change: "-5.4%", 
      icon: Leaf,
      score5t: 0.97
    }
  ];

  const feedback: FeedbackItem[] = [
    {
      id: "f1",
      source: "社區領導者 (Community Leader)",
      content: "上次永續報告的透明度非常出色。我們終於理解了用水量的計算邏輯 (Amazing transparency in the last report).",
      sentiment: "positive",
      timestamp: "2 小時前 (2h ago)",
      category: "社會 (Social)"
    },
    {
      id: "f2",
      source: "供應鏈合作夥伴 (Supply Chain Partner)",
      content: "請求進一步釐清碳權計算中從提示詞到結果的對應關係 (Please clarify the Carbon Credit calculation).",
      sentiment: "neutral",
      timestamp: "5 小時前 (5h ago)",
      category: "治理 (Governance)"
    }
  ];

  // 4. Render Helpers
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <ViewHeader
        title="善向永續儀表板 (Thankful Dashboard)"
        subtitle="善向永續版 • 3.1.0 (Thankful Edition)"
        description="採用 5T 協議驅動的透明優先介面。即時利害關係人共鳴與零幻覺計算指標 (Zero-Hallucination Metrics)."
        icon={Heart}
        tag="頂級 RWD (Premium RWD)"
      />

      {/* Main Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: KPI Highlights (Desktop: 4 columns, Tablet/Mobile: Full width) */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6"
          >
            {kpis.map((kpi) => (
              <motion.div key={kpi.id} variants={item}>
                <GlassCard className="p-6 group hover:border-[var(--color-primary)]/50 transition-all duration-300 shadow-flat hover:shadow-crystal">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                      <kpi.icon size={24} />
                    </div>
                    <Badge variant="optimal" styleType="soft" className="border-[var(--color-primary)]/20 text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-mono">
                      5T: {(kpi.score5t * 100).toFixed(0)}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                    {kpi.label}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[var(--color-text-main)] italic">
                      {kpi.value}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)] font-mono">
                      {kpi.unit}
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 mt-3 text-xs font-bold",
                    kpi.trend === "up" ? "text-emerald-500" : "text-amber-500"
                  )}>
                    <TrendingUp size={12} className={kpi.trend === "down" ? "rotate-180" : ""} />
                    自上次同步 (Since last sync): {kpi.change}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Center Column: Algorithm Transparency (Desktop: 8 columns, Tablet/Mobile: Full width) */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard variant="liquid" className="h-full min-h-[500px] flex flex-col p-8 bg-[var(--color-bg-surface)]/40 relative overflow-hidden border-[var(--color-primary)]/10">
            {/* 背景裝飾 */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-main)] flex items-center gap-3">
                    核心算法透明中心 (Algorithm Transparency Core)
                    <Badge variant="optimal" styleType="soft">Lvl 3.1.0 已驗證 (Verified)</Badge>
                  </h2>
                  <p className="text-[var(--color-text-muted)] mt-1">ESG 計算邏輯的零幻覺監控 (Zero-Hallucination Monitoring).</p>
                </div>
                <div className="flex bg-black/10 p-1 rounded-lg border border-[var(--color-border)] self-start">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === "overview" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]")}
                  >
                    狀態 (STATUS)
                  </button>
                  <button
                    onClick={() => setActiveTab("transparency")}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === "transparency" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]")}
                  >
                    邏輯 (LOGIC)
                  </button>
                </div>
              </div>

              {/* 基於選項卡的動態內容 */}
              <div className="flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" ? (
                    <motion.div 
                      key="status"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-black/5 border border-white/10 dark:bg-white/5 space-y-4">
                          <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm">
                            <CheckCircle2 size={18} />
                            真理錨點 (Truth Anchor) 作用中
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <div className="text-3xl font-mono font-bold tracking-tighter">0.000ms</div>
                              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">驗證延遲 (Verification Latency)</div>
                            </div>
                            <div className="w-24 h-8 flex items-center gap-1">
                              {[0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.5].map((h, i) => (
                                <motion.div 
                                  key={i} 
                                  className="w-full bg-emerald-500/40 rounded-full" 
                                  style={{ height: `${h * 100}%` }}
                                  animate={{ height: [`${h * 100}%`, `${(1-h) * 100}%`, `${h * 100}%`] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-black/5 border border-white/10 dark:bg-white/5 space-y-4">
                          <div className="flex items-center gap-3 text-sky-500 font-bold text-sm">
                            <Zap size={18} />
                            萬能索引 (Omni-Index) 同步中
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <div className="text-3xl font-mono font-bold tracking-tighter">100%</div>
                              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">數據湖不可竄改性 (Data Immutability)</div>
                            </div>
                            <div className="p-2 bg-sky-500/10 rounded-full">
                              <ShieldCheck size={20} className="text-sky-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[150px] p-6 rounded-2xl border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/[0.02] flex flex-col justify-center items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                          <Code size={32} className="text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--color-text-main)]">自我修正數據演進 (Self-Correcting Data Evolution)</h4>
                          <p className="text-sm text-[var(--color-text-muted)] max-w-md">目前所有數據節點均遵循 5T Linter 規範。在過去的 24,000 次計算週期中未檢測到任何偏差 (No deviations detected).</p>
                        </div>
                        <Button variant="wireframe" className="text-[var(--color-primary)] font-bold text-xs uppercase tracking-widest border-[var(--color-primary)]/20">
                          查看驗證鏈 (Verification Chain) <ArrowRight size={14} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="logic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 font-mono text-sm overflow-auto max-h-[350px] p-4 bg-black/10 rounded-xl"
                    >
                      <div className="text-emerald-500 mb-2">{/* 5T 協議執行掛鉤 (Protocol Enforcement Hook) */}</div>
                      <div className="text-[var(--color-text-main)]">
<span className="text-amber-500">const</span> seal = (data) {"=>"} {"{"} <br />
&nbsp;&nbsp;<span className="text-[var(--color-primary)]">return</span> <span className="text-sky-500">Object.freeze</span>{"({"}<br />
&nbsp;&nbsp;&nbsp;&nbsp;...data,<br />
&nbsp;&nbsp;&nbsp;&nbsp;_omniHeart: {"{"} version: <span className="text-emerald-400">&quot;3.1.0&quot;</span>, status: <span className="text-emerald-400">&quot;HONEST&quot;</span> {"}"}<br />
&nbsp;&nbsp;{"})"};<br />
{"}"}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] border-t border-white/5 pt-4 mt-4 italic">
                        上述代碼片段說明了「神聖 Linter (Holy Linter)」如何透過不可竄改性錨定真理。每一次渲染都經過多重簽名驗證 (Multi-signature verification).
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Bar */}
              <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)]">大腦皮層作用中 (Cortex Alive)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-muted)]">5T 不可竄改</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[var(--color-text-muted)] hidden sm:block">
                  NODE_ID: {node?.nodeId.substring(0, 12) || "PENDING..."}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Section: Feedback and Resonance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        <GlassCard className="p-6 md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-[var(--color-primary)]" />
              利害關係人共鳴 (Stakeholder Resonance)
            </h3>
            <Button variant="wireframe" className="text-xs font-bold uppercase tracking-tighter border-none">查看社交矩陣 (Social Matrix)</Button>
          </div>
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5 flex gap-4">
                <div className={cn(
                  "w-1 h-12 rounded-full self-center",
                  item.sentiment === "positive" ? "bg-emerald-500" : item.sentiment === "neutral" ? "bg-sky-500" : "bg-rose-500"
                )} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-[var(--color-text-main)]">{item.source}</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{item.timestamp}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 italic">&quot;{item.content}&quot;</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="optimal" styleType="soft" className="text-[10px] px-2 py-0 h-4 border-white/10 uppercase">{item.category}</Badge>
                    <Badge variant="optimal" styleType="soft" className={cn(
                      "text-[10px] px-2 py-0 h-4 uppercase",
                      item.sentiment === "positive" ? "text-emerald-500 border-emerald-500/20" : "text-sky-500 border-sky-500/20"
                    )}>{item.sentiment}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col justify-between bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent border-[var(--color-primary)]/20 shadow-crystal">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-main)]">準備好進行驗證了嗎？ (Ready for Verification?)</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              根據目前的 5T 軌跡，您的公司符合獲得 <strong>JunAiKey Premium 3.1.0</strong> 數位證書的資格 (Eligible for Digital Certificate).
            </p>
          </div>
          <Button className="w-full mt-6 bg-[var(--color-text-main)] text-[var(--color-bg-surface)] hover:bg-[var(--color-primary)] hover:text-white transition-all font-bold py-6 rounded-xl group uppercase tracking-widest text-xs" variant="solid">
            生成 5T 證書 (Generate Certificate)
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </GlassCard>
      </div>

      {/* RWD 導航資訊 (僅在小螢幕上顯示以維持 UX 清晰度) */}
      <div className="lg:hidden p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600/80">
          行動裝置優化 (Mobile Optimization)：某些複雜的數據可視化已經過簡化，以提高在您設備上的可讀性。請使用電腦版本以獲得完整的深鑽分析 (Deep Dive Analysis).
        </p>
      </div>
    </div>
  );
}
