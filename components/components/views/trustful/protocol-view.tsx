"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Eye, Link, Activity, Code, Lock,
  Grid, X, Database, FileCheck, Server,
  BrainCircuit, Network, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "@/lib/context/app-context";
import { ESGSwarmHUD } from "@/components/ui/esg-swarm-hud";

// ─── Protocol Definitions ─────────────────────────────
const PROTOCOLS = [
  { id: "Tangible",          name: "可感知",          desc: "數據以高保真、多維度的方式呈現",          icon: Eye,         color: "text-primary",        bg: "bg-primary/10" },
  { id: "Traceable",         name: "可溯源",          desc: "每個數據點都有明確的來源記錄",            icon: Link,        color: "text-primary",        bg: "bg-primary/10" },
  { id: "Trackable",         name: "可追蹤",          desc: "數據的整個生命週期都被完整記錄",          icon: Activity,    color: "text-accent",         bg: "bg-accent/10" },
  { id: "Transparent",       name: "可驗算",          desc: "所有計算邏輯與算法完全透明",              icon: Code,        color: "text-accent",         bg: "bg-accent/10" },
  { id: "Trustworthy",       name: "不可篡改",        desc: "採用密碼學方法確保數據無法篡改",          icon: Lock,        color: "text-status-lethal",  bg: "bg-status-lethal/10" },
  { id: "Integrity",         name: "5T 數據完整性",   desc: "自動檢測數據的完整性與一致性",            icon: ShieldCheck, color: "text-proxy",          bg: "bg-proxy/10" },
  { id: "Zero-Hallucination",name: "零幻覺驗證",      desc: "確保 AI 生成內容的真實性與準確性",        icon: BrainCircuit,color: "text-proxy",          bg: "bg-proxy/10" },
  { id: "Multi-Standard",    name: "多標準映射引擎",  desc: "自動將數據映射至多個國際標準",            icon: Network,     color: "text-status-optimal", bg: "bg-status-optimal/10" },
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
  { char: "善", eng: "Thankful",     desc1: "可透明驗算的公正審計",    desc2: "開放計算邏輯供審計" },
  { char: "美", eng: "Tasteful",     desc1: "可感知的卓越藝術",        desc2: "Liquid Glass UI 設計系統" },
  { char: "信", eng: "Trust",        desc1: "不可篡改的信任",          desc2: "SHA-256 數位簽章" },
  { char: "通", eng: "Transferable", desc1: "超越一切的無礙圓通",      desc2: "標準化 API 與數據格式", link: "omni-note", linkText: "進入無作筆記 (WuzuoNote)" },
];

// ─── Component ────────────────────────────────────────
export function ProtocolView() {
  const { setActiveTab } = useAppContext();
  const [isMeceOpen, setIsMeceOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">SRC & 5T Protocol</h1>
          <p className="text-text-muted mt-2">永續數據治理協議與證據金庫 — 確保數據真實性與完整性</p>
        </div>
        <Badge variant="optimal" styleType="soft" className="flex items-center gap-2 px-3 py-2 text-sm">
          <ShieldCheck className="w-5 h-5" /> System Active
        </Badge>
      </div>

      {/* ── SRC Section ── */}
      <GlassCard className="p-8 border-primary/20 bg-gradient-to-br from-bg-surface to-primary/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-main">SRC 證據金庫 (Sustainable Report Center)</h2>
            <p className="text-text-muted font-medium">企業級 ESG 數據與佐證文件安全儲存中心</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Server,    iconColor: "text-primary",       title: "分散式儲存架構",  desc: "採用高可用性分散式儲存，確保 ESG 原始數據、水電單據、碳排佐證文件永久保存且不遺失。" },
            { icon: Lock,      iconColor: "text-accent",        title: "軍規級加密防護",  desc: "所有存入 SRC 的文件均經過 AES-256 加密，並搭配嚴格的 RBAC 權限控管，保障企業機密。" },
            { icon: FileCheck, iconColor: "text-status-optimal",title: "自動化稽核軌跡",  desc: "與 5T 協議深度整合，任何文件的上傳、調閱與修改皆會留下不可篡改的稽核日誌 (Audit Trail)。" },
          ].map(({ icon: Icon, iconColor, title, desc }) => (
            <div key={title} className="bg-bg-base p-6 rounded-xl border border-border shadow-elevation-1">
              <Icon className={`w-6 h-6 ${iconColor} mb-3`} />
              <h4 className="text-lg font-bold text-text-main mb-2">{title}</h4>
              <p className="text-sm text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Protocol Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 24 MECE Matrix Card */}
        <GlassCard
          className="p-8 hover:bg-accent/5 transition-all duration-200 cursor-pointer group border-accent/25 bg-gradient-to-br from-bg-surface to-accent/5 card-interactive"
          onClick={() => setIsMeceOpen(true)}
        >
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:-translate-y-1 transition-transform duration-200">
            <Grid className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-text-main mb-2">24 MECE Matrix</h3>
          <p className="text-lg font-medium text-text-muted mb-4">服務矩陣整合</p>
          <p className="text-text-muted leading-relaxed">
            透過 OmniAPI 無縫對接 24 項 MECE 服務，自動匹配 FSC 97 項指標及 SASB 標準。
          </p>
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <span className="font-medium text-accent flex items-center gap-1">
              <Activity className="w-4 h-4" /> OmniAPI Active
            </span>
          </div>
        </GlassCard>

        {PROTOCOLS.map((p, i) => (
          <GlassCard key={i} className="p-8 hover:bg-primary/5 transition-all duration-200 cursor-default group card-interactive">
            <div className={`w-14 h-14 rounded-xl ${p.bg} flex items-center justify-center mb-6 group-hover:-translate-y-1 transition-transform duration-200`}>
              <p.icon className={`w-7 h-7 ${p.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-text-main mb-2">{p.id}</h3>
            <p className="text-lg font-medium text-text-muted mb-4">{p.name}</p>
            <p className="text-text-muted leading-relaxed">{p.desc}</p>
            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm">
              <span className="text-text-muted">Status</span>
              <span className={`font-medium ${p.color}`}>Verified</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── 5T Philosophy ── */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-text-main mb-6">核心哲學：5T 原則</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {FIVE_T_PILLARS.map((item, i) => (
            <div
              key={i}
              className="bg-bg-base border border-border rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 flex flex-col card-interactive"
            >
              <h4 className="text-2xl font-bold text-primary mb-1">{item.char}</h4>
              <p className="text-lg font-bold text-text-main mb-3">{item.eng}</p>
              <p className="text-sm text-text-muted font-medium mb-2">{item.desc1}</p>
              <p className="text-xs text-text-muted/70">{item.desc2}</p>
              {item.link && (
                <button
                  onClick={() => setActiveTab(item.link!)}
                  className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {item.linkText} <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── ESG Swarm HUD ── */}
      <GlassCard className="p-8 bg-bg-base border-border">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-main mb-4 flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-proxy" />
              神使陣列 (Agent Swarm)
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              透過 ADK (Agent Development Kit) 驅動的液態玻璃動態 HUD。
              展示了「總管大腦」如何分派任務，以及「感知神使」、「煉金神使」與「編纂神使」如何協同運作。
              所有運算皆遵循 5T 協議，確保零幻覺與不可篡改。
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge variant="optimal" styleType="soft" className="bg-proxy/15 text-proxy border-proxy/25">LangChain</Badge>
              <Badge variant="optimal" styleType="soft" className="bg-status-optimal/15 text-status-optimal border-status-optimal/25">Zod Schema</Badge>
              <Badge variant="lethal"  styleType="soft" className="bg-status-lethal/15 text-status-lethal border-status-lethal/25">NCBDB</Badge>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
            <ESGSwarmHUD />
          </div>
        </div>
      </GlassCard>

      {/* ── MECE Matrix Modal ── */}
      <AnimatePresence>
        {isMeceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-base/60 backdrop-blur-sm"
              onClick={() => setIsMeceOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-bg-surface rounded-2xl shadow-elevation-2 overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-bg-base">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Grid className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">24 MECE Matrix</h2>
                    <p className="text-sm text-text-muted">OmniAPI 服務矩陣整合</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMeceOpen(false)}
                  className="p-2 hover:bg-bg-surface rounded-full transition-colors text-text-muted hover:text-text-main"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar bg-bg-base/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MECE_SERVICES.map((service, i) => {
                    const isEnv = i < 8;
                    const isSoc = i >= 8 && i < 16;
                    const colorClass = isEnv
                      ? "border-primary/25 bg-primary/5 text-primary"
                      : isSoc
                        ? "border-accent/25 bg-accent/5 text-accent"
                        : "border-status-optimal/25 bg-status-optimal/5 text-status-optimal";
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border ${colorClass} flex flex-col justify-center items-center text-center h-24 hover:shadow-elevation-1 transition-all bg-bg-surface`}
                      >
                        <span className="text-[10px] font-bold opacity-50 mb-1">
                          {isEnv ? "ENV" : isSoc ? "SOC" : "GOV"} — {(i % 8) + 1}
                        </span>
                        <span className="text-sm font-bold text-text-main">{service}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
