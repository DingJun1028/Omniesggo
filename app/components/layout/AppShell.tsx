'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity, Bot, Building2, CircleHelp, Database, FileText,
  LayoutDashboard, Leaf, Menu, Search, Settings, ShieldCheck,
  SlidersHorizontal, Sun, TrendingDown, Users, X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const NAV_GROUPS = [
  {
    title: '工作台',
    items: [
      { href: '/omni-center', label: '萬能中心', code: 'A01', icon: LayoutDashboard },
      { href: '/sustain-write', label: '報告中心', code: 'A02', icon: FileText },
      { href: '/parser', label: '智能解析', code: 'A03', icon: Search },
      { href: '/materiality', label: '重大性矩陣', code: 'A04', icon: SlidersHorizontal },
      { href: '/supply-chain', label: '供應鏈盡調', code: 'A05', icon: Building2 },
      { href: '/carbon', label: '碳排淨零', code: 'A06', icon: TrendingDown },
      { href: '/trust', label: '信任金庫', code: 'A07', icon: Database },
    ],
  },
  {
    title: '治理與管理',
    items: [
      { href: '/verifier', label: '5T 防偽查驗', icon: ShieldCheck },
      { href: '/village', label: '村莊治理', icon: Users },
      { href: '/omni-agent', label: 'AI 控制台', icon: Bot },
      { href: '/resources', label: '資源總覽', icon: Settings },
    ],
  },
];

const QUICK_LINKS = [
  { href: '/', label: '首頁', icon: LayoutDashboard },
  { href: '/omni-center', label: '中樞', icon: Activity },
  { href: '/carbon', label: '碳管理', icon: TrendingDown },
  { href: '/trust', label: '信任', icon: ShieldCheck },
];

function isPathActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [query, setQuery] = useState('');
  const pathname = usePathname() || '/';
  const { user } = useAuth();
  const currentItem = NAV_GROUPS.flatMap((group) => group.items).find((item) => isPathActive(pathname, item.href));
  const pageTitle = currentItem?.label || (pathname === '/' ? '設施總覽' : 'OmniESGGo');
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => `${item.label} ${item.code || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved || 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSidebarOpen]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.classList.toggle('light', next === 'light');
  };

  const closeMenu = () => setIsSidebarOpen(false);
  const userInitial = user?.email?.trim().charAt(0).toUpperCase() || 'G';

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-[var(--bg)] text-[var(--text-1)] selection:bg-teal-500/20">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-slate-900 focus:shadow-xl">
        跳至主要內容
      </a>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="關閉導覽選單"
          tabIndex={-1}
          className="fixed inset-0 z-40 cursor-default bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        id="primary-navigation"
        aria-label="主要導覽"
        aria-hidden={!isSidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-[var(--border)] bg-[var(--surface-1)]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[17rem] lg:shrink-0 lg:translate-x-0 lg:bg-[var(--surface-1)]/75 lg:shadow-none xl:w-[18rem] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-5 sm:px-6">
          <Link href="/" onClick={closeMenu} className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-cool-soft)] text-[var(--accent-cool)] ring-1 ring-[var(--border-accent)] transition-transform group-hover:scale-105">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-wide text-[var(--text-1)]">OmniESGGo</span>
              <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-3)]">Sustainability OS</span>
            </span>
          </Link>
          <button type="button" aria-label="關閉導覽選單" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--text-2)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] lg:hidden" onClick={closeMenu}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pt-5">
          <label className="flex h-11 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text-3)] transition-colors focus-within:border-[var(--border-accent)] focus-within:ring-2 focus-within:ring-[var(--accent-cool)]/15">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋功能…"
              aria-label="搜尋導覽功能"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)]"
            />
            <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-3)] sm:inline">/</kbd>
          </label>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-5" aria-label="功能導覽">
          {filteredGroups.length ? filteredGroups.map((group) => (
            <section key={group.title} className="mb-6">
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-3)]">{group.title}</h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] ${active ? 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)] ring-1 ring-inset ring-[var(--border-accent)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]'}`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.label}</span>
                        {item.code && <span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] ${active ? 'bg-[var(--surface-1)]/80 text-[var(--accent-cool)]' : 'text-[var(--text-3)]'}`}>{item.code}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )) : (
            <p className="px-3 py-5 text-sm text-[var(--text-3)]" role="status">找不到符合的功能。</p>
          )}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <a href="http://localhost:52800" target="_blank" rel="noopener noreferrer" className="mb-2 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[var(--accent-cool)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />RWD 平台（新分頁）
          </a>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-cool-soft)] text-sm font-bold text-[var(--accent-cool)] ring-1 ring-[var(--border-accent)]" aria-hidden="true">{userInitial}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--text-1)]">{user?.email || '訪客模式'}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-3)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />5T 永續治理平台</p>
            </div>
            <Link href="/login" aria-label="帳戶與登入" onClick={closeMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <Link href="/resources" onClick={closeMenu} className="mt-2 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs text-[var(--text-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]">
            <CircleHelp className="h-4 w-4" aria-hidden="true" />說明與資源
          </Link>
        </div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.08),_transparent_55%)]" />
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-1)]/75 px-3 backdrop-blur-xl sm:px-5 lg:px-8">
          <button
            type="button"
            aria-label="開啟主要導覽"
            aria-expanded={isSidebarOpen}
            aria-controls="primary-navigation"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-1)] sm:text-base">{pageTitle}</p>
            <p className="hidden text-[10px] font-medium tracking-wide text-[var(--text-3)] sm:block">永續治理 · 數據可信 · 決策可追蹤</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-300 md:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />系統就緒</span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="切換顯示主題"
              title="切換顯示主題"
              className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 text-xs font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]"
            >
              <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span className="hidden sm:inline">切換主題</span>
            </button>
          </div>
        </header>

        <main id="main-content" className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-8 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto min-h-full w-full max-w-[1440px]">{children}</div>
        </main>

        <nav aria-label="快速導覽" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--border)] bg-[var(--surface-1)]/95 px-2 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
          {QUICK_LINKS.map((item) => {
            const active = isPathActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] ${active ? 'text-[var(--accent-cool)]' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
