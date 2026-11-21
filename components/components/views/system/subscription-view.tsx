"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Zap,
  Building2,
  CreditCard,
  Sparkles,
  Info,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

const TIERS = [
  {
    id: "starter",
    name: "基礎版",
    badge: "入門首選",
    description: "適合剛開始進行 ESG 盤查的中小企業，建立基礎數據框架。",
    price: "9,900",
    period: "/ 月",
    icon: Zap,
    color: "text-[#009E9D]",
    bg: "bg-[#009E9D]/10",
    borderColor: "border-[#009E9D]/20",
    buttonVariant: "wireframe" as const,
    buttonText: "免費試用 14 天",
    popular: false,
    features: [
      { name: "基本碳盤查工具 (Scope 1, 2)", included: true },
      { name: "標準 ESG 報告模板", included: true },
      { name: "單一使用者帳號", included: true },
      { name: "基礎數據視覺化", included: true },
      { name: "SRC 證據金庫 (10GB)", included: false },
      { name: "JunAiKey AI 助理", included: false },
    ],
  },
  {
    id: "pro",
    name: "專業版",
    badge: "最受歡迎",
    description: "適合需要完整 ESG 解決方案與 AI 輔助的企業，加速永續轉型。",
    price: "29,900",
    period: "/ 月",
    icon: Sparkles,
    color: "text-[#FFB703]",
    bg: "bg-gradient-to-br from-[#FFB703]/20 to-[#FF9E00]/5",
    borderColor: "border-[#FFB703]",
    buttonVariant: "solid" as const,
    buttonText: "立即升級專業版",
    popular: true,
    features: [
      { name: "完整碳盤查工具 (Scope 1, 2, 3)", included: true },
      { name: "進階 ESG 報告生成 (GRI, SASB)", included: true },
      { name: "5 個使用者帳號", included: true },
      { name: "進階數據分析與預測", included: true },
      { name: "SRC 證據金庫 (100GB)", included: true },
      { name: "JunAiKey AI 完整功能", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "企業版",
    badge: "量身打造",
    description: "適合大型企業、跨國供應鏈管理與高度客製化系統整合需求。",
    price: "聯絡我們",
    period: "",
    icon: Building2,
    color: "text-[#219EBC]",
    bg: "bg-[#219EBC]/10",
    borderColor: "border-[#219EBC]/20",
    buttonVariant: "wireframe" as const,
    buttonText: "聯絡業務團隊",
    popular: false,
    features: [
      { name: "多據點/供應鏈碳盤查整合", included: true },
      { name: "客製化 ESG 報告與儀表板", included: true },
      { name: "無限制使用者帳號", included: true },
      { name: "API 串接與 ERP 整合", included: true },
      { name: "SRC 證據金庫 (無上限)", included: true },
      { name: "專屬顧問與技術支援", included: true },
    ],
  },
];

const COMPARISON_FEATURES = [
  {
    category: "核心功能",
    items: [
      {
        name: "碳盤查範圍",
        starter: "Scope 1, 2",
        pro: "Scope 1, 2, 3",
        enterprise: "多據點 + 供應鏈",
      },
      {
        name: "ESG 報告生成",
        starter: "標準模板",
        pro: "GRI, SASB 框架",
        enterprise: "完全客製化",
      },
      {
        name: "使用者帳號數",
        starter: "1 個",
        pro: "5 個",
        enterprise: "無限制",
      },
      {
        name: "數據視覺化",
        starter: "基礎圖表",
        pro: "進階分析與預測",
        enterprise: "客製化儀表板",
      },
    ],
  },
  {
    category: "AI 與進階功能",
    items: [
      {
        name: "JunAiKey AI 助理",
        starter: false,
        pro: "完整功能",
        enterprise: "專屬模型訓練",
      },
      {
        name: "SRC 證據金庫容量",
        starter: "10GB (可加購)",
        pro: "100GB",
        enterprise: "無上限",
      },
      { name: "5T 協議驗證", starter: false, pro: true, enterprise: true },
      { name: "API / ERP 整合", starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: "支援與服務",
    items: [
      {
        name: "客服支援",
        starter: "Email 支援",
        pro: "優先 Email 支援",
        enterprise: "24/7 專屬通道",
      },
      { name: "專屬顧問", starter: false, pro: "可加購", enterprise: true },
      {
        name: "教育訓練",
        starter: "線上資源",
        pro: "每季 1 次線上培訓",
        enterprise: "實體/線上專屬培訓",
      },
    ],
  },
];

export function SubscriptionView() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );

  return (
    <div className="space-y-12 pb-12">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="optimal"
            styleType="soft"
            className="mb-4 bg-[#009E9D]/10 text-[#009E9D] border-none px-4 py-1.5 text-sm font-semibold"
          >
            升級您的永續影響力
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-6 leading-tight">
            選擇適合您的 <span className="text-[#009E9D]">ESG 解決方案</span>
          </h1>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
            無論您是剛起步的中小企業，還是需要管理複雜供應鏈的大型集團，我們都有量身打造的方案。
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-4 mt-10"
        >
          <span
            className={`text-base font-semibold transition-colors ${billingCycle === "monthly" ? "text-slate-800" : "text-slate-400"}`}
          >
            月繳
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="relative w-16 h-8 rounded-full bg-slate-200 transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009E9D] focus:ring-offset-2"
            style={{
              backgroundColor: billingCycle === "yearly" ? "#009E9D" : "",
            }}
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${billingCycle === "yearly" ? "translate-x-9" : "translate-x-1"}`}
            />
          </button>
          <span
            className={`text-base font-semibold flex items-center gap-2 transition-colors ${billingCycle === "yearly" ? "text-slate-800" : "text-slate-400"}`}
          >
            年繳
            <Badge
              variant="optimal"
              styleType="soft"
              className="text-[#FFB703] bg-[#FFB703]/10 border-none px-2 py-0.5 text-xs font-bold animate-pulse"
            >
              省 20%
            </Badge>
          </span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {TIERS.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index + 0.2, duration: 0.5 }}
            className={`relative flex flex-col h-full rounded-[24px] transition-all duration-300 ${
              tier.popular
                ? "bg-white shadow-2xl shadow-[#FFB703]/30 border-4 border-[#FFB703] lg:scale-105 z-10"
                : "bg-white/60 backdrop-blur-md border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:bg-white lg:scale-95"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <div className="bg-gradient-to-r from-[#FFB703] to-[#FF9E00] text-white text-sm font-bold px-6 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {tier.badge}
                </div>
              </div>
            )}

            <div className="p-8 flex-1 flex flex-col">
              {/* Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${tier.bg} flex items-center justify-center`}
                  >
                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  {!tier.popular && (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-500 min-h-[40px] leading-relaxed">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  {tier.id === "enterprise" ? (
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                      {tier.price}
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-slate-400 self-start mt-2">
                        NT$
                      </span>
                      <span className="text-5xl font-extrabold text-slate-800 tracking-tight">
                        {billingCycle === "yearly"
                          ? (
                              parseInt(tier.price.replace(/\D/g, "")) * 0.8
                            ).toLocaleString()
                          : tier.price}
                      </span>
                      <span className="text-slate-500 font-medium ml-1">
                        {tier.period}
                      </span>
                    </>
                  )}
                </div>
                {billingCycle === "yearly" && tier.id !== "enterprise" && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-[#FFB703] font-medium bg-[#FFB703]/10 w-fit px-2.5 py-1 rounded-md">
                    <Check className="w-3.5 h-3.5" />
                    已包含 20% 年度折扣
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-4 mb-8">
                <p className="text-sm font-bold text-slate-800 mb-4">
                  包含以下功能：
                </p>
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-[#009E9D]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#009E9D] stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-slate-400 stroke-[3]" />
                      </div>
                    )}
                    <span
                      className={`text-sm leading-tight ${feature.included ? "text-slate-700 font-medium" : "text-slate-400"}`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button
                variant={tier.buttonVariant}
                className={`w-full py-6 text-base font-bold rounded-xl group ${
                  tier.popular
                    ? "bg-[#FFB703] hover:bg-[#F2A900] text-white shadow-lg shadow-[#FFB703]/25 border-none"
                    : ""
                }`}
              >
                {tier.buttonText}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto mt-24 px-4 hidden md:block"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            完整功能比較表
          </h2>
          <p className="text-slate-600">深入了解各方案的詳細差異，找出最適合您的選擇。</p>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/50">
            <div className="p-6 font-bold text-slate-800 flex items-end">
              功能項目
            </div>
            {TIERS.map((tier) => (
              <div key={tier.id} className="p-6 text-center border-l border-slate-100">
                <div className={`text-sm font-bold mb-1 ${tier.color}`}>
                  {tier.name}
                </div>
                <div className="text-xl font-extrabold text-slate-800">
                  {tier.id === "enterprise" ? "客製化" : (billingCycle === "yearly" ? `NT$ ${(parseInt(tier.price.replace(/\D/g, "")) * 0.8).toLocaleString()}` : `NT$ ${tier.price}`)}
                </div>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {COMPARISON_FEATURES.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {/* Section Header */}
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {section.category}
                  </h4>
                </div>
                {/* Section Items */}
                <div className="divide-y divide-slate-50">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="grid grid-cols-4 hover:bg-slate-50/50 transition-colors">
                      <div className="p-4 px-6 text-sm font-medium text-slate-700 flex items-center gap-2">
                        {item.name}
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </div>
                      {[item.starter, item.pro, item.enterprise].map((val, i) => (
                        <div key={i} className="p-4 text-center border-l border-slate-100 flex items-center justify-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="w-5 h-5 text-[#009E9D] mx-auto" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )
                          ) : (
                            <span className={`text-sm ${i === 1 ? "font-bold text-slate-800" : "text-slate-600"}`}>
                              {val}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 text-center px-4"
      >
        <GlassCard className="inline-flex flex-col md:flex-row items-center gap-6 p-8 max-w-4xl mx-auto bg-gradient-to-r from-slate-800 to-slate-900 border-none shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h4 className="text-2xl font-bold text-white mb-2">
              需要更彈性的客製化方案？
            </h4>
            <p className="text-slate-300 text-sm md:text-base">
              我們的永續專家團隊隨時準備為您量身打造最適合的 ESG 數據治理架構與 API 串接服務。
            </p>
          </div>
          <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 py-6 rounded-xl whitespace-nowrap">
            預約免費諮詢
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  );
}

