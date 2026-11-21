"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  FileBarChart, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Globe,
  Activity
} from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "@/lib/context/app-context";

import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";

const RECENT_REPORTS = [
  { id: "REP-2025-Q4", name: "2025 Q4 Sustainability Progress", date: "2026-01-15", status: "Published", scale: "200 Pages", compliance: "98%" },
  { id: "REP-2025-ANNUAL", name: "2025 Annual ESG Comprehensive", date: "2026-02-01", status: "Sealed", scale: "500 Pages", compliance: "100%" },
  { id: "REP-2026-DRAFT", name: "2026 Q1 Preliminary Review", date: "2026-03-10", status: "Draft", scale: "300 Pages", compliance: "85%" },
];

export function OmniSrcView() {
  const { setActiveTab, setIsReportingWizardOpen, aiProxyMode, lang } = useAppContext();

  const handleCreateNew = () => {
    setActiveTab("reports");
    setIsReportingWizardOpen(true);
  };

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能自動生成" : "Omni AI Draft",
    subtitle: "Autonomous Report Intelligence",
    description: lang === "zh" ? "正在執行 AI 自主代理執行。自動聚合全域數據並生成合規報告，確保資產真實性。" : "AI autonomous agent aggregating data and generating compliance reports.",
    accent: "from-proxy/20 to-transparent",
    tag: "AI",
    icon: FileBarChart,
    guideSteps: PAGE_GUIDES["omni-src"]
  } : {
    title: lang === "zh" ? "萬能報告管理" : "Omni Report Tool",
    subtitle: "Digital Asset Management",
    description: lang === "zh" ? "手動管理永續報告，將數據轉化為具備競爭力的數位遺產。" : "Manually managing sustainability reports and digital assets.",
    accent: "from-primary/20 to-transparent",
    tag: "DRC",
    icon: FileBarChart,
    guideSteps: PAGE_GUIDES["omni-src"]
  };

  return (
    <div className="view-container space-y-6">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-3">
             <button 
              onClick={handleCreateNew}
              className={`flex items-center gap-2 px-6 py-3 ${aiProxyMode ? 'bg-proxy text-white shadow-proxy/20' : 'bg-primary text-white shadow-primary/20'} rounded-xl font-bold hover:brightness-110 transition-all hover:scale-105 shadow-elevation-1`}
            >
              <Plus className="w-5 h-5" />
              {aiProxyMode && lang === 'zh' ? '啟動 AI 自動生成' : lang === 'zh' ? '建立新報告' : 'Create Report'}
            </button>
          </div>
        }
      />

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "真理封印報告", value: "12", sub: "已完成 5T 存證", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5" },
          { label: "平均合規率", value: "97.4%", sub: "GRI 2026 基準", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "揭露指標密度", value: "1,240", sub: "跨 24 MECE 維度", icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
          { label: "產業先知對標 PR", value: "92", sub: "Visionary Rank 領跑", icon: Globe, color: "text-accent", bg: "bg-accent/10" }
        ].map((stat, i) => (
          <GlassCard key={i} className="p-6 border-b-4 border-b-transparent hover:border-b-primary/50 transition-all group active:scale-95 card-interactive">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <Badge variant="optimal" styleType="soft" className="opacity-0 group-hover:opacity-100 transition-opacity">
                LIVE
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-main">{stat.value}</h3>
              <p className="text-xs text-text-muted font-medium">{stat.sub}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Management List */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden shadow-elevation-1 border-border">
          <div className="p-6 border-b border-border bg-bg-base/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              資產在庫管理 (Report Assets)
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="搜尋報告..."
                  className="pl-9 pr-4 py-2 bg-bg-surface/80 border border-border rounded-lg text-sm text-text-main focus:ring-2 focus:ring-primary/30 focus:bg-bg-base transition-all w-full sm:w-48 placeholder:text-text-muted/50"
                />
              </div>
              <button className="p-2 hover:bg-bg-base rounded-lg transition-colors border border-border">
                <Filter className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-bg-surface/50 text-text-muted text-[10px] uppercase font-bold tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-4">報告名稱 & 識別碼</th>
                  <th className="px-6 py-4">發布日期</th>
                  <th className="px-6 py-4">規模/頁數</th>
                  <th className="px-6 py-4 text-center">狀態</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_REPORTS.map((report) => (
                  <tr key={report.id} className="hover:bg-bg-base transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main group-hover:text-primary transition-colors">{report.name}</span>
                        <span className="text-xs text-text-muted font-mono">{report.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{report.date}</td>
                    <td className="px-6 py-4 text-sm text-text-main font-bold">{report.scale}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                        report.status === 'Published' ? 'bg-primary/10 text-primary' :
                        report.status === 'Sealed' ? 'bg-blue-500/10 text-blue-600' : 'bg-status-warning/10 text-status-warning'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-row-reverse items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-bg-surface rounded-lg text-text-muted hover:text-text-main transition-colors" title="More">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-bg-surface rounded-lg text-text-muted hover:text-primary transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-bg-surface rounded-lg text-text-muted hover:text-accent transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-bg-surface/50 border-t border-border flex justify-center">
            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              查看所有報告紀錄 <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </GlassCard>

        {/* Right Sidebar Info */}
        <div className="space-y-6">
          <GlassCard className={`p-6 bg-gradient-to-br ${aiProxyMode ? 'from-proxy to-proxy/80' : 'from-primary to-primary/80'} text-white border-none shadow-elevation-1`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              AI 智能洞察 (Insights)
            </h3>
            <p className="text-white/90 text-sm leading-relaxed mb-6">
              基於最新的 GRI 2026 標準與同業 benchmark 數據，系統建議您在下一份報告中加強「範疇三減碳路徑」的敘事密度。目前您的揭露完整度已達到 85%。
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>揭露完整度</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-white h-full"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-border">
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              近期活動 (Activity)
            </h3>
            <div className="space-y-4">
              {[
                { text: "成功產出 2025 年度報告", time: "2 小時前", icon: CheckCircle2, color: "text-primary" },
                { text: "報告 REP-2026-DRAFT 存檔", time: "1 天前", icon: Clock, color: "text-status-warning" },
                { text: "完成 5T 數據完整性檢核", time: "2 天前", icon: ShieldCheck, color: "text-blue-500" }
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{item.text}</p>
                    <p className="text-[10px] text-text-muted font-medium">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
