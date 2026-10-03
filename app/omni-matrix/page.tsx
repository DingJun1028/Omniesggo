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
                5T 協議矩陣
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              <div className="space-y-4">
                {Object.entries(status.fiveTProtocol).map(([key, data]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-white/80 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse-glow_2s_infinite]" />
                      <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{key}</span>
                    </div>
                    <OmniBadge variant="emerald">{data.status}</OmniBadge>
                  </div>
                ))}
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
