"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  HelpCircle, 
  Book, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  FileText,
  ShieldCheck,
  CreditCard,
  Mail,
  PlayCircle,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Bot,
  Trophy,
  Map
} from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to ESG GO",
    description: "Your comprehensive platform for managing, tracking, and reporting ESG performance. Let's take a quick tour of our key features!",
    icon: Sparkles,
    color: "text-indigo-500",
    bg: "bg-indigo-100"
  },
  {
    title: "Intelligent Dashboard",
    description: "Monitor your ESG metrics in real-time. Track carbon footprint, social impact, and governance scores all in one place.",
    icon: BarChart3,
    color: "text-emerald-500",
    bg: "bg-emerald-100"
  },
  {
    title: "JunAiKey Assistant",
    description: "Meet your AI sustainability expert. Ask questions, get recommendations, and generate insights instantly.",
    icon: Bot,
    color: "text-blue-500",
    bg: "bg-blue-100"
  },
  {
    title: "Automated Reporting",
    description: "Generate compliant sustainability reports with a single click. We support major frameworks like GRI, SASB, and TCFD.",
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-100"
  },
  {
    title: "Gamified Engagement",
    description: "Engage your team with Village RPG and Agency features. Turn sustainability goals into collaborative quests!",
    icon: Trophy,
    color: "text-purple-500",
    bg: "bg-purple-100"
  }
];

const FAQ_DATA = [
  {
    category: "Getting Started (新手上路)",
    icon: Book,
    items: [
      {
        q: "What is ESG GO? (什麼是 ESG GO？)",
        a: "ESG GO is a comprehensive platform designed to help enterprises and SMEs manage, track, and report their ESG (Environmental, Social, and Governance) performance efficiently. (ESG GO 是一個全方位的平台，旨在幫助企業與中小企業高效管理、追蹤並產出 ESG 績效報告。)"
      },
      {
        q: "How do I set up my company profile? (如何設定公司資料？)",
        a: "Navigate to 'System Settings' from the left menu, then select 'Company Profile'. Fill in your organization's details, industry sector, and primary ESG goals. (從左側選單進入「系統設定」，選擇「公司資料」，填寫您的組織資訊、所屬產業及主要 ESG 目標。)"
      }
    ]
  },
  {
    category: "Reports & Data (報告與數據)",
    icon: FileText,
    items: [
      {
        q: "How does the AI Report Guide work? (AI 永續報告導航如何運作？)",
        a: "The AI Report Guide uses advanced generative AI to help you draft your sustainability report. It analyzes your data, suggests structures, and can even generate text and charts based on your inputs. (AI 永續報告導航使用先進的生成式 AI 協助您起草永續報告。它會分析您的數據、建議架構，甚至能根據您的輸入自動生成文字與圖表。)"
      },
      {
        q: "Can I export my reports to PDF? (我可以將報告匯出為 PDF 嗎？)",
        a: "Yes! In the Report Guide or Omni SRC view, you can use the 'Export PDF' button to generate a professionally formatted document ready for publication. (可以！在報告導航或 Omni SRC 視圖中，您可以使用「匯出 PDF」按鈕，生成排版專業、可直接發布的文件。)"
      }
    ]
  },
  {
    category: "Security & Privacy (安全與隱私)",
    icon: ShieldCheck,
    items: [
      {
        q: "Is my data secure? (我的數據安全嗎？)",
        a: "Absolutely. We use enterprise-grade encryption for all data at rest and in transit. Our Evidence Vault uses blockchain-inspired hashing to ensure data immutability. (絕對安全。我們對所有靜態與傳輸中的數據使用企業級加密。我們的「證據金庫」採用類似區塊鏈的雜湊技術，確保數據不可篡改。)"
      }
    ]
  },
  {
    category: "Billing & Subscription (計費與訂閱)",
    icon: CreditCard,
    items: [
      {
        q: "How do I upgrade my plan? (如何升級我的方案？)",
        a: "Go to the 'Subscription' page from the main navigation. You can view available plans and upgrade your account instantly using a credit card. (前往主選單的「訂閱方案」頁面。您可以查看可用方案，並使用信用卡立即升級您的帳戶。)"
      }
    ]
  }
];

export function HelpFaqView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("esg_go_tour_completed");
    if (!hasSeenTour) {
      setTimeout(() => setShowTour(true), 0);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem("esg_go_tour_completed", "true");
    setShowTour(false);
    setTourStep(0);
  };

  const startTour = () => {
    setTourStep(0);
    setShowTour(true);
  };

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    items: category.items.filter(
      item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-[#009E9D]" />
            Help & FAQ
            <Badge
              variant="optimal"
              styleType="soft"
              className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 ml-2"
            >
              Support Center
            </Badge>
          </h1>
          <p className="text-[#666666] text-sm sm:text-base">
            Find answers, documentation, and support for the ESG GO platform. (尋找 ESG GO 平台的解答、文件與支援)
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009E9D] focus:border-transparent transition-all"
            placeholder="Search for answers... (搜尋常見問題...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-8">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No results found (找不到結果)</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search terms. (請嘗試調整搜尋關鍵字)</p>
            </div>
          ) : (
            filteredData.map((category, catIdx) => {
              const Icon = category.icon;
              return (
                <div key={catIdx} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Icon className="w-5 h-5 text-[#009E9D]" />
                    {category.category}
                  </h2>
                  <div className="space-y-3">
                    {category.items.map((item, itemIdx) => {
                      const id = `${catIdx}-${itemIdx}`;
                      const isOpen = openItems[id];
                      return (
                        <GlassCard key={itemIdx} className="overflow-hidden transition-all duration-200">
                          <button
                            onClick={() => toggleItem(id)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none"
                          >
                            <span className="font-medium text-slate-800 pr-4">{item.q}</span>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
                              {item.a}
                            </div>
                          )}
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar / Contact Support */}
        <div className="space-y-6">
          <GlassCard className="p-6 bg-gradient-to-br from-[#009E9D]/5 to-[#219EBC]/5 border-[#009E9D]/20">
            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#009E9D]" />
              Still need help?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help. (找不到您要的答案嗎？我們的支援團隊隨時準備為您服務。)
            </p>
            <div className="space-y-3">
              <Button variant="solid" className="w-full justify-center">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support (聯絡客服)
              </Button>
              <Button variant="wireframe" className="w-full justify-center">
                <Book className="w-4 h-4 mr-2" />
                View Full Documentation
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-bold text-slate-800 mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-[#009E9D] hover:underline flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-[#009E9D] hover:underline flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Security Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="text-[#009E9D] hover:underline flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Video Tutorials
                </a>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-500" />
              New to ESG GO?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Take a quick interactive tour to learn about our key features and how to get started.
            </p>
            <Button onClick={startTour} variant="wireframe" className="w-full justify-center">
              <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
              Start Platform Tour
            </Button>
          </GlassCard>
        </div>
      </div>

      {/* Onboarding Tour Modal */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={completeTour}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${TOUR_STEPS[tourStep].bg}`}>
                  {(() => {
                    const Icon = TOUR_STEPS[tourStep].icon;
                    return <Icon className={`w-8 h-8 ${TOUR_STEPS[tourStep].color}`} />;
                  })()}
                </div>
              </div>
              
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">
                  {TOUR_STEPS[tourStep].title}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {TOUR_STEPS[tourStep].description}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-8">
                {TOUR_STEPS.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === tourStep ? "w-6 bg-indigo-500" : "w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <Button 
                  variant="wireframe" 
                  onClick={completeTour}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Skip Tour
                </Button>
                
                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <Button 
                      variant="wireframe" 
                      onClick={() => setTourStep(prev => prev - 1)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <Button 
                      variant="solid" 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setTourStep(prev => prev + 1)}
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      variant="solid" 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={completeTour}
                    >
                      Get Started <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
