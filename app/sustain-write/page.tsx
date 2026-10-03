'use client';
import { useState } from 'react';
import { OmniCard, OmniCardContent, OmniCardHeader, OmniCardTitle } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';
import { FileText, Database, Wand2, Eye, Download, CheckCircle2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function SustainWritePage() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateGeneration = () => {
    setIsGenerating(true);
    setStep(4);
    setProgress(0);
    
    // Simulate massive 280k words streaming generation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setStep(5);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 400);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-emerald-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 -mt-20 -ml-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
              萬能永續報告產生器 (Omni Sustain-Write)
            </h1>
            <div className="text-sm text-emerald-100/60 font-medium mt-1">
              支援 28 萬字超長文本結構化生成 · RAG 數據對接 · 圖文並茂自動排版
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full -z-10 transition-all duration-700"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
          {[
            { icon: FileText, label: '框架與大綱' },
            { icon: Database, label: '智庫數據對接' },
            { icon: Wand2, label: '視覺與樣式' },
            { icon: Loader2, label: '巨量生成與排版' },
            { icon: Eye, label: '預覽與導出' }
          ].map((s, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isPassed = step > num;
            return (
              <div key={num} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                  isPassed ? 'bg-emerald-500 border-emerald-500 text-slate-950' :
                  'bg-slate-900 border-slate-700 text-slate-500'
                }`}>
                  <s.icon size={18} className={isActive && num === 4 && isGenerating ? 'animate-spin' : ''} />
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-400' : isPassed ? 'text-emerald-500/80' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <OmniCard glow className="min-h-[500px]">
        <OmniCardHeader>
          <OmniCardTitle>
            {step === 1 && '步驟一：定義報告框架與生成大綱'}
            {step === 2 && '步驟二：OmniBrain RAG 數據對接'}
            {step === 3 && '步驟三：圖文並茂視覺設定'}
            {step === 4 && '步驟四：AI 巨量非同步生成中...'}
            {step === 5 && '步驟五：萬能報告生成完成'}
          </OmniCardTitle>
        </OmniCardHeader>
        <OmniCardContent className="flex flex-col h-full">
          
          {step === 1 && (
            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['GRI 2021', 'SASB', 'TCFD', 'IFRS S1/S2', 'CSRD'].map((framework) => (
                  <div key={framework} className="border border-slate-700 rounded-xl p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-200">{framework}</span>
                      <div className="w-4 h-4 rounded-full border border-slate-500 group-hover:border-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-500">標準合規模組與章節結構</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-slate-300 mb-2">預計生成規模 (Omni-Scale)</h4>
                <p className="text-xs text-emerald-400">已啟用超大文本模式 (Max Chunking)。目標產出：約 280,000 字全架構報告。</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <Database className="text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">已成功對接 OmniBrain</h4>
                  <p className="text-xs text-slate-400">系統將自動調用 2025 年度所有水電單據、碳盤查數據、員工訓練紀錄與治理會議紀錄。</p>
                </div>
                <OmniBadge variant="success" className="ml-auto">連線穩定</OmniBadge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-2xl font-black text-slate-200 mb-1">1,402</div>
                  <div className="text-xs text-slate-500">引用的資料節點 (Nodes)</div>
                </div>
                <div className="border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-2xl font-black text-slate-200 mb-1">98.7%</div>
                  <div className="text-xs text-slate-500">ZKP 證據覆蓋率</div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">圖表生成策略</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <input type="checkbox" defaultChecked className="accent-emerald-500" />
                      <span className="text-sm text-slate-300">自動生成數據視覺化圖表 (D3.js / Recharts)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <input type="checkbox" defaultChecked className="accent-emerald-500" />
                      <span className="text-sm text-slate-300">智慧配圖 (情境攝影集與插畫)</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">排版引擎</h4>
                  <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="text-emerald-400" size={18} />
                      <span className="font-bold text-emerald-400">Liquid Layout v2</span>
                    </div>
                    <p className="text-xs text-slate-400">圖文並茂專用引擎，支援自動分頁、孤字控制與高解析度 PDF 輸出準備。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <div className="relative w-48 h-48 mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" 
                    className="text-emerald-500 transition-all duration-300"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * progress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-400">{progress}%</span>
                  <span className="text-xs text-slate-500 mt-1">
                    已生成 {Math.floor(280000 * (progress / 100)).toLocaleString()} 字
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                正在進行跨章節語意連貫檢查與圖表渲染...
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-100 mb-2">生成完畢！</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  已成功透過 RAG 與 Omni-Scale 引擎產出包含 12 個章節、總計 283,412 字，並涵蓋 45 張視覺化圖表的 2025 萬能永續報告。
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <OmniButton variant="secondary" size="lg" className="gap-2">
                  <Eye size={18} />
                  進入萬能預覽模式
                </OmniButton>
                <OmniButton variant="primary" size="lg" className="gap-2">
                  <Download size={18} />
                  匯出 5T 數位憑證 PDF
                </OmniButton>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto pt-6 flex justify-between border-t border-slate-800">
            <OmniButton 
              variant="ghost" 
              disabled={step === 1 || isGenerating || step === 5}
              onClick={() => setStep(s => s - 1)}
            >
              上一步
            </OmniButton>
            
            {step < 3 ? (
              <OmniButton 
                variant="primary" 
                onClick={() => setStep(s => s + 1)}
              >
                下一步
              </OmniButton>
            ) : step === 3 ? (
              <OmniButton 
                variant="secondary"
                onClick={simulateGeneration}
                className="shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <Wand2 size={16} className="mr-2" />
                開始萬能生成 (28萬字)
              </OmniButton>
            ) : (
              <div /> // Placeholder for layout
            )}
          </div>
        </OmniCardContent>
      </OmniCard>
    </div>
  );
}
