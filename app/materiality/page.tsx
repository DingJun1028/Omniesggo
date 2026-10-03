'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, ShieldCheck, Download, Save, RefreshCw, 
  Layers, Info, FileText, CheckCircle2, Sparkles, HelpCircle 
} from 'lucide-react';
import { MaterialityTopic, DEFAULT_TOPICS } from '../api/materiality/assess/route';

export default function MaterialityPage() {
  const [topics, setTopics] = useState<MaterialityTopic[]>(DEFAULT_TOPICS);
  const [title, setTitle] = useState('雙重重大性評估矩陣 2026');
  const [year, setYear] = useState(2026);
  const [framework, setFramework] = useState('GRI_CSRD');
  const [threshold, setThreshold] = useState(3.5);
  const [selectedTopic, setSelectedTopic] = useState<MaterialityTopic | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    id: string;
    hashLock: string;
    message: string;
    createdAt: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 載入最新紀錄
  useEffect(() => {
    fetchLatestAssessment();
  }, []);

  const fetchLatestAssessment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/materiality/assess');
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.topics) setTopics(json.data.topics);
        if (json.data.title) setTitle(json.data.title);
        if (json.data.year) setYear(json.data.year);
        if (json.data.framework) setFramework(json.data.framework);
        if (json.data.threshold) setThreshold(json.data.threshold);
        if (json.data.hashLock) {
          setSaveResult({
            id: json.data.id,
            hashLock: json.data.hashLock,
            message: '已成功載入最新 5T 密碼學封印紀錄',
            createdAt: json.data.createdAt,
          });
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (id: string, field: 'impactScore' | 'financialScore', value: number) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleRationaleChange = (id: string, rationale: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, rationale } : t))
    );
  };

  const handleSaveAssessment = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/materiality/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          year,
          framework,
          threshold,
          topics,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSaveResult({
          id: json.data.id,
          hashLock: json.data.hashLock,
          message: json.data.message,
          createdAt: json.data.createdAt,
        });
      } else {
        setErrorMessage(json.error || '儲存失敗');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '連線伺服器失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCertificate = () => {
    if (!saveResult?.id) return;
    window.open(`/api/materiality/export/${saveResult.id}`, '_blank');
  };

  // 計算重大議題
  const materialTopics = topics.filter(
    (t) => t.impactScore >= threshold && t.financialScore >= threshold
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      
      {/* ── Top Navigation Header ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              EU CSRD & GRI 3 Compliant
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              5T Protocol Sealed
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            雙重重大性矩陣評估 (Double Materiality Assessment)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            結合衝擊重大性 (Impact Materiality) 與財務重大性 (Financial Materiality)，經 5T 密碼學 Hash Lock 封印。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLatestAssessment}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={handleSaveAssessment}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '5T 刻印中...' : '封印 5T 雜湊鎖'}
          </button>
          {saveResult?.id && (
            <button
              onClick={handleExportCertificate}
              className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-sm font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Download className="w-4 h-4" />
              匯出 5T 稽核證書
            </button>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {saveResult && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-cyan-200">{saveResult.message}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Hash Lock: <span className="text-cyan-400">{saveResult.hashLock}</span>
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            刻印時間: {new Date(saveResult.createdAt).toLocaleString('zh-TW')}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* ── Main Layout: Scatter Plot & Topic Evaluator ── */}
      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Double Materiality Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-2xl flex flex-col shadow-[0_0_30px_rgba(2,6,23,0.5)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-lg text-slate-100">雙重重大性散佈矩陣 (Matrix Plot)</h2>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> E 環境
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> S 社會
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> G 治理
              </div>
            </div>
          </div>

          {/* Matrix Plot Container */}
          <div className="relative w-full aspect-square max-h-[480px] my-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-8 overflow-hidden select-none">
            
            {/* Quadrant Lines */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-slate-800/60 p-2 text-[10px] text-slate-600 font-mono">次要議題區</div>
              <div className="border-b border-slate-800/60 p-2 text-[10px] text-cyan-900 font-mono text-right">衝擊導向關注區</div>
              <div className="border-r border-slate-800/60 p-2 text-[10px] text-emerald-900 font-mono">財務導向關注區</div>
              <div className="bg-gradient-to-br from-cyan-950/30 to-emerald-950/30 p-2 text-[10px] text-cyan-400 font-bold font-mono text-right flex flex-col justify-end items-end">
                <span>⭐ 高度雙重重大區域</span>
                <span className="text-[9px] text-cyan-500/70 font-normal">Score ≥ {threshold}</span>
              </div>
            </div>

            {/* Threshold Line Indicators */}
            <div 
              className="absolute left-0 right-0 border-t border-dashed border-cyan-500/40 pointer-events-none"
              style={{ bottom: `${((threshold - 1) / 4) * 100}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 border-l border-dashed border-cyan-500/40 pointer-events-none"
              style={{ left: `${((threshold - 1) / 4) * 100}%` }}
            />

            {/* Axis Labels */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-slate-400 tracking-wider">
              財務重大性 (Financial Materiality) ➔
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-400 tracking-wider">
              衝擊重大性 (Impact Materiality) ➔
            </div>

            {/* Topic Nodes */}
            {topics.map((t) => {
              const leftPercent = Math.min(Math.max(((t.impactScore - 1) / 4) * 100, 5), 92);
              const bottomPercent = Math.min(Math.max(((t.financialScore - 1) / 4) * 100, 5), 92);
              const isMaterial = t.impactScore >= threshold && t.financialScore >= threshold;
              const isSelected = selectedTopic?.id === t.id;

              let bgColor = t.category === 'E' ? 'bg-emerald-500' : t.category === 'S' ? 'bg-cyan-500' : 'bg-amber-500';
              let shadowColor = t.category === 'E' ? 'shadow-emerald-500/50' : t.category === 'S' ? 'shadow-cyan-500/50' : 'shadow-amber-500/50';

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  style={{ left: `${leftPercent}%`, bottom: `${bottomPercent}%` }}
                  className={`
                    absolute -translate-x-1/2 translate-y-1/2 cursor-pointer transition-all duration-300 group z-10
                    ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'}
                  `}
                >
                  <div className={`
                    w-7 h-7 rounded-full ${bgColor} text-slate-950 font-bold text-xs flex items-center justify-center
                    shadow-lg ${shadowColor} border-2 ${isMaterial ? 'border-white animate-pulse' : 'border-slate-800'}
                  `}>
                    {t.category}
                  </div>
                  
                  {/* Tooltip Label */}
                  <div className={`
                    absolute left-1/2 -translate-x-1/2 bottom-8 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium
                    bg-slate-900/95 border border-cyan-500/40 text-slate-200 pointer-events-none transition-all shadow-xl
                    ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95'}
                  `}>
                    {t.name}
                    <div className="text-[9px] text-cyan-400 font-mono">
                      (Impact: {t.impactScore} · Fin: {t.financialScore})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">總評估議題數</span>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{topics.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <span className="text-xs text-cyan-300">高度重大議題</span>
              <p className="text-xl font-bold text-cyan-400 mt-0.5">{materialTopics.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">門檻臨界值</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-sm font-bold text-slate-200 py-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Topic Score Evaluator & Sliders (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Selected / Topic Evaluator Panel */}
          <div className="bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(2,6,23,0.5)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-slate-100">議題權重評估面板</h3>
              </div>
              <span className="text-xs text-slate-400">點擊點陣圖切換</span>
            </div>

            <div className="mt-4 space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                const isMaterial = t.impactScore >= threshold && t.financialScore >= threshold;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTopic(t)}
                    className={`
                      p-4 rounded-2xl border transition-all duration-300 cursor-pointer
                      ${isSelected 
                        ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-bold
                          ${t.category === 'E' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            t.category === 'S' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'}
                        `}>
                          {t.category}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-200">{t.name}</h4>
                      </div>
                      {isMaterial && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 shrink-0">
                          重大議題
                        </span>
                      )}
                    </div>

                    {/* Sliders Area */}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>衝擊重大性</span>
                          <span className="font-mono font-bold text-cyan-400">{t.impactScore}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={t.impactScore}
                          onChange={(e) => handleScoreChange(t.id, 'impactScore', Number(e.target.value))}
                          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>財務重大性</span>
                          <span className="font-mono font-bold text-emerald-400">{t.financialScore}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={t.financialScore}
                          onChange={(e) => handleScoreChange(t.id, 'financialScore', Number(e.target.value))}
                          className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rationale Text */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={t.rationale}
                        onChange={(e) => handleRationaleChange(t.id, e.target.value)}
                        placeholder="請輸入議題評估依據 (Rationale)..."
                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
