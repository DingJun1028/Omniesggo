'use client';
import { useState, useEffect } from 'react';
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
import { Moon, Sun } from 'lucide-react';
import { OmniBaseCard } from '@/components/omni-base-card';

type Tab = 'dashboard' | 'notes' | 'tasks' | 'chat' | 'fiveT' | 'rag' | 'zkp' | 'calendar' | 'omniFn' | 'evolution' | 'learning' | 'hermesCron';


const FIVE_T = [
  { key: 'traceable', zh: '真', color: 'var(--accent-blue)' },
  { key: 'transparent', zh: '善', color: 'var(--accent-green)' },
  { key: 'tangible', zh: '美', color: 'var(--accent-gold)' },
  { key: 'trustworthy', zh: '信', color: 'var(--accent-purple)' },
  { key: 'trackable', zh: '通', color: 'var(--accent-cyan)' },
];

const OMNI_MODULES = [
  {
    name: '萬能筆記',
    en: 'OmniNote',
    icon: '📝',
    borderColor: 'border-accentTeal',
    textColor: 'text-accentTeal',
    href: 'notes' as Tab,
  },
  {
    name: '萬能任務',
    en: 'OmniTask',
    icon: '✅',
    borderColor: 'border-accentGold',
    textColor: 'text-accentGold',
    href: 'tasks' as Tab,
  },
  {
    name: '萬能日曆',
    en: 'OmniCalendar',
    icon: '📅',
    borderColor: 'border-accentBlue',
    textColor: 'text-accentBlue',
    href: 'calendar' as Tab,
  },
  {
    name: '萬能對話',
    en: 'OmniChat',
    icon: '🤖',
    borderColor: 'border-accentPurple',
    textColor: 'text-accentPurple',
    href: 'chat' as Tab,
  },
  {
    name: '萬能雷達',
    en: 'OmniRadar',
    icon: '📡',
    borderColor: 'border-accentCyan',
    textColor: 'text-accentCyan',
    href: 'fiveT' as Tab,
  },
  {
    name: '萬能智庫',
    en: 'OmniBrain',
    icon: '📚',
    borderColor: 'border-accentGreen',
    textColor: 'text-accentGreen',
    href: 'rag' as Tab,
  },
  {
    name: '萬能憑證',
    en: 'OmniVault',
    icon: '🔒',
    borderColor: 'border-accentBlue',
    textColor: 'text-accentBlue',
    href: 'zkp' as Tab,
  },
];

const DEMO_NOTES: NoteData[] = [
  {
    id: 'ON-A1B2',
    title: 'ESG 永續戰略 2025',
    content:
      'Q3 目標：完成碳排放基準年建立、供應鏈 ESG 評估框架設計。\n\n## 關鍵里程碑\n- **7月**: GRI 框架確認\n- **9月**: ZKP 封印報告',
    tags: ['ESG', '戰略'],
    fiveTGate: 'transparent',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'ON-C3D4',
    title: 'OmniOne 覺醒系統記錄',
    content:
      '已完成 AwakeningCore + MemorySystem + CaseHandler。\n\n`import { omniOne } from "@/sdks/omni-one/src"`',
    tags: ['OmniOne', 'AI', '開發'],
    fiveTGate: 'trackable',
    createdAt: Date.now() - 86400000,
  },
];

function polarPoint(a: number, r: number, cx: number, cy: number) {
  return { x: cx + r * Math.cos(a - Math.PI / 2), y: cy + r * Math.sin(a - Math.PI / 2) };
}

import { db } from '@lib/firebase';
import { collection, onSnapshot, query, orderBy } from '@lib/firebase';

const SCORES = { traceable:0.91, transparent:0.88, tangible:0.90, trustworthy:0.94, trackable:0.87 };
const overall = Object.values(SCORES).reduce((s,v)=>s+v,0)/5;
const CX=100, CY=100, MR=75;

const radarPath = Object.values(SCORES).map((v,i)=>{
  const a=(i/5)*Math.PI*2; const p=polarPoint(a,v*MR,CX,CY);
  return `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
}).join(' ')+' Z';

const tabs: {id:Tab; label:string; icon:string}[] = [
  {id:'learning', label:'學習中心',icon:'🎓'},
  {id:'dashboard',label:'萬能總攬',icon:'◎'},
  {id:'hermesCron',label:'Hermes 排程',icon:'🐝'},
  {id:'notes',    label:'萬能筆記',icon:'📝'},
  {id:'tasks',    label:'萬能任務',icon:'✅'},
  {id:'calendar', label:'萬能日曆',icon:'📅'},
  {id:'chat',     label:'萬能對話',icon:'🤖'},
  {id:'fiveT',    label:'萬能雷達',icon:'📡'},
  {id:'rag',      label:'萬能智庫',icon:'📚'},
  {id:'zkp',      label:'萬能憑證',icon:'🛡️'},
  {id:'omniFn',   label:'萬能函數',icon:'🪄'},
  {id:'evolution',label:'無限進化',icon:'🌀'},
];

export default function OmniCenterPage() {
  const [tab, setTab] = useState<Tab>('learning');
  const [notes, setNotes] = useState<NoteData[]>(DEMO_NOTES);
  const [zkpCount, setZkpCount] = useState<number>(0);
  const [pulse, setPulse] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [omniSummary, setOmniSummary] = useState<{ caseCount: number; griIndicatorCount: number } | null>(null);
  const [evidenceCount, setEvidenceCount] = useState<number>(0);

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
        if (!cancelled) {
          setOmniSummary({ caseCount: 47, griIndicatorCount: 142 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { isReady } = useAgnesApi();

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NoteData);
      setNotes(data);
    });

    // Listen for ZKP count
    const qZkp = query(collection(db, 'votes'));
    const unsubZkp = onSnapshot(qZkp, (snapshot) => {
      setZkpCount(snapshot.size);
    });

    return () => {
      unsubscribe();
      unsubZkp();
    };
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
      `}</style>

      {/* Header (Liquid Glass RWD) */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border border-cyan-100 dark:border-cyan-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-2xl text-slate-950 transition-shadow duration-700 ${pulse ? 'shadow-[0_0_25px_rgba(6,182,212,0.6)]' : 'shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}>
            <span className={pulse ? "animate-pulse" : ""}>◎</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-cyan-400 tracking-tight">
              萬能中心 Omni-Core
            </h1>
            <div className="text-sm text-slate-500 dark:text-cyan-100/60 font-medium">ESGGO 永續發展無限進化 · 無礙圓通</div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md border border-slate-200 dark:border-cyan-500/20 px-4 py-2 rounded-full">
          {isReady && (
            <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md font-bold tracking-wider mr-2 border border-purple-200 dark:border-purple-500/30">
              AGNES CORE
            </span>
          )}
          <div className={`w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 transition-shadow duration-700 ${pulse ? 'shadow-[0_0_12px_rgba(16,185,129,0.8)]' : ''}`} />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400/90 tracking-wide">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Tabs (Liquid Glass RWD Segment Control) */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div role="tablist" className="inline-flex gap-2 p-1.5 rounded-2xl backdrop-blur-md bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-cyan-500/20 shadow-inner min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                tab === t.id 
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-100 dark:border-cyan-500/40' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-cyan-500/10 border border-transparent'
              }`}
            >
              <span aria-hidden="true" className={tab === t.id ? 'animate-pulse' : ''}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Concentric + 5T Mini */}
          <OmniBaseCard className="!p-4" statusIndicator="trustworthy" hashLock="0x7f48e3a...b5c">
            <div className="text-xs text-textSecondary font-semibold tracking-wider mb-2.5">
              同心圓架構 · 5T 綜合評分
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <svg width={200} height={200} className="shrink-0">
                {[75, 57, 39, 21].map((r, i) => (
                  <circle
                    key={i}
                    cx={CX}
                    cy={CY}
                    r={r}
                    fill="none"
                    stroke={
                      [
                        'var(--accent-blue)',
                        'var(--accent-purple)',
                        'var(--accent-teal)',
                        'var(--accent-gold)',
                      ][i]
                    }
                    strokeWidth={pulse && i === 0 ? 2 : 1}
                    strokeDasharray={i === 0 ? '5 3' : undefined}
                    opacity={0.6}
                  />
                ))}
                <path
                  d={radarPath}
                  fill="var(--accent-teal)"
                  fillOpacity={0.2}
                  stroke="var(--accent-teal)"
                  strokeWidth={2}
                />
                {FIVE_T.map((d, i) => {
                  const a = (i / 5) * Math.PI * 2;
                  const p = polarPoint(a, MR + 14, CX, CY);
                  return (
                    <text
                      key={d.key}
                      x={p.x}
                      y={p.y + 4}
                      textAnchor="middle"
                      fill={d.color}
                      fontSize={12}
                      fontWeight={700}
                    >
                      {d.zh}
                    </text>
                  );
                })}
                <circle cx={CX} cy={CY} r={18} fill="var(--accent-teal)" />
                <text
                  x={CX}
                  y={CY - 4}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={8}
                  fontWeight={700}
                >
                  萬能
                </text>
                <text
                  x={CX}
                  y={CY + 6}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={8}
                  fontWeight={700}
                >
                  中心
                </text>
              </svg>
              <div className="flex-1">
                <div className="font-['Fira_Code',monospace] text-2xl font-bold text-accentGreen mb-1">
                  {(overall * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-textSecondary mb-2">整體 5T 合規度</div>
                {FIVE_T.map((d) => (
                  <div key={d.key} className="flex items-center gap-1.5 mb-1.5">
                    <span style={{ width: 12, color: d.color, fontSize: 12, fontWeight: 700 }}>
                      {d.zh}
                    </span>
                    <div className="flex-1 h-1 bg-primary rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${SCORES[d.key as keyof typeof SCORES] * 100}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                    <span
                      className="font-['Fira_Code',monospace] text-[10px]"
                      style={{ color: d.color }}
                    >
                      {(SCORES[d.key as keyof typeof SCORES] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </OmniBaseCard>

          {/* Quick Stats */}
          <div className="flex flex-col gap-4">
            <OmniBaseCard className="!p-4">
              <div className="text-xs text-textSecondary font-semibold tracking-wider mb-2.5">
                系統統計
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: '筆記數', v: notes.length, c: 'text-accentTeal' },
                  { l: 'OmniOne 案件', v: omniSummary?.caseCount ?? 47, c: 'text-accentPurple' },
                  { l: 'ZKP 封印', v: zkpCount, c: 'text-accentBlue' },
                  { l: 'GRI 指標', v: omniSummary?.griIndicatorCount ?? 142, c: 'text-accentGold' },
                ].map((s) => (
                  <div key={s.l} className="bg-primary rounded-lg py-2 px-2.5">
                    <div className={`font-['Fira_Code',monospace] text-xl font-bold ${s.c}`}>
                      {s.v}
                    </div>
                    <div className="text-xs text-textSecondary">{s.l}</div>
                  </div>
                ))}
              </div>
            </OmniBaseCard>

            <OmniBaseCard className="!p-4">
              <div className="text-xs text-textSecondary font-semibold tracking-wider mb-2.5">
                萬能模組矩陣
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {OMNI_MODULES.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      if (m.href.startsWith('/')) window.location.href = m.href;
                      else setTab(m.href as Tab);
                    }}
                    aria-label={`前往 ${m.name}`}
                    className={`bg-primary border border-borderColor/50 rounded-lg py-2 px-1.5 cursor-pointer text-center transition-all duration-200 hover:opacity-80 hover:${m.borderColor} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current`}
                  >
                    <div aria-hidden="true" className="text-lg mb-0.5">
                      {m.icon}
                    </div>
                    <div className={`text-[10px] font-semibold ${m.textColor}`}>{m.name}</div>
                  </button>
                ))}
              </div>
            </OmniBaseCard>
          </div>
        </div>
      )}

      {/* Hermes Cron Tab */}
      {tab === 'hermesCron' && (
        <div className="max-w-6xl mx-auto">
          <HermesCronStatus />
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'notes' && (
        <OmniBaseCard className="!p-4">
          <OmniNoteCRUD />
        </OmniBaseCard>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="max-w-4xl mx-auto">
          <WuzuoNoteView />
        </div>
      )}

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <div className="max-w-6xl mx-auto">
          <OmniCalendarView />
        </div>
      )}

      {/* Chat Tab */}
      {tab === 'chat' && (
        <OmniBaseCard className="!p-4 min-h-[500px]">
          <OmniOneChat />
        </OmniBaseCard>
      )}

      {/* 5T Tab */}
      {tab === 'fiveT' && (
        <OmniBaseCard className="!p-4">
          <FiveTRadar zkpCount={zkpCount} evidenceCount={evidenceCount} />
        </OmniBaseCard>
      )}

      {/* RAG Knowledge Base Tab */}
      {tab === 'rag' && (
        <OmniBaseCard className="!p-4 max-w-4xl mx-auto">
          <PdfUploader />
          <RagKnowledgeManager />
        </OmniBaseCard>
      )}

      {/* ZKP Vault Tab */}
      {tab === 'zkp' && (
        <div className="max-w-5xl mx-auto">
          <ZkpVault />
        </div>
      )}

      {/* Universal Omni Function Tab */}
      {tab === 'omniFn' && (
        <OmniBaseCard className="!p-4">
          <UniversalOmniConsole />
        </OmniBaseCard>
      )}

      {/* Learning Center */}
      {tab === 'learning' && (
        <OmniBaseCard className="!p-4">
          <LearningCenter />
        </OmniBaseCard>
      )}
    </div>
  );
}
