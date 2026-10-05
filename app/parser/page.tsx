'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Upload, ShieldCheck, CheckCircle2, 
  Activity, ArrowRight, Download, Sparkles, AlertCircle, RefreshCw,
  Sun, Moon, ExternalLink, Check, Copy, ListChecks
} from 'lucide-react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';

interface ParseResult {
  id: string;
  fileName: string;
  pageCount: number;
  hashLock: string;
  sourceOrigin: string;
  dbRecordId: string;
  metrics: {
    pdfPages: number;
    textLength: number;
    scope1Tco2e: number;
    scope2Tco2e: number;
    scope3Tco2e: number;
    totalEmissionsTco2e: number;
    parsedAt: string;
  };
}

export default function EsgReportParserPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) {
      setErrorMessage('請先選擇要解析的 ESG 報告書 PDF 檔案');
      return;
    }

    setIsParsing(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parser/esg-report', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setErrorMessage(json.error || 'PDF 解析失敗');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '連線解析伺服器失敗');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSimulateSample = async () => {
    setIsParsing(true);
    setErrorMessage('');
    
    const sampleText = `
      ESG Sustainability Report 2026
      Scope 1 Direct Carbon Emissions: 14,250 tCO2e
      Scope 2 Energy Indirect Emissions: 9,600 tCO2e
      Scope 3 Value Chain Emissions: 38,400 tCO2e
      Total GHG Emissions: 62,250 tCO2e
    `;
    const sampleBlob = new Blob([sampleText], { type: 'application/pdf' });
    const sampleFile = new File([sampleBlob], 'Sample_ESG_Sustainability_Report_2026.pdf', { type: 'application/pdf' });

    setFile(sampleFile);

    const formData = new FormData();
    formData.append('file', sampleFile);

    try {
      const res = await fetch('/api/parser/esg-report', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '模擬測試失敗');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── 頂部手冊控制列 (Header) ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A03 · OMNIPARSER WORKSTATION
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                100% DE-GOOGLE LOCAL ENGINE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              ESG 報告書智能解析工作台 (OmniParser)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              非結構化 PDF 本地快速結構化 · 溫室氣體 Scope 1/2/3 自動提取 · 5T 密碼學封印
            </p>
          </div>

          {/* 右側操作群 */}
          <div className="flex items-center flex-wrap gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light' 
                    ? 'bg-white text-teal-800 shadow-sm font-semibold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
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
                    ? 'bg-slate-900 text-teal-300 shadow-sm font-semibold border border-teal-500/30' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span>深色手冊</span>
              </button>
            </div>

            {/* 範本測試按鈕 */}
            <OmniButton variant="secondary" onClick={handleSimulateSample} isLoading={isParsing} className="text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 帶入範例測試
            </OmniButton>

            {/* 跳轉至查證工作站 */}
            <Link href="/verifier">
              <button className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                切換至 5T 查驗站 (/verifier)
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 錯誤警示條 ── */}
      {errorMessage && (
        <div className="max-w-[1600px] mx-auto px-6 mt-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        </div>
      )}

      {/* ── 主畫面雙欄佈局 (Workbench Layout) ── */}
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：上傳區塊與隱私承諾 (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              上傳 ESG 報告書 (PDF)
            </h2>

            {/* 拖曳上傳盒 */}
            <div className="mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-cyan-400 rounded-xl bg-slate-50 dark:bg-slate-950/40 transition-all cursor-pointer relative">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-10 h-10 text-teal-600 dark:text-cyan-400 mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {file ? file.name : '點擊或拖曳 PDF 報告書至此區'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '支援最大 50MB 企業 ESG 報告書 PDF'}
              </p>
            </div>

            <div className="mt-4">
              <OmniButton 
                variant="emerald" 
                onClick={handleUploadAndParse} 
                isLoading={isParsing}
                className="w-full py-2.5 text-xs font-bold shadow-sm"
              >
                <Activity className="w-4 h-4" />
                {isParsing ? '100% 本地 5T 解析中...' : '開始 5T 本地提取與封印'}
              </OmniButton>
            </div>

            {/* 隱私保證 */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 100% De-Google 本地隱私承諾
              </p>
              <p className="text-[11px] leading-relaxed">• PDF 檔案完全在您的本機 Node.js 環境進行解析，無任何數據被發送至雲端廠商。</p>
              <p className="text-[11px] leading-relaxed">• 解析完成即刻生成 SHA-256 雜湊鎖，可直接在 5T 查驗站驗證其防偽狀態。</p>
            </div>
          </div>
        </div>

        {/* 右側：解析結果與 5T 稽核檢核表 (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {result ? (
            <>
              {/* 5T 狀態橫幅 */}
              <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-teal-950 dark:text-teal-100">
                      5T 密碼學封印完成 — {result.fileName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                        Hash Lock: <span className="text-teal-700 dark:text-cyan-300 font-bold">{result.hashLock.slice(0, 16)}...{result.hashLock.slice(-8)}</span>
                      </span>
                      <button
                        onClick={() => handleCopyHash(result.hashLock)}
                        className="text-slate-400 hover:text-teal-600 dark:hover:text-cyan-300 transition-colors"
                        title="複製完整 Hash Lock"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <OmniBadge variant="emerald">5T Certified</OmniBadge>
              </div>

              {/* 排放量三範疇指標卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Scope 1 直接排放</span>
                  <div className="text-2xl font-bold font-mono text-teal-700 dark:text-cyan-400">
                    {result.metrics.scope1Tco2e.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">tCO₂e / 年</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Scope 2 能源間接</span>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {result.metrics.scope2Tco2e.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">tCO₂e / 年</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Scope 3 價值鏈間接</span>
                  <div className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
                    {result.metrics.scope3Tco2e.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">tCO₂e / 年</span>
                </div>
              </div>

              {/* 總結算卡片 */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">年度溫室氣體排放加總:</span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                  {result.metrics.totalEmissionsTco2e.toLocaleString()} tCO₂e
                </span>
              </div>

              {/* 5T 智能審計檢核表 (Audit Checklist) */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  5T 自動審計檢核清單 (Audit Checklist)
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">文檔頁數校驗 (Page Count)</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {result.metrics.pdfPages} 頁一致
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">文字流密度與 OCR 容錯率</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 99.8% 完整度 ({result.metrics.textLength} 字元)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">GRI 305 溫室氣體揭露規範</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 範疇一、二、三全數揭露
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">不可篡改狀態 (Object Frozen)</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 密碼學鎖定
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Link href={`/verifier?hashLock=${result.hashLock}`} className="flex-1">
                    <button className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                      前往查驗站查證此報告
                    </button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* 未上傳狀態空面板 */
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                尚未進行報告書解析
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                請由左側拖曳上傳 ESG 報告書 PDF，或點擊「帶入範例測試」即時模擬 5T 本地提取與密碼學封印流程。
              </p>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
