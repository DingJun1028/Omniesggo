'use client';

import { motion } from 'framer-motion';
import {
  FileText, BarChart3, Shield, Users, TrendingUp, Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'AI 協作報告書',
    description: '智能動態表單引擎，支援 GRI 2024、CSRD ESRS 框架，自動生成合規章節與指標建議。',
  },
  {
    icon: BarChart3,
    title: '雙重重大性矩陣',
    description: '互動式散佈圖與四象限分析，同時評估衝擊重大性與財務重大性，精準鎖定關鍵議題。',
  },
  {
    icon: Shield,
    title: '5T Hash Lock 信任機制',
    description: '每份報告全書雜湊鎖定，證據金庫不可篡改存證，確保永續數據的可追溯與可信任。',
  },
  {
    icon: Users,
    title: '供應鏈盡職調查',
    description: 'Tier 1/2 供應商風險評估、AI 合規審查、矯正行動追蹤，符合法規要求。',
  },
  {
    icon: TrendingUp,
    title: '碳盤查與淨零路徑',
    description: 'ISO 14064-1 範疇一二三盤查、SBTi 1.5°C 路徑試算、邊際減碳成本分析。',
  },
  {
    icon: Zap,
    title: '智能解析與查驗',
    description: 'PDF 報告書自動解析、碳排數據提取、第三方查驗比對，強化內部稽核效率。',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-1)] mb-4">
            全方位 ESG 合規解決方案
          </h2>
          <p className="text-lg sm:text-xl text-[var(--text-2)]">
            整合國際永續準則、AI 智能協作與信任機制，讓永續報告更簡單、更可靠
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] hover:border-[var(--border-accent)] hover:shadow-lg hover:shadow-[var(--accent-cool-soft)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-cool-soft)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-[var(--accent-cool)]" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-[var(--text-1)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--text-2)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
