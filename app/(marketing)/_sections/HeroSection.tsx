'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@esggo/ui';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
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
  );
}
