'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@esggo/ui';

export function CtaSection() {
  return (
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
  );
}
