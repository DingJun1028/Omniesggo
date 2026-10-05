'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FileText, Globe, Users, 
  BookOpen, Bot, Settings, Menu, X, Leaf,
  Database, ShieldCheck, Sliders, TrendingDown, Building2, Sun, Moon
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const NAV_ITEMS = [
  { href: '/omni-center', label: 'A01 萬能中心', icon: LayoutDashboard },
  { href: '/sustain-write', label: 'A02 報告中心', icon: FileText },
  { href: '/parser', label: 'A03 智能解析', icon: FileText },
  { href: '/materiality', label: 'A04 重大性矩陣', icon: Sliders },
  { href: '/supply-chain', label: 'A05 供應鏈盡調', icon: Building2 },
  { href: '/carbon', label: 'A06 碳排淨零', icon: TrendingDown },
  { href: '/trust', label: 'A07 信任金庫', icon: Database },
  { href: '/verifier', label: '5T 防偽查驗', icon: ShieldCheck },
  { href: '/village', label: '村莊治理', icon: Users },
  { href: '/omni-agent', label: 'AI 控制台', icon: Bot },
  { href: '/resources', label: '資源總覽', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const pathname = usePathname();
  const { user } = useAuth();

  // 載入與初始化雙色系主題 (Light / Dark Theme)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null;
    const initial = saved || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark');
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // 關閉側邊欄位當路由改變時 (Mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // 註冊 PWA Service Worker (100% De-Google 離線快取網)
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[sw] Service Worker registration failed:', err);
      });
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden selection:bg-cyan-500/30">
      
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Liquid Glass) ── */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
          backdrop-blur-2xl bg-white/70 dark:bg-slate-900/40 
          border-r border-slate-200 dark:border-cyan-500/10
          shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]
        `}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-cyan-500/20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
              <Leaf className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-lg tracking-wider text-slate-900 dark:text-cyan-400">
              OmniESGGo
            </span>
          </Link>
          <button 
            className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:text-cyan-400 dark:hover:bg-cyan-900/30 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium
                  ${isActive 
                    ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-200 dark:border-cyan-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* Footer Area of Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-cyan-500/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.email || 'Guest User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                OmniCore 5T Active
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background gradient applied via CSS usually, but we ensure content container doesn't block it */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.15),_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.15),_transparent_70%)]" />
        
        {/* ── Top Header ── */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200/50 dark:border-cyan-500/10 backdrop-blur-md bg-white/50 dark:bg-slate-900/30 relative z-30">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-200 dark:text-cyan-400 dark:hover:bg-cyan-900/30 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1">
            {/* Context-aware title or breadcrumbs could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            {/* OmniSub Editorial 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-white text-teal-800 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="清新典雅 (Light Editorial)"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">清新淺色</span>
                <span className="sm:hidden">淺色</span>
              </button>
              <button
                type="button"
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-teal-300 shadow-sm font-semibold border border-teal-500/30'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="深色手冊 (Dark Editorial)"
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">深色手冊</span>
                <span className="sm:hidden">深色</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wider">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto relative z-10 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
