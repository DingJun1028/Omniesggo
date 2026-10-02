'use client';

import React, { useState } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

export default function SupplyChainPage() {
  const [supplierName, setSupplierName] = useState('');
  const [industry, setIndustry] = useState('');
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = () => {
    setSupplierName('GreenTech Manufacturing Co.');
    setIndustry('Electronics / Semiconductors');
    setRawData('2025 CSR Report Data: \n- ISO 14001: Yes\n- Scope 1+2: 12,000 tCO2e\n- Scope 3: Not calculated\n- Renewable Energy: 10%\n- Social: No labor violations in 3 years.');
  };

  const handleEvaluate = async () => {
    if (!supplierName || !rawData) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/supply-chain/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierName, industry, rawData })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.evaluation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 flex items-center gap-2">
            <span>🏭</span> 供應鏈 ESG 評級雷達 (Supply Chain)
          </h1>
          <p className="text-slate-400 mt-1">運用 AI 自動審查供應商永續表現，計算風險層級與合規建議</p>
        </div>
        <OmniBadge variant="cyan">AI Auditor Active</OmniBadge>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左側：供應商資料輸入 */}
        <OmniCard className="p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">供應商審查設定</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">供應商名稱</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-teal-500"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="例如：台積電、鴻海..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">產業類別</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-teal-500"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例如：半導體、紡織..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">查核原始數據 (Raw Data / Report)</label>
              <textarea 
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-teal-500 resize-none font-mono text-sm"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="貼上供應商問卷回覆或 CSR 報告摘要..."
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <OmniButton 
              onClick={handleSimulate}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-1/3"
            >
              載入範例
            </OmniButton>
            <OmniButton 
              onClick={handleEvaluate}
              disabled={loading || !supplierName || !rawData}
              className="bg-teal-600 hover:bg-teal-500 text-white w-2/3"
            >
              {loading ? 'AI 審查分析中...' : '執行 ESG 風險評級'}
            </OmniButton>
          </div>
        </OmniCard>

        {/* 右側：評估結果 */}
        <OmniCard className="p-6 flex flex-col min-h-[500px] relative overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">AI 稽核與評級結果</h3>

          {!result && !loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
               <span className="text-4xl mb-3 opacity-50">🤖</span>
               <p>等待執行 AI 供應商審查...</p>
             </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4"></div>
              <p className="text-teal-400 font-medium animate-pulse">正在生成供應商風險矩陣...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 border border-teal-500/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                  <span className="text-xs text-teal-400 mb-1">評級</span>
                  <span className="text-4xl font-black text-white">{result.rating}</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-sm text-slate-400">綜合風險等級</span>
                    <span className={`font-bold ${result.riskLevel === 'Low' ? 'text-emerald-400' : result.riskLevel === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {result.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-sm text-slate-400">AI 信心度</span>
                    <span className="text-cyan-400">92%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2"><span>📈</span> 永續優勢 (Strengths)</h4>
                <ul className="space-y-2">
                  {result.strengths?.map((item: string, i: number) => (
                    <li key={i} className="text-sm bg-slate-900 p-2 rounded text-slate-300 border border-emerald-900/30 border-l-2 border-l-emerald-500">{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-rose-400 font-medium mb-2 flex items-center gap-2"><span>⚠️</span> 風險與劣勢 (Weaknesses)</h4>
                <ul className="space-y-2">
                  {result.weaknesses?.map((item: string, i: number) => (
                    <li key={i} className="text-sm bg-slate-900 p-2 rounded text-slate-300 border border-rose-900/30 border-l-2 border-l-rose-500">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-teal-950/30 p-4 rounded-lg border border-teal-900/50">
                <h4 className="text-teal-400 font-medium mb-1">採購決策建議 (Recommendation)</h4>
                <p className="text-sm text-slate-300">{result.recommendation}</p>
              </div>

            </div>
          )}
        </OmniCard>
      </div>
    </div>
  );
}
