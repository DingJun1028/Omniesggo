'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@esggo/ui';
import { motion } from 'framer-motion';
import { BENEFITS } from '../_data';

export function BenefitsSection() {
  return (
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
  );
}
