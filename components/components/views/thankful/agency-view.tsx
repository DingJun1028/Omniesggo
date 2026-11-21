"use client";

import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Copy, 
  Gift, 
  Award, 
  Store, 
  CheckCircle2, 
  Star,
  Leaf,
  ShieldCheck,
  TrendingUp,
  Share2,
  Sparkles,
  Bot,
  GraduationCap,
  Building2,
  TreePine,
  MessageSquareText,
  UserCheck,
  ExternalLink,
  Megaphone,
  CloudRain,
  Link,
  Coins
} from "lucide-react";
import { motion } from "motion/react";

const ORIGINAL_PARTNERS = [
  { 
    name: "山衛科技", 
    role: "可靠度與檢測專家", 
    url: "https://www.samwells.com", 
    features: "提供物理應力實測、非破壞檢測與可靠度驗證，為企業提供堅實的「5T」證據基礎與科學數據支持。",
    products: "非破壞檢測設備、聲學與振動量測系統、可靠度測試顧問服務",
    icon: Building2,
    colorClasses: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" }
  },
  { 
    name: "墾趣", 
    role: "戶外生活與自然體驗", 
    url: "https://www.freetimegears.com.tw", 
    features: "推廣戶外教育與自然環境保護，作為生態與環境數據的實踐節點，引領綠色生活風格與永續消費。",
    products: "頂級戶外裝備代理、綠色戶外體驗活動、環保永續材質服飾",
    icon: TreePine,
    colorClasses: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" }
  },
  { 
    name: "全人測評", 
    role: "職能與人才發展", 
    url: "https://www.maps-hr.com", 
    features: "專注於全人職能導圖與人才發展，科學化度量員工成長，協助企業落實社會責任 (S) 的核心價值。",
    products: "職業適性測驗系統、企業人才發展顧問、組織氣候與員工滿意度調查",
    icon: UserCheck,
    colorClasses: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" }
  },
  { 
    name: "語言步驟", 
    role: "永續敘事與溝通", 
    url: "https://www.languagesteps.com", 
    features: "將複雜的 ESG 數據與合規報告轉譯為動人的永續價值故事，強化企業與利害關係人的深度溝通。",
    products: "永續報告書編撰顧問、企業溝通策略規劃、ESG 敘事與公關培訓",
    icon: MessageSquareText,
    colorClasses: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" }
  }
];

const FEATURED_STORES = [
  {
    name: "綠色能源顧問",
    desc: "提供企業綠電採購、PPA 合約諮詢與再生能源憑證 (T-REC) 媒合服務。",
    discount: "代理碼專屬 9 折",
    icon: Leaf,
    colorClasses: {
      bg: "bg-emerald-50",
      hoverBg: "group-hover:bg-emerald-100",
      text: "text-emerald-500",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700"
    }
  },
  {
    name: "零碳辦公用品",
    desc: "100% 回收材質製造的辦公文具與設備，並提供完整的碳足跡聲明書。",
    discount: "首購贈 500 永續幣",
    icon: Store,
    colorClasses: {
      bg: "bg-blue-50",
      hoverBg: "group-hover:bg-blue-100",
      text: "text-blue-500",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700"
    }
  },
  {
    name: "永續認證輔導",
    desc: "ISO 14064-1、ISO 14067 等國際標準導入輔導，加速企業合規進程。",
    discount: "免費初步健檢",
    icon: ShieldCheck,
    colorClasses: {
      bg: "bg-amber-50",
      hoverBg: "group-hover:bg-amber-100",
      text: "text-amber-500",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700"
    }
  }
];

const NEXT_VERSION_MENTORS = [
  { name: "壽司博士 Dr. Thoth", role: "底層智慧與本質提純", desc: "善向永續核心導師", icon: Bot, color: "indigo" },
  { name: "王道阿丹", role: "技能學習", desc: "教導用戶如何駕馭永續工具", icon: GraduationCap, color: "orange" }
];

const NEXT_VERSION_FEATURES = [
  {
    title: "AI 碳盤查自動化 (Scope 3)",
    desc: "整合供應鏈數據，透過 AI 自動辨識與計算範疇三碳排放，大幅降低盤查成本。",
    icon: CloudRain,
    color: "blue"
  },
  {
    title: "5T 證據庫區塊鏈上鏈",
    desc: "將關鍵合規證據與檢測報告寫入區塊鏈，確保數據不可篡改，提升報告公信力。",
    icon: Link,
    color: "purple"
  },
  {
    title: "永續幣 (ESG Coin) 交易商城",
    desc: "開放村民使用永續幣兌換特優商家的綠色商品與服務，打造完整的代幣經濟生態。",
    icon: Coins,
    color: "amber"
  }
];

const IMPACT_ALLIANCE = [
  { name: "山衛科技", role: "可靠度衛士", desc: "提供物理應力實測的「5T」證據。", icon: Building2, color: "slate" },
  { name: "墾趣", role: "自然體驗", desc: "負責戶外教育與自然環境的數據節點。", icon: TreePine, color: "emerald" },
  { name: "語言步驟", role: "敘事導師", desc: "將複雜數據轉譯為永續價值。", icon: MessageSquareText, color: "blue" },
  { name: "全人評測", role: "全人職能導圖", desc: "度量人的成長與社會責任 (S)。", icon: UserCheck, color: "purple" }
];

export function AgencyView() {
  const [copied, setCopied] = useState(false);
  const [gamePreviewImage, setGamePreviewImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const agencyCode = "ESG-PIONEER-2026";

  const handleCopy = () => {
    navigator.clipboard.writeText(agencyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateGamePreview = async () => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A 2D epic adventure RPG game campaign scene, sustainable eco-village theme. Heroes fighting pollution monsters in a lush green environment with wind turbines and solar panels. Classic turn-based RPG UI elements, high quality, vibrant colors, epic fantasy atmosphere, 2D game art style.',
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setGamePreviewImage(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
    } catch (error) {
      // Silently handle image generation errors
      alert("圖片生成失敗，請稍後再試。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              永續夥伴代理聯盟
            </h1>
            <Badge
              variant="optimal"
              styleType="soft"
              className="bg-[#009E9D]/10 text-[#009E9D] border-[#009E9D]/20"
            >
              Agency Alliance
            </Badge>
          </div>
          <p className="text-slate-500 text-lg">
            紀念元祖夥伴，分享您的專屬代理碼，並在特優商店享受專屬回饋。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Agency Code & Rewards */}
        <div className="lg:col-span-1 space-y-8">
          <GlassCard className="p-8 border-t-4 border-t-[#009E9D] bg-gradient-to-b from-white to-[#009E9D]/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#009E9D]/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-[#009E9D]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">專屬代理碼獎勵</h2>
                <p className="text-sm text-slate-500">分享代碼，共創永續生態</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#009E9D]" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">您的代理碼</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-slate-800 tracking-wider">
                  {agencyCode}
                </span>
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-[#009E9D]"
                  title="複製代碼"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-700">累積永續幣</span>
                </div>
                <span className="font-bold text-xl text-slate-800">1,250</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-slate-700">成功邀請企業</span>
                </div>
                <span className="font-bold text-xl text-slate-800">3</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Share2 className="w-4 h-4" />
              分享邀請連結
            </button>
          </GlassCard>
        </div>

        {/* Right Column: Original Partners & Featured Stores */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Commemorating Original Partners */}
          <GlassCard className="p-8 border-l-4 border-l-amber-500 relative overflow-hidden bg-gradient-to-br from-amber-50/30 to-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">元祖紀念夥伴</h2>
                  <p className="text-sm text-slate-500">草創暨見證 0-1 的全過程</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 relative z-10">
              {ORIGINAL_PARTNERS.map((partner, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl border border-amber-100 bg-white hover:shadow-lg transition-all group">
                  <div className={`w-16 h-16 rounded-2xl ${partner.colorClasses.bg} ${partner.colorClasses.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <partner.icon className={`w-8 h-8 ${partner.colorClasses.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">{partner.name}</h4>
                        <p className="text-sm font-medium text-amber-600">{partner.role}</p>
                      </div>
                      <a 
                        href={partner.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#009E9D] hover:text-[#008A89] bg-[#009E9D]/10 hover:bg-[#009E9D]/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        訪問網站 <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">介紹特色</span>
                        <p className="text-sm text-slate-600 leading-relaxed">{partner.features}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">重點產品</span>
                        <p className="text-sm font-medium text-slate-700">{partner.products}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Featured Premium Stores */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">特優商店介紹</h2>
                <p className="text-sm text-slate-500">使用您的代理碼與永續幣，享受專屬的綠色服務與產品</p>
              </div>
            </div>

            <div className="space-y-4">
              {FEATURED_STORES.map((store, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${store.colorClasses.bg} ${store.colorClasses.hoverBg} transition-colors`}>
                    <store.icon className={`w-7 h-7 ${store.colorClasses.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#009E9D] transition-colors">
                        {store.name}
                      </h3>
                      <Badge className={`${store.colorClasses.badgeBg} ${store.colorClasses.badgeText} border-none px-3 py-1`}>
                        {store.discount}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {store.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-sm font-bold text-[#009E9D] hover:text-[#008A89] transition-colors inline-flex items-center gap-1">
                查看更多特優商店 <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>

          {/* Call to Action: 善向永續村 號召令 */}
          <GlassCard className="p-8 border-l-4 border-l-emerald-500 relative overflow-hidden bg-gradient-to-br from-emerald-50/30 to-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">［善向永續村 號召令］</h2>
                  <p className="text-sm text-slate-500">徵集村民 / 優質進駐商家</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* Villagers */}
              <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex flex-col h-full">
                <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" /> 招募永續村民
                </h3>
                <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed">
                  無論您是關注 ESG 的個人、學生或專業人士，加入善向永續村，參與永續行動累積「永續幣」，解鎖專屬課程與綠色商品優惠。
                </p>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                  註冊成為村民
                </button>
              </div>
              
              {/* Merchants */}
              <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/50 flex flex-col h-full">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5" /> 徵選優質商家
                </h3>
                <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed">
                  邀請具備綠色認證、低碳產品或社會企業背景的品牌進駐。透過平台精準觸及重視永續的客群，共創綠色經濟圈。
                </p>
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                  申請商家進駐
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Next Version Preview */}
          <GlassCard className="p-8 border-l-4 border-l-indigo-500 relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">下次改版預告</h2>
                  <p className="text-sm text-slate-500">元始夥伴紀念以及善向永續村商店募集，村民入住活動！</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              {/* Next Version Preview Features */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block"></span>
                  下期重點改版內容
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {NEXT_VERSION_FEATURES.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                      <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{feature.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Version Preview Mentors Only */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block"></span>
                  善向永續 核心導師
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {NEXT_VERSION_MENTORS.map((mentor, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                      <div className={`w-10 h-10 rounded-xl bg-${mentor.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <mentor.icon className={`w-5 h-5 text-${mentor.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{mentor.name}</h4>
                        <p className="text-xs font-medium text-indigo-600 mt-0.5 mb-1">{mentor.role}</p>
                        <p className="text-sm text-slate-500">{mentor.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Epic Campaign Preview */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block"></span>
                    善向永續村 RPG：2D 史詩冒險戰役
                  </div>
                  <button
                    onClick={generateGamePreview}
                    disabled={isGeneratingImage}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingImage ? "生成中..." : "生成開發概念圖"}
                  </button>
                </h3>
                <div className="w-full aspect-video bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
                  {gamePreviewImage ? (
                    <Image src={gamePreviewImage} alt="Game Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center p-6">
                      <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">點擊上方按鈕，使用 AI 生成下期遊戲開發概念圖</p>
                      <p className="text-xs text-slate-400 mt-1">2D 永續史詩冒險風格戰役</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
