'use client';

import { useEffect, useState } from 'react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';
import { Hexagon, Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

interface SystemStatus {
  entropyLevel: number;
  resonance: number;
  activeAgents: Array<{ name: string; role: string; status: string }>;
  fiveTProtocol: Record<string, { status: string; lastCheck: string }>;
  dataBridgeStats?: {
    totalUploads: number;
    totalRecords: number;
    latestHashLock: string;
  };
  systemMessage: string;
}

export default function OmniMatrixPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/omni-matrix/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Pulse every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400 flex items-center gap-3">
            <Hexagon className="w-10 h-10 text-cyan-500" />
            全通中樞 (OmniMatrix)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            依據 OmniCore 憲章進行最高權限觀測，5T 協議神聖治理結界已啟動。
          </p>
        </div>
        <OmniButton variant="cyber" onClick={fetchStatus} isLoading={loading}>
          強制共振同步
        </OmniButton>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Matrix Core */}
          <OmniCard variant="cyber" glow className="col-span-1 md:col-span-2">
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                全息狀態 (Holistic State)
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                  <div className="relative z-10 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-emerald-300">
                    {status.resonance}%
                  </div>
                </div>
                <div className="mt-4 text-lg font-bold tracking-widest text-cyan-700 dark:text-cyan-300">
                  全通之心 共振率
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-mono">
                  {status.systemMessage}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">系統熵值 (Entropy Level)</div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{status.entropyLevel} <span className="text-sm text-slate-400">/ 100</span></div>
                  <OmniBadge variant="emerald" className="mt-2">高度秩序 (Edge of Chaos)</OmniBadge>
                </div>
                <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">活躍代理神經元</div>
                  <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{status.activeAgents.length} <span className="text-sm text-slate-400">節點</span></div>
                  <OmniBadge variant="cyan" className="mt-2">Swarm Active</OmniBadge>
                </div>
              </div>
            </OmniCardContent>
          </OmniCard>

          {/* 5T Protocol Status */}
          <OmniCard variant="glass" glow>
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                5T 協議結界矩陣
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              <div className="space-y-4">
                {Object.entries(status.fiveTProtocol).map(([key, data]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-white/80 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-[pulse-glow_2s_infinite]" />
                      <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{key}</span>
                    </div>
                    <OmniBadge variant="emerald">{data.status}</OmniBadge>
                  </div>
                ))}
              </div>
            </OmniCardContent>
          </OmniCard>

          {/* 5T SVG MACC Abatement Curve Visualization */}
          <OmniCard variant="cyber" glow className="col-span-1 md:col-span-3">
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                5T 淨零邊際減碳成本動態曲線 (MACC Interactive Curve)
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20">
                <svg className="w-full h-48" viewBox="0 0 800 180">
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="50" y1="20" x2="750" y2="20" stroke="#334155" strokeDasharray="4 4" />
                  <line x1="50" y1="90" x2="750" y2="90" stroke="#06b6d4" strokeOpacity="0.3" />
                  <line x1="50" y1="150" x2="750" y2="150" stroke="#334155" strokeDasharray="4 4" />
                  
                  {/* Zero axis */}
                  <line x1="50" y1="90" x2="750" y2="90" stroke="#94a3b8" strokeWidth="1.5" />

                  {/* MACC Measure Bars */}
                  {/* Bar 1: Solar Power (-$45/t) */}
                  <rect x="70" y="90" width="110" height="40" fill="url(#emeraldGrad)" stroke="#10b981" strokeWidth="1.5" rx="4" />
                  <text x="125" y="115" fill="#10b981" fontSize="11" textAnchor="middle" fontWeight="bold">綠能發電 -$45/t</text>

                  {/* Bar 2: LED & Energy Efficiency (-$20/t) */}
                  <rect x="190" y="90" width="130" height="25" fill="url(#emeraldGrad)" stroke="#10b981" strokeWidth="1.5" rx="4" />
                  <text x="255" y="107" fill="#10b981" fontSize="11" textAnchor="middle" fontWeight="bold">設備節能 -$20/t</text>

                  {/* Bar 3: EV Fleet ($15/t) */}
                  <rect x="330" y="70" width="120" height="20" fill="url(#cyanGrad)" stroke="#06b6d4" strokeWidth="1.5" rx="4" />
                  <text x="390" y="84" fill="#06b6d4" fontSize="11" textAnchor="middle" fontWeight="bold">電動運具 +$15/t</text>

                  {/* Bar 4: Waste Heat Recovery ($38/t) */}
                  <rect x="460" y="45" width="140" height="45" fill="url(#cyanGrad)" stroke="#06b6d4" strokeWidth="1.5" rx="4" />
                  <text x="530" y="70" fill="#06b6d4" fontSize="11" textAnchor="middle" fontWeight="bold">廢熱回收 +$38/t</text>

                  {/* Bar 5: Carbon Capture CCUS ($110/t) */}
                  <rect x="610" y="20" width="120" height="70" fill="url(#cyanGrad)" stroke="#38bdf8" strokeWidth="1.5" rx="4" />
                  <text x="670" y="55" fill="#38bdf8" fontSize="11" textAnchor="middle" fontWeight="bold">CCUS 碳捕捉 +$110/t</text>
                </svg>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
                  <span>← 負邊際成本 (投資淨收益)</span>
                  <span className="text-cyan-400 font-bold">2030 目標減碳量: 21,000 tCO2e/年</span>
                  <span>正邊際成本 (脫碳投資) →</span>
                </div>
              </div>
            </OmniCardContent>
          </OmniCard>

          {/* Data Bridge Statistics */}
          {status.dataBridgeStats && (
            <OmniCard variant="cyber" glow className="col-span-1 md:col-span-3">
              <OmniCardHeader>
                <OmniCardTitle className="flex items-center gap-2">
                  <Database className="w-6 h-6 text-cyan-400" />
                  Data Bridge 實體數據封印統計 (Trackable & Trustworthy)
                </OmniCardTitle>
              </OmniCardHeader>
              <OmniCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">已封印資料批次 (Sealed Batches)</div>
                    <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{status.dataBridgeStats.totalUploads} 批次</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">已正規化 ESG 總列數 (Ingested Rows)</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{status.dataBridgeStats.totalRecords} 列</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">最新 SHA-256 Hash Lock</div>
                    <div className="text-xs font-mono text-cyan-500 truncate" title={status.dataBridgeStats.latestHashLock}>
                      {status.dataBridgeStats.latestHashLock}
                    </div>
                  </div>
                </div>
              </OmniCardContent>
            </OmniCard>
          )}

          {/* Agent Roster */}
          <OmniCard variant="glass" glow className="col-span-1 md:col-span-3">
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <Cpu className="w-6 h-6 text-indigo-500" />
                三位一體代理群集 (Trinity Swarm)
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {status.activeAgents.map(agent => (
                  <div key={agent.name} className="flex flex-col p-5 rounded-2xl bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{agent.name}</span>
                      <OmniBadge variant={agent.status === 'Optimal' ? 'cyan' : 'amber'}>
                        {agent.status}
                      </OmniBadge>
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{agent.role}</span>
                  </div>
                ))}
              </div>
            </OmniCardContent>
          </OmniCard>

        </div>
      )}
    </div>
  );
}
