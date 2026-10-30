'use client';

import Link from 'next/link';
import { 
  ArrowRight, FileText, BarChart3, Shield, CheckCircle2, 
  Zap, Users, Globe, TrendingUp, Award, Sparkles
} from 'lucide-react';
import { Button } from '@esggo/ui';
import { motion } from 'framer-motion';

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

const STATS = [
  { value: 'GRI 2024', label: '標準支援' },
  { value: 'CSRD ESRS', label: 'EU 法規合規' },
  { value: '5T', label: '信任協議' },
  { value: 'Hash Lock', label: '不可篡改存證' },
];

const BENEFITS = [
  '節省 60% 報告撰寫時間',
  '自動符合國際永續準則',
  '完整證據追溯機制',
  '跨部門協作無縫銜接',
  '即時合規性檢查',
  '專業顧問支援服務',
];

export default function MarketingHomePage() {
  return (
    <div className="pt-16 lg:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-cool-soft)] via-transparent to-[var(--accent-warm-soft)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-cool-soft),_transparent_50%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-cool-soft)] border border-[var(--border-accent)] mb-6">
                <Sparkles className="w-4 h-4 text-[var(--accent-cool)]" />
                <span className="text-sm font-medium text-[var(--accent-cool)]">
                  AI 驅動 • 可驗證 • 合規就緒
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[var(--text-1)] mb-6 leading-tight">
                AI 協作、
                <span className="bg-gradient-to-r from-[var(--accent-cool)] to-emerald-400 bg-clip-text text-transparent">
                  可驗證
                </span>
                的
                <br />
                永續報告書平台
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-[var(--text-2)] mb-10 leading-relaxed max-w-3xl mx-auto">
                從重大性分析到碳盤查、從供應鏈盡調到信任存證，
                一站式解決 GRI、CSRD、ESRS 合規挑戰
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/app">
                  <Button variant="primary" size="lg" className="group w-full sm:w-auto min-w-[200px]">
                    免費開始使用
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                    預約產品導覽
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 lg:py-16 border-y border-[var(--border)] bg-[var(--surface-1)]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--accent-cool)] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-[var(--text-2)]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-[var(--surface-1)]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-1)] mb-6">
                為何選擇 ESGGO
              </h2>
              <p className="text-lg text-[var(--text-2)] mb-8 leading-relaxed">
                我們結合深厚的永續專業知識與先進 AI 技術，打造最符合台灣與國際需求的
                ESG 報告解決方案。從合規到策略，協助企業邁向永續轉型。
              </p>
              <div className="space-y-4 mb-8">
                {BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[var(--accent-cool)] flex-shrink-0" />
                    <span className="text-[var(--text-2)] font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              <Link href="/app">
                <Button variant="primary" size="lg" className="group">
                  立即體驗
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--accent-cool-soft)] to-[var(--accent-warm-soft)] p-1">
                <div className="w-full h-full rounded-2xl bg-[var(--surface-1)] p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Award className="w-24 h-24 text-[var(--accent-cool)] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[var(--text-1)] mb-2">5T 信任協議</h3>
                    <p className="text-[var(--text-2)]">Traceable • Transparent • Trustworthy • Transferful • True</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--accent-cool)] to-emerald-600 p-8 sm:p-12 lg:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1),_transparent_70%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                準備好開始您的永續轉型了嗎？
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                加入 ESGGO，讓 AI 助力您的永續報告書，從今天開始建立可信任的 ESG 實績
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/app">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="group w-full sm:w-auto min-w-[200px] bg-white text-[var(--accent-cool)] hover:bg-white/90"
                  >
                    免費註冊
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="w-full sm:w-auto min-w-[200px] text-white hover:bg-white/10"
                  >
                    聯絡業務團隊
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
