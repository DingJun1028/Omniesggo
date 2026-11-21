"use client";

import { useState } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/lib/context/app-context";
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
  Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ViewHeader } from "@/components/ui/view-header";

const CATEGORIES = [
  { id: "all", label: "全部資源" },
  { id: "current", label: "當前永續報告全貌" },
  { id: "reports", label: "台灣前30大永續報告書" },
  { id: "yearbook", label: "台灣永續企業年鑑" },
  { id: "global", label: "國際頂尖報告 (美/歐)" },
  { id: "insights", label: "綜合比較與洞悉" },
  { id: "laws", label: "法規與準則" },
  { id: "cases", label: "企業真實案例" },
  { id: "copywriting", label: "好文案範例" },
];

const TOP_30_REPORTS = [
  { id: 1, company: "台積電 (TSMC)", years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"], sector: "半導體業", score: "AAA" },
  { id: 2, company: "台達電 (Delta)", years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"], sector: "電子零組件", score: "AAA" },
  { id: 3, company: "玉山金控 (E.SUN)", years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"], sector: "金融保險業", score: "AA" },
  { id: 4, company: "中華電信 (CHT)", years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"], sector: "通信網路業", score: "AA" },
  { id: 5, company: "鴻海精密 (Foxconn)", years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"], sector: "其他電子業", score: "A" },
];

const GLOBAL_REPORTS = [
  { id: 1, company: "Apple (美國)", year: "2023", sector: "科技硬體", score: "AAA" },
  { id: 2, company: "Microsoft (美國)", year: "2023", sector: "軟體服務", score: "AAA" },
  { id: 3, company: "Unilever (歐盟/英國)", year: "2023", sector: "民生消費", score: "AAA" },
  { id: 4, company: "Schneider Electric (歐盟/法國)", year: "2023", sector: "工業設備", score: "AAA" },
  { id: 5, company: "Patagonia (美國)", year: "2023", sector: "服飾零售", score: "AA" },
];

const YEARBOOKS = ["2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014"];

export function LibraryView() {
  const { aiProxyMode, lang, setGoodnessCoins } = useAppContext();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  
  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能知識百科" : "Omni Knowledge",
      subtitle: "Omni AI Agent",
      description: lang === "zh"
        ? "萬能代理：AI 自動索引全球 ESG 法規與競爭對手動態，提供智能建議。"
        : "AI agent auto-indexing global ESG regulations and competitor dynamics.",
      accent: "from-[#8B5CF6] to-[#7C3AED]",
      tag: "[自動]",
      icon: TrendingUp
    } : {
      title: lang === "zh" ? "萬能知識殿堂" : "Omni ESG Library",
      subtitle: "Omni Manual Control",
      description: lang === "zh" 
        ? "萬能核實：集結頂尖永續報告與法規準則，手動查詢與研讀所需資源。"
        : "Aggregating top sustainability reports and regulations for manual study.",
      accent: "from-[#009E9D] to-[#219EBC]",
      tag: "[手動]",
      icon: BookOpen
    };
  const [showReward, setShowReward] = useState(false);
  const [readProgress, setReadProgress] = useState<Record<string, number>>({});

  const handleReadArticle = (articleId: string) => {
    setSelectedArticle(articleId);
    setReadProgress((prev) => ({ ...prev, [articleId]: Math.max(prev[articleId] || 0, 10) }));
    // Simulate rewarding coins after a short delay
    setTimeout(() => {
      setGoodnessCoins((prev) => prev + 10);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }, 1500);
  };

  const handleArticleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!selectedArticle) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = Math.min(100, Math.max(10, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)));
    
    setReadProgress((prev) => {
      const current = prev[selectedArticle] || 0;
      if (progress > current) {
        return { ...prev, [selectedArticle]: progress };
      }
      return prev;
    });
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const response = await fetch('/api/library/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content: `This is the full content of ${title}. In a real application, this would be the actual article text.`,
          articleId: id 
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('無法下載報告，請稍後再試。');
    }
  };

  const handlePreview = async (id: string, title: string) => {
    try {
      const response = await fetch('/api/library/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content: `Preview of ${title}. This content is generated and stored in Google Drive via NCBDB.`,
          articleId: id 
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      alert('無法預覽報告，請稍後再試。');
    }
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋報告、法規或案例..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#009E9D] focus:ring-4 focus:ring-[#009E9D]/10 transition-all shadow-sm"
              />
            </div>
            {Object.keys(readProgress).length > 0 && (
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[#009E9D]/20 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">知識庫研讀進度</span>
                  <span className="text-sm font-bold text-[#009E9D]">
                    {Math.round(Object.values(readProgress).reduce((a, b) => a + b, 0) / 100)} 個知識點已掌握
                  </span>
                </div>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#009E9D]" 
                    style={{ width: `${Math.min(100, (Object.keys(readProgress).length / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        }
      />

      {/* Category Navigation */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-[20px] text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-[#009E9D] text-white"
                : "bg-white border border-[#E5E7EB] text-[#666666] hover:bg-[#F8F9FA]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current ESG Report Overview (Only show when 'all' or 'current' is selected) */}
          {(activeCategory === "all" || activeCategory === "current") && (
            <GlassCard className="p-5 sm:p-8 border-l-4 border-l-[#219EBC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                <h3 className="text-xl font-bold text-[#333333] flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#219EBC]" />
                  當前永續報告全貌
                </h3>
                <Badge variant="optimal" styleType="soft">
                  2026 年度
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">完成進度</p>
                  <p className="text-2xl font-bold text-[#009E9D]">68%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">已收集單據 (共45種)</p>
                  <p className="text-2xl font-bold text-[#219EBC]">12 / 45</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">AI 審計狀態</p>
                  <p className="text-lg font-bold text-[#FFB703] mt-1">
                    進行中
                  </p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                您的 2026 年度永續報告書目前正處於「編撰與單據收集」階段。Gnosis
                Engine 已成功與 NCBDB (用戶成長資料庫) 連線，此資料庫於您登入時即初始化，專門紀錄您的使用者習慣與成長軌跡；其他共享資料庫則同步紀錄目前的資料庫資源。建議您優先完成「利害關係人議合」章節。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="w-full sm:w-auto px-4 py-2 bg-[#219EBC] text-white rounded-xl text-sm font-medium hover:bg-[#1A829C] transition-colors">
                  繼續撰寫
                </button>
                <button className="w-full sm:w-auto px-4 py-2 bg-[#009E9D] text-white rounded-xl text-sm font-medium hover:bg-[#008282] transition-colors">
                  新增單據 (原始資料)
                </button>
                <button className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                  預覽草稿
                </button>
              </div>
            </GlassCard>
          )}

          {/* Featured Article: What is ESG Report */}
          {(activeCategory === "all" || activeCategory === "cases") && (
            <GlassCard
              className="p-5 sm:p-8 md:p-10 border-l-4 border-l-[#009E9D] cursor-pointer hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              onClick={() => handleReadArticle("what-is-esg")}
            >
              {/* Reward Animation Overlay */}
              <AnimatePresence>
                {showReward && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 right-4 bg-amber-100 border border-amber-200 text-amber-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10"
                  >
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-bold">+10 善向幣</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Badge className="bg-[#009E9D]/10 text-[#009E9D] hover:bg-[#009E9D]/20 border-none px-3 py-1 text-sm">
                  基礎知識
                </Badge>
                <span className="text-sm text-slate-500 font-medium">
                  5 分鐘閱讀
                </span>
              </div>
              
              {/* Optimized Image with Lazy Loading and Blur Placeholder */}
              <div className="relative w-full h-48 md:h-64 mb-6 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <Image
                  src="https://picsum.photos/seed/esg/800/400"
                  alt="ESG Report Illustration"
                  fill
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 group-hover:text-[#009E9D] transition-colors font-serif leading-snug relative z-10">
                ESG 報告書是什麼？企業與利害關係人溝通的橋樑
              </h2>
              <p className="text-slate-600 line-clamp-3 leading-relaxed text-lg">
                ESG報告書又稱為永續報告書、ESG永續報告書，用於記錄企業在ESG的績效表現，包含環境保護、社會責任、公司治理3大面向，讓利害關係人（如員工、股東、消費者）能夠瞭解企業在永續發展上投入的心力與成果...
              </p>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-[#009E9D] text-base font-semibold">
                  閱讀全文 <ChevronRight className="w-5 h-5 ml-1" />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="p-2 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("what-is-esg", "ESG 報告書是什麼？企業與利害關係人溝通的橋樑");
                    }}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {readProgress["what-is-esg"] !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        閱讀進度: {readProgress["what-is-esg"]}%
                      </span>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#009E9D] transition-all duration-300"
                          style={{ width: `${readProgress["what-is-esg"]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Top 30 Reports List */}
          {(activeCategory === "all" || activeCategory === "reports") && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#219EBC]" />
                  台灣前 30 大企業永續報告書 (近10年)
                </h3>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#009E9D] focus:border-[#009E9D] block p-2">
                  {YEARBOOKS.map(year => (
                    <option key={year} value={year}>{year} 年度</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                {TOP_30_REPORTS.map((report, i) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[8px] border border-[#E5E7EB] hover:border-[#219EBC] hover:bg-[#F8F9FA] transition-all group cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F1F3F5] text-[#666666] flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] group-hover:text-[#219EBC] transition-colors">
                          {report.company}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
                          <span>{report.sector}</span>
                          <span>•</span>
                          <span>收錄 {report.years.length} 年完整報告</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                      <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-none">
                        MSCI {report.score}
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          className="p-2 text-[#999999] hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors flex items-center gap-1"
                          title="預覽完整內容"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(report.company, report.company);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs hidden md:inline">預覽</span>
                        </button>
                        <button
                          className="p-2 text-[#999999] hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors flex items-center gap-1"
                          title="下載完整檔案"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(report.company, report.company);
                          }}
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-xs hidden md:inline">下載</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {activeCategory === "reports" && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-[#009E9D] hover:underline font-medium">
                    載入更多企業...
                  </button>
                </div>
              )}
            </GlassCard>
          )}

          {/* Taiwan Yearbook */}
          {(activeCategory === "all" || activeCategory === "yearbook") && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                  台灣永續企業年鑑 (近10年)
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {YEARBOOKS.map((year) => (
                  <div key={year} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer transition-all group relative">
                    <FileText className="w-8 h-8 text-slate-400 group-hover:text-[#D4AF37] mb-2 transition-colors" />
                    <span className="font-bold text-slate-700">{year}</span>
                    <span className="text-xs text-slate-500 mt-1">完整年鑑</span>
                    <button
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="下載 PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(`yearbook-${year}`, `${year} 台灣永續企業年鑑`);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Global Top 10 */}
          {(activeCategory === "all" || activeCategory === "global") && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#009E9D]" />
                  國際前10大永續報告 (美國與歐盟)
                </h3>
              </div>
              <div className="space-y-3">
                {GLOBAL_REPORTS.map((report, i) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[8px] border border-[#E5E7EB] hover:border-[#009E9D] hover:bg-[#F8F9FA] transition-all group cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F1F3F5] text-[#666666] flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] group-hover:text-[#009E9D] transition-colors">
                          {report.company}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
                          <span>{report.sector}</span>
                          <span>•</span>
                          <span>{report.year} 年報</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                      <Badge className="bg-[#009E9D]/10 text-[#009E9D] border-none">
                        MSCI {report.score}
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          className="p-2 text-[#999999] hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors"
                          title="預覽"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(report.company, report.company);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-[#999999] hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors"
                          title="下載 PDF"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(report.company, report.company);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Insights */}
          {(activeCategory === "all" || activeCategory === "insights") && (
            <GlassCard className="p-6 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#FFB703]" />
                  綜合比較與洞悉資訊
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-4 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer group relative"
                  onClick={() => handleReadArticle("disclosure-standards")}
                >
                  <div className="flex justify-between items-start mb-2 pr-6">
                    <h4 className="font-bold text-slate-800">台美歐 ESG 揭露標準差異分析</h4>
                    <button
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="下載 PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload("disclosure-standards", "台美歐 ESG 揭露標準差異分析");
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">深入探討台灣金管會規範與美國 SEC、歐盟 CSRD 的核心差異與合規建議。</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-xs text-[#009E9D] font-medium">
                      閱讀洞察 <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                    {readProgress["disclosure-standards"] !== undefined && (
                      <span className="text-[10px] font-bold text-[#009E9D] bg-[#009E9D]/10 px-1.5 py-0.5 rounded">
                        {readProgress["disclosure-standards"]}%
                      </span>
                    )}
                  </div>
                </div>
                <div 
                  className="p-4 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer group relative"
                  onClick={() => handleReadArticle("decarbonization-pathways")}
                >
                  <div className="flex justify-between items-start mb-2 pr-6">
                    <h4 className="font-bold text-slate-800">半導體產業減碳路徑比較</h4>
                    <button
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="下載 PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload("decarbonization-pathways", "半導體產業減碳路徑比較");
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">對比台積電、Intel、Samsung 在 Scope 1-3 減碳目標與實際執行成效。</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-xs text-[#009E9D] font-medium">
                      閱讀洞察 <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                    {readProgress["decarbonization-pathways"] !== undefined && (
                      <span className="text-[10px] font-bold text-[#009E9D] bg-[#009E9D]/10 px-1.5 py-0.5 rounded">
                        {readProgress["decarbonization-pathways"]}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guidelines & Laws */}
          {(activeCategory === "all" || activeCategory === "laws") && (
            <GlassCard className="p-6 bg-gradient-to-br from-[#F8F9FA] to-white">
              <h3 className="text-lg font-bold text-[#333333] mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#D4AF37]" />
                國際準則與法規
              </h3>
              <div className="space-y-4">
                <div 
                  className="group cursor-pointer relative"
                  onClick={() => handleReadArticle("gri-standards")}
                >
                  <div className="flex items-center justify-between pr-8">
                    <h4 className="font-bold text-[#333333] group-hover:text-[#D4AF37] transition-colors">
                      GRI 準則 (2021版)
                    </h4>
                    {readProgress["gri-standards"] !== undefined && (
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                        {readProgress["gri-standards"]}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1 line-clamp-2 pr-8">
                    全球最普及的通用準則，包含4個系列、34個主題，金管會要求企業採用。
                  </p>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 right-0 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("gri-standards", "GRI 準則 (2021版)");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-px bg-[#E5E7EB]" />
                <div 
                  className="group cursor-pointer relative"
                  onClick={() => handleReadArticle("sasb-standards")}
                >
                  <div className="flex items-center justify-between pr-8">
                    <h4 className="font-bold text-[#333333] group-hover:text-[#D4AF37] transition-colors">
                      SASB 準則
                    </h4>
                    {readProgress["sasb-standards"] !== undefined && (
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                        {readProgress["sasb-standards"]}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1 line-clamp-2 pr-8">
                    著重投資人溝通，涵蓋11項產業別、77項行業別，強調財務重大性。
                  </p>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 right-0 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("sasb-standards", "SASB 準則");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-px bg-[#E5E7EB]" />
                <div 
                  className="group cursor-pointer relative"
                  onClick={() => handleReadArticle("tcfd-standards")}
                >
                  <div className="flex items-center justify-between pr-8">
                    <h4 className="font-bold text-[#333333] group-hover:text-[#D4AF37] transition-colors">
                      TCFD 氣候相關財務揭露
                    </h4>
                    {readProgress["tcfd-standards"] !== undefined && (
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                        {readProgress["tcfd-standards"]}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1 line-clamp-2 pr-8">
                    聚焦氣候風險，透過治理、策略、風險管理、指標與目標4個範疇協助企業因應。
                  </p>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 right-0 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("tcfd-standards", "TCFD 氣候相關財務揭露");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Good Copywriting Examples */}
          {(activeCategory === "all" || activeCategory === "copywriting") && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-[#333333] mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FFB703]" />
                好文案範例庫
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-[8px] bg-[#F8F9FA] hover:bg-[#FFB703]/10 hover:text-[#FFB703] transition-colors group relative">
                  <div className="pr-8">
                    <span className="text-sm font-bold text-[#333333] group-hover:text-[#FFB703] block mb-1">
                      董事長的話 (開篇)
                    </span>
                    <span className="text-xs text-[#666666] line-clamp-1">
                      展現領導力與永續承諾的經典句型...
                    </span>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("copywriting-chairman", "董事長的話 (開篇)");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-[8px] bg-[#F8F9FA] hover:bg-[#FFB703]/10 hover:text-[#FFB703] transition-colors group relative">
                  <div className="pr-8">
                    <span className="text-sm font-bold text-[#333333] group-hover:text-[#FFB703] block mb-1">
                      重大性議題矩陣說明
                    </span>
                    <span className="text-xs text-[#666666] line-clamp-1">
                      如何清晰解釋雙重重大性分析過程...
                    </span>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("copywriting-materiality", "重大性議題矩陣說明");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-[8px] bg-[#F8F9FA] hover:bg-[#FFB703]/10 hover:text-[#FFB703] transition-colors group relative">
                  <div className="pr-8">
                    <span className="text-sm font-bold text-[#333333] group-hover:text-[#FFB703] block mb-1">
                      溫室氣體減量目標
                    </span>
                    <span className="text-xs text-[#666666] line-clamp-1">
                      符合 SBTi 框架的目標設定描述方式...
                    </span>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="下載 PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload("copywriting-ghg", "溫室氣體減量目標");
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedArticle(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-[#009E9D]/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#009E9D]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-[#333333]">
                      {selectedArticle === "what-is-esg" ? "ESG 基礎知識" : 
                       selectedArticle.includes("standards") ? "國際準則與法規" : "永續洞察分析"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-slate-500">閱讀進度</span>
                    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009E9D]" 
                        style={{ width: `${readProgress[selectedArticle] || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#009E9D] w-8">{readProgress[selectedArticle] || 0}%</span>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 hover:bg-[#F1F3F5] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-[#666666]" />
                  </button>
                </div>
              </div>

              <div 
                className="p-6 md:p-12 overflow-y-auto bg-white flex-1"
                onScroll={handleArticleScroll}
              >
                {selectedArticle === "what-is-esg" ? (
                  <article className="prose prose-slate max-w-none">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 font-serif leading-tight">
                    ESG 報告書是什麼？企業與利害關係人溝通的橋樑
                  </h1>

                  <p className="text-xl text-slate-600 leading-relaxed mb-10 font-serif">
                    ESG報告書又稱為永續報告書、ESG永續報告書，用於記錄企業在ESG的績效表現，包含環境保護、社會責任、公司治理3大面向，讓利害關係人（如員工、股東、消費者）能夠瞭解企業在永續發展上投入的心力與成果，既有助於企業提高資訊透明度、加強風險管理，也能展現其對於環境與社會的責任心。
                  </p>

                  <div className="bg-[#F8F9FA] p-6 rounded-[12px] border-l-4 border-[#D4AF37] mb-8">
                    <h3 className="text-xl font-bold text-[#333333] mb-4">
                      金管會強調重點
                    </h3>
                    <ul className="space-y-3 text-[#666666]">
                      <li>
                        <strong className="text-[#333333]">
                          精進年報資訊揭露規範：
                        </strong>
                        為使年報資訊更加公開透明，金管會將參酌國際準則修正年報揭露規範。
                      </li>
                      <li>
                        <strong className="text-[#333333]">
                          擴大永續資訊揭露範圍：
                        </strong>
                        規定實收資本額20億元以下之上市櫃公司，自2025年起均應編製永續報告書。
                      </li>
                      <li>
                        <strong className="text-[#333333]">
                          提升永續資訊品質：
                        </strong>
                        研議擴大確信範圍、協助抽查，以提升品質並強化確信人員管理。
                      </li>
                      <li>
                        <strong className="text-[#333333]">
                          研議推動 ISSB 準則：
                        </strong>
                        為接軌國際，將研修內控規範並成立永續準則委員會。
                      </li>
                    </ul>
                  </div>

                  <h2 className="text-2xl font-bold text-[#333333] mt-10 mb-6">
                    國際通用準則概覽
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white">
                      <h4 className="text-lg font-bold text-[#009E9D] mb-2">
                        GRI 準則
                      </h4>
                      <p className="text-sm text-[#666666]">
                        由全球永續報告協會提出，最普及的通用準則，金管會要求採用。包含4個系列、34個主題，提供易於理解的通用語言。
                      </p>
                    </div>
                    <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white">
                      <h4 className="text-lg font-bold text-[#219EBC] mb-2">
                        SASB 準則
                      </h4>
                      <p className="text-sm text-[#666666]">
                        著重與投資人溝通，多與財務有關。涵蓋5大面向、11項產業別、77項行業別，幫助企業找到適合架構。
                      </p>
                    </div>
                    <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white">
                      <h4 className="text-lg font-bold text-[#FFB703] mb-2">
                        TCFD 準則
                      </h4>
                      <p className="text-sm text-[#666666]">
                        重點放在「氣候風險」，透過治理、策略、風險管理、指標與目標4個範疇，協助企業因應氣候變遷。
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-[#333333] mt-10 mb-6">
                    撰寫步驟與架構
                  </h2>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#009E9D] text-white flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] text-lg">
                          議和
                        </h4>
                        <p className="text-[#666666]">
                          確定內容範圍與目標，透過問卷、訪談等方式確認重大議題。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#009E9D] text-white flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] text-lg">
                          規劃
                        </h4>
                        <p className="text-[#666666]">
                          整合內部資源，確保各單位數據與政策能有系統納入。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#009E9D] text-white flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] text-lg">
                          編撰
                        </h4>
                        <p className="text-[#666666]">
                          包含目的、問題、解法，可運用 PCDA 循環與 SMART 原則。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#009E9D] text-white flex items-center justify-center font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] text-lg">
                          審查
                        </h4>
                        <p className="text-[#666666]">
                          內部組織與外部獨立查證機構審查，並提報董事會。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#009E9D] text-white flex items-center justify-center font-bold flex-shrink-0">
                        5
                      </div>
                      <div>
                        <h4 className="font-bold text-[#333333] text-lg">
                          溝通
                        </h4>
                        <p className="text-[#666666]">
                          對內傳達理念，對外於官網公布並上傳至證交所平台。
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
                ) : (
                  <article className="prose prose-slate max-w-none">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 font-serif leading-tight">
                      {selectedArticle === "disclosure-standards" ? "台美歐 ESG 揭露標準差異分析" : 
                       selectedArticle === "decarbonization-pathways" ? "半導體產業減碳路徑比較" :
                       selectedArticle === "gri-standards" ? "GRI 準則 (2021版) 深度解析" :
                       selectedArticle === "sasb-standards" ? "SASB 準則：投資人溝通的核心" :
                       "TCFD 氣候相關財務揭露指南"}
                    </h1>
                    
                    <p className="text-xl text-slate-600 leading-relaxed mb-10 font-serif">
                      隨著全球永續發展趨勢的演進，各國監管機構紛紛出台更為嚴格的 ESG 揭露要求。本分析旨在探討不同區域間的核心差異，協助企業制定更具前瞻性的合規策略。
                    </p>
                    
                    <div className="grid grid-cols-1 gap-8">
                      <div className="bg-slate-50 p-5 sm:p-8 rounded-2xl border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">核心發現</h3>
                        <p className="text-slate-600 leading-relaxed">
                          目前全球正朝向「雙重重大性」（Double Materiality）邁進，不僅關注環境對企業的財務影響，也關注企業對環境與社會的實質影響。歐盟的 CSRD 準則在此方面走得最遠，而美國 SEC 則更側重於氣候相關的財務風險揭露。
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">建議行動</h3>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                          <li>建立跨部門的 ESG 數據收集系統，確保數據的準確性與可追溯性。</li>
                          <li>定期對標國際最新準則，動態調整揭露框架。</li>
                          <li>強化與利害關係人的溝通，將永續理念融入企業核心文化。</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="h-64" /> {/* Spacer for scroll progress demo */}
                  </article>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
