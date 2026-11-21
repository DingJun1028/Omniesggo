'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders, ShieldCheck, Download, Save, RefreshCw,
  Layers, FileText, CheckCircle2, Sparkles, HelpCircle,
  Sun, Moon, Copy, Check, ArrowRight, ExternalLink, Activity
} from 'lucide-react';
import { MaterialityTopic, DEFAULT_TOPICS } from '../api/materiality/assess/route';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';

export default function MaterialityPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [topics, setTopics] = useState<MaterialityTopic[]>(DEFAULT_TOPICS);
  const [title, setTitle] = useState('雙重重大性策略評估矩陣 2026');
  const [year, setYear] = useState(2026);
  const [framework, setFramework] = useState<'GRI_CSRD' | 'ISSB_TCFD' | 'SASB_SECTOR'>('GRI_CSRD');
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
  const [copiedHash, setCopiedHash] = useState(false);

  // 初始化主題
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '連線伺服器失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCertificate = () => {
    if (!saveResult?.id) return;
    window.open(`/api/materiality/export/${saveResult.id}`, '_blank');
  };

  const handleExportPdfCertificate = () => {
    if (!saveResult?.id) return;
    window.open(`/api/materiality/export-pdf/${saveResult.id}`, '_blank');
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // 計算雙重重大核心議題
  const materialTopics = topics.filter(
    (t) => t.impactScore >= threshold && t.financialScore >= threshold
  );

  return (
    <div className="min-w-0 w-full space-y-6 bg-[var(--bg)] font-sans text-[var(--text-1)] sm:space-y-8">

      {/* ── 頂部手冊控制列 (Header) ── */}
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 shadow-sm sm:rounded-3xl sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A04 · DOUBLE MATERIALITY WORKBENCH
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                EU CSRD & GRI 2024 COMPLIANT
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-1)] dark:text-[var(--text-1)] flex items-center gap-2">
              <Layers className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              雙重重大性策略評估矩陣 (Double Materiality)
            </h1>
            <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mt-0.5 font-medium">
              衝擊重大性 (內向外) 與財務重大性 (外向內) 雙向動態散佈 · 5T 密碼學 Hash Lock 封印
            </p>
          </div>

          {/* 右側操作群 */}
          <div className="flex items-center flex-wrap gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-[var(--surface-3)] border border-[var(--border)] dark:border-[var(--border)] shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-[var(--surface-1)] text-teal-800 shadow-sm font-semibold'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] dark:text-[var(--text-3)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>淺色手冊</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-[var(--surface-1)] text-teal-300 shadow-sm font-semibold border border-teal-500/30'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] dark:text-[var(--text-3)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span>深色手冊</span>
              </button>
            </div>

            <OmniButton
              variant="secondary"
              onClick={fetchLatestAssessment}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              刷新紀錄
            </OmniButton>

            <button
              onClick={handleSaveAssessment}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? '5T 封印中...' : '封印並儲存評估'}
            </button>

            {saveResult?.id && (
              <>
                <button
                  onClick={handleExportCertificate}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[var(--text-1)] border border-slate-300 dark:bg-[var(--surface-3)] dark:hover:bg-slate-700 dark:text-[var(--text-1)] dark:border-[var(--border-strong)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--text-3)]" /> JSON
                </button>
                <button
                  onClick={handleExportPdfCertificate}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-1)] hover:bg-slate-50 text-[var(--text-1)] border border-slate-300 dark:bg-[var(--surface-1)] dark:hover:bg-[var(--surface-3)] dark:text-[var(--text-1)] dark:border-[var(--border-strong)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--text-3)]" /> PDF 證書
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 評估設定控制列 (Assessment Control Bar) ── */}
      <div className="max-w-6xl mx-auto px-6 pt-5">
        <div className="p-4 rounded-2xl bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">

          <div className="flex flex-wrap items-center gap-4">
            {/* 年度設定 */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-2)] dark:text-[var(--text-2)]">評估年度:</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[var(--bg)] border border-slate-300 dark:border-[var(--border-strong)] font-bold text-teal-800 dark:text-cyan-300 focus:outline-none"
              >
                <option value={2025}>2025 年度</option>
                <option value={2026}>2026 年度</option>
                <option value={2027}>2027 年度</option>
              </select>
            </div>

            {/* 準則選擇 */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-2)] dark:text-[var(--text-2)]">標準框架:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-[var(--surface-3)] p-1 rounded-lg">
                {[
                  { id: 'GRI_CSRD', label: 'GRI + CSRD (ESRS)' },
                  { id: 'ISSB_TCFD', label: 'ISSB (IFRS S1/S2)' },
                  { id: 'SASB_SECTOR', label: 'SASB 產業標準' }
                ].map(fw => (
                  <button
                    key={fw.id}
                    onClick={() => setFramework(fw.id as any)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                      framework === fw.id
                        ? 'bg-[var(--surface-1)] text-teal-800 shadow-sm dark:bg-[var(--surface-1)] dark:text-cyan-300'
                        : 'text-[var(--text-3)] hover:text-[var(--text-2)] dark:text-[var(--text-3)]'
                    }`}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 重大性門檻滑桿 */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--text-2)] dark:text-[var(--text-2)]">重大門檻閥值:</span>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-32 accent-teal-600 dark:accent-cyan-400 bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-lg cursor-pointer"
            />
            <span className="font-mono font-bold text-sm text-teal-700 dark:text-cyan-400 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-500/30">
              ≥ {threshold.toFixed(1)}
            </span>
          </div>

        </div>
      </div>

      {/* ── 封印狀態通知 ── */}
      {saveResult && (
        <div className="max-w-[1600px] mx-auto px-6 mt-4">
          <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-cyan-400 shrink-0" />
              <div>
                <p className="font-bold text-teal-900 dark:text-teal-200">{saveResult.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[11px] text-[var(--text-3)] dark:text-[var(--text-2)]">
                    Hash Lock: <span className="font-bold text-teal-700 dark:text-cyan-300">{saveResult.hashLock}</span>
                  </span>
                  <button
                    onClick={() => handleCopyHash(saveResult.hashLock)}
                    className="text-[var(--text-3)] hover:text-teal-600 dark:hover:text-cyan-300 transition-colors"
                    title="複製 Hash Lock"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)] font-mono">
              刻印時間: {new Date(saveResult.createdAt).toLocaleString('zh-TW')}
            </span>
          </div>
        </div>
      )}

      {/* ── 主畫面佈局 (Matrix & Sliders) ── */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-0 sm:gap-6 lg:grid-cols-12">

        {/* 左側：2D 雙重重大性散佈矩陣圖 (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--border)]">
            <h2 className="font-bold text-sm text-[var(--text-1)] dark:text-[var(--text-1)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              2D 雙重重大性散佈圖 (Scatter Plot)
            </h2>
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> E 環境
              </div>
              <div className="flex items-center gap-1.5 text-teal-700 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-cyan-400" /> S 社會
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> G 治理
              </div>
            </div>
          </div>

          {/* 矩陣繪製容器 */}
          <div className="relative w-full aspect-square max-h-[520px] my-6 bg-slate-100/90 dark:bg-[var(--surface-1)]/90 border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-8 overflow-hidden select-none">

            {/* 四象限劃分 */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-slate-300 dark:border-[var(--border)] p-2 text-[10px] text-[var(--text-3)] dark:text-[var(--text-3)] font-mono">
                定期監測區 (Low Priority)
              </div>
              <div className="border-b border-slate-300 dark:border-[var(--border)] p-2 text-[10px] text-teal-700 dark:text-cyan-900 font-mono text-right">
                衝擊導向關注區 (Impact-Led)
              </div>
              <div className="border-r border-slate-300 dark:border-[var(--border)] p-2 text-[10px] text-emerald-700 dark:text-emerald-900 font-mono">
                財務導向關注區 (Financial-Led)
              </div>
              <div className="bg-teal-500/10 dark:bg-cyan-950/30 p-2 text-[10px] text-teal-800 dark:text-cyan-300 font-bold font-mono text-right flex flex-col justify-end items-end">
                <span>⭐ 雙重重大核心區域 (Double Material)</span>
                <span className="text-[9px] text-teal-600 dark:text-cyan-500/70 font-normal">Score ≥ {threshold}</span>
              </div>
            </div>

            {/* 門檻指示虛線 */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-teal-500/60 dark:border-cyan-500/50 pointer-events-none transition-all duration-300"
              style={{ bottom: `${((threshold - 1) / 4) * 100}%` }}
            />
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-teal-500/60 dark:border-cyan-500/50 pointer-events-none transition-all duration-300"
              style={{ left: `${((threshold - 1) / 4) * 100}%` }}
            />

            {/* 坐標軸標籤 */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-[var(--text-3)] dark:text-[var(--text-3)] tracking-wider">
              財務重大性 (Financial Materiality) ➔
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[var(--text-3)] dark:text-[var(--text-3)] tracking-wider">
              衝擊重大性 (Impact Materiality) ➔
            </div>

            {/* 議題散佈節點 */}
            {topics.map((t) => {
              const leftPercent = Math.min(Math.max(((t.impactScore - 1) / 4) * 100, 5), 92);
              const bottomPercent = Math.min(Math.max(((t.financialScore - 1) / 4) * 100, 5), 92);
              const isMaterial = t.impactScore >= threshold && t.financialScore >= threshold;
              const isSelected = selectedTopic?.id === t.id;

              const bgColor = t.category === 'E'
                ? 'bg-emerald-500 text-white'
                : t.category === 'S'
                ? 'bg-teal-600 dark:bg-cyan-400 text-white dark:text-slate-950'
                : 'bg-amber-500 text-white';

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
                    w-7 h-7 rounded-full ${bgColor} font-black text-xs flex items-center justify-center
                    shadow-md border-2 ${isMaterial ? 'border-white ring-2 ring-teal-500 dark:ring-cyan-400' : 'border-[var(--border)] dark:border-[var(--border-strong)]'}
                  `}>
                    {t.category}
                  </div>

                  {/* Tooltip 浮動標籤 */}
                  <div className={`
                    absolute left-1/2 -translate-x-1/2 bottom-8 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium
                    bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-1)] pointer-events-none transition-all shadow-xl
                    ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95'}
                  `}>
                    {t.name}
                    <div className="text-[9px] text-teal-300 dark:text-cyan-400 font-mono">
                      (衝擊: {t.impactScore} · 財務: {t.financialScore})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 統計指標底列 */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-[var(--border)] text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg)]/60 border border-[var(--border)] dark:border-[var(--border)]">
              <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">總評估議題數</span>
              <p className="text-xl font-bold font-mono text-[var(--text-1)] dark:text-[var(--text-1)] mt-0.5">{topics.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30">
              <span className="text-xs text-teal-800 dark:text-teal-300">雙重重大核心議題</span>
              <p className="text-xl font-bold font-mono text-teal-700 dark:text-cyan-400 mt-0.5">{materialTopics.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg)]/60 border border-[var(--border)] dark:border-[var(--border)]">
              <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">篩選標準門檻</span>
              <p className="text-xl font-bold font-mono text-[var(--text-1)] dark:text-[var(--text-1)] mt-0.5">≥ {threshold.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* 右側：議題評估工作台與滑桿控制 (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--border)] mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-[var(--text-1)] dark:text-[var(--text-1)]">議題量化評估面板</h3>
            </div>
            <span className="text-[11px] text-[var(--text-3)] font-mono">點擊散佈點切換選取</span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {topics.map((t) => {
              const isSelected = selectedTopic?.id === t.id;
              const isMaterial = t.impactScore >= threshold && t.financialScore >= threshold;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  className={`
                    p-3.5 rounded-xl border transition-all cursor-pointer text-xs
                    ${isSelected
                      ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 dark:border-teal-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-[var(--surface-1)]/80 border-[var(--border)] dark:border-[var(--border)] hover:border-slate-300 dark:hover:border-[var(--border-strong)]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] font-bold font-mono
                        ${t.category === 'E' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          t.category === 'S' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}
                      `}>
                        {t.category}
                      </span>
                      <h4 className="font-bold text-xs text-[var(--text-1)] dark:text-[var(--text-1)]">{t.name}</h4>
                    </div>
                    {isMaterial && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                        重大議題
                      </span>
                    )}
                  </div>

                  {/* 滑桿調節 */}
                  <div className="grid grid-cols-2 gap-3 mt-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)] mb-0.5">
                        <span>衝擊重大性</span>
                        <span className="font-mono font-bold text-teal-700 dark:text-cyan-400">{t.impactScore}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={t.impactScore}
                        onChange={(e) => handleScoreChange(t.id, 'impactScore', Number(e.target.value))}
                        className="w-full accent-teal-600 dark:accent-cyan-400 bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)] mb-0.5">
                        <span>財務重大性</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{t.financialScore}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={t.financialScore}
                        onChange={(e) => handleScoreChange(t.id, 'financialScore', Number(e.target.value))}
                        className="w-full accent-emerald-600 dark:accent-emerald-400 bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 實證依據 (Rationale) */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={t.rationale || ''}
                      onChange={(e) => handleRationaleChange(t.id, e.target.value)}
                      placeholder="請輸入評估依據與實證說明 (Rationale)..."
                      className="w-full text-[11px] bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-slate-300 dark:border-[var(--border)] rounded-lg px-2.5 py-1 text-[var(--text-1)] dark:text-[var(--text-1)] focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>
    </div>
  );
}
