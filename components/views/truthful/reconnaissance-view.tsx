"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ShieldAlert,
  BookOpen,
  Landmark,
  Cpu,
  Search,
  Eye,
  FileCheck,
  PlusCircle,
  Zap,
  Activity,
  History,
  Lock,
  Link as LinkIcon,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/app-context";
import { useTaskSystem } from "@/lib/hooks/useTaskSystem";
import { ViewHeader } from "@/components/ui/view-header";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";

// --- 5T Protocol Core Types ---
interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

export interface IIntelNode5T extends IComponentCore {
  category: "S1" | "S2" | "S3" | "S4" | "S5";
  impact_level: 1 | 2 | 3 | 4 | 5;
  protocol_5T: {
      tangible: boolean;
      traceable: string;
      trackable: string[];
      transparent: string;
      trustworthy: string;
    };
    principles_5T: {
      truthful: string;
      thankful: string;
      tasteful: boolean;
      trustful: string;
      transferful: string;
    };
  payload: {
    title: string;
    decision_ready_insight: string;
    target_entities: string[];
  };
}

// Mock Data Generation
const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
};

const MOCK_INTEL_DATA: IIntelNode5T[] = [
  {
    uuid: `INTEL-S1-${Date.now() - 100000}`,
    version: "2.0.0",
    timestamp: Date.now() - 100000,
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: [{ source: "UNFCCC", type: "Resolution Draft" }] },
    category: "S1",
    impact_level: 5,
    protocol_5T: {
        tangible: true,
        traceable: "https://unfccc.int/cop30-resolutions",
        trackable: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"],
        transparent: "SROI_Impact_Model_v2 [ISO-14064-1]",
        trustworthy: generateHash("UNFCCC COP30 Resolution on Carbon Pricing"),
      },
      principles_5T: {
        truthful: "https://unfccc.int/cop30/carbon-pricing-initiative",
        thankful: "[ISO-14068-1] Carbon Pricing Analysis Module",
        tasteful: true,
        trustful: generateHash("UNFCCC COP30 Resolution on Carbon Pricing"),
        transferful: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"].join(","),
      },
    payload: {
      title: "UNFCCC COP30 全球碳定價決議草案",
      decision_ready_insight:
        "聯合國氣候大會最新草案顯示，全球統一碳定價底線可能於 2028 年生效。建議立即啟動內部碳定價 (ICP) 機制壓力測試，評估對歐洲與北美出口業務的利潤衝擊。",
      target_entities: ["Supply Chain", "Finance", "Export Division"],
    },
  },
  {
    uuid: `INTEL-S2-${Date.now() - 200000}`,
    version: "2.0.0",
    timestamp: Date.now() - 200000,
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: [{ source: "ISSB", type: "Guideline Update" }] },
    category: "S2",
    impact_level: 4,
    protocol_5T: {
        tangible: true,
        traceable: "https://www.ifrs.org/issb-updates",
        trackable: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"],
        transparent: "Disclosure_Gap_Analysis [IFRS-S2]",
        trustworthy: generateHash("ISSB Scope 3 Disclosure Requirements Update"),
      },
      principles_5T: {
        truthful: "https://www.ifrs.org/projects/work-plan/climate-related-disclosures/",
        thankful: "[GHG Protocol] Scope 3 Accounting Standard",
        tasteful: true,
        trustful: generateHash("ISSB Scope 3 Disclosure Requirements Update"),
        transferful: ["CREATED_AT_GATEWAY", "MAPPED_TO_COMPLIANCE"].join(","),
      },
    payload: {
      title: "ISSB 發布範疇三溫室氣體盤查新指引",
      decision_ready_insight:
        "ISSB 針對供應鏈排放數據品質提出更嚴格的查證要求。建議本季內將一階供應商 (Tier 1) 的碳排數據收集頻率從年度改為季度，並導入 API 自動化對接。",
      target_entities: ["Procurement", "Sustainability Team"],
    },
  },
  {
    uuid: `INTEL-S4-${Date.now() - 300000}`,
    version: "2.0.0",
    timestamp: Date.now() - 300000,
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: [{ source: "NGFS", type: "Scenario Analysis" }] },
    category: "S4",
    impact_level: 5,
    protocol_5T: {
        tangible: true,
        traceable: "https://www.ngfs.net/climate-scenarios",
        trackable: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"],
        transparent: "Climate_Value_at_Risk [TCFD]",
        trustworthy: generateHash("NGFS Climate Scenarios Update for Banks"),
      },
      principles_5T: {
        truthful: "https://www.ngfs.net/en/scenarios-climate-risk",
        thankful: "[TCFD] Scenario Analysis Framework v2.0",
        tasteful: true,
        trustful: generateHash("NGFS Climate Scenarios Update for Banks"),
        transferful: ["CREATED_AT_GATEWAY", "MAPPED_TO_FINANCE"].join(","),
      },
    payload: {
      title: "NGFS 更新氣候情境：銀行業將提高高碳排企業融資利率",
      decision_ready_insight:
        "主要往來銀行預計於下半年度採用 NGFS 新版氣候情境。若未能提出具體的淨零轉型路徑 (SBTi)，預估融資成本將增加 0.25% - 0.5%。建議提早與銀行團進行永續績效連結貸款 (SLL) 展延談判。",
      target_entities: ["CFO Office", "Treasury"],
    },
  },
  {
    uuid: `INTEL-S5-${Date.now() - 400000}`,
    version: "2.0.0",
    timestamp: Date.now() - 400000,
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', doc: [{ source: "SEMI", type: "Industry Standard" }] },
    category: "S5",
    impact_level: 3,
    protocol_5T: {
        tangible: true,
        traceable: "https://www.semi.org/sustainability",
        trackable: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"],
        transparent: "Tech_Adoption_ROI [SEMI-S23]",
        trustworthy: generateHash("SEMI Green Manufacturing Guidelines"),
      },
      principles_5T: {
        truthful: "https://www.semi.org/en/sustainability/green-manufacturing",
        thankful: "[SEMI S23] Energy Conservation Guideline",
        tasteful: true,
        trustful: generateHash("SEMI Green Manufacturing Guidelines"),
        transferful: ["CREATED_AT_GATEWAY", "MAPPED_TO_OPERATIONS"].join(","),
      },
    payload: {
      title: "半導體產業鏈綠色製造新標準 (SEMI S23) 擴大適用",
      decision_ready_insight:
        "針對廠務設施的節能標準已更新。建議廠務部門評估導入 AI 冰水主機最佳化系統，預計可降低 12% 廠務能耗，回收期約 1.5 年。 (Energy efficiency standards for plant facilities have been updated.)",
      target_entities: ["廠務管理 (Facility Management)", "營運部門 (Operations)"],
    },
  },
];

const CATEGORY_MAP = {
  S1: { label: "全球治理 (Global Governance)",   icon: Globe,       color: "text-primary",        bg: "bg-primary/10",        border: "border-primary/20" },
  S2: { label: "揭露框架 (Standards & Disclosure)",   icon: BookOpen,    color: "text-status-optimal", bg: "bg-status-optimal/10", border: "border-status-optimal/20" },
  S3: { label: "全球智庫 (Think Tanks & Research)",   icon: ShieldAlert, color: "text-accent",         bg: "bg-accent/10",         border: "border-accent/20" },
  S4: { label: "資本金融 (Finance & Capital)",   icon: Landmark,    color: "text-accent",         bg: "bg-accent/10",         border: "border-accent/20" },
  S5: { label: "產業技術 (Sector & Tech)",   icon: Cpu,         color: "text-status-lethal",  bg: "bg-status-lethal/10",  border: "border-status-lethal/20" },
};

// --- Liquid Glass UI Component ---
const IntelCard5T = ({ intel, lang }: { intel: IIntelNode5T; lang: string }) => {
  const catInfo = CATEGORY_MAP[intel.category];
  const Icon = catInfo.icon;

  return (
    <GlassCard className="relative p-6 overflow-hidden group hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 card-interactive">
      {/* Scanning Overlay Animation */}
      <motion.div 
        initial={{ top: "-100%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none z-0"
      />
      {/* Top: Taxonomy & 5T Status */}
      <div className="flex justify-between items-center mb-5 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-[2px] ${catInfo.bg}`}>
            <Icon className={`w-4 h-4 ${catInfo.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${catInfo.color}`}>
                {intel.category} {catInfo.label}
              </span>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-bg-surface text-[9px] text-text-main font-black border border-border italic">
                IMPACT: L{intel.impact_level}
              </span>
            </div>
            <span className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] italic opacity-50">Decision-Ready Content</span>
          </div>
        </div>

        {/* 4可 1不可 Status Indicators (Flat, No Glow) */}
        <div className="flex items-center gap-3 bg-bg-base px-3 py-1.5 rounded-[2px] border border-border shadow-flat">
            <div className="flex gap-1.5 border-r border-border/60 pr-3">
              <span className="text-[8px] font-black text-text-muted mr-1 uppercase tracking-widest">Protocol</span>
              <div className="w-3 h-3 rounded-[1px] bg-[var(--color-primary)]" title="可感知 (Tangible)" />
              <div className="w-3 h-3 rounded-[1px] bg-[var(--color-primary)]" title="可溯源 (Traceable)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-optimal" title="可追蹤 (Trackable)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-warning" title="可透明 (Transparent)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-lethal" title="不可篡改 (Trustworthy LOCKED)" />
            </div>
            <div className="flex gap-1.5">
              <span className="text-[8px] font-black text-text-muted mr-1 uppercase tracking-widest">Principles</span>
              <div className="w-3 h-3 rounded-[1px] bg-[var(--color-primary)]" title="真誠 (Truthful)" />
              <div className="w-3 h-3 rounded-[1px] bg-[var(--color-primary)]" title="善向 (Thankful)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-optimal" title="品味 (Tasteful)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-warning" title="信任 (Trustful)" />
              <div className="w-3 h-3 rounded-[1px] bg-status-lethal" title="超越 (Transcend)" />
            </div>
          </div>
      </div>

      {/* Core Intelligence */}
      <div className="mb-6 relative z-10">
        <h3 className="text-h3 font-bold text-text-main mb-3 leading-snug">
          {intel.payload.title}
        </h3>
        <p className="text-body text-text-muted leading-relaxed border-l-2 border-accent pl-4 py-1 bg-bg-base/30">
          {intel.payload.decision_ready_insight}
        </p>
      </div>

      {/* Target Entities */}
      <div className="flex flex-wrap gap-2 mb-6">
        {intel.payload.target_entities.map((entity, idx) => (
          <span key={idx} className="text-[10px] px-2 py-1 rounded-md bg-bg-base text-text-muted border border-border flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {entity}
          </span>
        ))}
      </div>

      {/* Bottom: 5T Proofs */}
      <div className="flex justify-between items-end mt-4 pt-4 border-t border-border relative z-10">
        <div className="text-[10px] text-text-muted font-mono space-y-1.5">
            <div 
              className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
              onClick={() => toast.info(lang === 'zh' ? `正在追溯源頭: ${intel.uuid}` : `Tracing source for: ${intel.uuid}`)}
            >
              <LinkIcon className="w-3 h-3" />
              <span className="truncate max-w-[200px]">溯源 (TRACE): {intel.protocol_5T.traceable}</span>
            </div>
            <div 
              className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
              onClick={() => toast.info(lang === 'zh' ? `正在驗證演算透明度: ${intel.protocol_5T.transparent}` : `Verifying calculation transparency: ${intel.protocol_5T.transparent}`)}
            >
                <FileCheck className="w-3 h-3 text-status-warning" />
                <span>算力存證 (CALC): {intel.protocol_5T.transparent}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex flex-col items-end gap-1.5">
               <div className="flex items-center gap-1 text-[10px] text-status-lethal font-mono bg-status-lethal/10 px-2 py-1 rounded border border-status-lethal/20">
                 <Lock className="w-3 h-3" />
                 <span>HASH: {intel.protocol_5T.trustworthy.substring(0, 12)}...</span>
               </div>
               <div className="flex items-center gap-1 text-[9px] text-text-muted font-bold bg-bg-base px-2 py-0.5 rounded border border-border">
                 <span>真善美信通 ALIGNED</span>
               </div>
            </div>
          </div>
        </div>
    </GlassCard>
  );
};

export function ReconnaissanceView() {
  const { lang, goodnessCoins, setGoodnessCoins, aiProxyMode } = useAppContext();
  const { addTask } = useTaskSystem();
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [intelText, setIntelText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [intelCategory, setIntelCategory] = useState("S1");

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能全域監測" : "Omni Monitoring",
      subtitle: "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：AI 自主監測系統。自動掃描全球開源情報與法規偏移。" : "Autonomous AI agent monitoring. Scanning OSINT and compliance offsets.",
      accent: "from-[#8B5CF6] to-[#7C3AED]",
      tag: "[自動]",
      icon: Zap,
      cta: lang === "zh" ? "注入外部協議" : "Inject Protocol"
  } : {
      title: lang === "zh" ? "萬能監測" : "Omni Monitor",
      subtitle: "Omni Manual Control",
      description: lang === "zh" ? "萬能監測：手動偵測全球永續變化，建立企業決策護城河。" : "Manually monitoring global sustainability changes.",
      accent: "from-[#009E9D] to-[#00C2A8]",
      tag: "[手動]",
      icon: Eye,
      cta: lang === "zh" ? "提交關鍵情資" : "Submit Intel"
  };

  const filteredData = activeFilter === "ALL" 
    ? MOCK_INTEL_DATA 
    : MOCK_INTEL_DATA.filter(d => d.category === activeFilter);

  const handleSubmitIntel = () => {
    if (!intelText.trim()) return;
    
    // 1. Create a task in the system
    addTask({
      title: `驗證情資: ${intelText.substring(0, 20)}...`,
      description: `來源: ${sourceUrl}\n洞察: ${intelText}`,
      priority: "HIGH",
      contextId: `INTEL-${intelCategory}`,
      tags: ["RECON", intelCategory],
      aiSuggested: aiProxyMode
    });

    // 2. Simulate ITK reward
    setGoodnessCoins(prev => prev + (typeof setGoodnessCoins === 'function' ? 50 : 0));
    setShowSubmitModal(false);
    setIntelText("");
    setSourceUrl("");
    
    toast.success(lang === "zh" ? "情報已提交！已同步至任務系統，並獲得 50 ITK 獎勵。" : "Intel Submitted! Synced to Task System and gained 50 ITK rewards.");
  };

  return (
    <div className="view-container space-y-8">
      {/* Header Section */}
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="optimal" styleType="soft" className="h-8 px-4">
                <Activity className={`w-4 h-4 ${aiProxyMode ? 'text-proxy' : 'text-primary'} mr-2`} />
                監測中: 30+ 國際源頭機構
              </Badge>
              <Badge variant="lethal" styleType="soft" className="h-8 px-4">
                <Lock className={`w-4 h-4 ${aiProxyMode ? 'text-proxy' : 'text-status-lethal'} mr-2`} />
                5T 協議: 嚴格鎖定
              </Badge>
            </div>
            <Button 
              onClick={() => setShowSubmitModal(true)}
              className={`px-6 py-6 bg-gradient-to-r ${branding.accent} border-none shadow-lg hover:scale-105 transition-all text-white h-auto`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-bold leading-none">{branding.cta}</div>
                  <div className="text-[10px] opacity-80 font-mono mt-1">ITK 善值 (POINTS) +50</div>
                </div>
              </div>
            </Button>
          </div>
        }
      />

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto hide-scrollbar">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-2 rounded-[2px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-75 ${
              activeFilter === "ALL"
                ? "bg-[var(--color-primary)] text-white shadow-flat"
                : "text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10"
            }`}
          >
            ALL
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-[2px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-75 flex items-center gap-2 ${
                activeFilter === key
                  ? "bg-[var(--color-primary)] text-white shadow-flat"
                  : "text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10"
              }`}
            >
              <span>{key}</span>
              <span className="hidden sm:inline italic opacity-80">{info.label.split(' (')[0]}</span>
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="搜尋 Hash 或關鍵字..."
            className="w-full bg-bg-base/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-primary/40 transition-colors placeholder:text-text-muted/50"
          />
        </div>
      </div>

      {/* Intel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredData.map((intel) => (
            <motion.div
              key={intel.uuid}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <IntelCard5T intel={intel} lang={lang} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit Intel Modal (Talent Passport Linkage) */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/70 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-elevation-2 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    情報貢獻 (Talent Passport Contrib)
                  </h3>
                  <p className="text-xs text-text-muted mt-1 font-normal">
                    提交具備決策價值的 S1-S5 情報，通過 5T 驗證後可獲取 ITK 善元積分。 (Submit decision-ready intel to earn ITK points.)
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 hover:bg-bg-base rounded-lg text-text-muted/50 hover:text-text-main transition-colors duration-150"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">情報來源 URL (Traceable)</label>
                  <input 
                    type="url" 
                    placeholder="https://" 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full bg-bg-base border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:border-primary/40 transition-colors placeholder:text-text-muted/50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">情報分類 (Taxonomy)</label>
                  <select 
                    value={intelCategory}
                    onChange={(e) => setIntelCategory(e.target.value)}
                    className="w-full bg-bg-base border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:border-primary/40 transition-colors"
                  >
                    <option value="S1">S1 全球治理 (Global Governance)</option>
                    <option value="S2">S2 揭露框架 (Standards & Disclosure)</option>
                    <option value="S3">S3 全球智庫 (Think Tanks & Research)</option>
                    <option value="S4">S4 資本金融 (Finance & Capital)</option>
                    <option value="S5">S5 產業技術 (Sector & Tech)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">決策洞察 (Decision-Ready Insight)</label>
                  <textarea
                    value={intelText}
                    onChange={(e) => setIntelText(e.target.value)}
                    placeholder="請描述此情報對企業的具體影響與行動建議..."
                    rows={4}
                    className="w-full bg-bg-base border border-border rounded-lg px-4 py-2.5 text-text-main focus:outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-text-muted/50"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-primary border border-primary/30 hover:bg-primary/10 transition-colors duration-150"
                >
                  取消 (Cancel)
                </button>
                <button
                  onClick={handleSubmitIntel}
                  disabled={!intelText.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all duration-150 flex items-center gap-2 border-0 shadow-elevation-1"
                >
                  <Lock className="w-4 h-4" />
                  寫入 5T 協議門 (Seal into 5T)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
