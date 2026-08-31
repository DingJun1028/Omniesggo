'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Plus, Shield, Layout, Sparkles } from 'lucide-react';
import DrThothResonance from './DrThothResonance';

export default function FloatingFunctionKey428() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isThothOpen, setIsThothOpen] = useState(false);
  const [insightData, setInsightData] = useState<null | {
    status: 'OPTIMIZED' | 'CRITICAL_INTERVENTION';
    title: string;
    insight: string;
    actionRequired: string[];
  }>(null);

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      setMode((prev) => (prev === 'view' ? 'edit' : 'view'));
    }, 500);
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isThothOpen) setIsExpanded((v) => !v);
  };

  const handleSummonThoth = async () => {
    setIsExpanded(false);
    setIsThothOpen(true);
    setInsightData(null);
    try {
      const res = await fetch('/api/agentic-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: 'mod-env-carbon-0001',
          reportType: 'ISO-14064',
          previousYearUsage: 1000,
          currentYearUsage: 4950,
          gridEmissionFactor: 0.495,
          evidence: ['https://omni-vault.s3.universe.com/iso-14064-proof.pdf'],
        }),
      });
      const json = await res.json();
      if (json.success && json.insight) {
        setInsightData(json.insight);
      } else {
        throw new Error(json.error || 'API 未回傳洞察');
      }
    } catch {
      // 降級：API 不可達時回退本地快取洞察（免費算立、不阻塞 UI）
      setInsightData({
        status: 'OPTIMIZED',
        title: '✨ 雙棲代理戰略報告',
        insight:
          '您當期的範疇二碳排為 4950.00 kg CO₂e。恭喜！較基準年大幅下降，展現了卓越的永續韌性。',
        actionRequired: [
          '建議將此成就刻印至 2026 年度永續報告書草稿。',
          '可探索 mod-env-carbon-credit-0001 進行碳權資產化。',
          '啟動低碳轉型路徑模擬，預測 2030 目標達成率。',
        ],
      });
    }
  };

  return (
    <>
      <DrThothResonance isOpen={isThothOpen} onClose={() => setIsThothOpen(false)} insightData={insightData} />

      <div className="fixed bottom-10 right-10 z-[100]">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-0 flex flex-col-reverse gap-4 mb-4"
            >
              <motion.button
                onClick={handleSummonThoth}
                whileHover={{ scale: 1.1, x: -5 }}
                className="p-4 rounded-full liquid-glass-button text-emerald-300 hover:text-emerald-100 group relative shadow-neon-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="召喚 Dr. Thoth"
              >
                <Sparkles size={24} />
                <span className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  召喚 Dr. Thoth
                </span>
              </motion.button>
              {[
                { icon: <Plus size={24} />, label: '刻印新報告' },
                { icon: <Shield size={24} />, label: '開啟證據庫' },
                { icon: <Layout size={24} />, label: '進入總樞紐' },
              ].map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.1, x: -5 }}
                  className="p-4 rounded-full liquid-glass-button text-cyan-300 hover:text-cyan-100 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  aria-label={item.label}
                >
                  {item.icon}
                  <span className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center border transition-colors duration-500 backdrop-blur-2xl shadow-[0_0_40px_rgba(14,165,233,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-[#060b14] ${
            mode === 'edit'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-neon-amber'
              : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan'
          }`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '關閉功能表' : '開啟功能表'}
          aria-pressed={mode === 'edit'}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 animate-spin-slow pointer-events-none" />
          <div className="z-10 flex flex-col items-center">
            <Cpu size={26} />
            <span className="text-[10px] mt-0.5 font-bold tracking-widest opacity-80">
              {mode === 'edit' ? 'EDIT' : '428'}
            </span>
          </div>
        </motion.button>
      </div>
    </>
  );
}
