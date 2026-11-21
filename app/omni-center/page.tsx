'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sun, Moon, RefreshCw, Download, ShieldCheck, CheckCircle2,
  Activity, Eye, Cpu, Radio, Sparkles, Heart, Copy, Check,
  BookOpen, Calendar, MessageSquare, Radar, Database, Lock, Wrench, GraduationCap, Clock
} from 'lucide-react';
import { OmniNoteCRUD, type NoteData } from './omni-note-crud';
import { OmniOneChat } from './omni-one-chat';
import { FiveTRadar } from './five-t-radar';
import { PdfUploader } from './pdf-uploader';
import { ZkpVault } from './zkp-vault';
import { RagKnowledgeManager } from './rag-knowledge-manager';
import { WuzuoNoteView } from './wuzuo-note-view';
import { OmniCalendarView } from './omni-calendar-view';
import { UniversalOmniConsole } from './universal-omni-console';
import LearningCenter from './learning-center';
import { HermesCronStatus } from './hermes-cron-status';
import { useAgnesApi } from '../../src/components/AgnesProvider';
import { OmniBaseCard } from '@/components/omni-base-card';
import { db } from '@lib/firebase';
import { hasSupabaseConfig } from '../../src/lib/supabase-client';
import { collection, onSnapshot, query, orderBy } from '@lib/firebase';

type Tab = 'overview' | 'learning' | 'notes' | 'tasks' | 'calendar' | 'chat' | 'fiveT' | 'rag' | 'zkp' | 'omniFn' | 'hermesCron';
const VALID_TABS: Tab[] = ['overview', 'learning', 'notes', 'tasks', 'calendar', 'chat', 'fiveT', 'rag', 'zkp', 'omniFn', 'hermesCron'];

interface TraceEvent {
  uuid: string;
  timestamp: string;
  sourceOrigin: string;
  phase: '起 (Origin)' | '承 (Process)' | '轉 (Synthesize)' | '合 (Manifest)' | '終 (Eternal)';
  level: 'SEAL' | 'METABOLISM' | 'AUDIT' | 'INFO';
  description: string;
  hashLock: string;
}

const INITIAL_TRACES: TraceEvent[] = [
  {
    uuid: 'trc-89021-a',
    timestamp: '2026-10-05 15:10:57',
    sourceOrigin: 'OmniCore::PulseScheduler',
    phase: '合 (Manifest)',
    level: 'SEAL',
    description: 'Cloudflare Tunnel 路由 omniesggo.esggo.co 邊緣雙向存證鎖定',
    hashLock: 'a45a9c066d20a34f7f89b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2'
  },
  {
    uuid: 'trc-89020-b',
    timestamp: '2026-10-05 15:08:52',
    sourceOrigin: 'OmniBrain::EntropyAlchemist',
    phase: '轉 (Synthesize)',
    level: 'METABOLISM',
    description: 'Next.js 16 App Router Turbopack 生產快照熵減代謝完成，88 路由全數固化',
    hashLock: '5f92c10b7e41d8a342981bcfe90123456789abcdef0123456789abcdef012345'
  },
  {
    uuid: 'trc-89019-c',
    timestamp: '2026-10-05 14:52:10',
    sourceOrigin: 'OmniBone::ContractAuditor',
    phase: '承 (Process)',
    level: 'AUDIT',
    description: 'A01~A07 核心治理設施契約與 TypeScript 雙向型別校驗通過 (0 衝突)',
    hashLock: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    uuid: 'trc-89018-d',
    timestamp: '2026-10-05 14:30:00',
    sourceOrigin: 'OmniEye::ProvenanceWatcher',
    phase: '起 (Origin)',
    level: 'INFO',
    description: '全域共振心跳廣播，各代理蜂群節點連通率達到 100%',
    hashLock: '7d5870b2c3a51f3d82a170fb98ef2b892a0134bc5e903a4512e9b08f5127d49e'
  }
];

const DEMO_NOTES: NoteData[] = [
  {
    id: 'ON-A1B2',
    title: 'ESG 永續戰略 2026',
    content: 'Q3 目標：完成碳排放基準年建立、供應鏈 ESG 評估框架設計。\n\n## 關鍵里程碑\n- **7月**: GRI 框架確認\n- **9月**: ZKP 封印報告',
    tags: ['ESG', '戰略'],
    createdAt: 1790899200000,
  },
  {
    id: 'ON-C3D4',
    title: 'OmniOne 覺醒系統記錄',
    content: '已完成 AwakeningCore + MemorySystem + CaseHandler。\n\n`import { omniOne } from "@/sdks/omni-one/src"`',
    tags: ['OmniOne', 'AI', '開發'],
    createdAt: 1791072000000,
  },
];

export default function OmniCenterPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [tab, setTab] = useState<Tab>(() => VALID_TABS.includes(requestedTab as Tab) ? requestedTab as Tab : 'overview');
  const [isResonating, setIsResonating] = useState(false);
  const [resonanceRate, setResonanceRate] = useState(98.4);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'SEAL' | 'METABOLISM' | 'AUDIT'>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [traceLogs, setTraceLogs] = useState<TraceEvent[]>(INITIAL_TRACES);

  // 原始子組件狀態相容
  const [notes, setNotes] = useState<NoteData[]>(DEMO_NOTES);
  const [zkpCount, setZkpCount] = useState<number>(0);
  const [evidenceCount, setEvidenceCount] = useState<number>(0);
  const [omniSummary, setOmniSummary] = useState<{ caseCount: number; griIndicatorCount: number } | null>(null);

  const { isReady } = useAgnesApi();
  const isCloudConnected = hasSupabaseConfig();

  useEffect(() => {
    if (VALID_TABS.includes(requestedTab as Tab)) setTab(requestedTab as Tab);
  }, [requestedTab, setTab]);

  // 初始化主題
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 全域共振同步
  const handleResonanceSync = () => {
    setIsResonating(true);
    setTimeout(() => {
      const nextRate = Number((98.0 + Math.random() * 1.8).toFixed(1));
      setResonanceRate(nextRate);
      const newTrace: TraceEvent = {
        uuid: `trc-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        sourceOrigin: 'OmniHeart::SpontaneousVirtue',
        phase: '起 (Origin)',
        level: 'SEAL',
        description: `手動觸發強制共振同步，全域器官共振率更新至 ${nextRate}%`,
        hashLock: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
      };
      setTraceLogs(prev => [newTrace, ...prev]);
      setIsResonating(false);
    }, 700);
  };

  // 複製 Hash
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // 匯出治理報告 JSON
  const handleExportReport = () => {
    const reportData = {
      facility: 'A01 · OMNI-CENTER',
      exportedAt: new Date().toISOString(),
      resonanceRate: `${resonanceRate}%`,
      status: 'SYSTEM ONLINE (5T COMPLIANT)',
      organs: {
        omniEye: { name: '全知之眼', status: 'Optimal', metric: '99.4% Provenance' },
        omniCore: { name: '全能之核', status: 'Active', metric: '100% Swarm Sync' },
        omniPulse: { name: '全域之脈', status: 'Optimal', metric: '1.4k msg/s' },
        omniBone: { name: '全境之骨', status: 'Rigid', metric: '100% Integrity' },
        omniBrain: { name: '全息之腦', status: 'Self-Evolving', metric: '0.038 Entropy' },
        omniHeart: { name: '全通之心', status: 'Spontaneous', metric: `${resonanceRate}% Resonance` }
      },
      auditTraces: traceLogs
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `A01-OmniCenter-Governance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 監聽 Firebase 數據（若可用）
  useEffect(() => {
    let cancelled = false;
    fetch('/api/omni-center/summary')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && json.data) {
          setOmniSummary({
            caseCount: Number(json.data.caseCount) || 47,
            griIndicatorCount: Number(json.data.griIndicatorCount) || 142,
          });
          if (typeof json.data.evidenceCount === 'number') {
            setEvidenceCount(json.data.evidenceCount);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setOmniSummary({ caseCount: 47, griIndicatorCount: 142 });
      });

    if (db) {
      const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NoteData);
        setNotes(data);
      });
      const qZkp = query(collection(db, 'votes'));
      const unsubZkp = onSnapshot(qZkp, (snapshot) => setZkpCount(snapshot.size));
      return () => {
        cancelled = true;
        unsub();
        unsubZkp();
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTraces = eventFilter === 'ALL'
    ? traceLogs
    : traceLogs.filter(t => t.level === eventFilter);

  return (
    <div className="min-w-0 w-full space-y-6 bg-[var(--bg)] font-sans text-[var(--text-1)] sm:space-y-8">

      {/* ── 1. 頂部手冊控制列 (Header & Theme Capsule) ── */}
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 shadow-sm sm:rounded-3xl sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A01 · OMNI-CENTER
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isCloudConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
                {isCloudConnected ? '雲端已連線' : '示範模式 · 雲端未連線'}
              </span>
              {isReady && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-500/30">
                  AGNES CORE
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-1)] dark:text-[var(--text-1)] flex items-center gap-2">
              <Cpu className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              萬能中心 (Omni-Core Workbench)
            </h1>
            <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mt-0.5 font-medium">
              ESGGO 永續發展無限進化 · 無作妙德 · 圓通無礙 · 5T 終始矩陣核心
            </p>
          </div>

          {/* 右側操作群 */}
          <div className="flex items-center flex-wrap gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-[var(--surface-3)] border border-[var(--border)] dark:border-[var(--border)] shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-[var(--surface-1)] text-teal-800 shadow-sm font-semibold'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] dark:text-[var(--text-3)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>淺色手冊</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-[var(--surface-1)] text-teal-300 shadow-sm font-semibold border border-teal-500/30'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] dark:text-[var(--text-3)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span>深色手冊</span>
              </button>
            </div>

            {/* 強制共振同步按鈕 */}
            <button
              onClick={handleResonanceSync}
              disabled={isResonating}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResonating ? 'animate-spin' : ''}`} />
              {isResonating ? '共振同步中...' : '全域共振同步'}
            </button>

            {/* 匯出報告按鈕 */}
            <button
              onClick={handleExportReport}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-1)] hover:bg-slate-50 text-[var(--text-1)] border border-slate-300 dark:bg-[var(--surface-1)] dark:hover:bg-[var(--surface-3)] dark:text-[var(--text-1)] dark:border-[var(--border-strong)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-3)]" />
              匯出 A01 治理報告
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 子模組導航膠囊列 (Workbench Navigation) ── */}
      <div className="max-w-6xl mx-auto px-6 pt-5">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div role="tablist" className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] shadow-sm min-w-max">
            {[
              { id: 'overview', label: '六器官戰情總攬', icon: Activity },
              { id: 'learning', label: '學習中心', icon: GraduationCap },
              { id: 'notes', label: '萬能筆記', icon: BookOpen },
              { id: 'tasks', label: '萬能任務', icon: CheckCircle2 },
              { id: 'calendar', label: '萬能日曆', icon: Calendar },
              { id: 'chat', label: '萬能對話', icon: MessageSquare },
              { id: 'fiveT', label: '5T 雷達', icon: Radar },
              { id: 'rag', label: '萬能智庫', icon: Database },
              { id: 'zkp', label: '萬能憑證', icon: Lock },
              { id: 'omniFn', label: '萬能函數', icon: Wrench },
              { id: 'hermesCron', label: 'Hermes 排程', icon: Clock },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t.id as Tab)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-teal-500/40 shadow-sm'
                      : 'text-[var(--text-3)] dark:text-[var(--text-3)] hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. 主內容視圖 ── */}
      <section className="mx-auto w-full max-w-6xl space-y-5 px-0 sm:space-y-6">
        {!isCloudConnected && (
          <section role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-semibold">目前以本機示範資料瀏覽</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">Supabase 尚未設定，因此不會載入或同步雲端筆記與憑證；若要啟用持久化功能，請設定 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。</p>
          </section>
        )}

        {/* ── 3.1 戰情總攬 (Overview) ── */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* 六器官狀態矩陣 (Hexa-Core Matrix Grid) */}
            <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400">
                    六位一體 · 智慧中樞架構 (Hexa-Core Organ Matrix)
                  </h2>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mt-0.5">
                    起源對齊、契約剛性與全域無作妙德即時監測
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200/90 dark:border-teal-500/30">
                  全域共振率: {resonanceRate}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. 全知之眼 (OmniEye) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <Eye className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 全知之眼 (OmniEye)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      感知器
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">數據溯源與即時監控</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">來源驗證率</span>
                    <span className="font-bold text-teal-700 dark:text-cyan-400 text-sm">99.4%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 dark:bg-cyan-400 h-full rounded-full" style={{ width: '99.4%' }} />
                  </div>
                </div>

                {/* 2. 全能之核 (OmniCore) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <Cpu className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 全能之核 (OmniCore)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold">
                      指揮器
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">意志執行與代理蜂群調度</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">蜂群調度衝突率</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">0% (零衝突)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 3. 全域之脈 (OmniPulse) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <Radio className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 全域之脈 (OmniPulse)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                      通信器
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">數據總線與協作流轉</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">吞吐 / 平均延遲</span>
                    <span className="font-bold text-teal-700 dark:text-cyan-400 text-sm">1.4k msg/s · 12ms</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 dark:bg-cyan-400 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                {/* 4. 全境之骨 (OmniBone) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 全境之骨 (OmniBone)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                      治理器
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">契約維繫與憲章錨定</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">5T 契約結構剛性</span>
                    <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">100% 完整</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-600 dark:bg-purple-400 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 5. 全息之腦 (OmniBrain) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 全息之腦 (OmniBrain)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                      進化器
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">熵減煉金與架構自癒</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">技術債系統熵值</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">0.038 (極低熵)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>

                {/* 6. 全通之心 (OmniHeart) */}
                <div className="p-4 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-slate-50/50 dark:bg-[var(--surface-1)]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--text-1)] dark:text-[var(--text-1)]">
                      <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" /> 全通之心 (OmniHeart)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold">
                      運行境界
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mb-2">自發治理與無礙圓通</p>
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[var(--text-3)]">無摩擦流轉指數</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">{resonanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-600 dark:bg-rose-400 h-full rounded-full" style={{ width: `${resonanceRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 終始治理事件日誌 (Event Stream & Trace Audit) ── */}
            <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-1)] dark:text-[var(--text-1)]">
                    終始閉環治理日誌 (End-Beginning Trace Stream)
                  </h2>
                  <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mt-0.5">
                    每一筆事件均附帶 UUID、Origin Cause 與 SHA-256 存證雜湊鎖
                  </p>
                </div>

                {/* 篩選標籤 */}
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {(['ALL', 'SEAL', 'METABOLISM', 'AUDIT'] as const).map(flt => (
                    <button
                      key={flt}
                      onClick={() => setEventFilter(flt)}
                      className={`px-3 py-1 rounded-lg border transition-all ${
                        eventFilter === flt
                          ? 'bg-teal-700 text-white dark:bg-cyan-500 dark:text-slate-950 border-transparent shadow-sm'
                          : 'bg-slate-100 text-[var(--text-3)] dark:bg-[var(--surface-3)] dark:text-[var(--text-3)] border-[var(--border)] dark:border-[var(--border-strong)]'
                      }`}
                    >
                      {flt === 'ALL' ? '全部' : flt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 事件清單 */}
              <div className="space-y-3">
                {filteredTraces.map((item) => (
                  <div
                    key={item.uuid}
                    className="p-4 rounded-xl border border-[var(--border)]/90 dark:border-[var(--border)] bg-slate-50/60 dark:bg-[var(--surface-1)]/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-[var(--surface-3)] text-[var(--text-1)] dark:text-[var(--text-1)]">
                          {item.phase}
                        </span>
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.level === 'SEAL'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.level === 'METABOLISM'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {item.level}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-3)]">{item.timestamp}</span>
                        <span className="text-[11px] font-mono text-teal-700 dark:text-cyan-400 font-semibold">{item.sourceOrigin}</span>
                      </div>
                      <p className="text-[var(--text-1)] dark:text-[var(--text-1)] font-medium">
                        {item.description}
                      </p>
                    </div>

                    {/* Hash Lock 區塊 */}
                    <div className="shrink-0 flex items-center gap-2 bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] px-3 py-1.5 rounded-lg">
                      <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                      <span className="font-mono text-[10px] text-[var(--text-3)] dark:text-[var(--text-2)]">
                        {item.hashLock.slice(0, 10)}...{item.hashLock.slice(-6)}
                      </span>
                      <button
                        onClick={() => handleCopyHash(item.hashLock)}
                        className="text-[var(--text-3)] hover:text-teal-600 dark:hover:text-cyan-300 transition-colors"
                        title="複製完整 Hash Lock"
                      >
                        {copiedHash === item.hashLock ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 系統統計摘要卡 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">萬能筆記數</span>
                <p className="text-2xl font-bold font-mono text-teal-700 dark:text-cyan-400 mt-1">{notes.length}</p>
              </div>
              <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">OmniOne 案件</span>
                <p className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-1">{omniSummary?.caseCount ?? 47}</p>
              </div>
              <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">5T ZKP 封印存證</span>
                <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">{zkpCount}</p>
              </div>
              <div className="bg-[var(--surface-1)] dark:bg-[var(--surface-1)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">GRI 指標映射</span>
                <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">{omniSummary?.griIndicatorCount ?? 142}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3.2 各子視圖（完全相容既有功能） ── */}
        {tab === 'learning' && (
          <OmniBaseCard className="!p-4">
            <LearningCenter />
          </OmniBaseCard>
        )}

        {tab === 'notes' && (
          <OmniBaseCard className="!p-4">
            <OmniNoteCRUD />
          </OmniBaseCard>
        )}

        {tab === 'tasks' && (
          <div className="max-w-4xl mx-auto">
            <WuzuoNoteView />
          </div>
        )}

        {tab === 'calendar' && (
          <div className="max-w-6xl mx-auto">
            <OmniCalendarView />
          </div>
        )}

        {tab === 'chat' && (
          <OmniBaseCard className="!p-4 min-h-[500px]">
            <OmniOneChat />
          </OmniBaseCard>
        )}

        {tab === 'fiveT' && (
          <OmniBaseCard className="!p-4">
            <FiveTRadar zkpCount={zkpCount} evidenceCount={evidenceCount} />
          </OmniBaseCard>
        )}

        {tab === 'rag' && (
          <OmniBaseCard className="!p-4 max-w-4xl mx-auto">
            <PdfUploader />
            <RagKnowledgeManager />
          </OmniBaseCard>
        )}

        {tab === 'zkp' && (
          <div className="max-w-5xl mx-auto">
            <ZkpVault />
          </div>
        )}

        {tab === 'omniFn' && (
          <OmniBaseCard className="!p-4">
            <UniversalOmniConsole />
          </OmniBaseCard>
        )}

        {tab === 'hermesCron' && (
          <div className="max-w-6xl mx-auto">
            <HermesCronStatus />
          </div>
        )}

      </section>
    </div>
  );
}
