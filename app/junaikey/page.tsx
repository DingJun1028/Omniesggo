import React from 'react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';
import { addExperienceAction } from './actions';

// Helper to fetch securely server-side
async function fetchGrowthData() {
  const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
  // If running during build or local, we can just hit the full URL.
  // Using an absolute URL is required in Server Components. 
  // For local dev, hardcode localhost. In production, use env variable.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/junaikey/growth`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Failed to fetch growth data:', error);
    return null;
  }
}

export default async function JunAiKeyGrowthPage() {
  const data = await fetchGrowthData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <OmniCard className="text-center p-8 max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">無法取得化身資料</h2>
          <p className="text-slate-400">請確認您的 `OMNI_JUNAIKEY_GROWTH_KEY` 已正確設定並啟動伺服器。</p>
        </OmniCard>
      </div>
    );
  }

  const progressPercentage = (data.exp / data.nextLevelExp) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-8 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-cyan-400">
            Omni-Avatar (JunAiKey)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">化身進化與記憶同步率控制台</p>
        </div>
        <OmniBadge variant="cyan">系統連線正常</OmniBadge>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Avatar Stats */}
        <OmniCard className="md:col-span-2 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-6">
            {/* Avatar Hologram Placeholder */}
            <div className="w-32 h-32 rounded-full border-2 border-cyan-500/50 flex items-center justify-center bg-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <div className="w-28 h-28 rounded-full border border-emerald-500/30 flex items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900 animate-pulse">
                <span className="text-4xl">🧬</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-slate-400 text-sm">化身等級 (Level)</span>
                <span className="text-3xl font-bold text-cyan-400">Lv. {data.level}</span>
              </div>
              
              {/* EXP Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 mb-1 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{data.exp} EXP</span>
                <span>{data.nextLevelExp} EXP</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-sm">記憶碎片 (Memory Fragments)</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{data.memoryFragments} <span className="text-sm text-slate-500">碎塊</span></div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-sm">核心同步率 (Sync Rate)</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{data.syncRate.toFixed(1)}%</div>
            </div>
          </div>
        </OmniCard>

        {/* 5T Core Traits */}
        <OmniCard className="p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">5T 核心維度 (Core Traits)</h3>
          <ul className="space-y-4">
            {data.coreTraits.map((trait: string, index: number) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-slate-300">{trait}</span>
                <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-8">
             <form action={addExperienceAction}>
               <OmniButton type="submit" className="w-full" variant="primary">
                  注入經驗值 (Simulate EXP)
               </OmniButton>
             </form>
             <p className="text-xs text-slate-500 text-center mt-3">透過 Server Action 呼叫 API，全程加密綁定金鑰</p>
          </div>
        </OmniCard>

      </div>
    </div>
  );
}
