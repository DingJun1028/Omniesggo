'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassChartProps {
  title: string;
  value: number;
  max: number;
  unit: string;
  colorType: 'cyan' | 'emerald' | 'amber';
  trend?: 'up' | 'down' | 'neutral';
}

export default function OmniGlassChart({
  title,
  value,
  max,
  unit,
  colorType,
  trend,
}: GlassChartProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = {
    cyan: { bg: 'bg-teal-400 dark:bg-cyan-500/30', border: 'border-teal-300 dark:border-cyan-400', shadow: 'shadow-sm dark:shadow-neon-cyan', text: 'text-teal-700 dark:text-cyan-300' },
    emerald: { bg: 'bg-emerald-400 dark:bg-emerald-500/30', border: 'border-emerald-300 dark:border-emerald-400', shadow: 'shadow-sm dark:shadow-neon-emerald', text: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bg: 'bg-amber-400 dark:bg-amber-500/30', border: 'border-amber-300 dark:border-amber-400', shadow: 'shadow-sm dark:shadow-neon-amber', text: 'text-amber-700 dark:text-amber-300' },
  };
  const theme = colorMap[colorType];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between h-48 group backdrop-blur-md">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 tracking-wide">{title}</h4>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-gray-400'}`}>
            {trend === 'up' ? '▲ 優化' : trend === 'down' ? '▼ 衰退' : '— 持平'}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-4xl font-black ${theme.text} drop-shadow-sm dark:drop-shadow-md`}>{value}</span>
        <span className="text-sm text-slate-500 dark:text-gray-500 font-mono mb-1">{unit}</span>
      </div>
      <div className="relative w-full h-4 bg-slate-100 dark:bg-black/40 rounded-full border border-slate-200 dark:border-white/5 overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`absolute top-0 left-0 h-full rounded-full ${theme.bg} ${theme.border} border-t border-b-0 border-l-0 border-r ${theme.shadow}`}
        >
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
        </motion.div>
      </div>
    </div>
  );
}
