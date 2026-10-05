'use client';

import React, { useState, useEffect } from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

export default function DigitalTrustHubPage() {
  const [seals, setSeals] = useState<any[]>([]);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSeals = async () => {
    try {
      const res = await fetch('/api/trust/seal');
      const data = await res.json();
      if (data.success) {
        setSeals(data.seals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSeals();
  }, []);

  const handleSeal = async () => {
    if (!docName || !docContent) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trust/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName: docName, content: docContent })
      });
      if (res.ok) {
        setDocName('');
        setDocContent('');
        await fetchSeals();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-emerald-400 flex items-center gap-2">
            <span>🛡️</span> 數位信任中心 (Trust Hub)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">基於 5T 協議的零知識證明與 Hash Lock 密碼學存證系統</p>
        </div>
        <OmniBadge variant="emerald">ZKP Secured</OmniBadge>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側：存證輸入 */}
        <OmniCard className="p-6 lg:col-span-1 flex flex-col h-fit sticky top-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">新文件存證 (Data Sealing)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">文件識別名稱</label>
              <input 
                type="text" 
                placeholder="例如：2026_Q4_ESG_Report"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">關鍵數據 / 報告內容 (Raw Data)</label>
              <textarea 
                rows={5}
                placeholder="貼上需存證的原始數據..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-sm"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
              />
            </div>
          </div>

          <OmniButton 
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white" 
            onClick={handleSeal}
            disabled={loading || !docName || !docContent}
          >
            {loading ? '密碼學封裝中...' : '執行 ZKP Hash Lock 存證'}
          </OmniButton>
        </OmniCard>

        {/* 右側：存證歷史紀錄 */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">全域存證保險庫 (Evidence Vault)</h3>
          
          {seals.length === 0 && (
            <OmniCard className="p-12 flex flex-col items-center justify-center text-center border-dashed border-slate-700 opacity-70">
              <span className="text-4xl mb-4">??</span>
              <p className="text-slate-400">目前保險庫內無任何存證紀錄。</p>
            </OmniCard>
          )}

          {seals.map((seal) => (
            <OmniCard key={seal.id} className="p-5 border border-slate-800 hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">??</span>
                  <span className="font-medium text-slate-200">{seal.documentName}</span>
                </div>
                <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                  {new Date(seal.sealedAt).toLocaleString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center overflow-hidden">
                  <span className="text-xs text-slate-500 w-24 shrink-0">Hash Lock</span>
                  <span className="font-mono text-xs text-cyan-400 truncate ml-2">{seal.hashLock}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center overflow-hidden">
                  <span className="text-xs text-slate-500 w-24 shrink-0">ZKP Proof</span>
                  <span className="font-mono text-xs text-emerald-500 truncate ml-2">{seal.zkpProof}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500 w-24 shrink-0">Origin</span>
                  <span className="text-xs text-slate-400 truncate ml-2">{seal.sourceOrigin}</span>
                </div>
              </div>
            </OmniCard>
          ))}
        </div>
      </div>
    </div>
  );
}
