'use client';

import React, { useState } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

export default function DataBridgePage() {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sampleCSV = `EmployeeID,Department,Gender,Resigned
EMP001,Sales,M,N
EMP002,Engineering,F,N
EMP003,HR,F,Y
EMP004,Engineering,M,N
EMP005,Marketing,F,N`;

  const handleSimulateLoad = () => {
    setCsvContent(sampleCSV);
  };

  const handleUpload = async () => {
    if (!csvContent) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/data-bridge/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvContent, sourceSystem: 'Enterprise HR (Workday)' })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.metrics);
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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2">
            <span>🔗</span> 企業資料自動橋接器 (Data Bridge)
          </h1>
          <p className="text-slate-400 mt-1">無縫接入企業 API、人資系統 Excel / CSV，自動轉換為 5T ESG 指標</p>
        </div>
        <OmniBadge variant="amber">Webhook Active</OmniBadge>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左側：API 配置與上傳 */}
        <div className="space-y-6">
          <OmniCard className="p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
              <span>Webhook / API 接入設定</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">REST API</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Endpoint URL</label>
                <code className="block w-full bg-slate-900 border border-slate-700 rounded p-2 text-amber-400 text-sm">
                  POST /api/data-bridge/csv-upload
                </code>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Authorization Header</label>
                <code className="block w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 text-sm">
                  Bearer sk_live_5T_xxxxx...
                </code>
              </div>
              <p className="text-xs text-slate-500 mt-2">支援直接串接 Workday, SAP 等人資系統，實現資料自動「無縫換氣」。</p>
            </div>
          </OmniCard>

          <OmniCard className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">CSV 檔案拖曳與手動橋接</h3>
            <div className="flex-1 flex flex-col gap-4">
              <textarea 
                rows={6}
                placeholder="貼上 CSV 內容或拖曳檔案至此..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono text-sm leading-relaxed"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
              <div className="flex gap-4">
                <OmniButton 
                  onClick={handleSimulateLoad}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-1/3"
                >
                  載入範例 (HR)
                </OmniButton>
                <OmniButton 
                  onClick={handleUpload}
                  disabled={loading || !csvContent}
                  className="bg-amber-600 hover:bg-amber-500 text-white w-2/3"
                >
                  {loading ? '5T 轉換中...' : '執行資料自動橋接'}
                </OmniButton>
              </div>
            </div>
          </OmniCard>
        </div>

        {/* 右側：橋接與轉換結果 */}
        <OmniCard className="p-6 flex flex-col min-h-[500px] relative overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">ESG 指標轉換結果</h3>

          {!result && !loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-800 rounded-xl m-4">
               <span className="text-4xl mb-3 opacity-50">🔄</span>
               <p>等待資料注入與轉換...</p>
             </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-amber-400 font-medium animate-pulse">正在執行 5T Protocol 資料清洗與橋接...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in mt-4">
              <div className="flex justify-between items-center bg-emerald-950/30 p-4 rounded-lg border border-emerald-900/50">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span>✅</span> {result.status}
                </span>
                <span className="text-xs text-slate-400">來源: {result.source}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400 text-sm mb-1">總員工人數 (Total Workforce)</p>
                  <p className="text-3xl font-bold text-slate-100">{result.totalWorkforce} <span className="text-sm text-slate-500 font-normal">人</span></p>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400 text-sm mb-1">女性佔比 (Gender Diversity)</p>
                  <p className="text-3xl font-bold text-amber-400">{result.femaleRatio}</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center col-span-2">
                  <p className="text-slate-400 text-sm mb-1">員工流動率 (Turnover Rate)</p>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <p className="text-4xl font-bold text-rose-400">{result.turnoverRate}</p>
                    <div className="text-left">
                      <p className="text-xs text-slate-400">GRI 401-1 指標對齊</p>
                      <p className="text-xs text-emerald-500">符合 5T 可追溯性</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </OmniCard>
      </div>
    </div>
  );
}
