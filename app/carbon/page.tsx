'use client';

import React, { useState } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

export default function CarbonDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: '製造業 (Manufacturing)',
    scope1: 500,
    scope2: 1200,
    scope3: 3000
  });
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/carbon/ai-reduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.strategy);
      } else {
        setResult(data.fallback);
      }
    } catch (err) {
      console.error(err);
      setResult({ status: 'Error', analysis: '連線異常', shortTerm: [], longTerm: [], score: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <OmniBadge variant="teal">ISO 14064-1 Compliant</OmniBadge>
            <OmniBadge variant="emerald">Local AI 滿載</OmniBadge>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            AI 碳盤查與減碳顧問 (Carbon AI)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">智慧運算範疇一二三排放，由本地端模型提供專屬企業減碳策略</p>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側：數據輸入區 */}
        <OmniCard variant="glass" className="p-6 lg:col-span-1 flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">組織邊界數據設定</h3>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">產業類別</label>
              <select 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              >
                <option>製造業 (Manufacturing)</option>
                <option>科技業 (Technology)</option>
                <option>金融業 (Finance)</option>
                <option>服務業 (Services)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-teal-700 dark:text-cyan-400 mb-1">範疇一 (Scope 1) 直接排放 (tCO2e)</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                value={formData.scope1}
                onChange={(e) => setFormData({...formData, scope1: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">範疇二 (Scope 2) 能源間接 (tCO2e)</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                value={formData.scope2}
                onChange={(e) => setFormData({...formData, scope2: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">範疇三 (Scope 3) 價值鏈 (tCO2e)</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                value={formData.scope3}
                onChange={(e) => setFormData({...formData, scope3: Number(e.target.value)})}
              />
            </div>
          </div>

          <OmniButton 
            variant="primary"
            className="w-full mt-6 justify-center" 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'AI 推論中...' : '生成減碳路徑 (AI Analyze)'}
          </OmniButton>
        </OmniCard>

        {/* 右側：AI 分析報告 */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !loading && (
            <OmniCard variant="glass" className="p-12 flex flex-col items-center justify-center text-center h-full border-dashed border-slate-300 dark:border-slate-700">
              <div className="text-4xl mb-4 opacity-50">🍃</div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-300">等待數據輸入</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">點擊左側按鈕呼叫本地模型，生成專屬企業減碳策略。</p>
            </OmniCard>
          )}

          {loading && (
            <OmniCard variant="glass" className="p-12 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-600 dark:border-cyan-500/30 dark:border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-medium text-teal-700 dark:text-cyan-400 animate-pulse">全息推演中...</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">正在分析 {formData.industry} 的碳排放痛點</p>
            </OmniCard>
          )}

          {result && !loading && (
            <>
              {/* 狀態總覽 */}
              <OmniCard variant="glass" className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">淨零狀態評估</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">AI 綜合評分與現狀</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{result.score}</div>
                    <div className="text-xs text-slate-500">減碳潛力指標</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-sm leading-relaxed">
                  {result.analysis}
                </div>
              </OmniCard>

              {/* 減碳策略網格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OmniCard variant="glass" className="p-6">
                  <h3 className="text-teal-700 dark:text-cyan-400 font-bold mb-4 flex items-center gap-2 text-sm">
                    <span>⚡</span> 短期速贏策略 (Short-Term)
                  </h3>
                  <ul className="space-y-3">
                    {result.shortTerm?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-cyan-400"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </OmniCard>

                <OmniCard variant="glass" className="p-6">
                  <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-4 flex items-center gap-2 text-sm">
                    <span>🌍</span> 資本戰略轉型 (Long-Term)
                  </h3>
                  <ul className="space-y-3">
                    {result.longTerm?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </OmniCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
