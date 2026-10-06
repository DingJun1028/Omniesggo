'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, ShieldCheck, Download, SlidersHorizontal, Info, Target, TrendingUp, AlertTriangle, Crosshair, Settings2, FileText
} from 'lucide-react';

// ── 核心模型定義 ───────────────────────────────────────────────────────────
interface MaterialityTopic {
  id: string;
  name: string;
  category: 'E' | 'S' | 'G';
  impactScore: number; // 衝擊重大性 (X) 1.0 - 5.0
  financialScore: number; // 財務重大性 (Y) 1.0 - 5.0
  rationale: string;
}

const INITIAL_TOPICS: MaterialityTopic[] = [
  { id: 'E1', name: '氣候變遷與減碳', category: 'E', impactScore: 4.8, financialScore: 4.5, rationale: '面臨嚴格碳費法規與極端氣候中斷營運風險。' },
  { id: 'E2', name: '水資源與循環經濟', category: 'E', impactScore: 3.5, financialScore: 3.2, rationale: '製程高耗水，但已建置水回收系統降低衝擊。' },
  { id: 'S1', name: '職業安全衛生', category: 'S', impactScore: 4.5, financialScore: 3.8, rationale: '工安意外將導致停工與高額裁罰。' },
  { id: 'S2', name: '多元共融與人權', category: 'S', impactScore: 3.2, financialScore: 2.5, rationale: '供應鏈稽核日益嚴格，但不構成短期財務威脅。' },
  { id: 'G1', name: '商業道德與反貪腐', category: 'G', impactScore: 4.2, financialScore: 4.6, rationale: '跨國營運需遵守各國反貪腐法案，違規成本極高。' },
  { id: 'G2', name: '數據隱私與資安', category: 'G', impactScore: 4.9, financialScore: 4.9, rationale: '勒索軟體頻發，資料外洩將造成商譽毀滅與訴訟。' },
  { id: 'E3', name: '生物多樣性', category: 'E', impactScore: 2.1, financialScore: 1.5, rationale: '營運廠區非敏感棲地。' },
];

export default function MaterialityPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [threshold, setThreshold] = useState<number>(3.5);
  const [topics, setTopics] = useState<MaterialityTopic[]>(INITIAL_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<MaterialityTopic | null>(null);
  const [isSealing, setIsSealing] = useState(false);
  const [hashLock, setHashLock] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSeal = async () => {
    setIsSealing(true);
    try {
      const res = await fetch('/api/materiality/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, threshold, year: 2026 })
      });
      const data = await res.json();
      if (data.success) {
        setHashLock(data.data.hashLock);
      } else {
        console.error('Failed to seal:', data.error);
        alert('封印失敗：' + data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('網路異常，封印失敗');
    } finally {
      setIsSealing(false);
    }
  };

  const getCategoryColor = (cat: 'E'|'S'|'G', isSelected: boolean) => {
    if (cat === 'E') return isSelected ? 'fill-emerald-500 stroke-white dark:stroke-emerald-900 stroke-2' : 'fill-emerald-400 dark:fill-emerald-500/80';
    if (cat === 'S') return isSelected ? 'fill-sky-500 stroke-white dark:stroke-sky-900 stroke-2' : 'fill-sky-400 dark:fill-sky-500/80';
    if (cat === 'G') return isSelected ? 'fill-amber-500 stroke-white dark:stroke-amber-900 stroke-2' : 'fill-amber-400 dark:fill-amber-500/80';
  };

  // SVG 座標轉換 (1.0-5.0 轉 0-100%)
  const toCoord = (val: number) => ((val - 1) / 4) * 100;
  const thresholdCoord = toCoord(threshold);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── Header Capsule ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-sm">
                A04 · MATERIALITY
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-500/30">
                <Target className="w-3.5 h-3.5" />
                STRATEGY MATRIX
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              雙重重大性策略評估矩陣
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button onClick={() => setTheme('light')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}><Sun className="w-3.5 h-3.5" /> 淺色</button>
              <button onClick={() => setTheme('dark')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-900 text-teal-300 shadow-sm' : 'text-slate-500'}`}><Moon className="w-3.5 h-3.5" /> 深色</button>
            </div>

            <button
              onClick={handleSeal}
              disabled={isSealing || !!hashLock}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {hashLock ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {hashLock ? '已封印存證' : '封印並儲存評估'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {/* Hash Lock 顯示區 */}
        {hashLock && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">資料庫 Hash Lock 封印完成 (不可竄改狀態)</h3>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500/80 mt-1">{hashLock}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：控制列與列表 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4" />
                重大性閥值設定 (Threshold)
              </h2>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="1" max="5" step="0.1" 
                  value={threshold} 
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="flex-1 accent-teal-600 dark:accent-cyan-500"
                />
                <span className="w-12 text-center text-lg font-mono font-black text-slate-900 dark:text-white">
                  {threshold.toFixed(1)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">高於此閥值之議題將自動列為 2026 永續報告書核心揭露事項。</p>
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex-1">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" />
                議題清單
              </h2>
              <div className="space-y-2">
                {topics.map(t => {
                  const isCore = t.impactScore >= threshold && t.financialScore >= threshold;
                  return (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedTopic(t)}
                      className={`p-3 rounded-xl border text-sm cursor-pointer transition-all ${selectedTopic?.id === t.id ? 'border-teal-500 bg-teal-50 dark:bg-cyan-950/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                        {isCore && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" title="核心重大議題" />}
                      </div>
                      <div className="flex gap-3 text-xs font-mono text-slate-500">
                        <span>衝擊: {t.impactScore}</span>
                        <span>財務: {t.financialScore}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 右側：2D 散佈圖與詳情 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-6">
                <Crosshair className="w-4 h-4" />
                動態雙重重大性散佈圖
              </h2>
              
              <div className="relative aspect-square md:aspect-[3/2] w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                {/* 閥值線 (X = 衝擊, Y = 財務) */}
                <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-teal-500/40 z-10 transition-all duration-300" style={{ left: `${thresholdCoord}%` }} />
                <div className="absolute left-0 right-0 border-b-2 border-dashed border-teal-500/40 z-10 transition-all duration-300" style={{ bottom: `${thresholdCoord}%` }} />
                
                {/* 象限標籤 */}
                <div className="absolute top-4 right-4 z-0 text-right opacity-30">
                  <div className="text-xl font-black text-rose-500 uppercase tracking-widest">Core Issues</div>
                  <div className="text-xs font-bold text-slate-500">雙重核心重大</div>
                </div>
                
                {/* SVG 座標系繪製點 */}
                <svg className="absolute inset-0 w-full h-full z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {topics.map(t => {
                    const x = toCoord(t.impactScore);
                    const y = 100 - toCoord(t.financialScore); // SVG Y is inverted
                    const isSelected = selectedTopic?.id === t.id;
                    const isCore = t.impactScore >= threshold && t.financialScore >= threshold;
                    return (
                      <g key={t.id} onClick={() => setSelectedTopic(t)} className="cursor-pointer group">
                        {isCore && <circle cx={x} cy={y} r="3.5" className="fill-rose-500/20 animate-pulse" />}
                        <circle 
                          cx={x} cy={y} 
                          r={isSelected ? "2.5" : "1.5"} 
                          className={`transition-all duration-300 ${getCategoryColor(t.category, isSelected)}`} 
                        />
                        <text x={x} y={y - 3} textAnchor="middle" className={`text-[2px] font-bold transition-all ${isSelected ? 'fill-slate-900 dark:fill-white' : 'fill-slate-500 dark:fill-slate-400 opacity-0 group-hover:opacity-100'}`}>
                          {t.name}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* 座標軸標籤 */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">衝擊重大性 (Impact Materiality) →</div>
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-500">財務重大性 (Financial Materiality) →</div>
              </div>
            </div>

            {/* 編輯抽屜 */}
            {selectedTopic ? (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                    議題論證: {selectedTopic.name}
                  </h3>
                  <span className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
                    ID: {selectedTopic.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">衝擊重大性評分</label>
                    <input type="number" min="1" max="5" step="0.1" value={selectedTopic.impactScore} readOnly className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">財務重大性評分</label>
                    <input type="number" min="1" max="5" step="0.1" value={selectedTopic.financialScore} readOnly className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">評估論證 (Rationale)</label>
                  <textarea 
                    value={selectedTopic.rationale} 
                    readOnly 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm h-24 resize-none text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 border-dashed dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-sm">
                點擊散佈圖中的節點以查看或編輯論證細節。
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
