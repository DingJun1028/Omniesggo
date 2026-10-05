import React from 'react';
import Link from 'next/link';
import { Shield, BrainCircuit, FileSearch, CheckCircle2, UploadCloud, FileText } from 'lucide-react';

export default function OmniParserPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden p-6 md:p-10">
      {/* Liquid Glass Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                <Shield className="w-3 h-3 text-rose-400" />
                <span className="text-xs font-semibold text-rose-400 tracking-widest uppercase">A03 · Parser & Verifier</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-rose-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                OmniParser 工站
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-base">
              本地文件解析 · OCR 識別 · 5T 稽核驗證
            </p>
          </div>
          
          <div className="flex gap-4">
             <Link href="/omni" className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">返回 OmniCenter</span>
             </Link>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Upload & Queue */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/40 border border-slate-700/50 hover:border-rose-500/30 rounded-2xl p-6 backdrop-blur-md transition-colors text-center border-dashed">
               <UploadCloud className="w-10 h-10 text-rose-400 mx-auto mb-3" />
               <h3 className="text-sm font-semibold text-slate-200">上傳永續報告書</h3>
               <p className="text-xs text-slate-500 mt-1 mb-4">支援 PDF, DOCX, CSV 格式</p>
               <button className="bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 hover:border-rose-500/50 text-xs font-bold py-2 px-6 rounded-lg transition-all">
                 選擇檔案
               </button>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileSearch className="w-4 h-4" /> 解析佇列
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs text-slate-300 font-medium">2025_ESG_Report.pdf</div>
                      <div className="text-[10px] text-slate-500">處理中... 45%</div>
                    </div>
                  </div>
                  <div className="w-4 h-4 border-2 border-rose-500/20 border-t-rose-400 rounded-full animate-spin" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: 5T Audit Checklist */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" /> 5T 合規驗證儀表板
            </h2>
            
            <div className="space-y-4">
              {[
                { name: 'Traceable (可溯源)', desc: '確認所有數據來源皆附帶 Source_Origin', status: '待檢測', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { name: 'Transparent (透明度)', desc: '演算法與溫室氣體計算公式揭露', status: '待檢測', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { name: 'Tangible (可感知)', desc: '數據圖表與 UI/UX 解析狀態', status: '待檢測', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { name: 'Trustworthy (可信任)', desc: 'ZKP Hash Lock 密碼學封印狀態', status: '待檢測', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { name: 'Trackable (可追蹤)', desc: '全生命週期生命跡象掛載', status: '待檢測', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              ].map(gate => (
                <div key={gate.name} className="flex items-start md:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <div className="pr-4">
                    <h3 className={`text-sm font-bold ${gate.color}`}>{gate.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{gate.desc}</p>
                  </div>
                  <div className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full border ${gate.bg} ${gate.color} border-current/20`}>
                    {gate.status}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800/60 flex justify-end">
               <button className="bg-slate-800 text-slate-400 border border-slate-700 font-bold py-2.5 px-6 rounded-xl cursor-not-allowed opacity-50 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> 產生合規憑證 (Locked)
               </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
