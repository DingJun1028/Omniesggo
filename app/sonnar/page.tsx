'use client';

import React, { useState } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { Search, ShieldAlert, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SonnarIntelligencePage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scraping' | 'analyzing' | 'done' | 'error'>('idle');
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = async () => {
    if (!targetUrl) return;
    
    try {
      setStatus('scraping');
      setErrorMsg('');
      
      // Step 1: Local Scraping (Zero-Cost)
      const crawlRes = await fetch('/api/sonnar/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const crawlData = await crawlRes.json();
      
      const payload = crawlData.success ? crawlData.data : crawlData.fallback;
      setScrapedData(payload);

      if (!payload) throw new Error(crawlData.error || 'Scraping failed');

      // Step 2: Local AI Analysis via Ollama (Zero-Cost)
      setStatus('analyzing');
      const aiRes = await fetch('/api/sonnar/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const aiData = await aiRes.json();
      
      setAnalysis(aiData.success ? aiData.analysis : aiData.fallback);
      setStatus('done');

    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-white/10 pb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-cyan-500/20 border border-teal-200 dark:border-cyan-500/50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Sonnar 威脅情資雷達</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">本地 100% 零成本爬蟲與防漂綠 (Greenwashing) AI 偵測系統</p>
          </div>
        </header>

        {/* Scanner Input */}
        <OmniCard className="p-6">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            啟動全域掃描
          </h2>
          <div className="flex gap-4">
            <input 
              type="url"
              placeholder="輸入企業公開 ESG 報告或新聞網址 (例如: https://example.com/esg-2025)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={status === 'scraping' || status === 'analyzing'}
            />
            <OmniButton 
              onClick={handleScan}
              disabled={!targetUrl || status === 'scraping' || status === 'analyzing'}
              className="px-8"
            >
              {status === 'scraping' ? '爬取資料中...' : status === 'analyzing' ? 'Ollama 分析中...' : '發射探測波'}
            </OmniButton>
          </div>
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-950/50 border border-red-500/50 text-red-400 rounded-lg text-sm">
              系統錯誤: {errorMsg}
            </div>
          )}
        </OmniCard>

        {/* Status Tracker */}
        {status !== 'idle' && (
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className={`flex items-center gap-2 ${status === 'scraping' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              本地端無頭爬蟲擷取中
            </div>
            <div className="w-12 h-px bg-slate-800" />
            <div className={`flex items-center gap-2 ${status === 'analyzing' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              Ollama (qwen2.5) 漂綠深度分析
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {status === 'done' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            
            {/* Left Column: Scraping Info */}
            <div className="lg:col-span-1 space-y-6">
              <OmniCard className="p-5 border-t-4 border-t-slate-700">
                <h3 className="text-slate-400 text-sm font-medium mb-4">資料來源溯源 (Traceable)</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">目標標題</span>
                    <span className="text-slate-200 line-clamp-2">{scrapedData?.title || '未知的頁面標題'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">爬取時間</span>
                    <span className="text-slate-200">{new Date(scrapedData?.scrapedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">內文字元數</span>
                    <span className="text-cyan-400 font-mono">{scrapedData?.content?.length || 0} 字</span>
                  </div>
                </div>
              </OmniCard>
              
              <OmniCard className={`p-5 border-t-4 ${
                analysis.riskLevel === 'High' || analysis.riskLevel === 'Critical' 
                  ? 'border-t-red-500 bg-red-950/10' 
                  : analysis.riskLevel === 'Medium' 
                    ? 'border-t-yellow-500 bg-yellow-950/10' 
                    : 'border-t-emerald-500 bg-emerald-950/10'
              }`}>
                <h3 className="text-slate-400 text-sm font-medium mb-2">綜合風險評級 (Risk Level)</h3>
                <div className="flex items-end gap-3 mt-4">
                  <span className={`text-4xl font-black tracking-tight ${
                    analysis.riskLevel === 'High' || analysis.riskLevel === 'Critical' 
                      ? 'text-red-500' 
                      : analysis.riskLevel === 'Medium' 
                        ? 'text-yellow-500' 
                        : 'text-emerald-500'
                  }`}>
                    {analysis.riskLevel || 'Unknown'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-3 flex items-center gap-1">
                  信心指數: <span className="text-cyan-400 font-mono">{analysis.confidence}%</span>
                </p>
              </OmniCard>
            </div>

            {/* Right Column: AI Analysis Details */}
            <div className="lg:col-span-2 space-y-6">
              <OmniCard className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  防漂綠智能判定結果
                </h3>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-6">
                  <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">AI 分析摘要</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    偵測到的疑點 / 紅旗指標 (Red Flags)
                  </h4>
                  {analysis.redFlags && analysis.redFlags.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.redFlags.map((flag: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 bg-slate-900/30 p-3 rounded-lg border border-red-500/20">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span className="text-sm text-slate-300 leading-relaxed">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-emerald-400 text-sm font-medium">未偵測到明顯的漂綠指標</p>
                        <p className="text-emerald-500/60 text-xs mt-1">此報告在透明度上表現良好</p>
                      </div>
                    </div>
                  )}
                </div>
              </OmniCard>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
