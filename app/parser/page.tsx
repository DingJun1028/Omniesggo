'use client';

import React, { useState } from 'react';
import { 
  FileText, Upload, ShieldCheck, CheckCircle2, 
  Activity, ArrowRight, Download, Sparkles, AlertCircle, RefreshCw 
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
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
    } catch (err: any) {
      setErrorMessage(err.message || '連線解析伺服器失敗');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSimulateSample = async () => {
    setIsParsing(true);
    setErrorMessage('');
    
    // Create a mock blob to simulate file upload
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
    } catch (err: any) {
      setErrorMessage(err.message || '模擬測試失敗');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      
      {/* ── Top Header ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
              100% De-Google Local PDF Engine
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
              5T Hash Lock Sealed
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
            ESG 永續報告書 PDF 自動解析器 (ESG PDF Parser)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
            無需上傳外部雲端，採用 100% 本地 Node.js 高速提取 Scope 1/2/3 溫室氣體數據並進行 5T 密碼學封印。
          </p>
        </div>

        <OmniButton variant="cyber" onClick={handleSimulateSample} isLoading={isParsing}>
          <Sparkles className="w-4 h-4" /> 帶入範例測試
        </OmniButton>
      </div>

      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* ── Main Layout Grid ── */}
      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload Dropzone (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            上傳 ESG 報告書 (PDF)
          </h2>

          <div className="mt-5 flex flex-col items-center justify-center p-8 border-2 border-dashed border-teal-200 dark:border-cyan-500/30 rounded-xl bg-teal-50/30 dark:bg-slate-950/40 hover:bg-teal-50/60 dark:hover:bg-slate-900/60 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileText className="w-12 h-12 text-teal-600 dark:text-cyan-400 mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {file ? file.name : '點擊或拖曳 PDF 檔案至此區'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '支援最大 50MB 企業 ESG 報告書 PDF'}
            </p>
          </div>

          <div className="mt-5">
            <OmniButton 
              variant="emerald" 
              onClick={handleUploadAndParse} 
              isLoading={isParsing}
              className="w-full py-3 text-sm font-bold shadow-sm"
            >
              <Activity className="w-4 h-4" />
              {isParsing ? '100% 本地 5T 解析中...' : '開始 5T 本地提取與封印'}
            </OmniButton>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-bold text-slate-900 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 100% De-Google 本地隱私承諾
            </p>
            <p>• PDF 檔案完全在您的本機 Node.js 環境進行解析，無任何數據被發送至雲端廠商。</p>
            <p>• 解析結果即刻以 SHA-256 雜湊鎖封印並寫入 Supabase/Prisma 紀錄鏈。</p>
          </div>
        </div>

        {/* Right Column: Parsed Results & Metrics (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {result ? (
            <>
              {/* Status Banner */}
              <div className="p-5 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-base text-cyan-800 dark:text-cyan-200">5T 封印完成 — {result.fileName}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                      Hash Lock: <span className="text-cyan-600 dark:text-cyan-400">{result.hashLock}</span>
                    </p>
                  </div>
                </div>
                <OmniBadge variant="emerald">5T Certified</OmniBadge>
              </div>

              {/* Emissions Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OmniCard variant="glass" glow>
                  <OmniCardHeader>
                    <OmniCardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Scope 1 直接排放
                    </OmniCardTitle>
                  </OmniCardHeader>
                  <OmniCardContent>
                    <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                      {result.metrics.scope1Tco2e.toLocaleString()}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">tCO2e / 年</span>
                  </OmniCardContent>
                </OmniCard>

                <OmniCard variant="glass" glow>
                  <OmniCardHeader>
                    <OmniCardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Scope 2 能源間接
                    </OmniCardTitle>
                  </OmniCardHeader>
                  <OmniCardContent>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {result.metrics.scope2Tco2e.toLocaleString()}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">tCO2e / 年</span>
                  </OmniCardContent>
                </OmniCard>

                <OmniCard variant="glass" glow>
                  <OmniCardHeader>
                    <OmniCardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Scope 3 價值鏈間接
                    </OmniCardTitle>
                  </OmniCardHeader>
                  <OmniCardContent>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {result.metrics.scope3Tco2e.toLocaleString()}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">tCO2e / 年</span>
                  </OmniCardContent>
                </OmniCard>
              </div>

              {/* Total Footprint Summary */}
              <OmniCard variant="cyber" glow>
                <OmniCardHeader>
                  <OmniCardTitle className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-cyan-500" />
                    企業溫室氣體總排放量 (Total GHG Emissions)
                  </OmniCardTitle>
                </OmniCardHeader>
                <OmniCardContent className="space-y-4">
                  <div className="flex items-baseline justify-between p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">總碳足跡估算</span>
                      <p className="text-xs text-slate-400 font-mono">基於 ISO-14064-1 & GRI 溫室氣體盤查通則</p>
                    </div>
                    <div className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-300">
                      {result.metrics.totalEmissionsTco2e.toLocaleString()} <span className="text-base font-normal">tCO2e</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>解析頁數: <span className="text-slate-900 dark:text-slate-200 font-bold">{result.pageCount} 頁</span></div>
                    <div>資料來源印記: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{result.sourceOrigin}</span></div>
                  </div>
                </OmniCardContent>
              </OmniCard>
            </>
          ) : (
            <div className="flex-1 min-h-[420px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-slate-800 flex items-center justify-center text-teal-600 dark:text-cyan-400 mb-4 border border-teal-100 dark:border-white/10">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">等待上傳 ESG 報告書 PDF</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
                請於左側選擇檔案上傳，或點擊右上角「帶入範例測試」開始體驗 100% 本地 5T 自動解析。
              </p>
              
              <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-md text-left">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">標準</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">ISO 14064-1</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">確信層級</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">5T Hash Lock</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">執行環境</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">100% Local</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
