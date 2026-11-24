'use client';

import { motion } from 'framer-motion';
import { STATS } from '../_data';

export function StatsSection() {
  return (
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
  );
}
