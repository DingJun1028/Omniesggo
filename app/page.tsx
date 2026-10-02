'use client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { OmniCard, OmniCardContent } from '@/components/omni-base/OmniCard';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

const NAV_MODULES = [
  {
    href: '/omni-center',
    icon: '◎',
    title: '萬能中心',
    subtitle: 'OmniCore Center',
    desc: 'ZKP 知識封印 · L-Hub 蜂群 · Trinity 覺醒',
    accentClass: 'text-cyan-600 dark:text-cyan-400',
    badge: '5T LIVE',
  },
  {
    href: '/sustain-write/v5',
    icon: '📊',
    title: 'ESG 報告產生器',
    subtitle: 'Sustain Write v5.0',
    desc: 'GRI 600+ 指標 · AI 自動合規 · PDF 封存',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    badge: 'v5.0',
  },
  {
    href: '/sustain-center',
    icon: '🌱',
    title: '萬能永續中心',
    subtitle: 'Sustain Center ∞ Evolution',
    desc: 'ESG 儀表板 · 碳排驗算 · 永續發展無限進化',
    accentClass: 'text-teal-600 dark:text-teal-400',
    badge: 'EVOLUTION',
  },
  {
    href: '/village',
    icon: '🏡',
    title: '村莊治理',
    subtitle: 'Village Governance',
    desc: '二次方投票 · 任務看板 · 社群協作',
    accentClass: 'text-purple-600 dark:text-purple-400',
    badge: 'DAO',
  },
  {
    href: '/wiki',
    icon: '📚',
    title: '知識庫',
    subtitle: 'OmniWiki',
    desc: 'ESG 法規查詢 · GRI/TCFD/CSRD 解析',
    accentClass: 'text-amber-600 dark:text-amber-400',
    badge: 'KI',
  },
  {
    href: '/omni-agent',
    icon: '🤖',
    title: 'AI 代理控制台',
    subtitle: 'OmniAgent Console',
    desc: 'CelestialFlow 監控 · 自癒協議 · 代理蜂群',
    accentClass: 'text-rose-600 dark:text-rose-400',
    badge: 'GNOSIS',
  },
  {
    href: '/resources',
    icon: '📦',
    title: '系統資源總覽',
    subtitle: 'Platform Resources',
    desc: '功能模組 · AI 模型 · 基礎設施 · 資源 inventory',
    accentClass: 'text-yellow-600 dark:text-yellow-400',
    badge: 'SYS',
  },
];

const FIVE_T = [
  { symbol: 'T¹', label: 'Traceable', zh: '可溯源' },
  { symbol: 'T²', label: 'Transparent', zh: '可驗算' },
  { symbol: 'T³', label: 'Tangible', zh: '可感知' },
  { symbol: 'T⁴', label: 'Trustworthy', zh: '不可篡改' },
  { symbol: 'T⁵', label: 'Trackable', zh: '可追蹤' },
];

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* ── 主視覺 (Hero Section) ── */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 text-center flex-1 flex flex-col items-center justify-center min-h-[55vh]">
        {/* 背景光暈 (Liquid Glass Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

        <h1 className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-emerald-500 to-cyan-600 dark:from-cyan-400 dark:via-emerald-300 dark:to-cyan-400 animate-pulse drop-shadow-sm">
          ESGGO 永續發展無限進化
        </h1>
        <p className="relative z-10 text-lg md:text-2xl text-cyan-800 dark:text-cyan-100/90 mb-4 font-bold tracking-widest drop-shadow-sm">
          善向永續 · 全通之心 · 無作妙德
        </p>
        <p className="relative z-10 text-sm md:text-base text-slate-700 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          以 5T 協議驅動的萬能 (Omni) ESG 治理平台 — 從碳排計算到永續報告，全程 AI 賦能、可驗算、不可篡改。
        </p>

        {/* 5T 指示器 (採用 Liquid Glass 風格) */}
        <div className="relative z-10 flex flex-wrap justify-center gap-3 md:gap-5">
          {FIVE_T.map((t) => (
            <div
              key={t.symbol}
              className="group flex flex-col items-center px-5 py-3 rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-cyan-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(6,182,212,0.15)] dark:hover:border-cyan-400/40"
            >
              <span className="text-xl md:text-2xl font-black text-cyan-600 dark:text-cyan-400 group-hover:text-emerald-500 transition-colors">{t.symbol}</span>
              <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-bold tracking-wider">{t.zh}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 模組導航卡片 (OmniCard Grid) ── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pb-24 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {NAV_MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="group block h-full">
              <OmniCard glow className="h-full hover:-translate-y-2 hover:border-cyan-400/50 transition-all duration-500">
                <OmniCardContent className="flex flex-col h-full p-6 lg:p-8">
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl lg:text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                      {mod.icon}
                    </span>
                    <OmniBadge variant="glass" className="font-bold tracking-wide shadow-sm">
                      {mod.badge}
                    </OmniBadge>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {mod.title}
                    </h3>
                    <div className={`text-xs font-bold mb-4 tracking-widest uppercase ${mod.accentClass}`}>
                      {mod.subtitle}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-500 group-hover:text-emerald-500 transition-colors">
                    <span>進入模組</span>
                    <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                  
                </OmniCardContent>
              </OmniCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 底部系統狀態 ── */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="font-bold tracking-tight">OmniCore ♾️ ESGGO v5.1 · TRANSCENDED · 5T Protocol Active</span>
        </div>
        <div className="text-cyan-700 dark:text-cyan-500 font-bold tracking-wide text-center">
          上善若水，善向永續。知識即資產，服務即教學。
        </div>
        <div className="font-semibold tracking-tight">
          GCP CloudRun · Firebase · Next.js · RWD Active
        </div>
      </footer>
    </div>
  );
}
