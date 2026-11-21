'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowRight, Brain, CalendarDays, CheckCircle2, Clock3,
  FileText, GraduationCap, Layers3, LockKeyhole, MessageSquareText,
  Network, Search, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

type ViewId = 'overview' | 'notes' | 'learning' | 'tasks' | 'calendar' | 'chat' | 'knowledge' | 'fiveT' | 'vault';

const views: { id: ViewId; tab: string; label: string; icon: typeof Brain; description: string }[] = [
  { id: 'overview', tab: 'overview', label: '總覽', icon: Layers3, description: '記憶節點、知識萃取與對齊狀態' },
  { id: 'notes', tab: 'notes', label: '記憶節點', icon: FileText, description: '建立、整理與搜尋知識筆記' },
  { id: 'learning', tab: 'learning', label: '學習中心', icon: GraduationCap, description: '持續學習與知識沉澱' },
  { id: 'tasks', tab: 'tasks', label: '行動任務', icon: CheckCircle2, description: '把記憶轉為可追蹤的下一步' },
  { id: 'calendar', tab: 'calendar', label: '時間脈絡', icon: CalendarDays, description: '以行事曆掌握工作節奏' },
  { id: 'chat', tab: 'chat', label: 'OmniOne 對話', icon: MessageSquareText, description: '透過對話探索與整理脈絡' },
  { id: 'knowledge', tab: 'rag', label: '知識庫', icon: Search, description: '文件上傳與 RAG 知識管理' },
  { id: 'fiveT', tab: 'fiveT', label: '5T 對齊', icon: ShieldCheck, description: '檢視治理與對齊指標' },
  { id: 'vault', tab: 'zkp', label: '信任金庫', icon: LockKeyhole, description: '查看封印與可信任存證' },
];

const principles = [
  { title: 'Memory｜記憶', detail: '把日常筆記、決策與任務整理成可回看的知識節點。', icon: Brain },
  { title: 'Dreams｜夢境萃取', detail: '從累積內容找出關聯、重複主題與值得延伸的洞察。', icon: Sparkles },
  { title: 'Forgetting｜遺忘衰減', detail: '讓過期資訊回到審視流程，維持脈絡精簡而可靠。', icon: Clock3 },
];

export default function OmniMemoryPage() {
  const [active, setActive] = useState<ViewId>('overview');
  const [query, setQuery] = useState('');
  const activeView = useMemo(() => views.find((view) => view.id === active)!, [active]);
  const filteredViews = views.filter((view) => `${view.label} ${view.description}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 text-[var(--text-1)] sm:space-y-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm sm:p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <OmniBadge variant="teal">A08 · OMNI MEMORY</OmniBadge>
            <OmniBadge variant="emerald">記憶 × 萃取 × 對齊</OmniBadge>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">全通記憶與對齊引擎</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-2)] sm:text-base">
                將筆記、學習、任務、對話與文件知識匯入同一個工作脈絡。從可追溯的記憶節點出發，逐步整理洞察與行動；目前各工作台沿用既有功能，無需等待資料庫連線即可開始使用。
              </p>
            </div>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400">
              返回設施總覽 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {principles.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-[var(--border)] bg-slate-50 p-4 dark:border-[var(--border)] dark:bg-[var(--bg)]/60">
                <div className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4 text-teal-700 dark:text-cyan-400" />{title}</div>
                <p className="mt-2 text-xs leading-6 text-[var(--text-3)] dark:text-[var(--text-3)]">{detail}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 dark:border-[var(--border)] dark:bg-[var(--surface-1)] lg:sticky lg:top-5">
            <label htmlFor="memory-view-search" className="sr-only">搜尋工作台</label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 dark:border-[var(--border-strong)]">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
              <input id="memory-view-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋工作台…" className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-3)]" />
            </div>
            <nav aria-label="全通記憶工作台" className="mt-3 space-y-1">
              {filteredViews.map(({ id, label, icon: Icon, description }) => (
                <Link key={id} href={id === 'overview' ? '/omni-memory' : `/omni-center?tab=${encodeURIComponent(views.find((view) => view.id === id)?.tab ?? 'overview')}`} aria-current={active === id ? 'page' : undefined} title={description} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${active === id ? 'bg-teal-50 text-teal-900 dark:bg-cyan-950/60 dark:text-cyan-200' : 'text-[var(--text-3)] hover:bg-slate-50 dark:text-[var(--text-2)] dark:hover:bg-[var(--surface-3)]'}`}>
                  <Icon className="h-4 w-4 shrink-0" />{label}
                </Link>
              ))}
              {filteredViews.length === 0 && <p className="px-3 py-4 text-xs text-[var(--text-3)]">沒有符合的工作台</p>}
            </nav>
            <div className="mt-4 border-t border-[var(--border)] px-3 pt-4 text-xs leading-5 text-[var(--text-3)] dark:border-[var(--border)] dark:text-[var(--text-3)]">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-2)] dark:text-[var(--text-1)]"><Activity className="h-4 w-4 text-emerald-600" />工作台已就緒</div>
              <p className="mt-1">資料保存與帳號能力依各功能既有服務狀態運作。</p>
            </div>
          </aside>

          <section className="min-w-0" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-cyan-400">OMNI MEMORY WORKSPACE</p><h2 className="mt-1 text-2xl font-black">{activeView.label}</h2><p className="mt-1 text-sm text-[var(--text-3)] dark:text-[var(--text-3)]">{activeView.description}</p></div>
              {active !== 'overview' && <button type="button" onClick={() => setActive('overview')} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-[var(--border-strong)] dark:hover:bg-[var(--surface-1)]">回到總覽</button>}
            </div>

            {active === 'overview' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {views.filter((view) => view.id !== 'overview').map(({ id, label, icon: Icon, description }) => (
                    <Link key={id} href={`/omni-center?tab=${encodeURIComponent(views.find((view) => view.id === id)?.tab ?? 'overview')}`} className="group rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
                      <OmniCard variant="glass" className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-teal-400">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-cyan-950/60 dark:text-cyan-300"><Icon className="h-5 w-5" /></div>
                        <h3 className="mt-4 font-bold">{label}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-[var(--text-3)] dark:text-[var(--text-3)]">{description}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-cyan-400">開啟工作台 <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                      </OmniCard>
                    </Link>
                  ))}
                </div>
                <OmniCard variant="glass" className="p-5 sm:p-6">
                  <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Network className="h-5 w-5" /></div><div><h3 className="font-bold">從記憶到可執行的對齊流程</h3><p className="mt-1 text-sm text-[var(--text-3)] dark:text-[var(--text-3)]">先記錄來源，再建立脈絡，最後轉成任務或可查證的治理證據。</p></div></div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ['01', '捕捉', '筆記、文件與對話'],
                      ['02', '連結', '學習、日曆與知識檢索'],
                      ['03', '落地', '任務、5T 對齊與存證'],
                    ].map(([number, title, text]) => <div key={number} className="flex gap-3 rounded-xl border border-[var(--border)] p-4 dark:border-[var(--border)]"><span className="font-mono text-sm font-black text-teal-700 dark:text-cyan-400">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-[var(--text-3)]">{text}</p></div></div>)}
                  </div>
                </OmniCard>
              </div>
            ) : (
              <OmniCard variant="glass" className="min-h-[420px] p-4 sm:p-6">
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-cyan-950/60 dark:text-cyan-300"><activeView.icon className="h-7 w-7" /></div>
                  <h3 className="mt-4 text-lg font-bold">{activeView.label}已準備就緒</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-3)] dark:text-[var(--text-3)]">{activeView.description}。此工作台沿用 Omni-Center 既有功能，可由下方按鈕開啟並繼續操作。</p>
                  <Link href={`/omni-center?tab=${encodeURIComponent(activeView.tab)}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 dark:bg-cyan-500 dark:text-slate-950"><ArrowRight className="h-4 w-4" />開啟{activeView.label}</Link>
                </div>
              </OmniCard>
            )}
          </section>
        </div>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] py-4 text-xs text-[var(--text-3)] dark:border-[var(--border)]">
          <span className="flex items-center gap-2"><Workflow className="h-4 w-4" /> OmniCore · A08 Memory & Alignment</span>
          <span>每個節點保留脈絡，讓知識走向行動。</span>
        </footer>
      </div>
    </section>
  );
}
