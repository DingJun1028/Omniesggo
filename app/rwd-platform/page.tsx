export const metadata = {
  title: 'ESGGO RWD Platform — 全能力平台',
  description: '整合本機與遠端倉庫能力的響應式平台（RWD best practice UI/UX）',
};

const CAPABILITIES = [
  { code: 'A01', name: 'Omni-Center', desc: '全息智慧中樞、全天候自主代謝。' },
  { code: 'A02', name: 'ESG Reports', desc: 'GRI/CSRD 報告、動態表單、Hash Lock 封印。' },
  { code: 'A03', name: 'OmniParser', desc: 'PDF 批量解析、碳排提取、查驗通道。' },
  { code: 'A04', name: 'Materiality', desc: '雙重重大性 2D 散佈圖、四象限。' },
  { code: 'A05', name: 'Supply Chain', desc: 'Tier 1/2 圖譜、AI 盡調、風險預警。' },
  { code: 'A06', name: 'Carbon Accounting', desc: 'Scope 1/2/3 盤查、MACC 矩陣。' },
  { code: 'A07', name: 'Trust Anchor', desc: 'Evidence Vault、Merkle Tree、ZKP。' },
  { code: 'A08', name: 'OmniMemory', desc: '動態長期記憶、夢境萃取、遺忘衰減。' },
];

export default function RwdPlatformPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg">
        跳至主要內容
      </a>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-black text-lg">ESGGO RWD Platform</span>
          <nav aria-label="導覽" className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#capabilities" className="hover:text-teal-600 dark:hover:text-cyan-400">能力</a>
            <a href="#platform" className="hover:text-teal-600 dark:hover:text-cyan-400">平台</a>
          </nav>
        </div>
      </header>
      <section id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-center">
          全能力整合 · 響應式平台
        </h1>
        <p className="mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto text-center">
          彙整本機與遠端倉庫全部能力，以 5T 協議驅動。
        </p>
        <section id="capabilities" className="mt-12">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><span className="w-1.5 h-7 bg-teal-600 rounded-full" aria-hidden="true" />核心設施</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {CAPABILITIES.map((c) => (
              <article key={c.code} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-xl transition-all duration-300" aria-labelledby={`cap-${c.code}`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">{c.code}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  </div>
                  <h3 id={`cap-${c.code}`} className="font-black text-lg">{c.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{c.desc}</p>
                </div>
                <a href={`http://localhost:3000/app/${c.code.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors px-3 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none">啟動工作台 ↗</a>
              </article>
            ))}
          </div>
        </section>
        <section id="platform" className="mt-16 bg-white dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 p-8 rounded-2xl">
          <h2 className="text-2xl font-black mb-4">全能平台能力</h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Mobile-First：360/768/1024/1280/1440 斷點可調整。</li>
            <li>• Accessible：skip link、ARIA、深色主題、無障礙語意。</li>
            <li>• Responsive：流體網格、弹性觸控目標。</li>
          </ul>
        </section>
      </section>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        ESGGO RWD Platform · 5T Protocol
      </footer>
    </main>
  );
}