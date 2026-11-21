"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Eye, Link, Activity, Code, Lock,
  Grid, X, Database, FileCheck, Server,
  BrainCircuit, Network, ChevronRight, Zap, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";
import { ESGSwarmHUD } from "@/components/ui/esg-swarm-hud";
import { cn } from "@/lib/utils";

// ─── Protocol Definitions ─────────────────────────────
const PROTOCOLS = [
  { id: "Tangible",          name: "可感知 (Tangible)",          desc: "數據以高保真、多維度的方式呈現",          icon: Eye,         color: "text-primary",        bg: "bg-primary/10" },
  { id: "Traceable",         name: "可溯源 (Traceable)",         desc: "每個數據點都有明確的來源記錄",            icon: Link,        color: "text-primary",        bg: "bg-primary/10" },
  { id: "Trackable",         name: "可追蹤 (Trackable)",         desc: "數據的整個生命週期都被完整記錄",          icon: Activity,    color: "text-accent",         bg: "bg-accent/10" },
  { id: "Transparent",       name: "可驗算 (Transparent)",       desc: "所有計算邏輯與算法完全透明",              icon: Code,        color: "text-accent",         bg: "bg-accent/10" },
  { id: "Trustworthy",       name: "不可篡改 (Trustworthy)",     desc: "採用密碼學方法確保數據無法篡改",          icon: Lock,        color: "text-status-lethal",  bg: "bg-status-lethal/10" },
  { id: "Integrity",         name: "5T 數據完整性 (Integrity)",  desc: "自動檢測數據的完整性與一致性",            icon: Target,      color: "text-status-optimal", bg: "bg-status-optimal/10" },
];

const MECE_SERVICES = [
  "碳排放盤查 (Scope 1,2,3)", "能源管理與優化", "水資源風險評估", "廢棄物循環經濟",
  "氣候變遷風險 (TCFD)", "生物多樣性影響", "產品碳足跡計算", "綠色供應鏈管理",
  "勞工權益與人權", "職業安全衛生", "員工多元與包容", "社區參與與發展",
  "客戶隱私與資安", "產品品質與安全", "供應商社會評估", "薪酬與福利管理",
  "董事會結構與獨立性", "商業倫理與反貪腐", "風險管理機制", "稅務透明度",
  "利害關係人議合", "永續報告與確信", "內部控制與稽核", "法規遵循與合規",
];

const FIVE_T_PILLARS = [
  { char: "真", eng: "Truth",        desc1: "可溯源追蹤的真實數據",    desc2: "5T 協議確保數據真實性" },
  { char: "善", eng: "Goodness",     desc1: "可透明驗算的公正審計",    desc2: "開放計算邏輯供審計" },
  { char: "美", eng: "Beauty",       desc1: "可感知的卓越藝術",        desc2: "Liquid Glass UI 設計系統" },
  { char: "信", eng: "Trust",        desc1: "不可篡改的信任",          desc2: "SHA-256 數位簽章" },
  { char: "通", eng: "Transfer",     desc1: "超越一切的無礙圓通",      desc2: "標準化 API 與數據格式", link: "omni-note", linkText: "Open WuzuoNote" },
];

export function BestPracticeView() {
  const { aiProxyMode, lang, setActiveTab } = useAppContext();
  const [isMeceOpen, setIsMeceOpen] = useState(false);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "聖典最佳實踐" : "Best Practice Center",
    subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
    description: lang === "zh" ? "萬能代理：自主維護 5T 協議完整性，自動填補合規缺口與流程優化。" : "AI agent autonomous maintenance of 5T integrity and compliance gap filling.",
    tag: "[自動]",
    icon: Zap
  } : {
    title: lang === "zh" ? "聖典最佳實踐" : "Best Practice Center",
    subtitle: lang === "zh" ? "萬能手動控制 (Omni Manual Control)" : "Omni Manual Control",
    description: lang === "zh" ? "萬能核實：手動校對企業治理標準，確保各項流程符合聖典最佳實踐。" : "Manual verification of corporate governance standards and best practices.",
    tag: "[手動]",
    icon: ShieldCheck
  };

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <Badge variant="optimal" styleType="solid" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-status-optimal text-white border-none shadow-flat italic">
            <ShieldCheck className="w-4 h-4 mr-2" /> Engine Active
          </Badge>
        }
      />

      {/* ── Best Practice Core Section ── */}
      <GlassCard className="p-10 border-l-2 border-primary shadow-flat mb-12 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-32 h-32 text-primary" />
         </div>
        <div className="flex items-center gap-6 mb-10 relative z-10">
          <div className="w-16 h-16 rounded-[2px] bg-primary flex items-center justify-center shadow-flat">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-main uppercase tracking-tight italic">Omni Standard Compliance Vector</h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1 italic">Normalized Governance Framework</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { icon: Server,    title: "分散層存儲架構",  desc: "採用高可用性分散式儲存，確保 ESG 原始數據、水電單據、碳排佐證文件永久保存且不遺失。" },
            { icon: Lock,      title: "密碼級加密防護",  desc: "所有存入 SRC 的文件均經過 AES-256 加密，並搭配嚴格的 RBAC 權限控管，保障企業機密。" },
            { icon: FileCheck, title: "自動化稽核軌跡",  desc: "與 5T 協議深度整合，任何文件的上傳、調閱與修改皆會留下不可篡改的稽核日誌 (Audit Trail)。" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-bg-base p-8 rounded-[1px] border border-border shadow-inner group/item hover:bg-bg-surface transition-colors">
              <Icon className="w-7 h-7 text-primary mb-6 transition-transform group-hover/item:-translate-y-1" />
              <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest mb-4 italic underline underline-offset-8 decoration-primary/20">{title}</h4>
              <p className="text-[11px] font-bold text-text-muted italic leading-relaxed opacity-60 group-hover/item:opacity-100 transition-opacity">{desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Protocol Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* 24 MECE Matrix Card */}
        <GlassCard
          className="p-10 hover:bg-accent/[0.03] transition-all duration-300 border-l-2 border-accent shadow-flat relative overflow-hidden group cursor-pointer"
          onClick={() => setIsMeceOpen(true)}
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Grid className="w-24 h-24 text-accent" />
          </div>
          <div className="w-16 h-16 rounded-[2px] bg-accent flex items-center justify-center mb-8 shadow-flat relative z-10">
            <Grid className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black text-text-main uppercase tracking-tight italic relative z-10">24 MECE Matrix</h3>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 relative z-10 italic">Service Layer Orchestration</p>
          <p className="text-[11px] font-bold text-text-muted leading-relaxed italic relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
            Seamless integration via OmniAPI to matching FSC 97 indicators and international SASB standards.
          </p>
          <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between relative z-10">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic opacity-40">Link Status</span>
            <span className="text-[9px] font-black text-accent uppercase tracking-widest italic flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> SYNC_ACTIVE
            </span>
          </div>
        </GlassCard>

        {PROTOCOLS.map((p, i) => (
          <GlassCard key={i} className="p-10 hover:bg-bg-surface transition-all duration-300 cursor-default group border border-border shadow-flat relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <p.icon className={cn("w-20 h-20", p.color)} />
             </div>
            <div className={cn("w-16 h-16 rounded-[1px] flex items-center justify-center mb-8 shadow-inner relative z-10", p.bg)}>
              <p.icon className={cn("w-8 h-8", p.color)} />
            </div>
            <h3 className="text-2xl font-black text-text-main uppercase tracking-tighter italic relative z-10">{p.id}</h3>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 relative z-10 italic">{p.name}</p>
            <p className="text-[11px] font-bold text-text-muted leading-relaxed italic relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">{p.desc}</p>
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between relative z-10">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic opacity-40">Status</span>
              <span className={cn("text-[9px] font-black uppercase tracking-widest italic", p.color)}>Verified</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── 5T Philosophy ── */}
      <GlassCard className="p-10 border border-border bg-bg-surface/30 mb-12 shadow-flat">
        <div className="mb-10">
          <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.3em] italic">Core Governance Philosophy: 5T Principles</h2>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">The foundation of Omni Truth orchestration</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {FIVE_T_PILLARS.map((item, i) => (
            <div
              key={i}
              className="bg-bg-base border border-border rounded-[1px] p-8 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 flex flex-col shadow-inner group"
            >
              <h4 className="text-3xl font-black text-primary mb-2 italic tracking-tighter group-hover:scale-110 transition-transform origin-left">{item.char}</h4>
              <p className="text-sm font-black text-text-main mb-4 uppercase italic tracking-widest">{item.eng}</p>
              <p className="text-[10px] font-bold text-text-muted italic leading-relaxed mb-4 flex-1">{item.desc1}</p>
              <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest italic mb-6">{item.desc2}</p>
              {item.link && (
                <button
                  onClick={() => setActiveTab(item.link!)}
                  className="text-[9px] font-black text-primary hover:underline flex items-center gap-2 uppercase tracking-widest italic"
                >
                  {item.linkText} <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── ESG Swarm HUD ── */}
      <GlassCard className="p-12 border border-border bg-bg-surface shadow-flat">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-proxy/10 rounded-[1px] shadow-inner">
                <BrainCircuit className="w-8 h-8 text-proxy" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-text-main uppercase tracking-tight italic">Apostle Array Orbs</h2>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic mt-1">Agent Swarm HUD Orchestration</p>
               </div>
            </div>
            <p className="text-[11px] font-bold text-text-muted leading-relaxed mb-10 italic opacity-80">
              Driven by ADK (Agent Development Kit), this liquid telemetry interface visualizes the core cognitive distribution of the apostle swarm.
              Witness the total brain dispatching concurrent sequences to Perception, Alchemy, and Scribe agents.
              Every operation strictly adheres to the 5T protocol, ensuring a zero-hallucination environment and immutable data lineage.
            </p>
            <div className="flex flex-wrap gap-4">
              {["LANGCHAIN", "ZOD_SCHEMA", "NCBDB_CORE", "5T_PROTOCOL"].map((t) => (
                <Badge key={t} variant="optimal" styleType="soft" className="bg-bg-base border-border text-text-muted font-black text-[9px] uppercase tracking-widest px-3 py-1.5 italic rounded-[1px]">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full max-w-2xl bg-bg-base/50 rounded-[1px] border border-border p-8 shadow-inner">
            <ESGSwarmHUD />
          </div>
        </div>
      </GlassCard>

      {/* ── MECE Matrix Modal ── */}
      <AnimatePresence>
        {isMeceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div
              className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
              onClick={() => setIsMeceOpen(false)}
            />
            <GlassCard
              className="relative w-full max-w-5xl bg-bg-surface/90 backdrop-blur-2xl rounded-[1px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
              
              {/* Modal Header */}
              <div className="p-8 border-b border-border flex items-center justify-between bg-bg-base">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1px] bg-accent/10 flex items-center justify-center shadow-inner">
                    <Grid className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-text-main uppercase tracking-tight italic">24 MECE Matrix Ledger</h2>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1 italic opacity-60">OmniAPI Service Orchestration Matrix</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMeceOpen(false)}
                  className="p-3 hover:bg-bg-surface rounded-[1px] transition-colors text-text-muted hover:text-text-main"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-10 overflow-y-auto custom-scrollbar bg-bg-base/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {MECE_SERVICES.map((service, i) => {
                    const isEnv = i < 8;
                    const isSoc = i >= 8 && i < 16;
                    const color = isEnv ? 'var(--color-primary)' : isSoc ? 'var(--color-accent)' : 'var(--color-status-optimal)';
                    const label = isEnv ? "ENV" : isSoc ? "SOC" : "GOV";
                    
                    return (
                      <div
                        key={i}
                        className="p-6 rounded-[1px] border border-border bg-bg-surface flex flex-col justify-between items-start h-32 hover:border-primary/30 transition-all shadow-flat group"
                      >
                         <div className="flex items-center justify-between w-full mb-4">
                            <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.3em] italic">
                              {label} — {(i % 8) + 1}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                         </div>
                        <span className="text-[11px] font-black text-text-main uppercase italic leading-tight group-hover:text-primary transition-colors">{service}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-border bg-bg-surface flex justify-center">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.5em] italic opacity-40">Omni Operational Excellence Matrix // Mutually Exclusive Collectively Exhaustive</p>
              </div>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
