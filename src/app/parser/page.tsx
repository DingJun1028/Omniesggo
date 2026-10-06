'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, BrainCircuit, FileSearch, CheckCircle2, 
  UploadCloud, FileText, Sun, Moon, ArrowRight,
  Sparkles, ShieldAlert, Cpu
} from 'lucide-react';

export default function OmniParserPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fileStatus, setFileStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  // Mock upload handler
  const handleUploadClick = () => {
    if (fileStatus !== 'idle') return;
    setFileStatus('uploading');
    setProgress(0);
    
    // Simulate upload and process
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setFileStatus('done');
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans relative overflow-x-hidden ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Liquid Glass Background Effects */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${isDark ? 'bg-cyan-500/10' : 'bg-teal-500/10'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${isDark ? 'bg-emerald-500/5' : 'bg-cyan-500/5'}`} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 p-6 md:p-10">
        
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/90 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-500/30 transition-colors">
                <Cpu className="w-3.5 h-3.5" />
                A03 · PARSER & VERIFIER
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Shield className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              OmniParser 工站
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm md:text-base font-medium">
              本地文件解析引擎 · 視覺 OCR 識別 · 5T 協議稽核驗證
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner transition-colors">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !isDark ? 'bg-white text-cyan-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>淺色</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isDark ? 'bg-slate-900 text-cyan-300 shadow-sm font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-cyan-300" />
                <span>深色</span>
              </button>
            </div>

            <Link href="/omni" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl transition-all shadow-sm">
              <BrainCircuit className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">返回 OmniCenter</span>
            </Link>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Upload & Queue */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Box */}
            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 hover:border-cyan-400/50 rounded-2xl p-6 backdrop-blur-md transition-all shadow-sm text-center border-dashed group">
               <UploadCloud className="w-12 h-12 text-cyan-500 dark:text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
               <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">上傳永續報告書 / 碳盤查清冊</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">支援 PDF, DOCX, CSV 格式 · 檔案最大 50MB</p>
               <button 
                 onClick={handleUploadClick}
                 disabled={fileStatus !== 'idle'}
                 className="w-full justify-center bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-slate-800 dark:hover:bg-cyan-900/30 dark:text-cyan-400 dark:border-slate-700 dark:hover:border-cyan-500/50 text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {fileStatus === 'idle' ? '選擇檔案' : fileStatus === 'done' ? '上傳成功' : '上傳中...'}
               </button>
            </div>
            
            {/* Queue Box */}
            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 backdrop-blur-md shadow-sm transition-colors">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileSearch className="w-4 h-4" /> 解析佇列狀態
              </h3>
              
              <div className="space-y-3">
                {fileStatus !== 'idle' ? (
                  <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">2026_ESG_Report_Draft.pdf</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {fileStatus === 'done' ? '解析完成' : `Ollama L-Hub 處理中... ${progress}%`}
                          </div>
                        </div>
                      </div>
                      {fileStatus === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    目前佇列為空
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: 5T Audit Checklist */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> 
                5T 協議自動稽核儀表板
              </h2>
              {fileStatus === 'done' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> 掃描完成
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Traceable (可溯源)', desc: '確認所有數據來源皆附帶 Source_Origin', status: fileStatus === 'done' ? '通過' : '待檢測', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
                { name: 'Transparent (透明度)', desc: '演算法與溫室氣體計算公式揭露', status: fileStatus === 'done' ? '通過' : '待檢測', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { name: 'Tangible (可感知)', desc: '數據圖表與 UI/UX 解析狀態', status: fileStatus === 'done' ? '通過' : '待檢測', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { name: 'Trustworthy (可信任)', desc: 'ZKP Hash Lock 密碼學封印狀態', status: fileStatus === 'done' ? '通過' : '待檢測', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                { name: 'Trackable (可追蹤)', desc: '全生命週期生命跡象掛載', status: fileStatus === 'done' ? '通過' : '待檢測', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
              ].map(gate => (
                <div key={gate.name} className="flex items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group">
                  <div className="pr-4">
                    <h3 className={`text-sm font-extrabold ${gate.color}`}>{gate.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{gate.desc}</p>
                  </div>
                  <div className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full border ${gate.bg} ${gate.color} ${fileStatus === 'done' ? 'border-current/40' : 'border-current/20'} transition-all`}>
                    {gate.status}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 flex justify-end">
               <button 
                 disabled={fileStatus !== 'done'}
                 className={`font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-sm
                   ${fileStatus === 'done' 
                     ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-transparent' 
                     : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed opacity-70'
                   }`}
               >
                 {fileStatus === 'done' ? (
                   <>產生合規憑證 <ArrowRight className="w-4 h-4" /></>
                 ) : (
                   <><CheckCircle2 className="w-4 h-4" /> 等待解析完成</>
                 )}
               </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
