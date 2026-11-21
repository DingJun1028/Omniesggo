'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Zap } from 'lucide-react';

export interface DrThothInsight {
  status: 'OPTIMIZED' | 'CRITICAL_INTERVENTION';
  title: string;
  insight: string;
  actionRequired: string[];
}

export default function DrThothResonance({
  isOpen,
  onClose,
  insightData,
}: {
  isOpen: boolean;
  onClose: () => void;
  insightData: DrThothInsight | null;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-[400px] z-[200] p-6"
        >
          <div className="w-full h-full rounded-l-2xl flex flex-col p-6 border-l border-slate-200 dark:border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_40px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-sm dark:shadow-neon-emerald">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dr. Thoth</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono tracking-widest">AGENTIC TWIN ONLINE</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:focus-visible:ring-cyan-500 rounded-lg" aria-label="關閉 Dr. Thoth">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {!insightData ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-gray-500 space-y-4">
                  <Zap size={48} className="animate-pulse text-teal-500/30 dark:text-cyan-500/30" />
                  <p className="text-sm font-medium">等待數據匯入，隨時準備進行量子糾纏分析...</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className={`p-5 rounded-2xl border ${insightData.status === 'OPTIMIZED' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
                    <h4 className={`font-bold mb-2 flex items-center gap-2 ${insightData.status === 'OPTIMIZED' ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                      {insightData.title}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed font-medium">{insightData.insight}</p>
                  </div>
                  <div>
                    <h5 className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-3 pl-1">行動建議 (Next Steps)</h5>
                    <div className="space-y-3">
                      {insightData.actionRequired.map((action, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-teal-400 dark:hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer group flex items-start gap-3 shadow-sm">
                          <ChevronRight size={18} className="text-teal-600 dark:text-cyan-500 mt-0.5 group-hover:translate-x-1 transition-transform" />
                          <span className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-teal-900 dark:group-hover:text-cyan-100">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
