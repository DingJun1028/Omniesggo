'use client';

import React, { useState } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

export default function DocumentScannerPage() {
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulateUpload = () => {
    // 模擬上傳與 OCR 解析
    setFileName('2025_Supplier_CSR_Report.pdf');
    setFileText(`
      Company XYZ 2025 CSR Report:
      Scope 1 emissions have decreased by 15% to 450 tCO2e.
      Scope 2 emissions are 800 tCO2e.
      We achieved 100% renewable energy in our headquarters.
      Employee turnover rate is 5%, and we recorded zero workplace accidents.
      Our board now consists of 40% female directors.
      Data privacy complies with ISO 27001.
    `);
  };

  const handleExtract = async () => {
    if (!fileText) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/scanner/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: fileText, filename: fileName })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
            <span>🔍</span> AI 智慧文件解析 (ESG Scanner)
          </h1>
          <p className="text-slate-400 mt-1">上傳供應鏈報告或永續文件，由本地大語言模型自動萃取核心指標</p>
        </div>
        <OmniBadge variant="indigo">OCR + NLP 雙引擎</OmniBadge>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左側：上傳區 */}
        <OmniCard className="p-6 flex flex-col min-h-[500px]">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">1. 檔案載入區</h3>
          
          <div className="flex-1 flex flex-col gap-4">
            <div 
              className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl flex-1 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors group p-8 text-center"
              onClick={handleSimulateUpload}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📄</div>
              <p className="text-slate-300 font-medium">點擊此處選擇文件，或拖曳檔案至此</p>
              <p className="text-slate-500 text-sm mt-2">支援格式：PDF, DOCX, TXT, PNG, JPG</p>
              <p className="text-indigo-400 text-xs mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                (點擊以載入範例報告)
              </p>
            </div>

            {fileName && (
              <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-indigo-400">📝</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{fileName}</p>
                    <p className="text-xs text-slate-500">文件內容已就緒 ({fileText.length} 字元)</p>
                  </div>
                </div>
                <OmniButton 
                  onClick={handleExtract}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {loading ? 'AI 萃取中...' : '開始萃取資料'}
                </OmniButton>
              </div>
            )}
          </div>
        </OmniCard>

        {/* 右側：解析結果區 */}
        <OmniCard className="p-6 flex flex-col min-h-[500px] overflow-hidden relative">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">2. ESG 指標結構化萃取</h3>

          {!result && !loading && (
             <div className="flex-1 flex items-center justify-center text-slate-500">
               等待文件解析...
             </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-300 font-medium animate-pulse">正在掃描 ESG 關鍵字...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <span className="text-sm text-slate-400">AI 萃取信心指數</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" 
                      style={{ width: `${result.confidenceScore}%` }}
                    />
                  </div>
                  <span className="text-indigo-400 font-bold">{result.confidenceScore}%</span>
                </div>
              </div>

              <div className="text-sm text-slate-300 bg-indigo-950/30 p-3 rounded border border-indigo-900/50">
                <span className="text-indigo-400 font-bold mr-2">摘要:</span> {result.summary}
              </div>

              <div>
                <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2"><span>🌱</span> Environmental (環境)</h4>
                <ul className="space-y-2">
                  {result.environmental?.map((item: string, i: number) => (
                    <li key={i} className="text-sm bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2"><span>👥</span> Social (社會)</h4>
                <ul className="space-y-2">
                  {result.social?.map((item: string, i: number) => (
                    <li key={i} className="text-sm bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2"><span>⚖️</span> Governance (治理)</h4>
                <ul className="space-y-2">
                  {result.governance?.map((item: string, i: number) => (
                    <li key={i} className="text-sm bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </OmniCard>
      </div>
    </div>
  );
}
