'use client';

import Link from 'next/link';
import { Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@esggo/ui';
import { motion } from 'framer-motion';

const PLANS = [
  {
    name: '免費試用',
    price: '免費',
    period: '',
    description: '適合小型企業初次體驗 ESG 報告',
    features: [
      '基本報告書編輯器',
      'GRI 核心指標支援',
      '最多 1 份報告書',
      '基礎證據上傳',
      '社群支援',
    ],
    cta: '免費開始',
    href: '/app',
    popular: false,
  },
  {
    name: '專業版',
    price: 'NT$ 9,999',
    period: '/月',
    description: '適合成長型企業，完整 ESG 合規需求',
    features: [
      '完整動態表單引擎',
      'GRI 2024 + CSRD ESRS 全面支援',
      '雙重重大性矩陣',
      '碳盤查與淨零路徑規劃',
      '供應鏈盡職調查（最多 50 家供應商）',
      '5T Hash Lock 信任機制',
      'AI 智能建議與校驗',
      '電子郵件技術支援',
    ],
    cta: '立即申請',
    href: '/contact?plan=pro',
    popular: true,
  },
  {
    name: '企業版',
    price: '客製化',
    period: '',
    description: '適合大型企業與集團，完整整合需求',
    features: [
      '專業版所有功能',
      '無限報告書與供應商',
      'API 整合與 SSO 單一登入',
      '自訂工作流程與權限',
      '專屬客戶經理',
      '現場培訓與導入服務',
      'SLA 服務水準協議',
      '優先技術支援',
    ],
    cta: '聯絡業務',
    href: '/contact?plan=enterprise',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="pt-16 lg:pt-20">
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-1)] mb-6">
              簡單透明的定價
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-2)] max-w-2xl mx-auto">
              選擇最適合您企業的方案，從免費試用開始，隨著需求成長靈活升級
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl border ${
                  plan.popular
                    ? 'border-[var(--accent-cool)] shadow-lg shadow-[var(--accent-cool-soft)]'
                    : 'border-[var(--border)]'
                } bg-[var(--surface-1)] overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[var(--accent-cool)] to-emerald-400 text-white text-center py-2 text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4" />
                      最受歡迎
                    </div>
                  </div>
                )}
                <div className={`p-6 lg:p-8 ${plan.popular ? 'pt-12' : ''}`}>
                  <h3 className="text-2xl font-bold text-[var(--text-1)] mb-2">{plan.name}</h3>
                  <p className="text-[var(--text-2)] mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl lg:text-5xl font-bold text-[var(--text-1)]">{plan.price}</span>
                    <span className="text-[var(--text-2)] ml-2">{plan.period}</span>
                  </div>
                  <Link href={plan.href} className="block mb-8">
                    <Button
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="lg"
                      className="w-full group"
                    >
                      {plan.cta}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[var(--accent-cool)] flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--text-2)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
