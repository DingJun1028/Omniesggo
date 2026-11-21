"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Clock, AlertTriangle, CheckCircle2,
  ArrowRight, ShieldCheck, Milestone, Layers
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";

// ─── Mock Data ───────────────────────────────────────
const TIME_NODES = [
  {
    id: 1, date: "2026-03-15", title: "CBAM 季報提報",
    category: "Compliance", priority: "High", status: "Upcoming",
    fiveT: true, daysLeft: 0, desc: "提交歐盟碳邊境調整機制季度申報資料。"
  },
  {
    id: 2, date: "2026-03-20", title: "ISO-14064-1 外部查證預審",
    category: "Audit", priority: "High", status: "Upcoming",
    fiveT: true, daysLeft: 5, desc: "預審會議前須完成所有碳排計算的內部核查。"
  },
  {
    id: 3, date: "2026-04-01", title: "第一季供應鏈碳排數據統整",
    category: "Supply Chain", priority: "Medium", status: "Planning",
    fiveT: false, daysLeft: 17, desc: "彙整一級與二級供應商的碳排放數據報告。"
  },
  {
    id: 4, date: "2026-04-15", title: "董事會 ESG 績效報告",
    category: "Governance", priority: "High", status: "Planning",
    fiveT: true, daysLeft: 31, desc: "Q1 永續績效、風險暴露與策略對齊情況呈報。"
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Compliance:   "text-primary bg-primary/10 border-primary/20",
  Audit:        "text-accent bg-accent/10 border-accent/20",
  "Supply Chain": "text-status-optimal bg-status-optimal/10 border-status-optimal/20",
  Governance:   "text-proxy bg-proxy/10 border-proxy/20",
};

const TABS = ["Timeline", "Calendar", "Matrix"] as const;
type Tab = typeof TABS[number];

// ─── Component ────────────────────────────────────────
export function OmniChronoView() {
  const [activeTab, setActiveTab] = useState<Tab>("Timeline");
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode
    ? {
        title: lang === "zh" ? "萬能時程監管" : "Omni Timeline",
        subtitle: "AI Compliance Monitoring",
        description: lang === "zh"
          ? "正在監控關鍵合規節點，鎖定重大萬能時程、防止數據偏移。"
          : "AI agent auto-monitoring compliance nodes and locking critical timelines.",
        accent: "from-proxy/20 to-transparent",
        tag: "[自動]",
        icon: Clock,
        guideSteps: PAGE_GUIDES["omni-chrono"],
      }
    : {
        title: lang === "zh" ? "萬能時序日誌" : "Omni Chrono Hub",
        subtitle: "System Chronology Log",
        description: lang === "zh"
          ? "手動排定合規期限、內部稽核與任務，全面管控萬能時空維度。"
          : "Manually schedule compliance deadlines, audits, and tasks.",
        accent: "from-primary/20 to-transparent",
        tag: "[手動]",
        icon: Clock,
        guideSteps: PAGE_GUIDES["omni-chrono"],
      };

  const highPriority = TIME_NODES.filter(n => n.priority === "High").length;

  return (
    <div className="view-container space-y-8">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex gap-1 p-1 bg-bg-base border border-border rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-text-main hover:bg-bg-surface"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "待辦節點", value: TIME_NODES.length, icon: Milestone, color: "text-primary" },
          { label: "高優先度", value: highPriority, icon: AlertTriangle, color: "text-status-lethal" },
          { label: "5T 對齊", value: TIME_NODES.filter(n => n.fiveT).length, icon: ShieldCheck, color: "text-status-optimal" },
        ].map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-bg-base border border-border">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-text-main">{value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">{label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Main Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "Timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-8">
              <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-text-main">
                <Clock className="w-5 h-5 text-primary" />
                即將到來的時空節點
              </h2>

              <div className="relative border-l-2 border-border ml-4 space-y-8">
                {TIME_NODES.map((node, i) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-8 group"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[11px] top-1.5 p-1 rounded-full bg-bg-base border-2 ${
                        node.priority === "High"
                          ? "border-status-lethal"
                          : "border-accent"
                      }`}
                    >
                      {node.priority === "High"
                        ? <AlertTriangle className="w-3 h-3 text-status-lethal" />
                        : <Clock className="w-3 h-3 text-accent" />
                      }
                    </div>

                    {/* Card */}
                    <div className="rounded-xl border border-border bg-bg-surface p-5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10" />

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold font-mono text-text-muted bg-bg-base border border-border px-2 py-0.5 rounded-md">
                            {node.date}
                          </span>
                          <span className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded-md ${CATEGORY_COLORS[node.category] || "text-text-muted"}`}>
                            {node.category}
                          </span>
                        </div>

                        {node.fiveT && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-status-optimal bg-status-optimal/10 px-2 py-1 rounded-lg border border-status-optimal/20 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            5T ALIGNED
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-text-main mb-1">{node.title}</h3>
                      <p className="text-xs text-text-muted leading-relaxed mb-4">{node.desc}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={node.priority === "High" ? "lethal" : "optimal"}
                            styleType="soft"
                            className="text-[9px]"
                          >
                            {node.priority === "High" ? "⚠ 高優先度" : "● 中優先度"}
                          </Badge>
                          <span className="text-[10px] text-text-muted font-mono">
                            {node.status}
                            {node.daysLeft > 0 && ` · ${node.daysLeft}天後`}
                            {node.daysLeft === 0 && " · 今日截止"}
                          </span>
                        </div>

                        <button className="text-[10px] text-primary font-bold flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                          進入時光隧道 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "Calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <GlassCard className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-main">2026年 3月 — 4月</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TIME_NODES.map(node => (
                  <div
                    key={node.id}
                    className="p-4 rounded-xl border border-border bg-bg-base space-y-2 hover:border-primary/30 transition-colors"
                  >
                    <div className="text-2xl font-black font-mono text-primary">
                      {node.date.split("-")[2]}
                    </div>
                    <div className="text-[9px] font-bold text-text-muted uppercase">
                      {node.date.slice(0, 7).replace("-", "/")}
                    </div>
                    <p className="text-xs font-bold text-text-main leading-tight">{node.title}</p>
                    <span className={`inline-block text-[9px] font-bold border px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[node.category] || ""}`}>
                      {node.category}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "Matrix" && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg-base/60">
                    {["日期", "任務節點", "分類", "優先度", "狀態", "5T"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_NODES.map((node, i) => (
                    <motion.tr
                      key={node.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-text-muted">{node.date}</td>
                      <td className="px-4 py-3 font-bold text-text-main">{node.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${CATEGORY_COLORS[node.category] || ""}`}>
                          {node.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={node.priority === "High" ? "lethal" : "optimal"} styleType="soft" className="text-[9px]">
                          {node.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{node.status}</td>
                      <td className="px-4 py-3 text-center">
                        {node.fiveT
                          ? <CheckCircle2 className="w-4 h-4 text-status-optimal inline-block" />
                          : <span className="text-text-muted/30">—</span>
                        }
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
