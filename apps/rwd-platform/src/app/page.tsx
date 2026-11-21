'use client';

import { useEffect, useState } from 'react';

const CAPABILITIES = [
  { code: 'A01', name: '萬能中心與全息中樞', en: 'Omni-Center & Hexa-Core', path: 'http://localhost:3000/omni-center', desc: '六位一體智慧中樞、全天候自主代謝與共振監控。' },
  { code: 'A02', name: '永續報告中心', en: 'ESG Reports Center', path: 'http://localhost:3000/sustain-write', desc: 'GRI/CSRD 報告編撰、動態表單、即時印刷預覽、5T Hash Lock。' },
  { code: 'A03', name: '智能解析與審計', en: 'OmniParser & Verifier', path: 'http://localhost:3000/parser', desc: 'PDF 批量解析、碳排提取、第三方查驗通道。' },
  { code: 'A04', name: '雙重重大性矩陣', en: 'Double Materiality', path: 'http://localhost:3000/materiality', desc: 'CSRD 雙重實質性 2D 散佈圖與四象限。' },
  { code: 'A05', name: '供應鏈盡職調查', en: 'Supply Chain CSDD', path: 'http://localhost:3000/supply-chain', desc: 'Tier 1/2 圖譜、AI 審查、ESG 評級、風險預警。' },
  { code: 'A06', name: '碳排放計算', en: 'Carbon Accounting', path: 'http://localhost:3000/carbon', desc: '範疇 1/2/3 盤查、SBTi 軌跡、MACC 矩陣。' },
  { code: 'A07', name: '信任錨定與存證', en: 'Trust Anchor & Vault', path: 'http://localhost:3000/trust', desc: 'Evidence Vault、Merkle Tree、ZKP 封印。' },
  { code: 'A08', name: '全通記憶引擎', en: 'OmniMemory', path: 'http://localhost:3000/omni-memory', desc: 'Meta Muse 架構動態長期記憶、夢境萃取、遺忘衰減。' },
];

const OMNINOTE = [
  { title: '速記捕捉', desc: 'CaptureBar 快速輸入，支援 Markdown 與附件。' },
  { title: '雙鏈圖譜', desc: 'FusionGraph 連結筆記，視覺化知識網絡。' },
  { title: '證據鏈', desc: '5T 證據鏈與 CRDT 同步，不可篡改存證。' },
  { title: '搜尋與標籤', desc: '全文搜尋、標籤分類、草稿管理。' },
  { title: '匯入匯出', desc: 'Markdown/JSON 匯入匯出，資料可攜。' },
  { title: '健康監控', desc: 'HealthPanel 即時健康狀態與診斷。' },
];

const FIVE_T = [
  { symbol: 'T¹', zh: '可溯源', desc: '來源印記不可偽造' },
  { symbol: 'T²', zh: '可驗算', desc: '演算法公開透明' },
  { symbol: 'T³', zh: '可感知', desc: '高對比手冊印刷質感' },
  { symbol: 'T⁴', zh: '不可篡改', desc: 'SHA-256 密碼學封印' },
  { symbol: 'T⁵', zh: '可追蹤', desc: '全生命週期精確勾稽' },
];

export default function RwdPlatformPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('http://127.0.0.1:52710/health')
      .then((r) => { if (!cancelled) setApiStatus(r.ok ? 'online' : 'offline'); })
      .catch(() => { if (!cancelled) setApiStatus('offline'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        {/* Skip link for a11y */}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg">
          跳至主要內容
        </a>

        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black">E</span>
              <span className="font-black text-lg tracking-tight">ESGGO RWD Platform</span>
            </div>
            <nav aria-label="主要導覽" className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#capabilities" className="hover:text-teal-600 dark:hover:text-cyan-400">能力總覽</a>
              <a href="#omninote" className="hover:text-teal-600 dark:hover:text-cyan-400">OmniNote</a>
              <a href="#protocol" className="hover:text-teal-600 dark:hover:text-cyan-400">5T 協議</a>
            </nav>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="切換深淺主題"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <main id="main">
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                RWD · Mobile-First · Best Practice UI/UX
              </span>
              <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
                全能力整合 · 響應式平台
              </h1>
              <p className="mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                彙整本機與遠端倉庫（Omniesggo + OmniNote）全部能力，以 5T 協議驅動，提供 A01~A08 核心治理設施與萬能筆記控制台的統一入口。
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href="#capabilities" className="min-h-[44px] px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20">
                  探索能力
                </a>
                <a href="http://localhost:52720" target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  OmniNote 控制台 ↗
                </a>
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section id="capabilities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                  <span className="w-1.5 h-7 bg-teal-600 rounded-full" aria-hidden="true" />
                  A01 ~ A08 核心治理設施
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">各設施皆具備終始矩陣說明與 5T Hash Lock 封印</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 dark:text-cyan-400 bg-teal-50 dark:bg-cyan-950/40 px-3 py-1 rounded-full border border-teal-200 dark:border-cyan-500/30 self-start sm:self-auto">
                8 設施在線
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {CAPABILITIES.map((c) => (
                <article key={c.code} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-xl transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                        {c.code}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    </div>
                    <h3 className="font-black text-lg">{c.name}</h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2">{c.en}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{c.desc}</p>
                  </div>
                  <a
                    href={c.path}
                    className="mt-4 inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors px-3"
                  >
                    啟動工作台 →
                  </a>
                </article>
              ))}
            </div>
          </section>

          {/* OmniNote */}
          <section id="omninote" className="bg-white dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                <span className="w-1.5 h-7 bg-omni-omega rounded-full" aria-hidden="true" />
                OmniNote 萬能筆記（遠端整合）
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">液態玻璃 Web 控制台：速記、編輯、雙鏈圖譜、搜尋、標籤、草稿、匯入匯出、證據鏈</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {OMNINOTE.map((n) => (
                  <div key={n.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-bold text-sm mb-1">{n.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border ${apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : apiStatus === 'offline' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-400 animate-pulse'}`} />
                  OmniNote API：{apiStatus === 'online' ? '在線' : apiStatus === 'offline' ? '離線' : '檢查中'}
                </span>
                <a href="http://localhost:52720" target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity">
                  開啟 OmniNote 控制台 ↗
                </a>
                <a href="http://127.0.0.1:52710/health" target="_blank" rel="noopener noreferrer" className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  API 健康檢查 ↗
                </a>
              </div>
            </div>
          </section>

          {/* 5T Protocol */}
          <section id="protocol" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2 mb-6">
              <span className="w-1.5 h-7 bg-teal-600 rounded-full" aria-hidden="true" />
              5T 終始矩陣協議
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {FIVE_T.map((t) => (
                <div key={t.symbol} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/60 transition-colors">
                  <span className="text-2xl font-black text-teal-700 dark:text-cyan-400">{t.symbol}</span>
                  <span className="text-sm font-bold mt-1">{t.zh}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="font-bold">OmniCore ♾️ ESGGO · 5T Protocol Active</span>
            <span className="text-teal-700 dark:text-cyan-400 font-bold">上善若水，善向永續。</span>
            <span>Mobile-First · Accessible · Responsive</span>
          </div>
        </footer>
      </div>
    </div>
  );
}