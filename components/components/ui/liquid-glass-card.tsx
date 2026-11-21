"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IComponentCore } from '@/lib/types/esg-core';
import { ShieldCheck, History, Fingerprint, Lock } from 'lucide-react';

interface LiquidGlassCardProps {
  data: IComponentCore;
  isSealed?: boolean;
  isComputing?: boolean;
  onViewTrace?: (trace: any) => void;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ 
  data, 
  isSealed = false, 
  isComputing = false,
  onViewTrace 
}) => {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        relative overflow-hidden rounded-[8px] p-6 transition-all duration-150
        liquid-glass
        ${isSealed 
          ? 'shadow-[0_1px_2px_rgba(0,0,0,0.05)]' 
          : 'shadow-flat hover:-translate-y-[1px]'
        }
      `}
    >
      {/* 驗算時的光流掃描效果 */}
      {isComputing && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-sweep" />
      )}

      {/* 頂部：標題與狀態 */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1">
          <h3 className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider font-mono">
            {isSealed ? '已封印數據存證' : '數據作業中'}
          </h3>
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {String(data.payload.value || '---')} 
            <span className="text-sm font-bold text-slate-500 ml-1">{String(data.payload.unit || '')}</span>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSealed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 shadow-sm"
              title="Immutable Hash Lock Active"
            >
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-widest font-mono">CRYSTALLIZED</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded border border-slate-200 shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Synergy</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 分隔線 */}
      <div className="h-[1px] bg-slate-200 w-full mb-6 relative z-10" />

      {/* 底部：溯源與驗證資訊 */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-bold flex items-center gap-1.5 font-mono">
            <Fingerprint className="w-3.5 h-3.5" />
            UUID / 唯一識別
          </span>
          <span className="font-mono font-bold text-slate-700 bg-slate-100/80 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{data.uuid.slice(0, 13)}...</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-bold flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            算法標準
          </span>
          <span className="font-bold text-slate-700 flex items-center gap-1 font-mono">
             {data.version} 
             <span className="text-[9px] text-primary border border-primary/20 bg-primary/5 px-1 rounded uppercase font-bold tracking-widest shadow-sm">Verified</span>
          </span>
        </div>

        {/* 溯源路徑觸發點 */}
        <button 
          onClick={() => onViewTrace?.(data.traceability_chain)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black tracking-widest text-primary hover:bg-primary/5 rounded border border-primary/20 transition-colors uppercase font-mono shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
        >
          <History className="w-3.5 h-3.5" />
          查看全時軌跡軸
        </button>
      </div>
    </motion.div>
  );
};
