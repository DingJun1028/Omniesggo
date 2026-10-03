'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { UniversalOmniConsole } from '../omni-center/universal-omni-console';
import { OmniDataAnalyticsPanel } from '@/components/omni-data-analytics-panel';
import { InsightGrid } from '@/components/sustain-center/insight-grid';
import { TrustLedger, type LedgerItem } from '@/components/sustain-center/trust-ledger';
import { HeartbeatMonitor, HeartbeatMetrics } from '@/components/sustain-center/heartbeat-monitor';
import { Loader2, Globe, Activity, Zap, GitBranch, ShieldCheck } from 'lucide-react';
import { CarbonCalculatorPanel } from '@/components/sustain-center/carbon-calculator-panel';
import { AIDataChatPanel } from '@/components/sustain-center/ai-data-chat-panel';
import { JunAiUltimatePanel } from '@/components/sustain-center/junai-ultimate-panel';
import { OmniDataAnalyticsConfig } from '@/types/esg-charts';
import { COMPANIES } from '@/core/services/report-assembly-v5';

type Mode = 'steady' | 'evolution';

interface DashboardData {
  summaryMetrics: {
    totalEmissions: string;
    emissionUnit: string;
    esgScore: string;
    documentsProcessed: number;
  };
  charts: OmniDataAnalyticsConfig[];
  insights: Array<{ id: string; knowledge: { why: string; what: string; how: string }; sourceLabel: string }>;
  recentLedgers: LedgerItem[];
  evolution?: {
    level: number;
    xp: number;
    nextXp: number;
    unlocked: string[];
    activeTrials: Array<{ id: string; title: string; status: string }>;
  };
}

export default function SustainCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('steady');
  const [heartbeat, setHeartbeat] = useState<HeartbeatMetrics>({
    wsClients: 0,
    uptime: 0,
    errorCount: 0,
    memoryUsage: 0,
    status: 'Healthy',
  });
  const [wsConnected, setWsConnected] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/sustain-center/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Failed to load sustain center dashboard', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    let ws: WebSocket;
    const connectWs = () => {
      const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL || 'ws://localhost:8642';
      ws = new WebSocket(wsUrl);
      setWsConnected(true);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'HEARTBEAT' || msg.type === 'status') {
            const payload = msg.payload || msg.data || msg;
            setHeartbeat((prev) => ({
              ...prev,
              wsClients: payload.clients ?? prev.wsClients,
              uptime: payload.uptime ?? prev.uptime,
              memoryUsage: payload.memory?.used_mb ?? payload.memory ?? prev.memoryUsage,
              status: payload.status || 'Healthy',
              errorCount: payload.errors ?? prev.errorCount,
            }));
          }
        } catch {}
      };
    };
    connectWs();
    const timer = setInterval(() => {
      if (ws?.readyState === WebSocket.CLOSED) connectWs();
    }, 5000);
    return () => {
      clearInterval(timer);
      ws?.close();
    };
  }, []);

  const evolution = data?.evolution || {
    level: 5,
    xp: 62,
    nextXp: 100,
    unlocked: ['AI Audit Co-Pilot', 'Carbon Router', 'Assurance-Ready'],
    activeTrials: [
      { id: 't1', title: 'ESRS 雙重重大性對接', status: 'running' },
      { id: 't2', title: 'AI 碳排異常偵測', status: 'queued' },
      { id: 't3', title: '供應鏈 Scope 3 盤查', status: 'paused' },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-cyan-400" size={40} />
        <p className="font-mono text-sm animate-pulse">Syncing Holographic ESG Command Center...</p>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center">Failed to load data.</div>;

  const insights = data.insights.map((item) => ({
    id: item.id,
    knowledge: item.knowledge,
    sourceLabel: item.sourceLabel,
  }));

  const sampleCompany = COMPANIES[0];
  const evolutionAdvice =
    '建議優先導入 AI 合規查核、碳排優化與 ZKP 封印機制，以加速永續治理數位轉型。';

  const evolutionProgress = Math.min(100, Math.round((evolution.xp / evolution.nextXp) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-400">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0f1b21] to-slate-950 border-b border-slate-700/50">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-accentTeal/5 opacity-50 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-yellow-400 font-mono text-xs bg-yellow-400/10 px-3 py-1 rounded-full border border-accentGold/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                </span>
                OMNICORE HEART: TRANSCENDED (全通之心圓滿狀態)
              </div>
              <div className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-xs font-mono text-slate-400">
                <GitBranch size={14} />
                <span>EVO ENGINE READY</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_15px_rgba(99,166,176,0.3)]">
                  萬能永續中心
                </h1>
                <p className="text-slate-400 max-w-2xl text-sm leading-relaxed mb-2">
                  全景式 ESG 治理與確信樞紐。現在升級為永續發展無限進化模式，結合治理診斷、
                  成長進化圖與進化試煉，從穩定治理走向可擴張的永續系統。
                </p>
                <p className="text-slate-400 max-w-2xl text-xs leading-relaxed mb-2">
                  {evolutionAdvice}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-1 rounded-md">
                    MODE: {mode === 'evolution' ? 'EVOLUTION' : 'STEADY'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-1 rounded-md">
                    LEVEL {evolution.level}
                  </span>
                  <span className="text-[11px] font-mono text-yellow-400 bg-slate-900 border border-yellow-400/30 px-2 py-1 rounded-md">
                    XP {evolution.xp}/{evolution.nextXp}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl flex flex-col items-end min-w-[140px] shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                  <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Globe size={12}/> ESG 總評級</span>
                  <span className="text-3xl font-bold text-yellow-400">{data.summaryMetrics.esgScore}</span>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl flex flex-col items-end min-w-[140px] shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                  <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Activity size={12}/> 年度碳排</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-cyan-400">{data.summaryMetrics.totalEmissions}</span>
                    <span className="text-xs text-slate-400">{data.summaryMetrics.emissionUnit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <HeartbeatMonitor metrics={heartbeat} connected={wsConnected} />
              <button
                onClick={() => setMode((m) => (m === 'steady' ? 'evolution' : 'steady'))}
                className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <Zap size={16} />
                模式切換：{mode === 'evolution' ? '關閉無限進化' : '開啟無限進化'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
        {mode === 'evolution' && (
          <section className="rounded-2xl border border-purple-500/40 bg-slate-800/70 p-5 shadow-[0_0_25px_rgba(139,92,246,0.12)]">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-purple-400" />
              <h2 className="text-purple-400 font-bold text-lg">永續進化儀表</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                <div className="text-slate-400 text-xs mb-1">Level</div>
                <div className="text-3xl font-bold text-yellow-400">{evolution.level}</div>
                <div className="mt-2 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                  <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${evolutionProgress}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{evolution.xp} / {evolution.nextXp} XP</div>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                <div className="text-slate-400 text-xs mb-1">已解封能力</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {evolution.unlocked.map((u) => (
                    <span key={u} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                <div className="text-slate-400 text-xs mb-1">進化試煉</div>
                <div className="flex flex-col gap-2 mt-1">
                  {evolution.activeTrials.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-100">{t.title}</span>
                      <span className="text-blue-400">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <CarbonCalculatorPanel />
        </section>

        <section>
          <JunAiUltimatePanel />
        </section>

        <section>
          <AIDataChatPanel />
        </section>

        <section>
          <OmniDataAnalyticsPanel configs={data.charts} />
        </section>

        <section>
          <InsightGrid insights={insights} />
        </section>

        <section className="pt-4 border-t border-slate-700/30">
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              全域溫室氣體排放係數與框架合規矩陣 (Emission Factors & Framework Standards)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Taipower & International Factors */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">電力與能源排放係數 (Scope 2 Benchmark)</h3>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>台電 2024 最新電力排碳係數:</span>
                    <span className="text-cyan-400 font-bold">0.494 kgCO2e / 度</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>汽油 (Gasoline / Defra 2024):</span>
                    <span className="text-emerald-400 font-bold">2.312 kgCO2e / 公升</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>柴油 (Diesel / Defra 2024):</span>
                    <span className="text-emerald-400 font-bold">2.688 kgCO2e / 公升</span>
                  </div>
                </div>
              </div>

              {/* GRI / TCFD / SASB Compliance Matrix */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">國際 ESG 框架合規性對照 (Framework Matrix)</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>GRI Universal Standards 2021:</span>
                    <span className="text-emerald-400 font-bold font-mono">100% COMPLIANT</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>TCFD Climate Risk Governance:</span>
                    <span className="text-cyan-400 font-bold font-mono">100% COMPLIANT</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>EU CSRD ESRS E1-E5 / G1:</span>
                    <span className="text-indigo-400 font-bold font-mono">100% COMPLIANT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-slate-700/30">
          <TrustLedger ledgers={data.recentLedgers} />
        </section>

        <section className="pt-2">
          <UniversalOmniConsole />
        </section>
      </div>
    </div>
  );
}
