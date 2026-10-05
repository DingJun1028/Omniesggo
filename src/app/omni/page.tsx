'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye, Cpu, Activity, Shield, BrainCircuit, Heart,
  Sun, Moon, RefreshCcw, Database, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, Download, Copy, Zap
} from 'lucide-react';

// ── Hexa-Core Organs ──────────────────────────────────────────────────────
interface HexaCoreOrgan {
  id: string;
  name: string;
  englishName: string;
  icon: React.ElementType;
  description: string;
  metrics: { label: string; value: string }[];
  status: 'optimal' | 'warning' | 'critical';
  colorType: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
}

const ORGANS: HexaCoreOrgan[] = [
  {
    id: 'eye',
    name: '全知之眼',
    englishName: 'OmniEye',
    icon: Eye,
    description: '監控數據源來源驗證率與即時事件流',
    metrics: [{ label: '溯源驗證率', value: '100%' }, { label: '盲點數', value: '0' }],
    status: 'optimal',
    colorType: 'sky'
  },
  {
    id: 'core',
    name: '全能之核',
    englishName: 'OmniCore',
    icon: Cpu,
    description: '展示全域代理調度狀態與任務隊列進度',
    metrics: [{ label: '代理蜂群', value: '12 活躍' }, { label: '隊列負載', value: '輕載' }],
    status: 'optimal',
    colorType: 'cyan'
  },
  {
    id: 'pulse',
    name: '全域之脈',
    englishName: 'OmniPulse',
    icon: Activity,
    description: '數據總線吞吐量與平均延遲',
    metrics: [{ label: '吞吐量', value: '8.4k/s' }, { label: '延遲', value: '12ms' }],
    status: 'optimal',
    colorType: 'violet'
  },
  {
    id: 'bone',
    name: '全境之骨',
    englishName: 'OmniBone',
    icon: Shield,
    description: '憲章約束完整性評分與 5T 契約健康度',
    metrics: [{ label: '契約相容', value: '100%' }, { label: '結構剛性', value: '完美' }],
    status: 'optimal',
    colorType: 'emerald'
  },
  {
    id: 'brain',
    name: '全息之腦',
    englishName: 'OmniBrain',
    icon: BrainCircuit,
    description: '技術債熵值評級與自動修復觸發紀錄',
    metrics: [{ label: '熵值評估', value: '極低' }, { label: '自動修復', value: '未觸發' }],
    status: 'optimal',
    colorType: 'amber'
  },
  {
    id: 'heart',
    name: '全通之心',
    englishName: 'OmniHeart',
    icon: Heart,
    description: '全域共振率與無礙流轉指標',
    metrics: [{ label: '共振率', value: '100%' }, { label: '無礙流轉', value: '圓通' }],
    status: 'optimal',
    colorType: 'rose'
  }
];

// ── Trace Audit Log ───────────────────────────────────────────────────────
interface TraceEvent {
  uuid: string;
  timestamp: string;
  originCause: string;
  hashLock: string;
  type: 'seal' | 'metabolism' | 'error';
  agent: string;
}

const MOCK_EVENTS: TraceEvent[] = [
  {
    uuid: 'evt-9b1c',
    timestamp: '2026-10-05 21:55:23',
    originCause: 'System Metabolism Trigger',
    hashLock: 'a8f1...3c9e',
    type: 'metabolism',
    agent: 'OmniBrain'
  },
  {
    uuid: 'evt-4f2a',
    timestamp: '2026-10-05 21:54:12',
    originCause: 'ISO-14064 數據封印',
    hashLock: '7d58...d49e',
    type: 'seal',
    agent: 'OmniCore'
  }
];

export default function OmniCenterPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSyncing, setIsSyncing] = useState(false);
  const [resonance, setResonance] = useState(100);
  const [filter, setFilter] = useState<'all' | 'seal' | 'metabolism' | 'error'>('all');

  const filteredEvents = MOCK_EVENTS.filter(e => filter === 'all' || e.type === filter);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleForceSync = () => {
    setIsSyncing(true);
    setResonance(0);
    setTimeout(() => {
      setResonance(100);
      setIsSyncing(false);
    }, 1500);
  };

  const getColorClasses = (type: string) => {
    const map: Record<string, string> = {
      sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-500/30',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-500/30',
      violet: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-500/30',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/30',
      amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/30',
      rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-500/30'
    };
    return map[type] || map.cyan;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── Header & Theme Capsule ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-sm">
                A01 · OMNI-CENTER
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              萬能中心 Omni-Core
            </h1>
            <p className="text-sm font-bold text-teal-700 dark:text-teal-400 mt-1">
              ESGGO 永續發展無限進化 · 無作妙德 · 圓通無礙
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  theme === 'light' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> 淺色手冊
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  theme === 'dark' ? 'bg-slate-900 text-teal-300 shadow-sm border border-teal-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> 深色手冊
              </button>
            </div>

            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              強制共振同步
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        
        {/* ── 共振率儀表板 ── */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">全域共振率 (Global Resonance)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">目前系統各設施的語意同步與資料一致性狀態</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-teal-500 dark:bg-cyan-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${resonance}%` }} 
              />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono w-16 text-right">
              {resonance}%
            </span>
          </div>
        </div>

        {/* ── 六器官狀態矩陣 ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            六器官狀態矩陣 (Hexa-Core Matrix Grid)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ORGANS.map(organ => (
              <div key={organ.id} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${getColorClasses(organ.colorType)}`}>
                      <organ.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{organ.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">{organ.englishName}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                    OPTIMAL
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-4">
                  {organ.description}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {organ.metrics.map(metric => (
                    <div key={metric.label}>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{metric.label}</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 終始治理事件日誌 ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              終始治理事件日誌 (Event Stream & Trace Audit)
            </h2>
            <div className="flex gap-2">
              {(['all', 'seal', 'metabolism', 'error'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                    filter === f 
                    ? 'bg-slate-800 text-white border-slate-900 dark:bg-teal-900/60 dark:text-teal-300 dark:border-teal-500/50' 
                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
              <button className="ml-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-500/30 text-xs font-bold flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-cyan-900/60 transition-all">
                <Download className="w-3.5 h-3.5" /> 匯出 JSON
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-0 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">TIMESTAMP</th>
                  <th className="px-6 py-4">TYPE / AGENT</th>
                  <th className="px-6 py-4">ORIGIN CAUSE</th>
                  <th className="px-6 py-4">HASH LOCK</th>
                  <th className="px-6 py-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredEvents.map(evt => (
                  <tr key={evt.uuid} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{evt.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {evt.type === 'seal' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                        {evt.type === 'metabolism' && <Zap className="w-4 h-4 text-teal-500" />}
                        {evt.type === 'error' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{evt.agent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{evt.originCause}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{evt.hashLock}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors" title="複製 Hash Lock">
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">無符合條件的日誌</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
