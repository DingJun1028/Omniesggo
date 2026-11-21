"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewHeader } from "@/components/ui/view-header";
import {
  BookOpen,
  Search,
  FileText,
  ChevronRight,
  Download,
  Eye,
  TrendingUp,
  ShieldCheck,
  Scale,
  Lightbulb,
  X,
  Plus,
  ArrowRight,
  Library,
  GraduationCap,
  Globe,
  Award
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "全部資源 (All Resources)" },
  { id: "reports", label: "台灣前 30 大報告 (Taiwan Top 30)" },
  { id: "yearbook", label: "企業年鑑 (Yearbook)" },
  { id: "global", label: "國際頂尖報告 (Global)" },
  { id: "insights", label: "深度洞察 (Insights)" },
  { id: "laws", label: "法規與準則 (Standards)" },
];

const TOP_30_REPORTS = [
  { id: 1, company: "台積電 (TSMC)", years: ["2023", "2022", "2021"], sector: "半導體業", score: "AAA" },
  { id: 2, company: "台達電 (Delta)", years: ["2023", "2022"], sector: "電子零組件", score: "AAA" },
  { id: 3, company: "玉山金控 (E.SUN)", years: ["2023", "2022"], sector: "金融保險業", score: "AA" },
];

const GLOBAL_REPORTS = [
  { id: 1, company: "Apple (美國)", year: "2023", sector: "科技硬體", score: "AAA" },
  { id: 2, company: "Microsoft (美國)", year: "2023", sector: "軟體服務", score: "AAA" },
  { id: 3, company: "Unilever (歐盟/英國)", year: "2023", sector: "民生消費", score: "AAA" },
];

const YEARBOOKS = ["2023", "2022", "2021", "2020"];

export function OmniThinkTankView() {
  const { aiProxyMode, lang } = useAppContext();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能知識戰略室 (ThinkTank)" : "Omni ThinkTank",
    subtitle: "Knowledge Intelligence Hub",
    description: lang === "zh" 
      ? "全域代理檢索。系統正實時索引全球 ESG 法規與競爭者戰略，為您提取核心洞察。" 
      : "Global proxy retrieval. System is indexing global ESG regulations and competitor strategies.",
    accent: "from-primary/20 to-transparent",
    tag: "THINKTANK_PROXY",
    icon: GraduationCap
  } : {
    title: lang === "zh" ? "永續智庫中心" : "ESG Knowledge Hub",
    subtitle: "Omni Research Center",
    description: lang === "zh" 
      ? "手動知識研研。集結頂尖永續報告與法規準則，手動查詢與研讀所需資源。" 
      : "Manual knowledge study. Aggregating top sustainability reports and regulations.",
    accent: "from-blue-500/20 to-transparent",
    tag: "THINKTANK_MANUAL",
    icon: Library
  };

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={lang === "zh" ? "檢索智庫資源..." : "Search resources..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface/50 border border-border rounded-[2px] pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary transition-all font-bold italic uppercase tracking-widest selection:bg-primary/20"
            />
          </div>
        }
      />

      {/* Category Pills - Standardized */}
      <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-2 rounded-[2px] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border italic",
              activeCategory === cat.id
                ? "bg-text-main text-bg-base border-text-main shadow-flat"
                : "bg-bg-surface/50 border-border/50 text-text-muted hover:border-text-main/30 hover:text-text-main"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Feed - 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Featured Entry */}
          <GlassCard className="p-10 border border-border bg-bg-surface/50 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
             
             <div className="flex items-center gap-4 mb-6">
                <Badge variant="optimal" styleType="soft" className="text-[9px] font-black px-3">FEATURED_INSIGHT</Badge>
                <span className="text-[10px] font-mono text-text-muted opacity-60 italic">Updated: 2h ago</span>
             </div>

             <h2 className="text-3xl font-black text-text-main italic tracking-tighter leading-tight mb-4 group-hover:text-primary transition-colors">
                {lang === "zh" ? "2026 永續揭露大趨勢：從合規走向價值創造" : "2026 ESG Trends: From Compliance to Value"}
             </h2>
             <p className="text-sm text-text-muted leading-relaxed font-medium italic opacity-80 mb-8 max-w-2xl">
                {lang === "zh" 
                  ? "深入剖析 IFRS S1/S2 與 CSRD 在亞洲供應鏈的連鎖反應。我們揭示了前 30 大標竿企業如何透過數據自動化將揭露壓力轉化為市場優勢。" 
                  : "Deep dive into IFRS S1/S2 and CSRD ripple effects in Asian supply chains."}
             </p>

             <div className="flex items-center justify-between pt-8 border-t border-border/10">
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-text-muted uppercase font-black italic tracking-widest">Reading Time</span>
                      <span className="text-xs font-black text-text-main italic">12 MIN</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] text-text-muted uppercase font-black italic tracking-widest">Authority Level</span>
                      <span className="text-xs font-black text-status-optimal italic">L1_SEALED</span>
                   </div>
                </div>
                <Button variant="solid" className="h-10 px-8 text-[10px] font-black uppercase tracking-widest italic">
                  Launch Deep Study <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
             </div>
          </GlassCard>

          {/* Report Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOP_30_REPORTS.map((report) => (
              <GlassCard key={report.id} className="p-8 border border-border bg-bg-surface/30 hover:bg-bg-surface/50 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-[2px] bg-bg-base border border-border flex items-center justify-center">
                    <Globe className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                  <Badge variant="optimal" styleType="soft" className="text-[9px] border-primary/20 text-primary font-black">
                    MSCI {report.score}
                  </Badge>
                </div>
                <h3 className="text-xl font-black text-text-main italic tracking-tight mb-1">{report.company}</h3>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest italic mb-6">{report.sector}</p>
                
                <div className="space-y-3">
                  {report.years.map(year => (
                    <div key={year} className="flex items-center justify-between p-3 bg-bg-base/40 border border-border/40 hover:border-primary/30 transition-all cursor-pointer">
                      <span className="text-xs font-black italic">{year} ANNUAL_REPORT</span>
                      <Download className="w-3.5 h-3.5 text-text-muted hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Access List */}
          <GlassCard className="p-8 border border-border bg-bg-base shadow-flat">
             <h4 className="text-xs font-black text-text-main uppercase tracking-[0.2em] italic mb-6 border-l-2 border-primary pl-4">
                Core Protocols & Standards
             </h4>
             <div className="space-y-4">
                {[
                  { name: "GRI Standards 2021", tag: "GLOBAL", icon: ShieldCheck },
                  { name: "SASB Industry Map", tag: "FINANCIAL", icon: Scale },
                  { name: "TCFD Framework", tag: "CLIMATE", icon: TrendingUp },
                  { name: "CSRD / ESRS Guide", tag: "EU_REG", icon: BookOpen }
                ].map((std) => (
                  <div key={std.name} className="flex items-center gap-4 p-4 hover:bg-bg-surface transition-colors cursor-pointer group border border-transparent hover:border-border">
                    <std.icon className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                    <div className="flex-1">
                      <h5 className="text-xs font-black text-text-main italic tracking-tight">{std.name}</h5>
                      <span className="text-[8px] text-text-muted font-black tracking-widest">{std.tag}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                ))}
             </div>
          </GlassCard>

          {/* Impact Stats */}
          <GlassCard className="p-8 border border-border bg-bg-surface shadow-flat">
             <div className="space-y-6">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] italic mb-1">Total Indexed Reports</span>
                   <span className="text-4xl font-black text-text-main italic tracking-tighter">8,420+</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] italic mb-1">Law Accuracy Index</span>
                   <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-status-optimal italic tracking-tighter">99.9%</span>
                      <span className="text-[10px] font-black text-status-optimal mb-1">SYNC</span>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4">
                <div className="p-4 bg-primary/5 border border-primary/10 flex items-center gap-3">
                   <Award className="w-5 h-5 text-primary" />
                   <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">JunAiKey Elite Access</p>
                      <p className="text-[10px] text-text-main font-bold">Premium study mode active</p>
                   </div>
                </div>
             </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
