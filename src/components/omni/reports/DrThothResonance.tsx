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
          <div className="w-full h-full liquid-glass-container flex flex-col p-6 border-l border-white/20 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] bg-[#060b14]/60">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-300 shadow-neon-emerald">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Dr. Thoth</h3>
                  <p className="text-xs text-emerald-400 font-mono tracking-widest">AGENTIC TWIN ONLINE</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg" aria-label="關閉 Dr. Thoth">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {!insightData ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <Zap size={48} className="animate-pulse text-cyan-500/30" />
                  <p className="text-sm">等待數據匯入，隨時準備進行量子糾纏分析...</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className={`p-5 rounded-2xl border ${insightData.status === 'OPTIMIZED' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                    <h4 className={`font-bold mb-2 flex items-center gap-2 ${insightData.status === 'OPTIMIZED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {insightData.title}
                    </h4>
                    <p className="text-sm text-gray-200 leading-relaxed">{insightData.insight}</p>
                  </div>
                  <div>
                    <h5 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 pl-1">行動建議 (Next Steps)</h5>
                    <div className="space-y-3">
                      {insightData.actionRequired.map((action, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer group flex items-start gap-3">
                          <ChevronRight size={18} className="text-cyan-500 mt-0.5 group-hover:translate-x-1 transition-transform" />
                          <span className="text-sm text-gray-300 group-hover:text-cyan-100">{action}</span>
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
